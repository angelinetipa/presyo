// src/lib/savings.js
// Savings maths. Plain functions, no React, no interest.
//
// Everything is worked out in months.
//   1 day    is 1/30 of a month
//   1 year   is 12 months
//
// Two ways to use it
//   "I save this much"      projectSavings: a monthly amount in, totals out
//   "I want to reach this"  monthlyNeeded: a goal and a time in, a monthly
//                           amount out. monthsToReach: a goal and a monthly
//                           amount in, the time out.
//
// Amounts are in pesos. Anything that is not a positive number counts as 0.

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

/** The time spans shown in the results, in months. */
export const PERIODS = [
  { id: 'day', label: '1 day', months: 1 / DAYS_PER_MONTH },
  { id: 'month', label: '1 month', months: 1 },
  { id: 'half', label: '6 months', months: 6 },
  { id: 'year', label: '1 year', months: MONTHS_PER_YEAR },
  { id: 'five', label: '5 years', months: 5 * MONTHS_PER_YEAR },
];

/** Units a person can pick for a time span. */
export const TIME_UNITS = ['days', 'months', 'years'];

const clean = (n) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Turns an amount of days, months or years into months. */
export function toMonths(amount, unit) {
  const n = clean(amount);
  if (unit === 'days') return n / DAYS_PER_MONTH;
  if (unit === 'years') return n * MONTHS_PER_YEAR;
  return n;
}

/** Total saved after each period if the same amount is saved every month. */
export function projectSavings(monthly) {
  const m = clean(monthly);
  return PERIODS.map((p) => ({ ...p, total: m * p.months }));
}

/** The monthly amount needed to reach a goal in the given months. 0 if it cannot be worked out. */
export function monthlyNeeded(goal, months) {
  const g = clean(goal);
  const t = clean(months);
  return t === 0 ? 0 : g / t;
}

/** Whole months needed to reach a goal at a monthly amount. null if the monthly amount is 0. */
export function monthsToReach(goal, monthly) {
  const g = clean(goal);
  const m = clean(monthly);
  if (m === 0) return null;
  return Math.max(0, Math.ceil(g / m - 1e-9)); // max avoids a -0 when the goal is 0
}

/** Months as plain words, for example "1 year 3 months". */
export function describeMonths(months) {
  if (months === null || months === undefined) return '';
  if (months === 0) return '0 months';
  const years = Math.floor(months / MONTHS_PER_YEAR);
  const rest = months % MONTHS_PER_YEAR;
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'month' : 'months'}`);
  return parts.join(' ');
}