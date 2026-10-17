// src/components/BudgetSplit.jsx
// Split a monthly income into peso amounts. Replaces the old converter.
//
// Reading order: headline, the split bar, the rows, the rate, the notes.
// The headline states the biggest share in pesos, then the rows show the
// rest. All the maths is in lib/budget.js. This file holds the settings
// and puts them on screen.
//
// The rate starts at today's rate and can be edited. The edit is not
// saved, so tomorrow always starts from the new day's rate.

import { useEffect, useMemo, useState } from 'react';
import { colors } from '../constants/theme';
import { DEFAULT_INCOME, DEFAULT_ROWS, MAX_ROWS, ROW_COLORS } from '../constants/budget';
import { rankCurrencies, defaultCurrency } from '../lib/rank';
import { computeBudget, makeRow, parseAmount } from '../lib/budget';
import { loadSettings, saveSettings, clearSettings } from '../lib/budgetStorage';
import BudgetRow from './BudgetRow';

const peso = (n) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const money = (n) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const result = useMemo(
    () => computeBudget({ total: income, rate, rows }),
    [income, rate, rows],
  );

  if (available.length === 0) return null;

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const changeRow = (id, patch) =>
    update({ rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeRow = (id) => update({ rows: rows.filter((r) => r.id !== id) });
  const addRow = () => update({ rows: [...rows, makeRow({ label: '' })] });

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

  // The biggest row by peso amount, for the headline.
  const top = result.rows.reduce((m, r) => (r.php > (m?.php ?? 0) ? r : m), null);

  const colorOf = (i) => ROW_COLORS[i % ROW_COLORS.length];
  const ready = result.status !== 'norate' && result.status !== 'empty';

  let headline = 'Enter your monthly income to see the split.';
  if (result.status === 'norate') headline = 'Enter a rate above zero to see the split.';
  else if (ready) {
    headline = `${currency} ${money(result.income)} is ${peso(result.incomePhp)} a month.`;
  }

  return (
    <section className="panel budget">
      <div className="panel__head">
        <div>
          <h2 className="panel__title">{headline}</h2>
          <p className="panel__sub">
            {ready && top && top.php > 0
              ? `Most of it, ${peso(top.phpRounded)}, goes to ${top.label || 'the first row'}.`
              : 'Set your income and how you want to divide it. Everything here can be changed.'}
          </p>
        </div>
        <button type="button" className="linkbtn" onClick={resetAll}>
          Reset to defaults
        </button>
      </div>

      <div className="budget__top">
        <label className="field">
          <span className="field__label">Monthly income</span>
          <input
            type="text"
            inputMode="decimal"
            value={income}
            placeholder="0"
            aria-label={`Monthly income in ${currency}`}
            onChange={(e) => update({ income: e.target.value })}
          />
        </label>

        <div className="field">
          <span className="field__label">Paid in</span>
          <div className="switch" role="group" aria-label="Choose the income currency">
            {available.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => chooseCurrency(c)}
                aria-pressed={c === currency}
                className={c === currency ? 'switch__btn switch__btn--on' : 'switch__btn'}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">
            Pesos per {currency}
            <span className="field__tag">{edited ? 'edited' : 'today'}</span>
          </span>
          <span className="field__row">
            <input
              type="text"
              inputMode="decimal"
              value={rateShown}
              aria-label={`Pesos per ${currency}`}
              onChange={(e) => setRateText(e.target.value)}
            />
            {edited && (
              <button type="button" className="linkbtn" onClick={() => setRateText(null)}>
                Use today
              </button>
            )}
          </span>
        </label>
      </div>

      {ready && result.assigned > 0 && (
        <div
          className="sbar"
          role="img"
          aria-label={result.rows
            .filter((r) => r.php > 0)
            .map((r) => `${r.label || 'Row'} ${r.share.toFixed(0)} percent`)
            .join(', ')}
        >
          {result.rows.map((r, i) =>
            r.source > 0 ? (
              <span
                key={r.id}
                className="sbar__seg"
                style={{ flexGrow: r.source, background: colorOf(i) }}
                title={`${r.label || 'Row'}: ${peso(r.phpRounded)}`}
              />
            ) : null,
          )}
          {result.status === 'under' && (
            <span className="sbar__seg sbar__seg--free" style={{ flexGrow: result.unassigned }} />
          )}
        </div>
      )}

      <ul className="brows">
        {rows.map((row, i) => (
          <BudgetRow
            key={row.id}
            row={row}
            result={result.rows[i]}
            currency={currency}
            color={colorOf(i)}
            canRemove={rows.length > 1}
            onChange={(patch) => changeRow(row.id, patch)}
            onRemove={() => removeRow(row.id)}
          />
        ))}
      </ul>

      <div className="budget__foot">
        <button type="button" className="addbtn" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
          + Add a row
        </button>

        {ready && result.status === 'under' && (
          <p className="budget__msg">
            {peso(result.unassignedPhp)} ({currency} {money(result.unassigned)}) is not assigned yet.
          </p>
        )}
        {ready && result.status === 'over' && (
          <p className="budget__msg budget__msg--bad" style={{ color: colors.down }}>
            The rows add up to {peso(result.overPhp)} ({currency} {money(result.over)}) more than your income.
          </p>
        )}
        {ready && result.status === 'ok' && (
          <p className="budget__msg">Every peso is assigned.</p>
        )}
      </div>

      {ready && history.length > 0 && incomeNum > 0 && (
        <p className="panel__sub budget__note">
          Across {history.length} recorded days, {currency} {money(incomeNum)} has been worth{' '}
          {peso(incomeNum * low)} to {peso(incomeNum * high)}. That is what did happen, not a
          forecast. Percent rows split what is left after any fixed rows.
        </p>
      )}
    </section>
  );
}