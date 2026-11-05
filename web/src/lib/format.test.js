// src/lib/format.test.js
// Tests for date formatting. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDay, formatPeso, formatMoney, formatPesoExact, formatMoneyExact, formatRateExact, formatPercentExact,
} from './format.js';

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

test('pesos show to the centavo with a separator', () => {
  assert.equal(formatPeso(63564), '\u20B163,564.00');
  assert.equal(formatPeso(0), '\u20B10.00');
  assert.equal(formatPeso(1234567.4), '\u20B11,234,567.40');
});

test('money rounds half up on the decimal digits, not on the binary value', () => {
  // toFixed(2) gives 1.00, 2.67 and 0.28 for these.
  assert.equal(formatPeso(1.005), '\u20B11.01');
  assert.equal(formatPeso(2.675), '\u20B12.68');
  assert.equal(formatMoney(0.285), '0.29');
});

test('exact helpers keep the tiny decimals', () => {
  assert.equal(formatRateExact(63.7942), '63.794200');
  assert.equal(formatRateExact(0.401), '0.401000');
  assert.equal(formatPesoExact(63794.2351234567), '\u20B163,794.23512346');
  assert.equal(formatPesoExact(63794.2), '\u20B163,794.20');
  assert.equal(formatMoneyExact(1000), '1,000.00');
  assert.equal(formatPercentExact(-0.0712345678), '-0.071235%');
  assert.equal(formatPercentExact(0.29), '+0.29%');
  assert.equal(formatPercentExact(0), '0.00%');
});

test('binary noise does not leak into exact money', () => {
  assert.equal(formatPesoExact(0.1 + 0.2), '\u20B10.30');
  assert.equal(formatPesoExact(63794.20000000001), '\u20B163,794.20');
});

test('money shows two decimals', () => {
  assert.equal(formatMoney(1000), '1,000.00');
  assert.equal(formatMoney(0.5), '0.50');
});