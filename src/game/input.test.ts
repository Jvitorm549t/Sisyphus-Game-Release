/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ParallelInputProcessor } from './input';

test('Input Test 1: Distinct simultaneous keys register and accumulate without dropping', () => {
  const processor = new ParallelInputProcessor();

  const now = 1000;
  // Simultaneous 4-finger press (e.g. F, J, Space, Mouse0)
  const r1 = processor.registerInput({ id: 'key_KeyF', type: 'keyboard', timestamp: now }, 28);
  const r2 = processor.registerInput({ id: 'key_KeyJ', type: 'keyboard', timestamp: now }, 28);
  const r3 = processor.registerInput({ id: 'key_Space', type: 'keyboard', timestamp: now }, 28);
  const r4 = processor.registerInput({ id: 'mouse_0', type: 'mouse', timestamp: now }, 28);

  assert.equal(r1, true);
  assert.equal(r2, true);
  assert.equal(r3, true);
  assert.equal(r4, true);

  // Flush impulses for physics step
  const impulses = processor.flushImpulses(28);
  assert.equal(impulses.length, 4, 'Should yield 4 discrete impulses');
  assert.deepEqual(impulses, [28, 28, 28, 28]);

  // Queue must be empty after flush
  const nextImpulses = processor.flushImpulses(28);
  assert.equal(nextImpulses.length, 0);
});

test('Input: Debouncing prevents extreme repeat hardware bounce on same key', () => {
  const processor = new ParallelInputProcessor({ minEventIntervalMs: 30 });

  const t1 = 2000;
  const first = processor.registerInput({ id: 'key_KeyA', type: 'keyboard', timestamp: t1 }, 28);
  // Attempt duplicate 5ms later (hardware chatter)
  const duplicate = processor.registerInput({ id: 'key_KeyA', type: 'keyboard', timestamp: t1 + 5 }, 28);
  // Attempt valid press 40ms later
  const validLater = processor.registerInput({ id: 'key_KeyA', type: 'keyboard', timestamp: t1 + 40 }, 28);

  assert.equal(first, true);
  assert.equal(duplicate, false, 'Should debounce same key within 30ms');
  assert.equal(validLater, true, 'Should accept press after debounce window');
});

test('Input: Rate calculation measures inputs per second accurately', () => {
  const processor = new ParallelInputProcessor({ rateSampleWindowMs: 1000 });

  const t0 = 5000;
  // Fire 10 inputs within 500ms
  for (let i = 0; i < 10; i++) {
    processor.registerInput({ id: `key_${i}`, type: 'keyboard', timestamp: t0 + i * 40 }, 28);
  }

  assert.equal(processor.getInputsPerSecond(t0 + 500), 10);
  // After 1500ms, all should have pruned
  assert.equal(processor.getInputsPerSecond(t0 + 1600), 0);
});
