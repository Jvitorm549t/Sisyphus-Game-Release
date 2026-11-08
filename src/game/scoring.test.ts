/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScoreState,
  updateScoreState,
  formatMeters,
} from './scoring';

test('Scoring Test 2: Score ascends strictly according to meters climbed', () => {
  let score = createInitialScoreState(0);
  assert.equal(score.currentDistance, 0);
  assert.equal(score.maxDistance, 0);

  // Climb 12.4 meters
  score = updateScoreState(score, 12.4);
  assert.equal(score.currentDistance, 12.4);
  assert.equal(score.maxDistance, 12.4);
  assert.equal(score.metersRolledBack, 0);

  // Climb further to 25.8 meters
  score = updateScoreState(score, 25.8);
  assert.equal(score.currentDistance, 25.8);
  assert.equal(score.maxDistance, 25.8);
});

test('Scoring Test 2: Current distance decays on rollback while maxDistance preserves record', () => {
  let score = createInitialScoreState(0);
  score = updateScoreState(score, 50.0); // reached 50m

  // Boulder rolls backwards down to 35m
  score = updateScoreState(score, 35.0);

  assert.equal(score.currentDistance, 35.0, 'Current distance must reflect live position');
  assert.equal(score.maxDistance, 50.0, 'Max distance achieved must remain preserved');
  assert.equal(score.metersRolledBack, 15.0, 'Meters rolled back should accumulate loss');
});

test('Scoring: formatMeters rounds correctly for integer HUD readout', () => {
  assert.equal(formatMeters(0), '0');
  assert.equal(formatMeters(42.8), '42');
  assert.equal(formatMeters(1250.3), '1,250');
});
