// src/constants/theme.js
// The palette comes from the subject, not from a template.
//
// Presyo is about money changed at a counter, so the page borrows the
// vernacular of a money changer's rate board: a dark panel, amber
// figures, everything set in monospace so the decimal points line up in
// a column the way they do on a real board.
//
// Deliberately unlike Aralite, which uses the DepEd flag colours.

export const colors = {
  paper: '#F1F0EC',   // warm grey, like a printed remittance slip
  card: '#FFFFFF',
  ink: '#16232E',     // deep slate-navy, the ink on that slip
  inkSoft: '#5E6C77',
  rule: '#DDDCD6',

  board: '#16232E',   // the panel itself
  boardRule: '#2C3D4B',
  digit: '#E8B04B',   // amber, the colour of a lit board

  up: '#5FD3A0',      // one peso buys more of that currency
  down: '#F0836F',    // it buys less
  flat: '#8A959D',
};

// Fixed order so the board never reshuffles between loads. USD first,
// because it is the one most readers came to check.
export const CURRENCIES = ['USD', 'SAR', 'AED', 'SGD', 'HKD'];

export const CURRENCY_NOTE = {
  USD: 'Remote and freelance work',
  SAR: 'Saudi Arabia',
  AED: 'United Arab Emirates',
  SGD: 'Singapore',
  HKD: 'Hong Kong',
};
