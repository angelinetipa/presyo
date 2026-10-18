// src/constants/budget.js
// Settings for the budget split calculator.
// Every starting value can be edited. Rows can be renamed, added, and removed.
//
// A row has one value and one unit.
//   'percent'  a share of the income
//   'source'   an amount in the income currency
//   'php'      an amount in pesos

export const DEFAULT_INCOME = '1000';

export const DEFAULT_ROWS = [
  { id: 'savings', label: 'Savings', unit: 'percent', value: '60' },
  { id: 'needs', label: 'Needs', unit: 'percent', value: '30' },
  { id: 'wants', label: 'Wants', unit: 'percent', value: '10' },
];

export const UNITS = ['percent', 'source', 'php'];

// Keeps the list short enough to read at a glance.
export const MAX_ROWS = 8;
export const MAX_LABEL = 24;

// Saved in this browser only. Settings saved by earlier versions use the
// same key and are converted when they are read (see lib/budgetStorage.js).
export const STORAGE_KEY = 'presyo.budget.v1';

// One colour per row, in order. Muted, so the amounts stay the loudest thing.
export const ROW_COLORS = [
  '#16232E', '#E8B04B', '#3F7F93', '#B8573E', '#6B8F5E', '#8A6FA8', '#9AA3AB', '#C98A9B',
];