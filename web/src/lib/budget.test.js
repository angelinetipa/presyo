// src/lib/budget.test.js
// Tests for the budget maths. Run with: npm test
// Uses the test runner built into Node, so there is nothing to install.

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBudget, parseAmount, roundShares, makeRow, switchKind } from './budget.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg ?? `${a} is not close to ${b}`);

const DEFAULTS = [
  { id: 'savings', label: 'Savings', mode: 'percent', value: '60', unit: 'source' },
  { id: 'needs', label: 'Needs', mode: 'percent', value: '30', unit: 'source' },
  { id: 'wants', label: 'Wants', mode: 'percent', value: '10', unit: 'source' },
];

const byId = (result, id) => result.rows.find((row) => row.id === id);

test('default 60, 30, 10 split of 1000 at 60 pesos per unit', () => {
  const out = computeBudget({ total: '1000', rate: 60, rows: DEFAULTS });
  assert.equal(out.status, 'ok');
  close(byId(out, 'savings').source, 600);
  close(byId(out, 'needs').source, 300);
  close(byId(out, 'wants').source, 100);
  close(byId(out, 'savings').php, 36000);
  close(byId(out, 'needs').php, 18000);
  close(byId(out, 'wants').php, 6000);
  close(out.incomePhp, 60000);
});

