import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adaptBackendTelemetry, earthPosition, sampleMission } from '../src/features/mission-view/telemetry/mission.ts';
test('3D embedding preserves planar radius and orientation away from launch', () => {
  const points = [{ time_s: 0, x_m: 6000000, y_m: 3000000, vx_mps: 100, vy_mps: 200, altitude_m: Math.hypot(6000000,3000000)-6371000, pitch_angle_deg: 30, is_engine_active: true, propellant_remaining_kg: 123 }];
  const run = adaptBackendTelemetry(points as Parameters<typeof adaptBackendTelemetry>[0]);
  assert.deepEqual(earthPosition(run, run.samples[0].position), [3,6,0]);
  assert.ok(Math.abs(Math.hypot(...earthPosition(run, run.samples[0].position))*1e6 - Math.hypot(6000000,3000000)) < 1e-6);
  assert.ok(Math.abs(run.samples[0].pitch - (Math.PI/6 + Math.atan2(3000000,6000000))) < 1e-12);
  assert.equal(sampleMission(run.samples, 10).fuel,123);
  assert.equal(run.staged,false);
});
