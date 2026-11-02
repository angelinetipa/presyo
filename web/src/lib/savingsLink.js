// src/lib/savingsLink.js
// The link between the budget and the savings calculator. Plain functions, no React.
//
// The budget has a row named Savings. That row is the monthly savings the
// calculator works with. Nothing is stored twice. The calculator reads the
// amount from the budget rows, and writes a change back into the same rows.
//
// Finding the row
//   The first row whose name starts with "saving" (any case, spaces ignored).
//   "Savings" and "Savings fund" match. "Emergency fund" does not.
//   With no such row, the budget and the calculator stay separate.
//
// Reading (savingsFromBudget)
//   Gives the Savings row as a monthly peso amount and a share of income.
//   Gives null when the amount cannot be known: no Savings row, no income or
//   rate, or the Savings row is empty and cannot fill itself yet.
//
// Writing (applySavings)
//   The Savings row becomes a peso amount, exactly as given. A percent row
//   would round the pesos, and then the calculator would read back a number
//   that is not the one typed. After the write, the budget is rebalanced
//   with rebalance in lib/split.js, so another row adjusts and the total
//   still adds up. The Savings row itself is never the one that adjusts.

import { computeSplit, rebalance, formatValue } from './split.js';

/** Finds the Savings row. Returns the row, or null. */
export function findSavingsRow(rows) {
  return rows.find((r) => String(r.label).trim().toLowerCase().startsWith('saving')) ?? null;
}

/**
 * Reads the monthly savings from the budget.
 * Returns { id, label, php, share } or null. php is whole pesos, share is a whole percent.
 */
export function savingsFromBudget({ rows, income, rate }) {
  const row = findSavingsRow(rows);
  if (!row) return null;

  const result = computeSplit({ total: income, rate, rows });
  if (result.status === 'norate' || result.status === 'noincome') return null;

  const item = result.rows.find((r) => r.id === row.id);
  if (!item || (item.state !== 'filled' && item.state !== 'auto')) return null;

  return { id: row.id, label: row.label, php: item.phpRounded, share: item.shareRounded };
}

/**
 * Sets the monthly savings in pesos and returns the new rows.
 * Returns the same rows, untouched, when there is no Savings row or the
 * amount is not a number of zero or more.
 *
 * balanceId is the row that last filled itself. It is the first choice
 * for the row that adjusts. See rebalance in lib/split.js.
 */
export function applySavings({ rows, income, rate, balanceId = null, php }) {
  const row = findSavingsRow(rows);
  const amount = typeof php === 'number' ? php : NaN;
  if (!row || !Number.isFinite(amount) || amount < 0) return rows;

  const next = rows.map((r) => (r.id === row.id ? { ...r, unit: 'php', value: formatValue(amount) } : r));
  return rebalance({ rows: next, total: income, rate, editedId: row.id, balanceId });
}