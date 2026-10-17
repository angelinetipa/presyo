// src/components/Board.jsx
// The rate board. A dark panel, currency codes on the left, figures
// right aligned so the decimal points stack.
//
// Rows are ranked by pesos per unit, highest first, using rankCurrencies.
// Figures use tabular-nums so a changing digit does not shift the column.

import { colors, CURRENCY_NOTE } from '../constants/theme';
import { rankCurrencies } from '../lib/rank';

function Delta({ pct }) {
  if (pct == null) return <span style={{ color: colors.flat }}>—</span>;
  const flat = Math.abs(pct) < 0.005;
  const up = pct > 0;
  const color = flat ? colors.flat : up ? colors.up : colors.down;
  const mark = flat ? '–' : up ? '▲' : '▼';
  return (
    <span style={{ color }}>
      {mark} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export default function Board({ latest, lastDate }) {
  const shown = rankCurrencies(latest);

  return (
    <section className="board" aria-label="Latest exchange rates">
      <header className="board__head">
        <span>Pesos per unit</span>
        <span>
          {lastDate
            ? new Date(lastDate).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      </header>

      <ol className="board__rows">
        {shown.map((currency, i) => {
          const row = latest[currency];
          return (
            <li key={currency} className="board__row" style={{ '--i': i }}>
              <span className="board__code">{currency}</span>
              <span className="board__note">{CURRENCY_NOTE[currency]}</span>
              <span className="board__value">{row.value.toFixed(4)}</span>
              <span className="board__delta"><Delta pct={row.dayChange} /></span>
            </li>
          );
        })}
      </ol>

      <footer className="board__foot">
        Highest to lowest. Change is against the previous recorded day.
      </footer>
    </section>
  );
}