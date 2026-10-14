import type { TelemetryPoint } from '../../../types/simulation';

export type Vec3 = [number, number, number];
export type MissionSample = {
  time: number;
  position: Vec3;
  velocity: Vec3;
  pitch: number;
  throttle: number;
  altitude: number;
  fuel: number;
  pressure?: number;
  acceleration?: number;
};
export type MissionEvent = { time: number; label: string };
export type MissionRun = {
  samples: MissionSample[];
  events: MissionEvent[];
  source: 'mock' | 'backend';
  staged: boolean;
};
export const BOOSTER_SEPARATION = 120;
export const CORE_SEPARATION = 200;
export const DURATION = 300;

// Deterministic visual fixture, not an SLS performance simulation.
export function createMockMission(fault: boolean): MissionRun {
  const samples: MissionSample[] = [];
  for (let time = 0; time <= DURATION; time++) {
    const poweredTime = fault ? Math.min(time, 65) : time;
    const peak = 1.8 * poweredTime ** 2;
    const fallTime = fault ? Math.max(0, time - 65) : 0;
    const altitude = Math.max(0, peak - 4.9 * fallTime ** 2);
    const vertical = fault && time > 65 ? (altitude > 0 ? -9.8 * fallTime : 0) : 3.6 * time;
    const downrange = altitude > 0 ? .8 * poweredTime ** 2 : 0;
    samples.push({ time, position: [downrange, altitude, 0], velocity: [1.6 * poweredTime, vertical, 0],
      pitch: Math.min(.8, poweredTime / 300), throttle: fault && time >= 65 ? 0 : time < 280 ? 1 : 0,
      altitude, fuel: Math.max(0, 1 - poweredTime / 280) });
  }
  const events = [{ time: 0, label: 'Mock ignition' }];
  if (fault) {
    events.push({ time: 65, label: 'Mock engine shutdown' });
    events.push({ time: samples.find(p => p.time > 65 && p.altitude === 0)!.time, label: 'Mock ground impact' });
  } else {
    events.push({ time: BOOSTER_SEPARATION, label: 'Illustrative booster separation' },
      { time: CORE_SEPARATION, label: 'Illustrative core separation' }, { time: 280, label: 'Mock upper-stage cutoff' });
  }
  return { samples, events, source: 'mock', staged: !fault };
}

// Planar ECI is embedded in 3D without claiming out-of-plane dynamics.
export function adaptBackendTelemetry(points: TelemetryPoint[]): MissionRun {
  return { source: 'backend', staged: false, events: [], samples: points.map(p => ({
    time: p.time_s, position: [p.y_m, p.x_m - 6371000, 0], velocity: [p.vy_mps, p.vx_mps, 0],
    pitch: p.pitch_angle_deg * Math.PI / 180 + Math.atan2(p.y_m, p.x_m), throttle: p.is_engine_active ? 1 : 0,
    altitude: p.altitude_m, fuel: p.propellant_remaining_kg, pressure: p.dynamic_pressure_pa, acceleration: p.acceleration_mps2,
  })) };
}

export function sampleMission(samples: MissionSample[], time: number): MissionSample {
  if (!samples.length) throw new Error('Mission has no telemetry');
  if (time <= samples[0].time) return samples[0];
  if (time >= samples[samples.length - 1].time) return samples[samples.length - 1];
  let low = 0, high = samples.length - 1;
  while (high - low > 1) { const mid = (low + high) >> 1; if (samples[mid].time <= time) low = mid; else high = mid; }
  const a = samples[low], b = samples[high];
  const fraction = (time - a.time) / (b.time - a.time);
  const lerp = (x: number, y: number) => x + (y - x) * fraction;
  return { time, position: a.position.map((v, i) => lerp(v, b.position[i])) as Vec3,
    velocity: a.velocity.map((v, i) => lerp(v, b.velocity[i])) as Vec3,
    pitch: lerp(a.pitch, b.pitch), altitude: lerp(a.altitude, b.altitude), fuel: lerp(a.fuel, b.fuel),
    pressure: lerp(a.pressure ?? 0, b.pressure ?? 0), acceleration: lerp(a.acceleration ?? 0, b.acceleration ?? 0), throttle: a.throttle };
}

// State derives from time, so seeking backward always reattaches components.
export function separationAt(run: MissionRun, time: number) {
  return { boosters: run.staged && time >= BOOSTER_SEPARATION, core: run.staged && time >= CORE_SEPARATION };
}

// One scene unit is 1,000 km. Backend ECI (x,y) becomes world (y,x,0).
export function earthPosition(run: MissionRun, position: Vec3): Vec3 {
  if (run.source === 'backend') return [position[0] / 1e6, 6.371 + position[1] / 1e6, 0];
  const angle = position[0] / 6371000;
  const radius = 6.371 + position[1] / 1e6;
  return [Math.sin(angle) * radius, Math.cos(angle) * radius, 0];
}
