// src/components/BudgetSplit.jsx
// Split a monthly income into peso amounts.
//
// Reading order: title and purpose, headline, income and rate, the split
// bar, the rows, one message, then a note about the recorded range. The
// title says what the section is for, so a new visitor knows. The maths is in
// lib/split.js. The settings and every change a person can make are in
// hooks/useBudget.js, passed in as budget. This file puts them on screen.
//
// Each row has one value and one unit (%, the income currency, or pesos).
// Leave one row empty and it fills itself with what is left. When every row
// has a value and a change makes the total go over or under (a row, the
// income, the rate or the currency), the row that last filled itself, or the
// last row, fills itself again. See rebalance in lib/split.js.
//
// Changing the income currency keeps every number as typed. An amount of
// 300 in the income currency stays 300, and only the label changes.
//
// The rate starts at today's rate and can be edited. The edit is not
// saved, so tomorrow always starts from the new day's rate.

import { MAX_ROWS, ROW_COLORS } from '../constants/budget';
import { parseAmount } from '../lib/split';
import { findSavingsRow } from '../lib/savingsLink';
import { formatMoney, formatPeso } from '../lib/format';
import BudgetRow from './BudgetRow';
import BudgetNotice from './BudgetNotice';
import BudgetPresets from './BudgetPresets';
import BudgetReport, { printReport } from './BudgetReport';
import './BudgetSplit.css';

export default function BudgetSplit({ budget, series, lastDate }) {
  const {
    available, currency, income, rows, rateShown, rate, edited, result,
    changeRow, changeIncome, changeRate, resetRate,
    removeRow, addRow, pickPreset, chooseCurrency, resetAll,
  } = budget;

  if (available.length === 0) return null;

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
          <h2 className="panel__title">Budget planner</h2>
          <p className="panel__sub">Split your monthly income into savings, needs and wants.</p>
        </div>
        <div className="panel__actions">
          <button
            type="button"
            className="linkbtn"
            onClick={() => printReport(lastDate)}
            disabled={!ready}
          >
            Save as PDF
          </button>
          <button type="button" className="linkbtn" onClick={resetAll}>
            Reset to defaults
          </button>
        </div>
      </div>

      <div className="budget__result">
        <p className="budget__headline">{headline}</p>
        <p className="panel__sub">
          {ready && top && result.status === 'complete'
            ? `Most of it, ${formatPeso(top.phpRounded)}, goes to ${top.label || 'the first row'}.`
            : 'Everything here can be changed.'}
        </p>
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
              onChange={(e) => changeIncome(e.target.value)}
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
              onChange={(e) => changeRate(e.target.value)}
            />
            {edited && (
              <button type="button" className="linkbtn" onClick={resetRate}>
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

      <BudgetPresets rows={rows} onPick={pickPreset} />

      <p className="budget__hint">Leave a row empty and it fills itself. Change a row and another adjusts. Lock a row to stop that.</p>

      {findSavingsRow(rows) && (
        <p className="budget__link">
          <span className="field__tag">Linked</span>
          The Savings row is shared with the savings calculator below.
        </p>
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
        {ready && <BudgetNotice result={result} currency={currency} />}
      </div>

      {ready && history.length > 0 && incomeNum > 0 && (
        <p className="panel__sub budget__note">
          Across {history.length} recorded days, {currency} {formatMoney(incomeNum)} has been worth{' '}
          {formatPeso(incomeNum * low)} to {formatPeso(incomeNum * high)}. That is what did happen,
          not a forecast.
        </p>
      )}

      {ready && (
        <BudgetReport
          result={result}
          rows={rows}
          currency={currency}
          rate={rate}
          rateEdited={edited}
          rateDate={lastDate}
          low={low}
          high={high}
          days={history.length}
        />
      )}
    </section>
  );
}