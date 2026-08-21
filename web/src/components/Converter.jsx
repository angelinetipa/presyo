// src/components/Converter.jsx
// The piece that turns a rate into a number someone can feel.
//
// "61.7180" means nothing to most people. "$500 is ₱30,859 today, and
// across the days recorded the same $500 ranged from ₱30,400 to
// ₱31,200" is a thing you can picture.
//
// Everything here is arithmetic on rows already in the database. There
// is no prediction and no advice — the range is what DID happen, not
// what will. That distinction is the whole reason this page can exist
// without steering somebody's household money.

import { useState } from 'react';
import { colors, CURRENCIES } from '../constants/theme';

const peso = (n) =>
  '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Converter({ series, latest }) {
  const available = CURRENCIES.filter((c) => latest[c]);
  const [currency, setCurrency] = useState(available[0] ?? 'USD');
  const [amount, setAmount] = useState('500');

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  const history = series.map((d) => d[currency]).filter((v) => v != null);
  if (history.length === 0 || available.length === 0) return null;

  const today = latest[currency].value;
  const low = Math.min(...history);
  const high = Math.max(...history);

  const nowPeso = value * today;
  const lowPeso = value * low;
  const highPeso = value * high;
  const spread = highPeso - lowPeso;

  return (
    <section className="panel convert">
      <h2 className="panel__title">What would this be worth in pesos?</h2>
      <p className="panel__sub">
        Type any amount. The page works it out from the days it has recorded — nothing predicted.
      </p>

      <div className="convert__input">
        <div className="switch" role="group" aria-label="Choose a currency">
          {available.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              aria-pressed={c === currency}
              className={c === currency ? 'switch__btn switch__btn--on' : 'switch__btn'}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="convert__field">
          <span className="sr-only">Amount in {currency}</span>
          <input
            type="number" min="0" step="any" inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={`Amount in ${currency}`}
          />
        </label>
      </div>

      {!valid ? (
        <p className="convert__hint">Enter an amount above zero.</p>
      ) : (
        <>
          <p className="convert__headline">
            {currency} {value.toLocaleString()} is{' '}
            <strong>{peso(nowPeso)}</strong> today.
          </p>

          <div className="convert__range">
            <div className="convert__end">
              <span className="convert__label">Lowest it has been</span>
              <span className="convert__num" style={{ color: colors.down }}>{peso(lowPeso)}</span>
            </div>
            <div className="convert__bar" aria-hidden="true">
              <span
                className="convert__marker"
                style={{
                  left: high === low ? '50%' : `${((today - low) / (high - low)) * 100}%`,
                }}
              />
            </div>
            <div className="convert__end convert__end--right">
              <span className="convert__label">Highest it has been</span>
              <span className="convert__num" style={{ color: colors.up }}>{peso(highPeso)}</span>
            </div>
          </div>

          <p className="convert__note">
            Across {history.length} recorded days, the same {currency}{' '}
            {value.toLocaleString()} has been worth anywhere from {peso(lowPeso)} to{' '}
            {peso(highPeso)} — a difference of <strong>{peso(spread)}</strong>. The marker shows
            where today sits in that range.
          </p>
        </>
      )}
    </section>
  );
}