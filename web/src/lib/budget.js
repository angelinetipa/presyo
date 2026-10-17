// src/lib/budget.js
// Budget split maths. Plain functions, no React, no imports.
//
// How the split works
//   1. Each row is either "percent" or "fixed".
//   2. A fixed row is a set amount, in the income currency ("source")
//      or in pesos ("php").
//   3. With no fixed rows, each percent row takes that percent of the income.
//   4. With fixed rows, the percent rows share what is left after the fixed
//      amounts, in proportion to their percents.
//   5. Anything not assigned is reported as "unassigned". If the rows add up
//      to more than the income, the excess is reported as "over".
//
// Row shape
//   { id, label, mode: 'percent' | 'fixed', value, unit: 'source' | 'php' }
//   "value" may be a number or the text from an input box.
//   "unit" only matters for fixed rows.

const EPS = 0.005; // half a cent. Differences smaller than this count as zero.

/**
 * Reads a number from an input box. Accepts commas and spaces.
 * Anything that is not a positive number becomes 0.
 */
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? input : 0;
  const cleaned = String(input ?? '').replace(/[,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Rounds a list of amounts so the rounded values still add up to the
 * rounded total. Uses the largest remainder method.
 * decimals = 0 rounds to whole numbers, 2 rounds to cents.
 */
export function roundShares(values, decimals = 0) {
  const factor = 10 ** decimals;
  const scaled = values.map((v) => v * factor);
  const floors = scaled.map(Math.floor);

  const target = Math.round(scaled.reduce((sum, v) => sum + v, 0));
  let leftover = target - floors.reduce((sum, v) => sum + v, 0);

  const byRemainder = scaled
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = [...floors];
  for (let k = 0; k < byRemainder.length && leftover > 0; k += 1, leftover -= 1) {
    out[byRemainder[k].i] += 1;
  }
  return out.map((v) => v / factor);
}

let counter = 0;

/** Makes a new row with a unique id. */
export function makeRow({ label = 'New row', mode = 'percent', value = '', unit = 'source' } = {}) {
  counter += 1;
  return { id: `row-${Date.now().toString(36)}-${counter}`, label, mode, value, unit };
}

function emptyResult(rows, income, rate, status) {
  return {
    status,
    income,
    incomePhp: 0,
    rate,
    rows: rows.map((row) => ({
      id: row.id,
      label: row.label,
      mode: row.mode,
      unit: row.unit,
      source: 0,
      php: 0,
      sourceRounded: 0,
      phpRounded: 0,
      share: 0,
    })),
    percentSum: 0,
    fixedSource: 0,
    remaining: income,
    assigned: 0,
    assignedPhp: 0,
    unassigned: income,
    unassignedPhp: 0,
    over: 0,
    overPhp: 0,
  };
}

/**
 * Works out the split.
 *
 * total  income per month, in the source currency (number or input text)
 * rate   pesos per one unit of the source currency
 * rows   see the row shape at the top of this file
 *
 * status is one of
 *   'norate'  the rate is missing or not above zero
 *   'empty'   the income is zero
 *   'over'    the rows add up to more than the income
 *   'under'   part of the income is unassigned
 *   'ok'      every unit of income is assigned
 */
export function computeBudget({ total, rate, rows }) {
  const income = parseAmount(total);
  const r = Number(rate);

  if (!Number.isFinite(r) || r <= 0) return emptyResult(rows, income, 0, 'norate');
  if (income === 0) return emptyResult(rows, 0, r, 'empty');

  const parsed = rows.map((row) => ({ ...row, amount: parseAmount(row.value) }));
  const fixed = parsed.filter((row) => row.mode === 'fixed');
  const percent = parsed.filter((row) => row.mode !== 'fixed');

  // Fixed amounts, converted to the source currency.
  const sourceById = new Map();
  for (const row of fixed) {
    sourceById.set(row.id, row.unit === 'php' ? row.amount / r : row.amount);
  }
  const fixedSource = [...sourceById.values()].reduce((sum, v) => sum + v, 0);
  const remaining = income - fixedSource;
  const percentSum = percent.reduce((sum, row) => sum + row.amount, 0);

  // Percent rows.
  for (const row of percent) {
    let source = 0;
    if (fixed.length === 0) {
      source = (income * row.amount) / 100;
    } else if (remaining > 0 && percentSum > 0) {
      source = (remaining * row.amount) / percentSum;
    }
    sourceById.set(row.id, source);
  }

  const sources = parsed.map((row) => sourceById.get(row.id));
  const phps = parsed.map((row, i) =>
    row.mode === 'fixed' && row.unit === 'php' ? row.amount : sources[i] * r,
  );
  const sourcesRounded = roundShares(sources, 2);
  const phpsRounded = roundShares(phps, 0);

  const assigned = sources.reduce((sum, v) => sum + v, 0);
  const diff = income - assigned;
  const unassigned = diff > EPS ? diff : 0;
  const over = diff < -EPS ? -diff : 0;

  let status = 'ok';
  if (over > 0) status = 'over';
  else if (unassigned > 0) status = 'under';

  return {
    status,
    income,
    incomePhp: income * r,
    rate: r,
    rows: parsed.map((row, i) => ({
      id: row.id,
      label: row.label,
      mode: row.mode,
      unit: row.unit,
      source: sources[i],
      php: phps[i],
      sourceRounded: sourcesRounded[i],
      phpRounded: phpsRounded[i],
      share: (sources[i] / income) * 100,
    })),
    percentSum,
    fixedSource,
    remaining,
    assigned,
    assignedPhp: assigned * r,
    unassigned,
    unassignedPhp: unassigned * r,
    over,
    overPhp: over * r,
  };
}