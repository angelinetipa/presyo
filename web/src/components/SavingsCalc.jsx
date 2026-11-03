// src/components/SavingsCalc.jsx
// The savings calculator. A dark panel in the style of the rate board.
//
// It is linked to the Savings row of the budget (see lib/savingsLink.js).
// The monthly amount here is that row. Change it here and the budget
// follows. Change the Savings row in the budget and it shows up here.
//
// Two ways to use it
//   I save this much   a monthly amount and a length of time give the total
//   I have a goal      a goal and a length of time give the monthly amount
//                      to save. That amount is written into the budget.
//
// The maths is in lib/savings.js. There is no interest. Every figure is a
// plain sum of what is put aside.
//
// With no Savings row in the budget the calculator still works on its own,
// and a note says how to link it.

import { useEffect, useState } from 'react';
import {
  PERIODS, TIME_UNITS, toMonths, projectSavings, monthlyNeeded, monthsToReach, describeMonths,
} from '../lib/savings';
import { findSavingsRow } from '../lib/savingsLink';
import { parseAmount } from '../lib/split';
import { formatMoney, formatPeso } from '../lib/format';
import './SavingsCalc.css';

// Whole pesos from 100 up. Small amounts keep their centavos.
const money = (n) => (n >= 100 || n === 0 ? formatPeso(n) : `₱${formatMoney(n)}`);

// "1 year", "6 months", "1.5 years"
const spanText = (span, unit) => {
  const n = parseAmount(span);
  return `${span.trim() || '0'} ${n === 1 ? unit.slice(0, -1) : unit}`;
};

