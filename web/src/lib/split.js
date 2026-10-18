// src/lib/split.js
// Budget split maths. Plain functions, no React.
//
// How it works
//   1. Every row has one value and one unit.
//        'percent'  a share of the income
//        'source'   an amount in the income currency, for example USD
//        'php'      an amount in pesos
//   2. A row with no value is empty. A typed 0 counts as filled.
//   3. If exactly one row is empty, it takes whatever is left of the
//      income. That row is the "auto" row, and its value is returned in
//      the row's own unit so it can be shown inside the field.
//   4. If two or more rows are empty, nothing is filled in. The result says
//      how many rows still need a value (needMore) and how much is left.
//   5. If no row is empty, the rows are checked against the income. The
//      result is "complete", "under" (some income is left), or "over".
//
// Row shape
//   { id, label, unit: 'percent' | 'source' | 'php', value }
//   "value" is a number or the text from an input box. Blank means empty.
//
// Amounts within half a peso of each other count as equal. This keeps a
// split typed in whole pesos from reading as "off by a few centavos".

const EPS_PHP = 0.5;

/** Reads one input value. Returns { state: 'empty' | 'filled' | 'invalid', n }. */
function readValue(raw) {
  if (raw === null || raw === undefined) return { state: 'empty', n: 0 };
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0
      ? { state: 'filled', n: raw }
      : { state: 'invalid', n: 0 };
  }
  const text = String(raw).replace(/[,\s]/g, '');
  if (text === '') return { state: 'empty', n: 0 };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { state: 'invalid', n: 0 };
  return { state: 'filled', n: Number(text) };
}

/** Reads an income or a rate. Anything empty or invalid becomes 0. */
export function parseAmount(input) {
  const read = readValue(input);
  return read.state === 'filled' ? read.n : 0;
}

