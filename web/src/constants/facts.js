// src/constants/facts.js
// Every outside figure on this page, with its source.
//
// Kept in one file so a stale number is easy to find and update, and so
// nothing appears on screen without a citation attached. The page's own
// figures come from the database; these are the ones that give them
// scale, and they age — check them once a year.

export const FACTS = {
  ofwCount: {
    value: '2.19 million',
    text: 'Filipinos worked abroad in 2024 — up from 2.16 million the year before.',
    detail: 'More than half, 1.25 million, are women.',
    source: 'Philippine Statistics Authority, Survey on Overseas Filipinos (Dec 2025)',
  },
  averageRemittance: {
    value: 129000,
    display: '₱129,000',
    text: 'was the average amount one OFW sent home over 2024.',
    source: 'Philippine Statistics Authority (Dec 2025)',
  },
  totalRemittance: {
    value: '$35.63 billion',
    text: 'in cash came home in 2025, a record — equal to 7.3% of everything the country produced that year.',
    source: 'Bangko Sentral ng Pilipinas (Feb 2026)',
  },
};

// Share of 2025 cash remittances by the country the money came from.
// Used to show honestly how much of the picture these five currencies
// actually cover — and how much they miss.
// Source: Bangko Sentral ng Pilipinas, 2025 full-year data.
export const REMITTANCE_SOURCES = [
  { country: 'United States', share: 39.7, currency: 'USD', tracked: true },
  { country: 'Singapore', share: 7.3, currency: 'SGD', tracked: true },
  { country: 'Saudi Arabia', share: 6.6, currency: 'SAR', tracked: true },
  { country: 'Japan', share: 5.0, currency: 'JPY', tracked: true },
  { country: 'United Kingdom', share: 4.6, currency: 'GBP', tracked: true },
  { country: 'United Arab Emirates', share: 4.6, currency: 'AED', tracked: true },
];

export const COVERED = REMITTANCE_SOURCES
  .filter((s) => s.tracked)
  .reduce((sum, s) => sum + s.share, 0);

export const MISSED = REMITTANCE_SOURCES
  .filter((s) => !s.tracked)
  .reduce((sum, s) => sum + s.share, 0);

// Hong Kong and Canada are tracked too, but the central bank does not
// publish them among its top sources, so no share can be shown for them.
// The coverage figure above is therefore a floor, not a ceiling.
export const TRACKED_BEYOND_LIST = ['Hong Kong', 'Canada'];