function TimeField({ id, label, span, unit, onChange }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="joined">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={span}
          placeholder="0"
          onChange={(e) => onChange({ span: e.target.value, unit })}
        />
        <select
          value={unit}
          aria-label={`${label} unit`}
          onChange={(e) => onChange({ span, unit: e.target.value })}
        >
          {TIME_UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function SavingsCalc({ budget }) {
  const { savings, rows, result, changeSavings, available } = budget;
  const linked = Boolean(findSavingsRow(rows));

  const [mode, setMode] = useState('save'); // 'save' or 'goal'
  const [monthlyText, setMonthlyText] = useState(() => (savings ? String(savings.php) : ''));
  const [when, setWhen] = useState({ span: '1', unit: 'years' });
  const [plan, setPlan] = useState({ goal: '100000', span: '1', unit: 'years' });

  // The budget is the source of truth for the Savings row. When it changes
  // from the budget side, copy the new amount into the field. A typed amount
  // that only differs by rounding is left alone, so typing is not interrupted.
  const budgetPhp = savings?.php;
  useEffect(() => {
    if (budgetPhp === undefined) return;
    setMonthlyText((text) => (Math.round(parseAmount(text)) === budgetPhp ? text : String(budgetPhp)));
  }, [budgetPhp]);

  if (available.length === 0) return null;

  const monthly = parseAmount(monthlyText);

  function changeMonthly(text) {
    setMonthlyText(text);
    if (linked) changeSavings(parseAmount(text));
  }

  // Works out the monthly amount for a goal and writes it into the budget.
  function changePlan(next) {
    setPlan(next);
    const need = Math.ceil(monthlyNeeded(parseAmount(next.goal), toMonths(parseAmount(next.span), next.unit)));
    if (linked && need > 0) changeSavings(need);
  }

  // Save mode
  const months = toMonths(parseAmount(when.span), when.unit);
  const total = monthly * months;

  // Goal mode
  const goal = parseAmount(plan.goal);
  const goalMonths = toMonths(parseAmount(plan.span), plan.unit);
  const need = Math.ceil(monthlyNeeded(goal, goalMonths));
  const reachMonths = monthsToReach(goal, monthly);
  const covered = need > 0 ? Math.min(100, Math.floor((monthly / need) * 100)) : 0;
  const onTrack = need > 0 && monthly >= need;

  const tooMuch = result.incomePhp > 0 && monthly > result.incomePhp + 0.5;

  return (
    <section className="savecalc" aria-label="Savings calculator">
      <header className="savecalc__head">
        <div>
          <h2 className="savecalc__title">Savings calculator</h2>
          <p className="savecalc__sub">See how much your savings add up to over days, months or years.</p>
        </div>
        <div className="seg" role="group" aria-label="What do you want to find out">
          <button type="button" aria-pressed={mode === 'save'} onClick={() => setMode('save')}>
            I save this much
          </button>
          <button type="button" aria-pressed={mode === 'goal'} onClick={() => setMode('goal')}>
            I have a goal
          </button>
        </div>
      </header>

      {mode === 'save' ? (
        <>
          <div className="savecalc__fields">
            <div className="field">
              <label className="field__label" htmlFor="save-monthly">Savings each month</label>
              <div className="joined">
                <input
                  id="save-monthly"
                  type="text"
                  inputMode="decimal"
                  value={monthlyText}
                  placeholder="0"
                  onChange={(e) => changeMonthly(e.target.value)}
                />
                <span className="joined__unit">PHP</span>
              </div>
            </div>
            <TimeField id="save-span" label="For how long" span={when.span} unit={when.unit} onChange={setWhen} />
          </div>

          <div className="savecalc__result" aria-live="polite">
            <p className="savecalc__kicker">You will have</p>
            <p className="savecalc__big">{money(total)}</p>
            <p className="savecalc__line">
              {months > 0 ? `after ${spanText(when.span, when.unit)}` : 'Enter how long you will save.'}
            </p>
          </div>

          <ul className="savecalc__rows">
            {projectSavings(monthly).map((p, i) => (
              <li key={p.id} className="savecalc__row" style={{ '--i': i }}>
                <span>{p.label}</span>
                <span>{money(p.total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="savecalc__fields">
            <div className="field">
              <label className="field__label" htmlFor="goal-amount">Savings goal</label>
              <div className="joined">
                <input
                  id="goal-amount"
                  type="text"
                  inputMode="decimal"
                  value={plan.goal}
                  placeholder="0"
                  onChange={(e) => changePlan({ ...plan, goal: e.target.value })}
                />
                <span className="joined__unit">PHP</span>
              </div>
            </div>
            <TimeField
              id="goal-span"
              label="Reach it in"
              span={plan.span}
              unit={plan.unit}
              onChange={(t) => changePlan({ ...plan, ...t })}
            />
          </div>

          <div className="savecalc__result" aria-live="polite">
            <p className="savecalc__kicker">Save each month</p>
            <p className="savecalc__big">{need > 0 ? formatPeso(need) : '₱0'}</p>
            <p className="savecalc__line">
              {need > 0
                ? `to reach ${formatPeso(goal)} in ${spanText(plan.span, plan.unit)}.`
                : 'Enter a goal and how long you have.'}
            </p>
          </div>

          {need > 0 && (
            <div className="savecalc__compare">
              <div
                className="meter"
                role="progressbar"
                aria-label="Your monthly savings compared with what you need"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={covered}
              >
                <span className={`meter__fill${onTrack ? '' : ' meter__fill--part'}`} style={{ width: `${covered}%` }} />
              </div>
              <p className="savecalc__line">
                {onTrack
                  ? 'Your monthly savings reach the goal on time.'
                  : `Your monthly savings are ${covered}% of what you need.`}
              </p>
              <p className="savecalc__line">
                {reachMonths === null
                  ? 'Add a monthly amount to see how long it takes.'
                  : `At ${money(monthly)} a month, you reach ${formatPeso(goal)} in ${describeMonths(reachMonths)}.`}
              </p>
              {linked && Math.round(monthly) !== need && (
                <button type="button" className="linkbtn" onClick={() => changeSavings(need)}>
                  Set my budget savings to {formatPeso(need)}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {tooMuch && (
        <p className="savecalc__warn">That is more than your monthly income of {formatPeso(result.incomePhp)}.</p>
      )}

      <footer className="savecalc__foot">
        {linked ? (
          <>
            <span className="savecalc__tag">Linked</span>
            <span>Change the savings here and the budget follows. Change the Savings row in the budget and this follows.</span>
          </>
        ) : (
          <>
            <span className="savecalc__tag savecalc__tag--off">Not linked</span>
            <span>Add a row named Savings to the budget to link this calculator to it.</span>
          </>
        )}
      </footer>
    </section>
  );
}