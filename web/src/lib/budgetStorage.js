// src/lib/budgetStorage.js
// Saves the calculator settings in this browser, and reads them back.
//
// What is saved: the income currency, the income, and the rows.
// What is not saved: the rate. It always starts from today's rate, so an
// old edited rate never sits behind a new day's figures.
//
// The saved text is untrusted. It can be old, edited by hand, or cut off,
// so sanitize checks every field and falls back to the defaults.

import { DEFAULT_INCOME, DEFAULT_ROWS, MAX_ROWS, MAX_LABEL, STORAGE_KEY } from '../constants/budget.js';

const MODES = ['percent', 'fixed'];
const UNITS = ['source', 'php'];

const asText = (v) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : typeof v === 'string' ? v : '');

function cleanRow(row, index) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: typeof row.id === 'string' && row.id ? row.id.slice(0, 40) : `saved-${index}`,
    label: typeof row.label === 'string' ? row.label.slice(0, MAX_LABEL) : '',
    mode: MODES.includes(row.mode) ? row.mode : 'percent',
    value: asText(row.value).slice(0, 20),
    unit: UNITS.includes(row.unit) ? row.unit : 'source',
  };
}

/** Turns whatever was saved into settings the calculator can use. */
export function sanitize(saved, validCurrencies, fallbackCurrency) {
  const base = { currency: fallbackCurrency, income: DEFAULT_INCOME, rows: DEFAULT_ROWS };
  if (!saved || typeof saved !== 'object') return base;

  const currency = validCurrencies.includes(saved.currency) ? saved.currency : fallbackCurrency;
  const income = asText(saved.income).slice(0, 20);

  let rows = DEFAULT_ROWS;
  if (Array.isArray(saved.rows) && saved.rows.length > 0) {
    const cleaned = saved.rows.slice(0, MAX_ROWS).map(cleanRow).filter(Boolean);
    // Row ids must be unique, or editing one row would edit another.
    const unique = new Set(cleaned.map((r) => r.id));
    if (cleaned.length > 0 && unique.size === cleaned.length) rows = cleaned;
  }

  return { currency, income: income === '' && saved.income !== '' ? DEFAULT_INCOME : income, rows };
}

/** Reads the saved settings. Never throws: storage can be blocked or empty. */
export function loadSettings(validCurrencies, fallbackCurrency) {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return sanitize(text ? JSON.parse(text) : null, validCurrencies, fallbackCurrency);
  } catch {
    return sanitize(null, validCurrencies, fallbackCurrency);
  }
}

/** Saves the settings. Quietly does nothing if storage is blocked or full. */
export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private windows and full storage land here. The calculator still works.
  }
}

/** Removes the saved settings, for the reset button. */
export function clearSettings() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}