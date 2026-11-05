// src/components/Board.jsx
// The rate board, styled like a money changer's panel: a dark background,
// currency codes on the left, and right aligned figures so the decimal
// points line up.
//
// Rows are ranked by pesos per unit, highest first, using rankCurrencies.
// Each row is one line so the board stays short. The country is kept as a
// hover title and as hidden text for screen readers. Figures use
// tabular-nums so a changing digit does not shift the column. Hovering a
// figure shows the exact stored rate, and hovering a change shows its exact
// percent.
//
// days and since describe the recorded data and fill the footer line.

import { colors, CURRENCY_NOTE } from '../constants/theme';
import { rankCurrencies } from '../lib/rank';
import { formatDay, formatPercentExact, formatRateExact } from '../lib/format';
import InfoTip from './InfoTip';

function Delta({ pct }) {
  if (pct == null) return <span style={{ color: colors.flat }}>n/a</span>;
  const flat = Math.abs(pct) < 0.005;
  const up = pct > 0;
  const color = flat ? colors.flat : up ? colors.up : colors.down;
  const mark = flat ? '–' : up ? '▲' : '▼';
  return (
    <span style={{ color }} title={formatPercentExact(pct)}>
      {mark} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export default function Board({ latest, lastDate, days, since }) {
  const shown = rankCurrencies(latest);

  return (
    <section className="board" aria-label="Latest exchange rates">
      <header className="board__head">
        <span>Pesos per unit</span>
        <span className="board__meta">
          <span>{lastDate ? formatDay(lastDate, 'medium') : 'n/a'}</span>
          <InfoTip tone="dark" label="About the rate board">
            Highest to lowest. Change is against the previous recorded day.
          </InfoTip>
        </span>
      </header>

      <ol className="board__rows">
        {shown.map((currency, i) => {
          const row = latest[currency];
          return (
            <li key={currency} className="board__row" style={{ '--i': i }} title={CURRENCY_NOTE[currency]}>
              <span className="board__code">
                {currency}
                <span className="sr-only"> {CURRENCY_NOTE[currency]}</span>
              </span>
              <span className="board__value" title={`1 ${currency} is ₱${formatRateExact(row.value)}`}>
                {row.value.toFixed(4)}
              </span>
              <span className="board__delta"><Delta pct={row.dayChange} /></span>
            </li>
          );
        })}
      </ol>

      {days > 0 && (
        <footer className="board__foot">
          <strong>{days}</strong> days recorded on its own since {since}.
        </footer>
      )}
    </section>
  );
}