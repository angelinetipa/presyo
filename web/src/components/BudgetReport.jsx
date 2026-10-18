// src/components/BudgetReport.jsx
// The printed summary of the split. It is hidden on screen and is the only
// thing shown when the page is printed. The Save as PDF button opens the
// browser print dialog, where the person picks "Save as PDF".
//
// It is rendered into document.body, outside the app root, so the print
// styles can hide the whole app and show only this page.
//
// The text comes from the same result the calculator shows, so the
// printout always matches the screen.

import { createPortal } from 'react-dom';
import { formatDay, formatMoney, formatPeso } from '../lib/format';
import { describe } from './BudgetNotice';

const UNIT_NAME = { percent: '%', php: 'PHP' };

const pct = (n) => `${Number(n.toFixed(1))}%`;

/** Opens the print dialog. The page title becomes the suggested file name. */
export function printReport(lastDate) {
  const original = document.title;
  const stamp = lastDate ?? new Date().toISOString().slice(0, 10);
  document.title = `Presyo budget split ${stamp}`;

  const restore = () => {
    document.title = original;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

export default function BudgetReport({ result, rows, currency, rate, rateEdited, rateDate, low, high, days }) {
  const printed = new Date().toLocaleDateString('en-PH', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const note = describe(result, currency);
  // Each line pairs the computed row with what the person typed.
  const lines = result.rows
    .map((r, i) => ({ ...r, entered: r.state === 'auto' ? r.autoText : String(rows[i]?.value ?? '').trim() }))
    .filter((r) => r.state === 'filled' || r.state === 'auto');
  const showLeft = result.status === 'under' || result.status === 'needmore';

  const rateLine = rateEdited
    ? `${rate} pesos per ${currency}, edited by you`
    : `${rate} pesos per ${currency}${rateDate ? `, recorded ${formatDay(rateDate, 'long')}` : ''}`;

  return createPortal(
    <article className="report" aria-hidden="true">
      <header className="report__head">
        <p className="report__brand">Presyo</p>
        <h1 className="report__title">Monthly income split</h1>
        <p className="report__meta">Prepared {printed}</p>
      </header>

      <dl className="report__facts">
        <div>
          <dt>Monthly income</dt>
          <dd>{currency} {formatMoney(result.income)}</dd>
        </div>
        <div>
          <dt>Worth in pesos</dt>
          <dd>{formatPeso(result.incomePhp)}</dd>
        </div>
        <div>
          <dt>Rate used</dt>
          <dd>{rateLine}</dd>
        </div>
      </dl>

      <table className="report__table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Entered</th>
            <th className="num">Pesos</th>
            <th className="num">{currency}</th>
            <th className="num">Share</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((r) => (
            <tr key={r.id}>
              <td>{r.label || 'Unnamed'}</td>
              <td>
                {r.entered} {UNIT_NAME[r.unit] ?? currency}
                {r.state === 'auto' ? ' (auto)' : ''}
              </td>
              <td className="num">{formatPeso(r.phpRounded)}</td>
              <td className="num">{formatMoney(r.sourceRounded)}</td>
              <td className="num">{r.shareRounded}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2">Assigned</td>
            <td className="num">{formatPeso(result.assignedPhp)}</td>
            <td className="num">{formatMoney(result.assigned)}</td>
            <td className="num">{pct(result.assignedShare)}</td>
          </tr>
          {showLeft && (
            <tr>
              <td colSpan="2">Left to assign</td>
              <td className="num">{formatPeso(result.leftPhp)}</td>
              <td className="num">{formatMoney(result.left)}</td>
              <td className="num">{pct(result.leftShare)}</td>
            </tr>
          )}
        </tfoot>
      </table>

      {note && <p className="report__status">{note.text}</p>}

      {days > 0 && (
        <p className="report__text">
          Across {days} recorded days, {currency} {formatMoney(result.income)} has been worth{' '}
          {formatPeso(result.income * low)} to {formatPeso(result.income * high)}. That is what did
          happen, not a forecast.
        </p>
      )}

      <footer className="report__foot">
        <p>
          Rates come from ExchangeRate-API. They are indicative midpoint rates, good for
          estimates. They are not a price anyone offers you.
        </p>
        <p>Made with Presyo.</p>
      </footer>
    </article>,
    document.body,
  );
}