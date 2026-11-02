// src/lib/savingsLink.test.js
// Tests for the link between the budget and the savings calculator. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { findSavingsRow, savingsFromBudget, applySavings } from './savingsLink.js';
import { computeSplit } from './split.js';
import { DEFAULT_ROWS } from '../constants/budget.js';

// Income 1000 at a rate of 60 is 60,000 pesos a month.
const INCOME = '1000';
const RATE = 60;
const rows = () => DEFAULT_ROWS.map((r) => ({ ...r }));
const byId = (list, id) => list.find((r) => r.id === id);
const split = (list) => computeSplit({ total: INCOME, rate: RATE, rows: list });

test('the Savings row is found by its name', () => {
  assert.equal(findSavingsRow(rows()).id, 'savings');
  const list = [{ id: 'a', label: 'Needs' }, { id: 'b', label: '  SAVINGS fund ' }];
  assert.equal(findSavingsRow(list).id, 'b');
});

test('no Savings row means no link', () => {
  const list = [{ id: 'a', label: 'Needs', unit: 'percent', value: '50' }, { id: 'b', label: 'Fun', unit: 'percent', value: '50' }];
  assert.equal(findSavingsRow(list), null);
  assert.equal(savingsFromBudget({ rows: list, income: INCOME, rate: RATE }), null);
  assert.equal(applySavings({ rows: list, income: INCOME, rate: RATE, php: 1000 }), list);
});

test('a percent row reads as pesos and a share', () => {
  const found = savingsFromBudget({ rows: rows(), income: INCOME, rate: RATE });
  assert.deepEqual(found, { id: 'savings', label: 'Savings', php: 36000, share: 60 });
});

test('a peso row and an income currency row both read as pesos', () => {
  const peso = rows().map((r) => (r.id === 'savings' ? { ...r, unit: 'php', value: '9000' } : r));
  assert.equal(savingsFromBudget({ rows: peso, income: INCOME, rate: RATE }).php, 9000);
  const source = rows().map((r) => (r.id === 'savings' ? { ...r, unit: 'source', value: '200' } : r));
  assert.equal(savingsFromBudget({ rows: source, income: INCOME, rate: RATE }).php, 12000);
});

test('a Savings row that fills itself still reads', () => {
  const list = rows().map((r) => (r.id === 'savings' ? { ...r, value: '' } : r));
  assert.equal(savingsFromBudget({ rows: list, income: INCOME, rate: RATE }).php, 36000);
});

test('an empty Savings row that cannot fill itself reads as null', () => {
  const list = rows().map((r) => (r.id === 'savings' || r.id === 'needs' ? { ...r, value: '' } : r));
  assert.equal(savingsFromBudget({ rows: list, income: INCOME, rate: RATE }), null);
});

test('no income or no rate reads as null', () => {
  assert.equal(savingsFromBudget({ rows: rows(), income: '', rate: RATE }), null);
  assert.equal(savingsFromBudget({ rows: rows(), income: INCOME, rate: 0 }), null);
});

test('setting the savings makes the Savings row a peso amount and another row adjusts', () => {
  const next = applySavings({ rows: rows(), income: INCOME, rate: RATE, php: 30000 });
  assert.equal(byId(next, 'savings').unit, 'php');
  assert.equal(byId(next, 'savings').value, '30000');
  assert.equal(byId(next, 'needs').value, '30');
  assert.equal(byId(next, 'wants').value, '');

  const result = split(next);
  assert.equal(result.status, 'complete');
  assert.equal(byId(result.rows, 'savings').phpRounded, 30000);
  assert.equal(byId(result.rows, 'needs').phpRounded, 18000);
  assert.equal(byId(result.rows, 'wants').phpRounded, 12000);
});

test('the row that last filled itself is the one that adjusts', () => {
  const next = applySavings({ rows: rows(), income: INCOME, rate: RATE, balanceId: 'needs', php: 30000 });
  assert.equal(byId(next, 'needs').value, '');
  assert.equal(byId(split(next).rows, 'needs').phpRounded, 24000);
});

test('a locked row does not adjust', () => {
  const locked = rows().map((r) => (r.id === 'wants' ? { ...r, locked: true } : r));
  const next = applySavings({ rows: locked, income: INCOME, rate: RATE, php: 30000 });
  assert.equal(byId(next, 'wants').value, '10');
  assert.equal(byId(next, 'needs').value, '');
});

test('the Savings row never adjusts, even when it filled itself last', () => {
  const empty = rows().map((r) => (r.id === 'savings' ? { ...r, value: '' } : r));
  const next = applySavings({ rows: empty, income: INCOME, rate: RATE, balanceId: 'savings', php: 30000 });
  assert.equal(byId(next, 'savings').value, '30000');
  assert.equal(byId(next, 'wants').value, '');
});

test('nothing adjusts when the rows already add up', () => {
  const next = applySavings({ rows: rows(), income: INCOME, rate: RATE, php: 36000 });
  assert.equal(next.filter((r) => r.value === '').length, 0);
  assert.equal(split(next).status, 'complete');
});

test('what is written is what is read back', () => {
  for (const php of [0, 1, 4999, 30000, 59999.5]) {
    const next = applySavings({ rows: rows(), income: INCOME, rate: RATE, php });
    const back = savingsFromBudget({ rows: next, income: INCOME, rate: RATE });
    assert.equal(back.php, Math.round(php), String(php));
  }
});

test('a savings amount above the income is written, and the budget reports it as over', () => {
  const next = applySavings({ rows: rows(), income: INCOME, rate: RATE, php: 80000 });
  assert.equal(byId(next, 'savings').value, '80000');
  assert.equal(split(next).status, 'over');
});

test('an amount that is not a number leaves the rows untouched', () => {
  const list = rows();
  for (const bad of [NaN, -5, Infinity, '5000', null, undefined]) {
    assert.equal(applySavings({ rows: list, income: INCOME, rate: RATE, php: bad }), list, String(bad));
  }
});

test('the rows passed in are not changed', () => {
  const list = rows();
  const copy = JSON.stringify(list);
  applySavings({ rows: list, income: INCOME, rate: RATE, php: 30000 });
  assert.equal(JSON.stringify(list), copy);
});