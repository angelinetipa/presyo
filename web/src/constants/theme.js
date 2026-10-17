// src/constants/theme.js
// Colours and the list of tracked currencies.
//
// The palette follows a money changer's rate board: a dark panel, amber
// figures, and monospace type so decimal points line up in a column.

export const colors = {
  paper: '#F1F0EC',   // warm grey, like a printed remittance slip
  card: '#FFFFFF',
  ink: '#16232E',     // deep slate navy
  inkSoft: '#5E6C77',
  rule: '#DDDCD6',

  board: '#16232E',   // the board panel
  boardRule: '#2C3D4B',
  digit: '#E8B04B',   // amber, the colour of a lit board

  up: '#5FD3A0',      // one peso buys more of that currency
  down: '#F0836F',    // it buys less
  flat: '#8A959D',
};

// Master list of tracked currencies. The board and the selectors sort
// it by peso value, highest first (see lib/rank.js), so the order here
// only breaks ties.
//
// A currency appears only once the pipeline has recorded a value for it,
// so a newly added currency stays hidden until its first run lands.
export const CURRENCIES = ['USD', 'SAR', 'AED', 'SGD', 'HKD', 'JPY', 'GBP', 'CAD'];

export const CURRENCY_NOTE = {
  USD: 'United States · remote and freelance work',
  SAR: 'Saudi Arabia',
  AED: 'United Arab Emirates',
  SGD: 'Singapore',
  HKD: 'Hong Kong',
  JPY: 'Japan',
  GBP: 'United Kingdom',
  CAD: 'Canada',
};