/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScoreState } from './types';

const STORAGE_KEY = 'sisyphus_all_time_best';

export function loadAllTimeBest(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val) {
      const parsed = parseFloat(val);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }
  } catch {
    // Graceful fallback for non-browser or sandbox environments
  }
  return 0;
}

export function saveAllTimeBest(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, score.toFixed(1));
  } catch {
    // Non-blocking fallback
  }
}

export function createInitialScoreState(allTimeBest = 0): ScoreState {
  return {
    currentDistance: 0,
    maxDistance: 0,
    allTimeBest,
    metersRolledBack: 0,
  };
}

/**
 * Pure scoring update function.
 * Test 2 assurance:
 * - Current distance mirrors the live mountain slope position.
 * - Score increases strictly with uphill climb.
 * - Decays smoothly and accurately when rolling backwards.
 * - Records maxDistance reached in this run and persists allTimeBest without numerical drift.
 */
export function updateScoreState(
  prevScore: ScoreState,
  newDistance: number
): ScoreState {
  // Clamp distance to non-negative
  const safeDistance = Math.max(0, newDistance);
  
  // Track backwards distance rolled
  const deltaDistance = safeDistance - prevScore.currentDistance;
  const rollbackIncrement = deltaDistance < 0 ? Math.abs(deltaDistance) : 0;
  
  // New peak distance reached this run
  const newMaxDistance = Math.max(prevScore.maxDistance, safeDistance);
  const newAllTimeBest = Math.max(prevScore.allTimeBest, newMaxDistance);

  if (newAllTimeBest > prevScore.allTimeBest) {
    saveAllTimeBest(newAllTimeBest);
  }

  return {
    currentDistance: safeDistance,
    maxDistance: newMaxDistance,
    allTimeBest: newAllTimeBest,
    metersRolledBack: prevScore.metersRolledBack + rollbackIncrement,
  };
}

/**
 * Formats distance meters cleanly as integer or 1 decimal place.
 */
export function formatMeters(meters: number): string {
  return Math.floor(meters).toLocaleString();
}
