// src/components/BudgetRow.jsx
// One line of the split. A name, a value with its unit, and the pesos it
// comes to. On wide screens it is one line. On phones it is two short
// lines: the name on top, then the value on the left and the answer on
// the right.
//
// A row shows one of four states, which comes from computeSplit.
//   filled   the user typed a value
//   auto     the row was left empty and filled itself with what is left
//   empty    no value yet, and nothing to fill it with
//   invalid  the text is not a number
//
// An auto row shows its value inside the field. Clicking into it selects
// the number, so typing replaces it. The mouse up handler keeps the
// browser from dropping that selection right after the click. Clearing
// the field makes the row auto again.
//
// A locked row is never changed by auto balance. It can still be edited by
// hand. Locking an auto row keeps the number it shows.
//
// Changing the unit changes the label only. The typed number stays as it is.
//
// The row only reports edits through onChange. The maths is in lib/split.js.

import { useEffect, useRef } from 'react';
import { MAX_LABEL, UNITS } from '../constants/budget';
import { formatMoney, formatPeso } from '../lib/format';

const UNIT_NAME = { percent: '%', php: 'PHP' };

export default function BudgetRow({ row, result, currency, color, canRemove, onChange, onRemove }) {
  const auto = result.state === 'auto';
  const empty = result.state === 'empty';
  const invalid = result.state === 'invalid';
  const name = row.label || 'this row';
  const valueRef = useRef(null);

  // When a row turns auto while the user is in it, such as after clearing
  // the field, select the shown number so the next key replaces it.
  useEffect(() => {
    const el = valueRef.current;
    if (auto && el && document.activeElement === el) el.select();
  }, [auto, result.autoText]);

  // Locking an auto row freezes the number it shows, so the row keeps it.
  function toggleLock() {
    if (!row.locked && auto) onChange({ locked: true, value: result.autoText });
    else onChange({ locked: !row.locked });
  }

  const unitName = (u) => UNIT_NAME[u] ?? currency;

  return (
    <li className={`brow brow--${result.state}`} style={{ '--c': color }}>
      <span className="brow__swatch" aria-hidden="true" />

      <input
        className="brow__label"
        type="text"
        value={row.label}
        maxLength={MAX_LABEL}
        placeholder="Name"
        aria-label="Row name"
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <div className="joined brow__value">
        <input
          ref={valueRef}
          type="text"
          inputMode="decimal"
          value={auto ? result.autoText : row.value}
          placeholder={empty ? 'empty' : '0'}
          aria-label={`Amount for ${name}${auto ? ', filled in automatically' : ''}`}
          aria-invalid={invalid || undefined}
          onFocus={(e) => {
            // Wait one tick. Some browsers place the caret after focus fires.
            const field = e.target;
            if (auto) setTimeout(() => field.select(), 0);
          }}
          onMouseUp={(e) => { if (auto && document.activeElement === e.target) e.preventDefault(); }}
          onChange={(e) => onChange({ value: e.target.value })}
        />
        <select
          value={row.unit}
          aria-label={`Unit for ${name}`}
          onChange={(e) => onChange({ unit: e.target.value })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{unitName(u)}</option>
          ))}
        </select>
      </div>

      <div className="brow__out">
        {(result.state === 'filled' || auto) && (
          <>
            <span className="brow__php">
              {auto && <span className="brow__tag">auto</span>}
              {formatPeso(result.phpRounded)}
            </span>
            <span className="brow__src">
              {currency} {formatMoney(result.sourceRounded)} · {result.shareRounded}%
            </span>
          </>
        )}
        {empty && <span className="brow__soft">Waiting for a value</span>}
        {invalid && <span className="brow__bad">Numbers only</span>}
      </div>

      <button
        type="button"
        className={`brow__lock${row.locked ? ' brow__lock--on' : ''}`}
        aria-pressed={!!row.locked}
        aria-label={row.locked ? `Unlock ${name}` : `Lock ${name}`}
        title={row.locked ? 'Locked. Auto balance will not change this row.' : 'Lock this row'}
        onClick={toggleLock}
      >
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          {row.locked ? (
            <path d="M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z" fill="currentColor" />
          ) : (
            <path d="M5 7V5a3 3 0 0 1 5.8-1.1l-1.4.5A1.5 1.5 0 0 0 6.5 5v2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1Z" fill="currentColor" />
          )}
        </svg>
      </button>

      <button
        type="button"
        className="brow__remove"
        aria-label={`Remove ${name}`}
        disabled={!canRemove}
        onClick={onRemove}
      >
        &times;
      </button>
    </li>
  );
}