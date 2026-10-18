// src/lib/format.test.js
// Tests for date formatting. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDay, formatPeso, formatMoney } from './format.js';

const ZONES = ['Pacific/Honolulu', 'America/Los_Angeles', 'UTC', 'Asia/Manila', 'Pacific/Auckland'];

test('a plain day shows the same date in every time zone', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ZONES) {
      process.env.TZ = zone;
      assert.equal(formatDay('2026-10-18'), 'Oct 18', `short in ${zone}`);
      assert.equal(formatDay('2026-10-18', 'medium'), 'Oct 18, 2026', `medium in ${zone}`);
      assert.equal(formatDay('2026-08-06', 'long'), 'August 6, 2026', `long in ${zone}`);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('the first and last day of a month do not slip into the next or previous', () => {
  process.env.TZ = 'Pacific/Honolulu';
  assert.equal(formatDay('2026-10-01'), 'Oct 1');
  assert.equal(formatDay('2026-10-31'), 'Oct 31');
  delete process.env.TZ;
});

test('pesos show as whole numbers with a separator', () => {
  assert.equal(formatPeso(63564), '\u20B163,564');
  assert.equal(formatPeso(0), '\u20B10');
  assert.equal(formatPeso(1234567.4), '\u20B11,234,567');
});

test('money shows two decimals', () => {
  assert.equal(formatMoney(1000), '1,000.00');
  assert.equal(formatMoney(0.5), '0.50');
});