import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  adaptBackendTelemetry,
  createMockMission,
  sampleMission,
  earthPosition,
} from '../src/features/mission-view/telemetry/mission.ts';

test('Launch Sequence: Stage A (Prelaunch) is stationary, upright, and on the pad', () => {
  const mission = createMockMission(false);
  const t0 = sampleMission(mission.samples, 0);

  // Position on pad: downrange = 0, altitude = 0
  assert.equal(t0.launchPosition[0], 0, 'Initial downrange must be exactly 0 (no lateral shift)');
  assert.equal(t0.launchPosition[1], 0, 'Initial altitude must be 0 (on launch pad)');
  assert.equal(t0.localPitch, 0, 'Initial pitch angle must be 0 (pointing straight up)');
  assert.equal(t0.altitude, 0, 'Altitude telemetry must start at 0');
});

test('Launch Sequence: Stage C (Vertical Liftoff) rises vertically with zero horizontal drift and zero pitch tilt', () => {
  const mission = createMockMission(false);

  // Check initial ascent samples during vertical liftoff phase (t in [0, 12] s)
  for (const t of [1, 3, 6, 9, 12]) {
    const s = sampleMission(mission.samples, t);
    assert.equal(
      s.launchPosition[0],
      0,
      `At t=${t}s, downrange must be 0 (no lateral drift to the right)`
    );
    assert.equal(
      s.localPitch,
      0,
      `At t=${t}s, local pitch must be 0 (perfectly vertical orientation)`
    );
    assert.ok(
      s.launchPosition[1] > 0,
      `At t=${t}s, rocket must have lifted off vertically (altitude > 0)`
    );
  }
});

test('Launch Sequence: Stage D (Pitch-Over) begins smoothly after vertical ascent threshold', () => {
  const mission = createMockMission(false);

  const prePitch = sampleMission(mission.samples, 12);
  const midPitch = sampleMission(mission.samples, 35);
  const postPitch = sampleMission(mission.samples, 75);

  assert.equal(prePitch.localPitch, 0, 'Pitch remains 0 before pitchover begins');
  assert.ok(
    midPitch.localPitch > 0 && midPitch.localPitch < postPitch.localPitch,
    'Pitch angle increases smoothly during gravity turn'
  );
  assert.ok(
    midPitch.launchPosition[0] > 0,
    'Downrange distance begins accumulating as rocket pitches over'
  );
  assert.ok(
    midPitch.launchPosition[0] < postPitch.launchPosition[0],
    'Downrange increases monotonically along ascent'
  );
});

test('Backend Telemetry Adapter: preserves topocentric vertical liftoff while keeping inertial EarthView coordinates', () => {
  // Mock backend telemetry at equatorial liftoff
  const backendData = [
    {
      time_s: 0.0,
      x_m: 6371000.0,
      y_m: 0.0,
      vx_mps: 0.0,
      vy_mps: 464.6,
      altitude_m: 0.0,
      downrange_distance_m: 0.0,
      pitch_angle_deg: 0.0,
      is_engine_active: true,
      propellant_remaining_kg: 50000.0,
    },
    {
      time_s: 5.0,
      x_m: 6371200.0,
      y_m: 2323.0,
      vx_mps: 80.0,
      vy_mps: 464.6,
      altitude_m: 200.0,
      downrange_distance_m: 0.0, // Ground-relative downrange is 0 during vertical ascent
      pitch_angle_deg: 0.0,
      is_engine_active: true,
      propellant_remaining_kg: 48000.0,
    },
    {
      time_s: 30.0,
      x_m: 6385000.0,
      y_m: 16000.0,
      vx_mps: 450.0,
      vy_mps: 600.0,
      altitude_m: 14000.0,
      downrange_distance_m: 4200.0,
      pitch_angle_deg: 18.5,
      is_engine_active: true,
      propellant_remaining_kg: 35000.0,
    },
  ];

  const mission = adaptBackendTelemetry(backendData as Parameters<typeof adaptBackendTelemetry>[0]);

  // Point 0 (t = 0): Launch pad
  const p0 = mission.samples[0];
  assert.deepEqual(p0.launchPosition, [0, 0, 0], 't=0 LaunchPosition must be origin [0,0,0]');
  assert.equal(p0.localPitch, 0, 't=0 localPitch must be 0');

  // Point 1 (t = 5s): Vertical ascent
  const p1 = mission.samples[1];
  assert.deepEqual(
    p1.launchPosition,
    [0, 200, 0],
    'During vertical ascent, launchPosition X must be 0 and Y must match altitude (200m)'
  );
  assert.equal(p1.localPitch, 0, 'localPitch must remain 0 during vertical ascent');

  // Global coordinates check for EarthView:
  // p1.position contains inertial coordinates [y, x - R, 0]
  assert.deepEqual(p1.position, [2323, 200, 0]);
  const ep1 = earthPosition(mission, p1.position);
  // Earth coordinates normalized in megameters
  assert.ok(Math.abs(ep1[1] - (6371200 / 1e6)) < 1e-4);

  // Point 2 (t = 30s): Pitch-over active
  const p2 = mission.samples[2];
  assert.equal(p2.launchPosition[0], 4200, 'Downrange distance accurately reflected in LaunchView X');
  assert.equal(p2.launchPosition[1], 14000, 'Altitude reflected in LaunchView Y');
  assert.ok(Math.abs(p2.localPitch - (18.5 * Math.PI / 180)) < 1e-6, 'Pitch angle converted to radians');
});
