/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawInputEvent } from './types';

export interface InputProcessorConfig {
  maxQueuedInputsPerFrame: number;
  rateSampleWindowMs: number;
  minEventIntervalMs: number; // Debounces hardware bounce per individual key ID
}

export const DEFAULT_INPUT_CONFIG: InputProcessorConfig = {
  maxQueuedInputsPerFrame: 32, // Safely handles multi-finger barrage without stalling
  rateSampleWindowMs: 1000,
  minEventIntervalMs: 25,      // Minimum ms between repeated hits of the exact same key ID
};

export class ParallelInputProcessor {
  private config: InputProcessorConfig;
  private pendingImpulses: number = 0;
  private keyLastTriggered: Map<string, number> = new Map();
  private timestamps: number[] = [];
  private totalInputsCount: number = 0;

  constructor(config: Partial<InputProcessorConfig> = {}) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
  }

  /**
   * Register a raw input event (keyboard key, mouse click, touch tap).
   * QA Test 1: Multiple simultaneous keys/clicks sum up their push forces.
   * Debounces the *same* physical key from OS key-repeat stutter while allowing
   * unlimited distinct keys pressed simultaneously (multi-finger slam/roll).
   */
  public registerInput(raw: RawInputEvent, baseForce: number): boolean {
    const now = raw.timestamp || performance.now();
    const lastTime = this.keyLastTriggered.get(raw.id) || 0;

    // Check individual key debounce interval
    if (now - lastTime < this.config.minEventIntervalMs) {
      return false;
    }

    this.keyLastTriggered.set(raw.id, now);

    // Bound maximum queue growth to prevent memory exhaustion or event loop stalling
    if (this.pendingImpulses < this.config.maxQueuedInputsPerFrame) {
      this.pendingImpulses += 1;
    }

    // Record for rolling rate calculation
    this.timestamps.push(now);
    this.totalInputsCount += 1;

    // Clean up stale timestamps older than sample window
    this.pruneOldTimestamps(now);

    return true;
  }

  /**
   * Release or clean up a key when released.
   */
  public releaseKey(id: string): void {
    this.keyLastTriggered.delete(id);
  }

  /**
   * Consumes and clears pending impulses accumulated since last frame.
   * Returns array of individual impulse forces.
   */
  public flushImpulses(baseForce: number): number[] {
    const count = this.pendingImpulses;
    this.pendingImpulses = 0;
    if (count === 0) return [];

    const impulses: number[] = new Array(count);
    for (let i = 0; i < count; i++) {
      impulses[i] = baseForce;
    }
    return impulses;
  }

  /**
   * Computes current inputs per second over the rolling window.
   */
  public getInputsPerSecond(now: number = performance.now()): number {
    this.pruneOldTimestamps(now);
    return this.timestamps.length;
  }

  public getTotalInputs(): number {
    return this.totalInputsCount;
  }

  public clear(): void {
    this.pendingImpulses = 0;
    this.keyLastTriggered.clear();
    this.timestamps = [];
  }

  private pruneOldTimestamps(now: number): void {
    const cutoff = now - this.config.rateSampleWindowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }

    // Clean up key tracker cache if too many keys were stored
    if (this.keyLastTriggered.size > 120) {
      for (const [key, time] of this.keyLastTriggered.entries()) {
        if (now - time > 5000) {
          this.keyLastTriggered.delete(key);
        }
      }
    }
  }
}
