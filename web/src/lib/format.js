// src/lib/format.js
// Shared formatting helpers.
//
// Dates. These handle plain calendar days such as "2026-10-18".
//
// A bare date string is read as midnight UTC. Showing it in the viewer's
// own time zone can move it back a day for anyone west of UTC. These
// helpers format in UTC, so every viewer sees the same day.
//
// Do not use them for full timestamps, such as a run's start time. Those
// are real moments and should show in the viewer's local time.

const STYLES = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
};

/** Formats a plain day. style is 'short' (Oct 18), 'medium' (Oct 18, 2026) or 'long'. */
export function formatDay(iso, style = 'short') {
  return new Date(iso).toLocaleDateString('en-PH', { ...STYLES[style], timeZone: 'UTC' });
}

// Numbers.
//
// Money is shown to the centavo, two decimals. The full value stays in the
// maths and is shown only in a hover title, using the exact helpers below.
//
// These helpers round with Intl.NumberFormat, which rounds the decimal
// digits of a number half up. Number.prototype.toFixed rounds the stored
// binary value instead, so toFixed(2) turns 1.005 into 1.00. Do not use
// toFixed for money.

const PESO = '\u20B1';

const fixed = (n, min, max, grouping = true) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: grouping });

/** Pesos to the centavo, with the peso sign. */
export function formatPeso(n) {
  return PESO + fixed(n, 2, 2);
}

/** An amount with two decimals and thousands separators. */
export function formatMoney(n) {
  return fixed(n, 2, 2);
}

/** Pesos with every decimal that matters, at least two and at most eight. For hover titles. */
export function formatPesoExact(n) {
  return PESO + fixed(n, 2, 8);
}

/** An amount in any currency with every decimal that matters. For hover titles. */
export function formatMoneyExact(n) {
  return fixed(n, 2, 8);
}

/** A stored rate with all six decimals. The table keeps pesos per unit to six places. */
export function formatRateExact(n) {
  return fixed(n, 6, 6, false);
}

/** A percent change with up to six decimals and its sign. For hover titles. */
export function formatPercentExact(n) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 6, signDisplay: 'exceptZero' }) + '%';
}