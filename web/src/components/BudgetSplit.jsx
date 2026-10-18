// src/components/BudgetSplit.jsx
// Split a monthly income into peso amounts.
//
// Reading order: headline, income and rate, the split bar, the rows, one
// message, then a note about the recorded range. The maths is in
// lib/split.js. This file holds the settings and puts them on screen.
//
// Each row has one value and one unit (%, the income currency, or pesos).
// Leave one row empty and it fills itself with what is left.
//
// Changing the income currency keeps every number as typed. An amount of
// 300 in the income currency stays 300, and only the label changes.
//
// The rate starts at today's rate and can be edited. The edit is not
// saved, so tomorrow always starts from the new day's rate.

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_INCOME, DEFAULT_ROWS, MAX_ROWS, ROW_COLORS } from '../constants/budget';
import { rankCurrencies, defaultCurrency } from '../lib/rank';
import { computeSplit, makeRow, parseAmount } from '../lib/split';
import { formatMoney, formatPeso } from '../lib/format';
import { loadSettings, saveSettings, clearSettings } from '../lib/budgetStorage';
import BudgetRow from './BudgetRow';
import BudgetNotice from './BudgetNotice';

export default function BudgetSplit({ series, latest }) {
  const available = rankCurrencies(latest);
  const fallback = defaultCurrency(latest);

  const [settings, setSettings] = useState(() => loadSettings(available, fallback));
  const [rateText, setRateText] = useState(null); // null means "use today's rate"

  const { currency, income, rows } = settings;
  const today = latest[currency]?.value ?? 0;
  const rateShown = rateText ?? (today ? today.toFixed(4) : '');
  const edited = rateText !== null && parseAmount(rateText) !== Number(today.toFixed(4));
  const rate = parseAmount(rateShown);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const result = useMemo(() => computeSplit({ total: income, rate, rows }), [income, rate, rows]);

  if (available.length === 0) return null;

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const changeRow = (id, patch) =>
    update({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeRow = (id) => update({ rows: rows.filter((r) => r.id !== id) });
  const addRow = () => update({ rows: [...rows, makeRow()] });

  function chooseCurrency(c) {
    setRateText(null);
    update({ currency: c });
  }

  function resetAll() {
    clearSettings();
    setRateText(null);
    setSettings({ currency: fallback, income: DEFAULT_INCOME, rows: DEFAULT_ROWS });
  }

  // History for the range note. It uses real recorded days only.
  const history = series.map((d) => d[currency]).filter((v) => v != null);
  const low = history.length ? Math.min(...history) : 0;
  const high = history.length ? Math.max(...history) : 0;
  const incomeNum = parseAmount(income);

  const ready = result.status !== 'norate' && result.status !== 'noincome';
  const colorOf = (i) => ROW_COLORS[i % ROW_COLORS.length];

  // The biggest row by pesos, for the headline.
  const top = result.rows.reduce(
    (m, r) => ((r.state === 'filled' || r.state === 'auto') && r.php > (m?.php ?? 0) ? r : m),
    null,
  );

  let headline = 'Enter your monthly income to see the split.';
  if (result.status === 'norate') headline = 'Enter a rate above zero to see the split.';
  else if (ready) headline = `${currency} ${formatMoney(result.income)} is ${formatPeso(result.incomePhp)} a month.`;

  const showLeft = result.status === 'under' || result.status === 'needmore';

  return (
    <section className="panel budget">
      <div className="panel__head">
        <div>
          <h2 className="panel__title">{headline}</h2>
          <p className="panel__sub">
            {ready && top && result.status === 'complete'
              ? `Most of it, ${formatPeso(top.phpRounded)}, goes to ${top.label || 'the first row'}.`
              : 'Set your income and divide it. Everything here can be changed.'}
          </p>
        </div>
        <button type="button" className="linkbtn" onClick={resetAll}>
          Reset to defaults
        </button>
      </div>

      <div className="budget__top">
        <div className="field">
          <label className="field__label" htmlFor="budget-income">Monthly income</label>
          <div className="joined">
            <input
              id="budget-income"
              type="text"
              inputMode="decimal"
              value={income}
              placeholder="0"
              onChange={(e) => update({ income: e.target.value })}
            />
            <select
              value={currency}
              aria-label="Income currency"
              onChange={(e) => chooseCurrency(e.target.value)}
            >
              {available.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="budget-rate">
            Pesos per {currency}
            <span className="field__tag">{edited ? 'edited' : 'today'}</span>
          </label>
          <div className="field__row">
            <input
              id="budget-rate"
              className="field__input"
              type="text"
              inputMode="decimal"
              value={rateShown}
              onChange={(e) => setRateText(e.target.value)}
            />
            {edited && (
              <button type="button" className="linkbtn" onClick={() => setRateText(null)}>
                Use today
              </button>
            )}
          </div>
        </div>
      </div>

      {ready && result.assigned > 0 && (
        <div
          className="sbar"
          role="img"
          aria-label={result.rows
            .filter((r) => r.php > 0)
            .map((r) => `${r.label || 'Row'} ${r.shareRounded} percent`)
            .join(', ')}
        >
          {result.rows.map((r, i) =>
            r.source > 0 ? (
              <span
                key={r.id}
                className="sbar__seg"
                style={{ flexGrow: r.source, background: colorOf(i) }}
                title={`${r.label || 'Row'}: ${formatPeso(r.phpRounded)}`}
              />
            ) : null,
          )}
          {showLeft && <span className="sbar__seg sbar__seg--free" style={{ flexGrow: result.left }} />}
        </div>
      )}

      <p className="budget__hint">Leave one row empty and it fills itself.</p>

      <ul className="brows">
        {rows.map((row, i) => (
          <BudgetRow
            key={row.id}
            row={row}
            result={result.rows[i]}
            currency={currency}
            color={colorOf(i)}
            canRemove={rows.length > 1}
            canConvert={ready}
            onChange={(patch) => changeRow(row.id, patch)}
            onRemove={() => removeRow(row.id)}
          />
        ))}
      </ul>

      <div className="budget__foot">
        <button type="button" className="addbtn" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
          + Add a row
        </button>
        {ready && <BudgetNotice result={result} currency={currency} />}
      </div>

      {ready && history.length > 0 && incomeNum > 0 && (
        <p className="panel__sub budget__note">
          Across {history.length} recorded days, {currency} {formatMoney(incomeNum)} has been worth{' '}
          {formatPeso(incomeNum * low)} to {formatPeso(incomeNum * high)}. That is what did happen,
          not a forecast.
        </p>
      )}
    </section>
  );
}