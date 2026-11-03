// src/lib/kpis.test.js
// Tests for the KPI numbers. Run with: npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { rateKpis, runKpis } from './kpis.js';

const near = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 1e-9, `${msg}: ${actual} vs ${expected}`);

const SERIES = [
  { date: '2026-10-01', USD: 64.0, SGD: 50.0 },
  { date: '2026-10-02', USD: 63.0, SGD: 50.5 },
  { date: '2026-10-03', USD: 65.0 }, // no SGD on this day
  { date: '2026-10-04', USD: 64.8, SGD: 51.0 },
];

test('the latest value, date and day count', () => {
  const k = rateKpis(SERIES, 'USD');
  assert.equal(k.value, 64.8);
  assert.equal(k.date, '2026-10-04');
  assert.equal(k.days, 4);
  assert.equal(k.currency, 'USD');
});

test('the change against the previous day and against the first day', () => {
  const k = rateKpis(SERIES, 'USD');
  near(k.dayChange, ((64.8 - 65) / 65) * 100, 'day change');
  near(k.sinceStart, ((64.8 - 64) / 64) * 100, 'since start');
  assert.equal(k.sinceDate, '2026-10-01');
});

test('the low and high come with their dates', () => {
  const k = rateKpis(SERIES, 'USD');
  assert.deepEqual(k.low, { value: 63, date: '2026-10-02' });
  assert.deepEqual(k.high, { value: 65, date: '2026-10-03' });
});

test('today sits between the low and the high', () => {
  near(rateKpis(SERIES, 'USD').rangePosition, (64.8 - 63) / (65 - 63), 'position');
});

test('a day with no value for the currency is skipped, not counted as zero', () => {
  const k = rateKpis(SERIES, 'SGD');
  assert.equal(k.days, 3);
  assert.equal(k.value, 51);
  near(k.dayChange, ((51 - 50.5) / 50.5) * 100, 'day change skips the gap');
});

test('one recorded day has no day change and no range position', () => {
  const k = rateKpis([{ date: '2026-10-01', USD: 64 }], 'USD');
  assert.equal(k.dayChange, null);
  assert.equal(k.sinceStart, 0);
  assert.equal(k.rangePosition, null);
  assert.deepEqual(k.low, k.high);
});

test('a flat range has no position', () => {
  const flat = [{ date: '2026-10-01', USD: 64 }, { date: '2026-10-02', USD: 64 }];
  assert.equal(rateKpis(flat, 'USD').rangePosition, null);
  assert.equal(rateKpis(flat, 'USD').dayChange, 0);
});

test('a repeated low or high uses the earliest date', () => {
  const tie = [
    { date: '2026-10-01', USD: 62 },
    { date: '2026-10-02', USD: 65 },
    { date: '2026-10-03', USD: 62 },
    { date: '2026-10-04', USD: 65 },
  ];
  const k = rateKpis(tie, 'USD');
  assert.equal(k.low.date, '2026-10-01');
  assert.equal(k.high.date, '2026-10-02');
});

test('days out of order give the same answer', () => {
  const shuffled = [SERIES[3], SERIES[0], SERIES[2], SERIES[1]];
  assert.deepEqual(rateKpis(shuffled, 'USD'), rateKpis(SERIES, 'USD'));
});

test('values that are not usable rates are ignored', () => {
  const messy = [
    { date: '2026-10-01', USD: 64 },
    { date: '2026-10-02', USD: NaN },
    { date: '2026-10-03', USD: -5 },
    { date: '2026-10-04', USD: '65' },
    { date: '2026-10-05', USD: 65 },
  ];
  const k = rateKpis(messy, 'USD');
  assert.equal(k.days, 2);
  assert.equal(k.value, 65);
});

test('a currency with no recorded value gives null', () => {
  assert.equal(rateKpis(SERIES, 'JPY'), null);
  assert.equal(rateKpis([], 'USD'), null);
  assert.equal(rateKpis(null, 'USD'), null);
});

test('runs are counted by finished status', () => {
  const runs = [
    { status: 'success' }, { status: 'success' }, { status: 'failed' }, { status: 'success' },
  ];
  const k = runKpis(runs);
  assert.deepEqual([k.total, k.passed, k.failed, k.running], [4, 3, 1, 0]);
  assert.equal(k.allPassed, false);
  near(k.passRate, 75, 'pass rate');
});

test('every run passing', () => {
  const k = runKpis([{ status: 'success' }, { status: 'success' }]);
  assert.equal(k.allPassed, true);
  assert.equal(k.passRate, 100);
});

test('a run still open is not a pass and not a fail', () => {
  const k = runKpis([{ status: 'running' }, { status: 'success' }]);
  assert.deepEqual([k.total, k.passed, k.failed, k.running], [1, 1, 0, 1]);
  assert.equal(k.allPassed, true);
});

test('no runs, or only an open run, has no pass rate', () => {
  for (const input of [[], null, undefined, [{ status: 'running' }]]) {
    const k = runKpis(input);
    assert.equal(k.total, 0);
    assert.equal(k.passRate, null);
    assert.equal(k.allPassed, false);
  }
});

test('an unknown status is not counted', () => {
  assert.equal(runKpis([{ status: 'weird' }, { status: 'success' }]).total, 1);
});