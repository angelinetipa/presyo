// src/components/BudgetSplit.jsx
// Split a monthly income into peso amounts.
//
// Reading order: title and purpose, income, rate and what the income is
// worth in pesos, the split bar, the rows, then one line with the add
// button, the ready made splits and one message. The title says what the
// section is for, so a new visitor knows. The maths is in lib/split.js.
// The settings and every change a person can make are in hooks/useBudget.js,
// passed in as budget. This file puts them on screen.
//
// The section is kept short so it fits its box in the dashboard grid. The
// reading notes, including the recorded range, are in the info button.
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
import { formatMoney, formatPeso, formatPesoExact, formatRateExact } from '../lib/format';
import BudgetRow from './BudgetRow';
import BudgetNotice from './BudgetNotice';
import BudgetPresets from './BudgetPresets';
import BudgetReport, { printReport } from './BudgetReport';
import InfoTip from './InfoTip';
import './BudgetSplit.css';

export default function BudgetSplit({ budget, series, lastDate }) {
  const {
    available, currency, income, rows, rateShown, rate, edited, today, result,
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

  // Shown in place of the notice until there is an income and a rate.
  const prompt = result.status === 'norate'
    ? 'Enter a rate above zero to see the split.'
    : 'Enter your monthly income to see the split.';

  const showLeft = result.status === 'under' || result.status === 'needmore';
  const linked = Boolean(findSavingsRow(rows));
  const showRange = ready && history.length > 0 && incomeNum > 0;

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
            Reset
          </button>
          <InfoTip label="How the budget planner works">
            <span className="infotip__line">
              Leave a row empty and it fills itself. Change a row and another adjusts. Lock a row to stop that.
            </span>
            {linked && (
              <span className="infotip__line">
                The Savings row is shared with the savings calculator.
              </span>
            )}
            {showRange && (
              <span className="infotip__line">
                Across {history.length} recorded days, {currency} {formatMoney(incomeNum)} has been worth{' '}
                {formatPeso(incomeNum * low)} to {formatPeso(incomeNum * high)}. That is what did happen,
                not a forecast.
              </span>
            )}
          </InfoTip>
        </div>
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
            {edited && (
              <button type="button" className="linkbtn" onClick={resetRate}>
                Use today
              </button>
            )}
          </label>
          <input
            id="budget-rate"
            className="field__input"
            type="text"
            inputMode="decimal"
            value={rateShown}
            title={today ? `Today is ${formatRateExact(today)}` : undefined}
            onChange={(e) => changeRate(e.target.value)}
          />
        </div>

        <div className="field budget__worth">
          <span className="field__label">Worth each month</span>
          <p className="budget__php" aria-live="polite" title={ready ? formatPesoExact(result.incomePhp) : undefined}>
            {ready ? formatPeso(result.incomePhp) : '–'}
          </p>
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
                title={`${r.label || 'Row'} ${formatPeso(r.phpRounded)}`}
              />
            ) : null,
          )}
          {showLeft && <span className="sbar__seg sbar__seg--free" style={{ flexGrow: result.left }} />}
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
        <BudgetPresets rows={rows} onPick={pickPreset} />
        {ready ? (
          <BudgetNotice result={result} currency={currency} />
        ) : (
          <p className="notice notice--warn" role="status">{prompt}</p>
        )}
      </div>

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