test('a fixed row takes its amount and the percent rows share the rest by ratio', () => {
  const rows = [
    { id: 'savings', label: 'Savings', mode: 'fixed', value: '500', unit: 'source' },
    { id: 'needs', label: 'Needs', mode: 'percent', value: '30', unit: 'source' },
    { id: 'wants', label: 'Wants', mode: 'percent', value: '10', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.equal(out.status, 'ok');
  close(byId(out, 'savings').source, 500);
  close(byId(out, 'needs').source, 375);
  close(byId(out, 'wants').source, 125);
});

test('a fixed amount in pesos is converted with the rate', () => {
  const rows = [
    { id: 'savings', label: 'Savings', mode: 'fixed', value: '30000', unit: 'php' },
    { id: 'needs', label: 'Needs', mode: 'percent', value: '30', unit: 'source' },
    { id: 'wants', label: 'Wants', mode: 'percent', value: '10', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  close(byId(out, 'savings').source, 500);
  close(byId(out, 'savings').php, 30000);
  close(byId(out, 'needs').source, 375);
});

test('percents under 100 with no fixed row leave the rest unassigned', () => {
  const rows = [
    { id: 'a', label: 'A', mode: 'percent', value: '50', unit: 'source' },
    { id: 'b', label: 'B', mode: 'percent', value: '40', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.equal(out.status, 'under');
  close(byId(out, 'a').source, 500);
  close(byId(out, 'b').source, 400);
  close(out.unassigned, 100);
  close(out.unassignedPhp, 6000);
  close(out.percentSum, 90);
});

test('percents over 100 with no fixed row report the excess', () => {
  const rows = [
    { id: 'a', label: 'A', mode: 'percent', value: '70', unit: 'source' },
    { id: 'b', label: 'B', mode: 'percent', value: '40', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.equal(out.status, 'over');
  close(out.over, 100);
  close(out.overPhp, 6000);
});

test('fixed amounts above the income zero the percent rows and report the excess', () => {
  const rows = [
    { id: 'rent', label: 'Rent', mode: 'fixed', value: '1200', unit: 'source' },
    { id: 'rest', label: 'Rest', mode: 'percent', value: '100', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.equal(out.status, 'over');
  close(byId(out, 'rest').source, 0);
  close(out.over, 200);
});

test('fixed rows only leave the remainder unassigned', () => {
  const rows = [{ id: 'rent', label: 'Rent', mode: 'fixed', value: '400', unit: 'source' }];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.equal(out.status, 'under');
  close(out.unassigned, 600);
});

test('percent rows with zero weight get nothing when a fixed row exists', () => {
  const rows = [
    { id: 'rent', label: 'Rent', mode: 'fixed', value: '400', unit: 'source' },
    { id: 'rest', label: 'Rest', mode: 'percent', value: '0', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  close(byId(out, 'rest').source, 0);
  close(out.unassigned, 600);
});

test('zero income gives status empty and zero amounts', () => {
  const out = computeBudget({ total: '', rate: 60, rows: DEFAULTS });
  assert.equal(out.status, 'empty');
  assert.ok(out.rows.every((row) => row.source === 0 && row.php === 0));
});

test('a missing or zero rate gives status norate', () => {
  assert.equal(computeBudget({ total: '1000', rate: 0, rows: DEFAULTS }).status, 'norate');
  assert.equal(computeBudget({ total: '1000', rate: 'abc', rows: DEFAULTS }).status, 'norate');
});

test('bad input in a row counts as zero instead of breaking the split', () => {
  const rows = [
    { id: 'a', label: 'A', mode: 'percent', value: 'abc', unit: 'source' },
    { id: 'b', label: 'B', mode: 'percent', value: '-20', unit: 'source' },
    { id: 'c', label: 'C', mode: 'percent', value: '50', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  close(byId(out, 'a').source, 0);
  close(byId(out, 'b').source, 0);
  close(byId(out, 'c').source, 500);
});

test('rounded pesos add up to the rounded total', () => {
  const third = '33.3333333';
  const rows = [
    { id: 'a', label: 'A', mode: 'percent', value: third, unit: 'source' },
    { id: 'b', label: 'B', mode: 'percent', value: third, unit: 'source' },
    { id: 'c', label: 'C', mode: 'percent', value: third, unit: 'source' },
  ];
  const out = computeBudget({ total: '100', rate: 1, rows });
  const sum = out.rows.reduce((s, row) => s + row.phpRounded, 0);
  assert.equal(sum, Math.round(out.assignedPhp));
});

test('shown percents add up to 100 when everything is assigned', () => {
  const rows = [
    { id: 'a', label: 'A', mode: 'fixed', value: '500', unit: 'source' },
    { id: 'b', label: 'B', mode: 'percent', value: '30', unit: 'source' },
    { id: 'c', label: 'C', mode: 'percent', value: '10', unit: 'source' },
  ];
  const out = computeBudget({ total: '1000', rate: 60, rows });
  assert.deepEqual(out.rows.map((row) => row.shareRounded), [50, 38, 12]);
});

test('roundShares keeps the sum and handles cents', () => {
  const out = roundShares([10.004, 10.004, 10.004], 2);
  close(out.reduce((s, v) => s + v, 0), 30.01);
  assert.deepEqual(roundShares([1.5, 1.5], 0), [2, 1]);
});

test('parseAmount reads commas and rejects bad values', () => {
  assert.equal(parseAmount('1,500.50'), 1500.5);
  assert.equal(parseAmount(' 2 000 '), 2000);
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('-5'), 0);
  assert.equal(parseAmount('abc'), 0);
  assert.equal(parseAmount(undefined), 0);
  assert.equal(parseAmount(12), 12);
});

test('switching a percent row to fixed keeps its current amount', () => {
  const before = computeBudget({ total: '1000', rate: 60, rows: DEFAULTS });
  const savings = DEFAULTS[0];
  const current = byId(before, 'savings');

  const inSource = switchKind(savings, 'source', current);
  assert.deepEqual([inSource.mode, inSource.unit, inSource.value], ['fixed', 'source', '600']);

  const inPesos = switchKind(savings, 'php', current);
  assert.deepEqual([inPesos.mode, inPesos.unit, inPesos.value], ['fixed', 'php', '36000']);

  // The split stays the same after the switch.
  const rows = [inSource, DEFAULTS[1], DEFAULTS[2]];
  const after = computeBudget({ total: '1000', rate: 60, rows });
  close(byId(after, 'needs').source, 300);
  close(byId(after, 'wants').source, 100);
});

test('switching a fixed row to percent fills in its share of the income', () => {
  const rows = [
    { id: 'savings', label: 'Savings', mode: 'fixed', value: '500', unit: 'source' },
    DEFAULTS[1],
    DEFAULTS[2],
  ];
  const before = computeBudget({ total: '1000', rate: 60, rows });
  const out = switchKind(rows[0], 'percent', byId(before, 'savings'));
  assert.deepEqual([out.mode, out.value], ['percent', '50']);
});

test('switching to the kind a row already has changes nothing', () => {
  const before = computeBudget({ total: '1000', rate: 60, rows: DEFAULTS });
  const out = switchKind(DEFAULTS[1], 'percent', byId(before, 'needs'));
  assert.equal(out, DEFAULTS[1]);
});

test('switching a row with a zero amount leaves its box empty', () => {
  const before = computeBudget({ total: '', rate: 60, rows: DEFAULTS });
  const out = switchKind(DEFAULTS[2], 'php', byId(before, 'wants'));
  assert.equal(out.value, '');
});

test('makeRow gives each row its own id', () => {
  const a = makeRow();
  const b = makeRow({ label: 'Family' });
  assert.notEqual(a.id, b.id);
  assert.equal(b.label, 'Family');
  assert.equal(a.mode, 'percent');
});