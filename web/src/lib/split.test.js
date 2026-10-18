// src/lib/split.test.js
// Tests for the split maths. Run with: npm test
// Uses the test runner built into Node, so there is nothing to install.

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSplit, parseAmount, formatValue, roundShares, makeRow } from './split.js';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg ?? `${a} is not close to ${b}`);
const row = (id, unit, value) => ({ id, label: id, unit, value });
const byId = (result, id) => result.rows.find((r) => r.id === id);
const run = (rows, total = '1000', rate = 60) => computeSplit({ total, rate, rows });

test('every row filled and adding up gives complete, with no auto row', () => {
  const out = run([row('savings', 'percent', '60'), row('needs', 'percent', '30'), row('wants', 'percent', '10')]);
  assert.equal(out.status, 'complete');
  assert.equal(out.autoId, null);
  close(byId(out, 'savings').source, 600);
  close(byId(out, 'needs').php, 18000);
  close(byId(out, 'wants').source, 100);
  close(out.incomePhp, 60000);
});

test('3 of 4 rows filled: the empty row fills itself with the rest', () => {
  const out = run([
    row('a', 'percent', '50'), row('b', 'percent', '30'), row('c', 'percent', '10'), row('d', 'percent', ''),
  ]);
  assert.equal(out.status, 'complete');
  assert.equal(out.autoId, 'd');
  assert.equal(byId(out, 'd').state, 'auto');
  close(byId(out, 'd').source, 100);
  close(byId(out, 'd').autoValue, 10);
  assert.equal(byId(out, 'd').autoText, '10');
  close(out.left, 0);
  close(out.assignedShare, 100);
});

test('the auto value is shown in the unit of the auto row', () => {
  const rows = (unit) => [row('a', 'percent', '50'), row('b', 'php', '18000'), row('c', unit, '')];
  const asPercent = run(rows('percent'));
  assert.equal(byId(asPercent, 'c').autoText, '20');
  const asSource = run(rows('source'));
  assert.equal(byId(asSource, 'c').autoText, '200');
  const asPhp = run(rows('php'));
  assert.equal(byId(asPhp, 'c').autoText, '12000');
});

test('rows can mix percent, income currency and pesos', () => {
  const out = run([row('a', 'percent', '40'), row('b', 'source', '100'), row('c', 'php', '6000'), row('d', '', '')]);
  // 400 + 100 + 100 = 600, so the last row takes 400.
  assert.equal(out.status, 'complete');
  close(byId(out, 'c').source, 100);
  close(byId(out, 'd').source, 400);
});

test('two empty rows wait and report how many more are needed and what is left', () => {
  const out = run([row('a', 'percent', '50'), row('b', 'percent', ''), row('c', 'percent', '')]);
  assert.equal(out.status, 'needmore');
  assert.equal(out.needMore, 1);
  assert.equal(out.autoId, null);
  assert.deepEqual(out.emptyIds, ['b', 'c']);
  close(out.left, 500);
  close(out.leftPhp, 30000);
  close(out.leftShare, 50);
  close(byId(out, 'b').source, 0);
  assert.equal(byId(out, 'b').state, 'empty');
});

test('all rows empty needs all but one filled', () => {
  const out = run([row('a', 'percent', ''), row('b', 'percent', ''), row('c', 'percent', ''), row('d', 'percent', '')]);
  assert.equal(out.status, 'needmore');
  assert.equal(out.needMore, 3);
  close(out.left, 1000);
});

test('a single empty row takes everything', () => {
  const out = run([row('a', 'percent', '')]);
  assert.equal(out.status, 'complete');
  close(byId(out, 'a').source, 1000);
  assert.equal(byId(out, 'a').autoText, '100');
});

test('all rows filled but short of the income gives under and what is left', () => {
  const out = run([row('a', 'percent', '50'), row('b', 'percent', '40')]);
  assert.equal(out.status, 'under');
  close(out.left, 100);
  close(out.leftPhp, 6000);
  close(out.leftShare, 10);
});

test('all rows filled but above the income gives over', () => {
  const out = run([row('a', 'percent', '70'), row('b', 'percent', '40')]);
  assert.equal(out.status, 'over');
  close(out.over, 100);
  close(out.overPhp, 6000);
  close(out.overShare, 10);
});

test('known rows above the income stop the auto fill and report over', () => {
  const out = run([row('rent', 'source', '1200'), row('rest', 'percent', '')]);
  assert.equal(out.status, 'over');
  assert.equal(out.autoId, null);
  close(out.over, 200);
  close(byId(out, 'rest').source, 0);
});

test('over takes priority when two rows are empty', () => {
  const out = run([row('a', 'percent', '120'), row('b', 'percent', ''), row('c', 'percent', '')]);
  assert.equal(out.status, 'over');
});

