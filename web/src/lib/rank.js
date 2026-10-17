// src/lib/rank.js
// Orders currencies by what one unit is worth in pesos, highest first.
//
// The order is worked out from the latest rates each time, so it follows
// the data. If two currencies ever tie, the order in CURRENCIES decides.

import { CURRENCIES } from '../constants/theme';

/** Tracked currencies that have a recorded value, highest peso value first. */
export function rankCurrencies(latest) {
  return CURRENCIES
    .filter((c) => latest[c])
    .sort((a, b) => latest[b].value - latest[a].value);
}

/** The currency a selector should start on. USD when available, else the top ranked. */
export function defaultCurrency(latest) {
  if (latest.USD) return 'USD';
  return rankCurrencies(latest)[0] ?? 'USD';
}