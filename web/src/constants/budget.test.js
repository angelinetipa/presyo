// src/constants/budget.test.js
// Checks the ready made splits. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ROWS, MAX_LABEL, MAX_ROWS, PRESETS } from './budget.js';

test('every preset adds up to 100 percent', () => {
  for (const p of PRESETS) {
    const total = p.rows.reduce((sum, [, value]) => sum + value, 0);
    assert.equal(total, 100, p.name);
  }
});

test('presets fit the row and name limits and have unique ids', () => {
  const ids = new Set();
  for (const p of PRESETS) {
    assert.ok(p.rows.length <= MAX_ROWS, p.name);
    for (const [label] of p.rows) assert.ok(label.length <= MAX_LABEL, label);
    ids.add(p.id);
  }
  assert.equal(ids.size, PRESETS.length);
});

test('the first preset matches the default rows', () => {
  const first = PRESETS[0].rows.map(([label, value]) => [label, String(value)]);
  const defaults = DEFAULT_ROWS.map((r) => [r.label, r.value]);
  assert.deepEqual(first, defaults);
});