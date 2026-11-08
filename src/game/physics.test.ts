/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stepPhysics,
  createInitialSimulationState,
  enqueuePushImpulse,
  calculateDynamicSlopeSteepness,
  DEFAULT_PHYSICS_CONFIG,
  DEFAULT_MODIFIERS,
} from './physics';

test('Physics: Initial state starts stationary at base of hill', () => {
  const state = createInitialSimulationState();
  assert.equal(state.distance, 0);
  assert.equal(state.velocity, 0);
  assert.equal(state.stoneAngle, 0);
  assert.equal(state.pushForceQueue.length, 0);
});

test('Physics Test 1: Parallel multi-input summation increases uphill acceleration', () => {
  let state = createInitialSimulationState();

  // Enqueue 3 simultaneous inputs in the same tick (multi-finger slam)
  state = enqueuePushImpulse(state, 28, 100);
  state = enqueuePushImpulse(state, 28, 100);
  state = enqueuePushImpulse(state, 28, 100);

  assert.equal(state.pushForceQueue.length, 3);

  // Step physics with 16.6ms (approx 60fps)
  const nextState = stepPhysics(state, 0.016, DEFAULT_PHYSICS_CONFIG, DEFAULT_MODIFIERS);

  // Velocity should become positive (uphill motion)
  assert.ok(nextState.velocity > 0, `Expected velocity > 0, got ${nextState.velocity}`);
  assert.ok(nextState.distance >= 0, `Expected distance >= 0, got ${nextState.distance}`);
  assert.equal(nextState.pushForceQueue.length, 0, 'Impulse queue must be cleared after step');
});

test('Physics: Boulder decelerates and rolls backwards when player stops pushing', () => {
  let state = createInitialSimulationState();
  state.distance = 25; // 25 meters up the hill
  state.velocity = 0;  // Player paused pushing

  // Step forward in time (0.05s) with zero input
  const nextState = stepPhysics(state, 0.05, DEFAULT_PHYSICS_CONFIG, DEFAULT_MODIFIERS);

  // Under gravity along the slope, velocity should become negative (rolling downhill)
  assert.ok(nextState.velocity < 0, `Expected negative velocity under gravity, got ${nextState.velocity}`);
  assert.equal(nextState.isRollingBackward, true);
});

test('Physics Test 3: Boulder cannot roll backward past 0m base', () => {
  let state = createInitialSimulationState();
  state.distance = 0.01;
  state.velocity = -5; // Moving downhill towards bottom

  const nextState = stepPhysics(state, 0.05, DEFAULT_PHYSICS_CONFIG, DEFAULT_MODIFIERS);

  assert.equal(nextState.distance, 0, 'Distance must be clamped at base 0m');
  assert.equal(nextState.velocity, 0, 'Velocity should stop at base');
});

test('Physics: Exact stone angular rotation tracks distance rolled', () => {
  let state = createInitialSimulationState();
  state.velocity = 10;

  const nextState = stepPhysics(state, 0.02, DEFAULT_PHYSICS_CONFIG, DEFAULT_MODIFIERS);

  // Stone angle should have rotated in positive direction
  assert.ok(nextState.stoneAngle > 0, 'Stone should rotate forward as it rolls uphill');
});

test('Physics: Dynamic slope steepness scales monotonically with distance traveled', () => {
  const at0m = calculateDynamicSlopeSteepness(26, 0);
  const at50m = calculateDynamicSlopeSteepness(26, 50);
  const at120m = calculateDynamicSlopeSteepness(26, 120);
  const at250m = calculateDynamicSlopeSteepness(26, 250);

  // Base checks
  assert.equal(at0m.angleDeg, 26);
  assert.equal(at0m.multiplier, 1.0);

  // Progressive increase in angle and gravity pull multiplier
  assert.ok(at50m.angleDeg > at0m.angleDeg, `50m angle ${at50m.angleDeg} must be > 26`);
  assert.ok(at50m.multiplier > 1.0, `50m multiplier ${at50m.multiplier} must be > 1.0`);

  assert.ok(at120m.angleDeg > at50m.angleDeg, `120m angle ${at120m.angleDeg} must be > 50m`);
  assert.ok(at120m.multiplier > at50m.multiplier, '120m gravity multiplier must exceed 50m');

  assert.ok(at250m.angleDeg > at120m.angleDeg, '250m angle must exceed 120m');
  assert.ok(at250m.multiplier > at120m.multiplier, '250m gravity multiplier must exceed 120m');
});

test('Physics: Downhill gravity acceleration is strictly stronger at high altitudes', () => {
  const config = DEFAULT_PHYSICS_CONFIG;

  // Step state at 0m altitude with 0 velocity
  let stateLow = createInitialSimulationState();
  stateLow.distance = 0.5;
  stateLow.velocity = 0;
  const resultLow = stepPhysics(stateLow, 0.04, config, DEFAULT_MODIFIERS);

  // Step state at 150m altitude with 0 velocity
  let stateHigh = createInitialSimulationState();
  stateHigh.distance = 150;
  stateHigh.velocity = 0;
  const resultHigh = stepPhysics(stateHigh, 0.04, config, DEFAULT_MODIFIERS);

  // Downhill acceleration is negative; at 150m it must pull more intensely downhill
  assert.ok(resultHigh.acceleration < resultLow.acceleration,
    `High altitude accel (${resultHigh.acceleration}) must be more negative than low altitude (${resultLow.acceleration})`);

  // Downhill velocity achieved in 0.04s should be more negative
  assert.ok(resultHigh.velocity < resultLow.velocity,
    `High altitude velocity (${resultHigh.velocity}) must be more negative than low altitude (${resultLow.velocity})`);
});
