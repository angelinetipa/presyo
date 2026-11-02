// src/lib/savings.test.js
// Tests for the savings maths. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERIODS, projectSavings, toMonths, monthlyNeeded, monthsToReach, describeMonths,
} from './savings.js';

const totalFor = (rows, id) => rows.find((r) => r.id === id).total;

test('a monthly amount grows evenly across every period', () => {
  const rows = projectSavings(3000);
  assert.equal(rows.length, PERIODS.length);
  assert.equal(totalFor(rows, 'day'), 100);
  assert.equal(totalFor(rows, 'month'), 3000);
  assert.equal(totalFor(rows, 'half'), 18000);
  assert.equal(totalFor(rows, 'year'), 36000);
  assert.equal(totalFor(rows, 'five'), 180000);
});

test('zero, negative and invalid amounts give zero totals', () => {
  for (const bad of [0, -500, NaN, Infinity, undefined, null]) {
    assert.ok(projectSavings(bad).every((r) => r.total === 0), String(bad));
  }
});

test('days, months and years convert to months', () => {
  assert.equal(toMonths(30, 'days'), 1);
  assert.equal(toMonths(6, 'months'), 6);
  assert.equal(toMonths(2, 'years'), 24);
  assert.equal(toMonths(-1, 'years'), 0);
});

test('the monthly amount needed for a goal', () => {
  assert.equal(monthlyNeeded(120000, 12), 10000);
  assert.equal(monthlyNeeded(120000, toMonths(2, 'years')), 5000);
});

test('no time or no goal gives a monthly amount of 0', () => {
  assert.equal(monthlyNeeded(120000, 0), 0);
  assert.equal(monthlyNeeded(0, 12), 0);
  assert.equal(monthlyNeeded(NaN, 12), 0);
});

test('months to reach a goal round up to a whole month', () => {
  assert.equal(monthsToReach(100000, 10000), 10);
  assert.equal(monthsToReach(100000, 30000), 4);
  assert.equal(monthsToReach(0, 5000), 0);
});

test('months to reach a goal is null when nothing is saved', () => {
  assert.equal(monthsToReach(100000, 0), null);
  assert.equal(monthsToReach(100000, -5), null);
});

test('months read as plain words', () => {
  assert.equal(describeMonths(0), '0 months');
  assert.equal(describeMonths(1), '1 month');
  assert.equal(describeMonths(12), '1 year');
  assert.equal(describeMonths(15), '1 year 3 months');
  assert.equal(describeMonths(26), '2 years 2 months');
  assert.equal(describeMonths(null), '');
});