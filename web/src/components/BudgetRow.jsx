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
// The row only reports edits through onChange. The maths is in lib/split.js.

import { useEffect, useRef } from 'react';
import { MAX_LABEL, UNITS } from '../constants/budget';
import { formatMoney, formatPeso } from '../lib/format';
import { formatValue } from '../lib/split';

const UNIT_NAME = { percent: '%', php: 'PHP' };

export default function BudgetRow({ row, result, currency, color, canRemove, canConvert, onChange, onRemove }) {
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

  const unitName = (u) => UNIT_NAME[u] ?? currency;

  // Changing the unit keeps the amount the same, so the row does not jump.
  // It only converts when the row has a usable amount to convert.
  function changeUnit(unit) {
    if (unit === row.unit) return;
    if (canConvert && result.state === 'filled') {
      const next = unit === 'percent' ? result.share : unit === 'php' ? result.php : result.source;
      onChange({ unit, value: formatValue(next) });
    } else {
      onChange({ unit });
    }
  }

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
          onChange={(e) => changeUnit(e.target.value)}
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