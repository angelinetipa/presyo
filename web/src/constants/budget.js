// src/constants/budget.js
// Settings for the budget split calculator.
// Every starting value can be edited. Rows can be renamed, added, and removed.

export const DEFAULT_INCOME = '1000';

export const DEFAULT_ROWS = [
  { id: 'savings', label: 'Savings', mode: 'percent', value: '60', unit: 'source' },
  { id: 'needs', label: 'Needs', mode: 'percent', value: '30', unit: 'source' },
  { id: 'wants', label: 'Wants', mode: 'percent', value: '10', unit: 'source' },
];

// Keeps the list short enough to read at a glance.
export const MAX_ROWS = 8;
export const MAX_LABEL = 24;

// Saved in this browser only. Bump the number if the saved shape changes.
export const STORAGE_KEY = 'presyo.budget.v1';

// One colour per row, in order. Muted, so the amounts stay the loudest thing.
export const ROW_COLORS = [
  '#16232E', '#E8B04B', '#3F7F93', '#B8573E', '#6B8F5E', '#8A6FA8', '#9AA3AB', '#C98A9B',
];