test('known rows that already use the whole income give the auto row zero', () => {
  const out = run([row('a', 'percent', '100'), row('b', 'percent', '')]);
  assert.equal(out.status, 'complete');
  assert.equal(out.autoId, 'b');
  assert.equal(byId(out, 'b').autoText, '0');
});

test('a typed 0 counts as filled, not empty', () => {
  const out = run([row('a', 'percent', '100'), row('b', 'percent', '0')]);
  assert.equal(out.status, 'complete');
  assert.equal(out.autoId, null);
  assert.equal(byId(out, 'b').state, 'filled');
});

test('blank, spaces and null all count as empty', () => {
  const out = run([row('a', 'percent', '50'), row('b', 'percent', '   '), row('c', 'percent', null)]);
  assert.equal(out.status, 'needmore');
  assert.deepEqual(out.emptyIds, ['b', 'c']);
});

test('text that is not a number is invalid and blocks the auto fill', () => {
  const out = run([row('a', 'percent', 'abc'), row('b', 'percent', '30'), row('c', 'percent', '')]);
  assert.equal(out.status, 'invalid');
  assert.deepEqual(out.invalidIds, ['a']);
  assert.equal(out.autoId, null);
  assert.equal(byId(out, 'a').state, 'invalid');
});

test('negative numbers and exponent text are invalid', () => {
  assert.equal(run([row('a', 'percent', '-5'), row('b', 'percent', '')]).status, 'invalid');
  assert.equal(run([row('a', 'percent', '1e2'), row('b', 'percent', '')]).status, 'invalid');
});

test('commas and decimals are read', () => {
  const out = run([row('a', 'source', '1,000.50'), row('b', 'percent', '')], '2000');
  close(byId(out, 'a').source, 1000.5);
  close(byId(out, 'b').source, 999.5);
});

test('a missing rate or income gives its own status', () => {
  assert.equal(run([row('a', 'percent', '100')], '1000', 0).status, 'norate');
  assert.equal(run([row('a', 'percent', '100')], '1000', 'abc').status, 'norate');
  assert.equal(run([row('a', 'percent', '100')], '', 60).status, 'noincome');
  assert.equal(run([row('a', 'percent', '100')], '0', 60).status, 'noincome');
});

test('pesos typed in whole numbers that match the income within half a peso are complete', () => {
  // 1000 at 63.5638 is 63,563.80 pesos. Typing 63,564 is off by 0.20 pesos.
  const out = run([row('a', 'php', '63564')], '1000', 63.5638);
  assert.equal(out.status, 'complete');
  close(byId(out, 'a').php, 63564);
});

test('a difference of more than half a peso is not complete', () => {
  assert.equal(run([row('a', 'php', '63560')], '1000', 63.5638).status, 'under');
});

test('shown percents and pesos add up when the split is complete', () => {
  const out = run([row('a', 'percent', '33.3333333'), row('b', 'percent', '33.3333333'), row('c', 'percent', '')], '100', 1);
  assert.equal(out.status, 'complete');
  const pesos = out.rows.reduce((s, r) => s + r.phpRounded, 0);
  const shares = out.rows.reduce((s, r) => s + r.shareRounded, 0);
  assert.equal(pesos, 100);
  assert.equal(shares, 100);
});

test('an auto percent is rounded for the input box', () => {
  const out = run([row('a', 'percent', '33.33'), row('b', 'percent', '33.33'), row('c', 'percent', '')], '100', 1);
  assert.equal(byId(out, 'c').autoText, '33.34');
});

test('no rows leaves the whole income unassigned', () => {
  const out = run([]);
  assert.equal(out.status, 'under');
  close(out.left, 1000);
});

test('formatValue keeps two decimals at most and drops trailing zeros', () => {
  assert.equal(formatValue(10), '10');
  assert.equal(formatValue(33.3349), '33.33');
  assert.equal(formatValue(12000.004), '12000');
  assert.equal(formatValue(0.1 + 0.2), '0.3');
  assert.equal(formatValue(0), '0');
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

test('roundShares keeps the sum', () => {
  assert.deepEqual(roundShares([50, 37.5, 12.5], 0), [50, 38, 12]);
  close(roundShares([10.004, 10.004, 10.004], 2).reduce((s, v) => s + v, 0), 30.01);
});

test('makeRow gives each row its own id and starts empty', () => {
  const a = makeRow();
  const b = makeRow({ label: 'Family' });
  assert.notEqual(a.id, b.id);
  assert.equal(b.label, 'Family');
  assert.equal(a.unit, 'percent');
  assert.equal(a.value, '');
});