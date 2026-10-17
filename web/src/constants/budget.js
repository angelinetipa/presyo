// src/constants/budget.js
// Starting values for the budget split calculator.
// Every value can be edited. Rows can be renamed, added, and removed.

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_INCOME = '1000';

export const DEFAULT_ROWS = [
  { id: 'savings', label: 'Savings', mode: 'percent', value: '60', unit: 'source' },
  { id: 'needs', label: 'Needs', mode: 'percent', value: '30', unit: 'source' },
  { id: 'wants', label: 'Wants', mode: 'percent', value: '10', unit: 'source' },
];