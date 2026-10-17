// src/lib/budgetStorage.test.js
// Tests for reading saved settings. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from './budgetStorage.js';
import { DEFAULT_ROWS, DEFAULT_INCOME } from '../constants/budget.js';

const VALID = ['USD', 'SGD', 'JPY'];

test('nothing saved gives the defaults', () => {
  const out = sanitize(null, VALID, 'USD');
  assert.equal(out.currency, 'USD');
  assert.equal(out.income, DEFAULT_INCOME);
  assert.deepEqual(out.rows, DEFAULT_ROWS);
});

test('good saved settings come back unchanged', () => {
  const saved = {
    currency: 'SGD',
    income: '2500',
    rows: [
      { id: 'a', label: 'Rent', mode: 'fixed', value: '900', unit: 'source' },
      { id: 'b', label: 'Rest', mode: 'percent', value: '100', unit: 'source' },
    ],
  };
  assert.deepEqual(sanitize(saved, VALID, 'USD'), saved);
});

test('a currency that is no longer tracked falls back', () => {
  assert.equal(sanitize({ currency: 'XYZ', income: '10', rows: [] }, VALID, 'USD').currency, 'USD');
});

test('wrong types and bad fields are repaired', () => {
  const out = sanitize(
    {
      currency: 'USD',
      income: 1500,
      rows: [{ id: 'a', label: 5, mode: 'weird', value: 20, unit: 'moon' }],
    },
    VALID,
    'USD',
  );
  assert.equal(out.income, '1500');
  assert.deepEqual(out.rows, [{ id: 'a', label: '', mode: 'percent', value: '20', unit: 'source' }]);
});

test('duplicate row ids fall back to the default rows', () => {
  const rows = [
    { id: 'a', label: 'One', mode: 'percent', value: '50', unit: 'source' },
    { id: 'a', label: 'Two', mode: 'percent', value: '50', unit: 'source' },
  ];
  assert.deepEqual(sanitize({ currency: 'USD', income: '10', rows }, VALID, 'USD').rows, DEFAULT_ROWS);
});

test('too many rows are cut to the limit and long labels are shortened', () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: `r${i}`, label: 'x'.repeat(60), mode: 'percent', value: '1', unit: 'source',
  }));
  const out = sanitize({ currency: 'USD', income: '10', rows }, VALID, 'USD');
  assert.equal(out.rows.length, 8);
  assert.equal(out.rows[0].label.length, 24);
});

test('junk that is not an object gives the defaults', () => {
  assert.deepEqual(sanitize('hello', VALID, 'USD').rows, DEFAULT_ROWS);
  assert.deepEqual(sanitize(42, VALID, 'USD').rows, DEFAULT_ROWS);
});

test('an empty income box is kept empty, not reset', () => {
  assert.equal(sanitize({ currency: 'USD', income: '', rows: [] }, VALID, 'USD').income, '');
});