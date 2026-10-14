import type { TelemetryPoint } from '../../../types/simulation';

export type Vec3 = [number, number, number];
export type MissionSample = {
  time: number;
  position: Vec3;
  launchPosition?: Vec3;
  velocity: Vec3;
  pitch: number;
  localPitch?: number;
  throttle: number;
  altitude: number;
  fuel: number;
  pressure?: number;
  acceleration?: number;
  downrange?: number;
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

// Deterministic visual fixture with physical Stage A-E launch sequence.
export function createMockMission(fault: boolean): MissionRun {
  const samples: MissionSample[] = [];
  const pitchoverTime = 12; // Stage C vertical liftoff phase before pitchover maneuver
  for (let time = 0; time <= DURATION; time++) {
    const poweredTime = fault ? Math.min(time, 65) : time;
    const peak = 1.8 * poweredTime ** 2;
    const fallTime = fault ? Math.max(0, time - 65) : 0;
    const altitude = Math.max(0, peak - 4.9 * fallTime ** 2);
    const vertical = fault && time > 65 ? (altitude > 0 ? -9.8 * fallTime : 0) : 3.6 * time;

    // Stage C: vertical liftoff with 0 downrange; Stage D: smooth pitchover transition
    const pt = Math.max(0, poweredTime - pitchoverTime);
    const isPitchover = time > pitchoverTime && altitude > 0;
    const downrange = isPitchover ? 0.8 * pt ** 2 : 0;
    const horizVel = isPitchover ? 1.6 * pt : 0;
    const pitchFraction = isPitchover ? Math.min(0.8, pt / (300 - pitchoverTime)) : 0;

    const pos: Vec3 = [downrange, altitude, 0];
    samples.push({
      time,
      position: pos,
      launchPosition: pos,
      velocity: [horizVel, vertical, 0],
      pitch: pitchFraction,
      localPitch: pitchFraction,
      throttle: fault && time >= 65 ? 0 : time < 280 ? 1 : 0,
      altitude,
      fuel: Math.max(0, 1 - poweredTime / 280),
      downrange,
    });
  }
  const events = [{ time: 0, label: 'Ignition sequence and liftoff command' }];
  events.push({ time: pitchoverTime, label: 'Pitchover maneuver initiated' });
  if (fault) {
    events.push({ time: 65, label: 'Premature engine shutdown' });
    events.push({ time: samples.find(p => p.time > 65 && p.altitude === 0)!.time, label: 'Ground impact detected' });
  } else {
    events.push({ time: BOOSTER_SEPARATION, label: 'Illustrative booster separation' },
      { time: CORE_SEPARATION, label: 'Illustrative core separation' }, { time: 280, label: 'Main engine cutoff (MECO)' });
  }
  return { samples, events, source: 'mock', staged: !fault };
}

// Planar ECI is embedded in 3D without claiming out-of-plane dynamics.
export function adaptBackendTelemetry(points: TelemetryPoint[]): MissionRun {
  return {
    source: 'backend',
    staged: false,
    events: [],
    samples: points.map(p => {
      const downrange = p.downrange_distance_m ?? 0;
      const altitude = p.altitude_m;
      const localPitch = (p.pitch_angle_deg * Math.PI) / 180;
      const inertialPitch = localPitch + Math.atan2(p.y_m, p.x_m);
      return {
        time: p.time_s,
        position: [p.y_m, p.x_m - 6371000, 0],
        launchPosition: [downrange, altitude, 0],
        velocity: [p.vy_mps, p.vx_mps, 0],
        pitch: inertialPitch,
        localPitch,
        throttle: p.is_engine_active ? 1 : 0,
        altitude,
        fuel: p.propellant_remaining_kg,
        pressure: p.dynamic_pressure_pa,
        acceleration: p.acceleration_mps2,
        downrange,
      };
    }),
  };
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
  const lerpVec = (va: Vec3, vb: Vec3): Vec3 => [lerp(va[0], vb[0]), lerp(va[1], vb[1]), lerp(va[2], vb[2])];

  const pos = a.position.map((v, i) => lerp(v, b.position[i])) as Vec3;
  const launchPos = a.launchPosition && b.launchPosition ? lerpVec(a.launchPosition, b.launchPosition) : pos;

  return {
    time,
    position: pos,
    launchPosition: launchPos,
    velocity: a.velocity.map((v, i) => lerp(v, b.velocity[i])) as Vec3,
    pitch: lerp(a.pitch, b.pitch),
    localPitch: lerp(a.localPitch ?? a.pitch, b.localPitch ?? b.pitch),
    altitude: lerp(a.altitude, b.altitude),
    fuel: lerp(a.fuel, b.fuel),
    pressure: lerp(a.pressure ?? 0, b.pressure ?? 0),
    acceleration: lerp(a.acceleration ?? 0, b.acceleration ?? 0),
    throttle: a.throttle,
    downrange: lerp(a.downrange ?? 0, b.downrange ?? 0),
  };
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