/** Formats a number so it can sit inside an input box. Two decimals at most, no trailing zeros. */
export function formatValue(n) {
  return Number(n.toFixed(2)).toString();
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

/** Makes a new empty row with a unique id. */
export function makeRow({ label = '', unit = 'percent', value = '' } = {}) {
  counter += 1;
  return { id: `row-${Date.now().toString(36)}-${counter}`, label, unit, value };
}

function baseResult(status, income, rate, items) {
  return {
    status,
    income,
    incomePhp: income * rate,
    rate,
    rows: items.map(({ row, state }) => ({
      id: row.id,
      label: row.label,
      unit: row.unit,
      state: state === 'filled' ? 'filled' : state === 'invalid' ? 'invalid' : 'empty',
      source: 0,
      php: 0,
      share: 0,
      sourceRounded: 0,
      phpRounded: 0,
      shareRounded: 0,
      autoValue: null,
      autoText: null,
    })),
    emptyIds: items.filter((it) => it.state === 'empty').map((it) => it.row.id),
    invalidIds: items.filter((it) => it.state === 'invalid').map((it) => it.row.id),
    autoId: null,
    needMore: 0,
    assigned: 0,
    assignedPhp: 0,
    assignedShare: 0,
    left: income,
    leftPhp: income * rate,
    leftShare: income > 0 ? 100 : 0,
    over: 0,
    overPhp: 0,
    overShare: 0,
  };
}

/**
 * Works out the split.
 *
 * total  income per month, in the income currency (number or input text)
 * rate   pesos per one unit of the income currency (number or input text)
 * rows   see the row shape at the top of this file
 *
 * status is one of
 *   'norate'    the rate is missing or not above zero
 *   'noincome'  the income is missing or not above zero
 *   'invalid'   a row holds text that is not a number
 *   'needmore'  two or more rows are empty, so nothing can be filled in yet
 *   'over'      the rows add up to more than the income
 *   'under'     every row has a value and part of the income is left
 *   'complete'  every unit of income is assigned
 */
export function computeSplit({ total, rate, rows }) {
  const income = parseAmount(total);
  const r = parseAmount(rate);

  const items = rows.map((row) => ({ row, ...readValue(row.value) }));

  if (r <= 0) return baseResult('norate', income, 0, items);
  if (income <= 0) return baseResult('noincome', 0, r, items);

  const toSource = (item) => {
    if (item.row.unit === 'percent') return (income * item.n) / 100;
    if (item.row.unit === 'php') return item.n / r;
    return item.n;
  };

  const eps = EPS_PHP / r;
  const emptyCount = items.filter((it) => it.state === 'empty').length;
  const invalidCount = items.filter((it) => it.state === 'invalid').length;

  const sources = items.map((it) => (it.state === 'filled' ? toSource(it) : 0));
  const known = sources.reduce((sum, v) => sum + v, 0);
  const remaining = income - known;

  let status;
  let autoIndex = -1;
  let needMore = 0;

  if (invalidCount > 0) {
    status = 'invalid';
  } else if (remaining < -eps) {
    status = 'over';
  } else if (emptyCount === 1) {
    // The one empty row takes whatever is left.
    autoIndex = items.findIndex((it) => it.state === 'empty');
    sources[autoIndex] = remaining > eps ? remaining : 0;
    status = 'complete';
  } else if (emptyCount >= 2) {
    status = 'needmore';
    needMore = emptyCount - 1;
  } else {
    status = remaining > eps ? 'under' : 'complete';
  }

  const phps = items.map((it, i) =>
    it.state === 'filled' && it.row.unit === 'php' ? it.n : sources[i] * r,
  );
  const sourcesRounded = roundShares(sources, 2);
  const phpsRounded = roundShares(phps, 0);
  const sharesRounded = roundShares(sources.map((v) => (v / income) * 100), 0);

  const assigned = sources.reduce((sum, v) => sum + v, 0);
  const diff = income - assigned;
  const left = diff > eps ? diff : 0;
  const over = diff < -eps ? -diff : 0;

  const out = baseResult(status, income, r, items);
  out.autoId = autoIndex >= 0 ? items[autoIndex].row.id : null;
  out.needMore = needMore;
  out.assigned = assigned;
  out.assignedPhp = assigned * r;
  out.assignedShare = (assigned / income) * 100;
  out.left = left;
  out.leftPhp = left * r;
  out.leftShare = (left / income) * 100;
  out.over = over;
  out.overPhp = over * r;
  out.overShare = (over / income) * 100;

  out.rows = out.rows.map((row, i) => {
    const share = (sources[i] / income) * 100;
    const next = {
      ...row,
      state: i === autoIndex ? 'auto' : row.state,
      source: sources[i],
      php: phps[i],
      share,
      sourceRounded: sourcesRounded[i],
      phpRounded: phpsRounded[i],
      shareRounded: sharesRounded[i],
    };
    if (i === autoIndex) {
      const own = row.unit === 'percent' ? share : row.unit === 'php' ? phps[i] : sources[i];
      next.autoValue = own;
      next.autoText = formatValue(own);
    }
    return next;
  });

  return out;
}

/**
 * Applies one edit to the rows and keeps the split balanced.
 *
 * When every row has a value and the user changes one of them, the
 * balancing row is emptied so it fills itself with what is left. The
 * balancing row is the one that last filled itself. If none did yet,
 * it is the last row.
 *
 * Nothing is balanced when the edited row is the balancing row, when the
 * edit is only a name, when the new value is empty, or when some row was
 * already empty (that row is already filling itself).
 */
export function applyEdit(rows, id, patch, balanceId) {
  const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));

  const touchesAmount = 'value' in patch || 'unit' in patch;
  if (!touchesAmount) return next;
  if ('value' in patch && String(patch.value).trim() === '') return next;
  if (rows.some((r) => String(r.value).trim() === '')) return next;

  const target = rows.find((r) => r.id === balanceId) ?? rows[rows.length - 1];
  if (!target || target.id === id) return next;

  return next.map((r) => (r.id === target.id ? { ...r, value: '' } : r));
}