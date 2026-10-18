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
      { id: 'a', label: 'Rent', unit: 'php', value: '9000', locked: true },
      { id: 'b', label: 'Rest', unit: 'percent', value: '', locked: false },
    ],
  };
  assert.deepEqual(sanitize(saved, VALID, 'USD'), saved);
});

test('an empty row value stays empty', () => {
  const out = sanitize({ currency: 'USD', income: '10', rows: [{ id: 'a', label: 'A', unit: 'source', value: '' }] }, VALID, 'USD');
  assert.equal(out.rows[0].value, '');
});

test('rows saved by the earlier version are converted to one unit', () => {
  const saved = {
    currency: 'USD',
    income: '1000',
    rows: [
      { id: 'a', label: 'Rent', mode: 'fixed', value: '300', unit: 'source' },
      { id: 'b', label: 'Phone', mode: 'fixed', value: '1500', unit: 'php' },
      { id: 'c', label: 'Rest', mode: 'percent', value: '100', unit: 'source' },
    ],
  };
  assert.deepEqual(sanitize(saved, VALID, 'USD').rows, [
    { id: 'a', label: 'Rent', unit: 'source', value: '300', locked: false },
    { id: 'b', label: 'Phone', unit: 'php', value: '1500', locked: false },
    { id: 'c', label: 'Rest', unit: 'percent', value: '100', locked: false },
  ]);
});

test('an unknown unit falls back to percent', () => {
  const out = sanitize({ currency: 'USD', income: '10', rows: [{ id: 'a', label: 'A', unit: 'moon', value: '5' }] }, VALID, 'USD');
  assert.equal(out.rows[0].unit, 'percent');
});

test('a currency that is no longer tracked falls back', () => {
  assert.equal(sanitize({ currency: 'XYZ', income: '10', rows: [] }, VALID, 'USD').currency, 'USD');
});

test('wrong types are repaired', () => {
  const out = sanitize(
    { currency: 'USD', income: 1500, rows: [{ id: 'a', label: 5, unit: 'percent', value: 20 }] },
    VALID,
    'USD',
  );
  assert.equal(out.income, '1500');
  assert.deepEqual(out.rows, [{ id: 'a', label: '', unit: 'percent', value: '20', locked: false }]);
});

test('only a real true keeps a row locked', () => {
  const rows = [
    { id: 'a', label: 'A', unit: 'percent', value: '1', locked: true },
    { id: 'b', label: 'B', unit: 'percent', value: '2', locked: 'yes' },
    { id: 'c', label: 'C', unit: 'percent', value: '3' },
  ];
  const out = sanitize({ currency: 'USD', income: '10', rows }, VALID, 'USD');
  assert.deepEqual(out.rows.map((r) => r.locked), [true, false, false]);
});

test('duplicate row ids fall back to the default rows', () => {
  const rows = [
    { id: 'a', label: 'One', unit: 'percent', value: '50' },
    { id: 'a', label: 'Two', unit: 'percent', value: '50' },
  ];
  assert.deepEqual(sanitize({ currency: 'USD', income: '10', rows }, VALID, 'USD').rows, DEFAULT_ROWS);
});

test('an empty list of rows falls back to the default rows', () => {
  assert.deepEqual(sanitize({ currency: 'USD', income: '10', rows: [] }, VALID, 'USD').rows, DEFAULT_ROWS);
});

test('too many rows are cut to the limit and long labels are shortened', () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: `r${i}`, label: 'x'.repeat(60), unit: 'percent', value: '1',
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