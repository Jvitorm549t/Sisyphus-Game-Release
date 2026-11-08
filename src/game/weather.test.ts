/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DynamicWeatherSystem, WEATHER_CYCLE } from './weather';
import {
  stepPhysics,
  createInitialSimulationState,
  enqueuePushImpulse,
  DEFAULT_PHYSICS_CONFIG,
  DEFAULT_MODIFIERS,
} from './physics';

test('Weather: System initializes with calm weather', () => {
  const weather = new DynamicWeatherSystem();
  assert.equal(weather.getActiveWeather().id, 'calm');
  assert.equal(weather.getActiveWeather().difficultyImpact, 'neutral');
  assert.ok(weather.getTimeRemaining() > 0);
  assert.equal(weather.getCycleIndex(), 0);
});

test('Weather: Transition cycling progresses through all weather conditions', () => {
  const weather = new DynamicWeatherSystem();
  const initialKind = weather.getActiveWeather().id;
  assert.equal(initialKind, 'calm');

  const second = weather.advanceWeather();
  assert.equal(second.id, 'storm');
  assert.equal(second.difficultyImpact, 'harder');

  const third = weather.advanceWeather();
  assert.equal(third.id, 'fog');
  assert.equal(third.difficultyImpact, 'harder');

  const fourth = weather.advanceWeather();
  assert.equal(fourth.id, 'zephyr');
  assert.equal(fourth.difficultyImpact, 'easier');

  const fifth = weather.advanceWeather();
  assert.equal(fifth.id, 'rockfall');
  assert.equal(fifth.difficultyImpact, 'harder');

  // Should wrap around back to calm
  const wrap = weather.advanceWeather();
  assert.equal(wrap.id, 'calm');
});

test('Weather: Automatic timer step triggers weather advancement', () => {
  const weather = new DynamicWeatherSystem();
  const initialDuration = weather.getActiveWeather().durationSeconds;

  // Step partially
  const changed1 = weather.step(initialDuration / 2);
  assert.equal(changed1, false);
  assert.equal(weather.getActiveWeather().id, 'calm');

  // Step remaining time plus delta
  const changed2 = weather.step((initialDuration / 2) + 0.1);
  assert.equal(changed2, true);
  assert.equal(weather.getActiveWeather().id, 'storm');
});

test('Weather Physics: Storm makes climbing harder (higher gravity, lower push, adverse wind)', () => {
  const weather = new DynamicWeatherSystem();
  weather.setWeather('storm');
  const storm = weather.getActiveWeather();

  const modifiersStorm = weather.applyModifiers(DEFAULT_MODIFIERS);
  const modifiersCalm = DEFAULT_MODIFIERS;

  // Compare single push impulse under calm vs storm
  let stateCalm = createInitialSimulationState();
  stateCalm = enqueuePushImpulse(stateCalm, 30, 100);
  const nextCalm = stepPhysics(stateCalm, 0.05, DEFAULT_PHYSICS_CONFIG, modifiersCalm);

  let stateStorm = createInitialSimulationState();
  stateStorm = enqueuePushImpulse(stateStorm, 30, 100);
  const nextStorm = stepPhysics(stateStorm, 0.05, DEFAULT_PHYSICS_CONFIG, modifiersStorm);

  // Velocity reached under storm should be noticeably less due to push multiplier, adverse wind, and higher gravity
  assert.ok(
    nextStorm.velocity < nextCalm.velocity,
    `Storm velocity (${nextStorm.velocity}) should be lower than calm velocity (${nextCalm.velocity})`
  );
  assert.equal(storm.difficultyImpact, 'harder');
});

test('Weather Physics: Zephyr wind makes climbing easier (lower gravity, boost push, tailwind)', () => {
  const weather = new DynamicWeatherSystem();
  weather.setWeather('zephyr');
  const zephyr = weather.getActiveWeather();

  const modifiersZephyr = weather.applyModifiers(DEFAULT_MODIFIERS);
  const modifiersCalm = DEFAULT_MODIFIERS;

  let stateCalm = createInitialSimulationState();
  stateCalm = enqueuePushImpulse(stateCalm, 30, 100);
  const nextCalm = stepPhysics(stateCalm, 0.05, DEFAULT_PHYSICS_CONFIG, modifiersCalm);

  let stateZephyr = createInitialSimulationState();
  stateZephyr = enqueuePushImpulse(stateZephyr, 30, 100);
  const nextZephyr = stepPhysics(stateZephyr, 0.05, DEFAULT_PHYSICS_CONFIG, modifiersZephyr);

  // Velocity reached under zephyr should be greater than calm
  assert.ok(
    nextZephyr.velocity > nextCalm.velocity,
    `Zephyr velocity (${nextZephyr.velocity}) should exceed calm velocity (${nextCalm.velocity})`
  );
  assert.equal(zephyr.difficultyImpact, 'easier');
});
