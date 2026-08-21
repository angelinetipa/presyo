// src/components/Board.jsx
// The signature element: a money changer's rate board.
//
// Every mall in the Philippines has one — a dark panel, currency codes
// down the left, figures right-aligned in a column so the decimal
// points stack. Borrowing that vernacular says what the page is faster
// than a heading would, and it is where the page spends its boldness.
// Everything else on the page stays quiet.
//
// Figures use tabular-nums so a digit changing does not shift the
// column. On a real board the numbers never jump sideways.

import { colors, CURRENCIES, CURRENCY_NOTE } from '../constants/theme';

function Delta({ pct }) {
  if (pct == null) return <span style={{ color: colors.flat }}>—</span>;
  const flat = Math.abs(pct) < 0.005;
  const up = pct > 0;
  const color = flat ? colors.flat : up ? colors.up : colors.down;
  const mark = flat ? '\u2013' : up ? '\u25B2' : '\u25BC';
  return (
    <span style={{ color }}>
      {mark} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export default function Board({ latest, lastDate }) {
  const shown = CURRENCIES.filter((c) => latest[c]);

  return (
    <section className="board" aria-label="Latest exchange rates">
      <header className="board__head">
        <span>Pesos per unit</span>
        <span>{lastDate ? new Date(lastDate).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
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
        Change shown against the previous recorded day.
      </footer>
    </section>
  );
}
