// src/lib/kpis.js
// The numbers behind the KPI tiles. Plain functions, no React.
//
// Rates (rateKpis)
//   Works from the recorded days of one currency. Days where that currency
//   has no value are skipped. The percent changes use the same formula as
//   shape in lib/api.js, so the tiles agree with the rate board.
//     dayChange    change against the previous recorded day, in percent
//     sinceStart   change against the first recorded day, in percent
//     low, high    the lowest and highest value, each with its date.
//                  When a value repeats, the earliest date is used.
//     rangePosition where today sits between low and high, 0 to 1. It is
//                  null when low and high are the same.
//   These are facts about the recorded days. None of them is a forecast.
//
// Runs (runKpis)
//   Counts finished pipeline runs. A run still open ('running') is not a
//   pass and not a fail, so it is left out of the total.

const isRate = (v) => Number.isFinite(v) && v > 0;

const pct = (now, before) => (before > 0 ? ((now - before) / before) * 100 : null);

/**
 * KPIs for one currency, or null when it has no recorded value.
 * series is the list of days from shape in lib/api.js: { date, USD, SAR, ... }.
 */
export function rateKpis(series, currency) {
  const points = (series ?? [])
    .filter((d) => isRate(d?.[currency]))
    .map((d) => ({ date: d.date, value: d[currency] }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const before = points.length > 1 ? points[points.length - 2] : null;

  let low = first;
  let high = first;
  for (const p of points) {
    if (p.value < low.value) low = p;
    if (p.value > high.value) high = p;
  }

  const span = high.value - low.value;

  return {
    currency,
    value: last.value,
    date: last.date,
    dayChange: before ? pct(last.value, before.value) : null,
    sinceStart: pct(last.value, first.value),
    sinceDate: first.date,
    low: { value: low.value, date: low.date },
    high: { value: high.value, date: high.date },
    rangePosition: span > 0 ? (last.value - low.value) / span : null,
    days: points.length,
  };
}

/** Counts of finished runs. runs is the list from fetchRuns in lib/api.js. */
export function runKpis(runs) {
  const list = Array.isArray(runs) ? runs : [];
  const count = (status) => list.filter((r) => r?.status === status).length;

  const passed = count('success');
  const failed = count('failed');
  const total = passed + failed;

  return {
    total,
    passed,
    failed,
    running: count('running'),
    allPassed: total > 0 && failed === 0,
    passRate: total > 0 ? (passed / total) * 100 : null,
  };
}