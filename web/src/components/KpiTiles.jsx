// src/components/KpiTiles.jsx
// Four small tiles above the chart. Each one is a fact about the recorded
// days, not a forecast. The maths is in lib/kpis.js.
//
//   Today          the latest rate, and the change against the day before
//   Since a date   the change against the first recorded day
//   Low to high    the range, with a marker for where today sits in it
//   Runs passed    finished pipeline runs that succeeded
//
// The first three follow the selected currency. The runs tile does not.
// Colour is never the only signal. Every change also has an arrow and
// a number.

import { rateKpis, runKpis } from '../lib/kpis';
import { formatDay } from '../lib/format';
import './KpiTiles.css';

const PESO = '₱';

// Values under 1 (such as JPY) need more decimals to be readable.
const fmt = (v) => (v < 1 ? v.toFixed(4) : v.toFixed(2));

/** Turns a percent change into the parts a tile shows. null when unknown. */
function trend(pct) {
  if (pct == null) return null;
  const flat = Math.abs(pct) < 0.005;
  return {
    tone: flat ? 'flat' : pct > 0 ? 'up' : 'down',
    mark: flat ? '–' : pct > 0 ? '▲' : '▼',
    text: `${Math.abs(pct).toFixed(2)}%`,
  };
}

function Tile({ label, value, foot }) {
  return (
    <div className="kpi">
      <dt className="kpi__label">{label}</dt>
      <dd className="kpi__value">{value}</dd>
      <dd className="kpi__foot">{foot}</dd>
    </div>
  );
}

export default function KpiTiles({ series, currency, runs }) {
  const rate = rateKpis(series, currency);
  if (!rate) return null;

  const runStats = runKpis(runs);
  const day = trend(rate.dayChange);
  const since = trend(rate.sinceStart);
  const position = rate.rangePosition;

  return (
    <dl className="kpis" aria-label={`Key numbers for ${currency}`}>
      <Tile
        label="Today"
        value={`${PESO}${fmt(rate.value)}`}
        foot={
          day ? (
            <>
              <span className={`kpi__${day.tone}`}>{day.mark} {day.text}</span> on the day
            </>
          ) : (
            'First day recorded'
          )
        }
      />

      <Tile
        label={`Since ${formatDay(rate.sinceDate)}`}
        value={
          <span className={`kpi__${since.tone}`}>{since.mark} {since.text}</span>
        }
        foot={rate.days > 1 ? `over ${rate.days} days` : 'First day only'}
      />

      <Tile
        label="Low to high"
        value={`${fmt(rate.low.value)} to ${fmt(rate.high.value)}`}
        foot={
          position == null ? (
            'No range yet'
          ) : (
            <span
              className="kpi__track"
              role="img"
              aria-label={`Today is ${Math.round(position * 100)} percent of the way from the low to the high`}
            >
              <span className="kpi__mark" style={{ left: `${position * 100}%` }} />
            </span>
          )
        }
      />

      <Tile
        label="Runs passed"
        value={runStats.total > 0 ? `${runStats.passed} of ${runStats.total}` : 'n/a'}
        foot={
          runStats.total === 0 ? (
            'No runs yet'
          ) : runStats.failed > 0 ? (
            <span className="kpi__down">last {runStats.total} runs, {runStats.failed} failed</span>
          ) : (
            `last ${runStats.total} runs`
          )
        }
      />
    </dl>
  );
}