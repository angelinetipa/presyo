// src/constants/budget.js
// Settings for the budget split calculator.
// Every starting value can be edited. Rows can be renamed, added, and removed.
//
// A row has one value and one unit.
//   'percent'  a share of the income
//   'source'   an amount in the income currency
//   'php'      an amount in pesos
//
// A row can be locked. Auto balance never changes a locked row.

export const DEFAULT_INCOME = '1000';

export const DEFAULT_ROWS = [
  { id: 'savings', label: 'Savings', unit: 'percent', value: '60', locked: false },
  { id: 'needs', label: 'Needs', unit: 'percent', value: '30', locked: false },
  { id: 'wants', label: 'Wants', unit: 'percent', value: '10', locked: false },
];

// Ready made splits. Each one adds up to 100 percent. The first is the
// starting split. Picking one replaces the rows and keeps income and currency.
export const PRESETS = [
  { id: 'savings-first', name: '60 / 30 / 10', rows: [['Savings', 60], ['Needs', 30], ['Wants', 10]] },
  { id: 'fifty-thirty-twenty', name: '50 / 30 / 20', rows: [['Needs', 50], ['Wants', 30], ['Savings', 20]] },
  { id: 'seventy-twenty-ten', name: '70 / 20 / 10', rows: [['Needs', 70], ['Savings', 20], ['Wants', 10]] },
  { id: 'eighty-twenty', name: '80 / 20', rows: [['Spending', 80], ['Savings', 20]] },
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