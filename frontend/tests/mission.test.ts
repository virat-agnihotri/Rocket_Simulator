import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adaptBackendTelemetry, createMockMission, sampleMission, separationAt } from '../src/features/mission-view/telemetry/mission.ts';

test('backward seeking reattaches stages and restores engine state', () => {
  const run = createMockMission(false);
  assert.deepEqual(separationAt(run, 220), { boosters: true, core: true });
  assert.deepEqual(separationAt(run, 119), { boosters: false, core: false });
  assert.equal(sampleMission(run.samples, 290).throttle, 0);
  assert.equal(sampleMission(run.samples, 30).throttle, 1);
});
test('fault stops engines at the event boundary and reaches ground without stage separation', () => {
  const run = createMockMission(true);
  assert.equal(sampleMission(run.samples, 64.9).throttle, 1);
  assert.equal(sampleMission(run.samples, 65).throttle, 0);
  assert.equal(sampleMission(run.samples, 300).altitude, 0);
  assert.deepEqual(separationAt(run, 200), { boosters: false, core: false });
});
test('sampling interpolates irregular timestamps and clamps endpoints', () => {
  const run = createMockMission(false);
  const samples = [run.samples[0], { ...run.samples[10], time: 2.5 }];
  assert.equal(sampleMission(samples, 1.25).altitude, 90);
  assert.equal(sampleMission(samples, -1).time, 0);
  assert.equal(sampleMission(samples, 100).time, 2.5);
});
test('backend mapping preserves Earth-centered positions and does not fabricate stages', () => {
  const telemetry = [{ time_s: 0, x_m: 6371000, y_m: 0, vx_mps: 0, vy_mps: 10, altitude_m: 0, pitch_angle_deg: 0, is_engine_active: true, propellant_remaining_kg: 20 }];
  const run = adaptBackendTelemetry(telemetry as Parameters<typeof adaptBackendTelemetry>[0]);
  assert.deepEqual(run.samples[0].position, [0, 0, 0]);
  assert.deepEqual(run.samples[0].velocity, [10, 0, 0]);
  assert.equal(run.source, 'backend');
  assert.deepEqual(separationAt(run, 300), { boosters: false, core: false });
});
