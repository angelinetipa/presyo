// src/components/BudgetRow.jsx
// One line of the split: a name, a percent or fixed switch, a value,
// and the pesos it comes to. Inputs are on the left, the answer on the right.
//
// The row only reports edits upward through onChange. The maths lives in
// lib/budget.js, and this file only displays what it is given.

import { MAX_LABEL } from '../constants/budget';

const peso = (n) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const money = (n) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BudgetRow({ row, result, currency, color, canRemove, onChange, onRemove }) {
  const fixed = row.mode === 'fixed';
  const name = row.label || 'this row';

  return (
    <li className="brow" style={{ '--c': color }}>
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

      <div className="brow__mode" role="group" aria-label={`How to set ${name}`}>
        <button
          type="button"
          className={!fixed ? 'brow__opt brow__opt--on' : 'brow__opt'}
          aria-pressed={!fixed}
          onClick={() => onChange({ mode: 'percent' })}
        >
          %
        </button>
        <button
          type="button"
          className={fixed ? 'brow__opt brow__opt--on' : 'brow__opt'}
          aria-pressed={fixed}
          onClick={() => onChange({ mode: 'fixed' })}
        >
          Fixed
        </button>
      </div>

      <div className="brow__value">
        <input
          type="text"
          inputMode="decimal"
          value={row.value}
          placeholder="0"
          aria-label={fixed ? `Fixed amount for ${name}` : `Percent for ${name}`}
          onChange={(e) => onChange({ value: e.target.value })}
        />
        {fixed ? (
          <select
            value={row.unit}
            aria-label={`Currency of the fixed amount for ${name}`}
            onChange={(e) => onChange({ unit: e.target.value })}
          >
            <option value="source">{currency}</option>
            <option value="php">PHP</option>
          </select>
        ) : (
          <span className="brow__unit">%</span>
        )}
      </div>

      <div className="brow__out">
        <span className="brow__php">{peso(result.phpRounded)}</span>
        <span className="brow__src">
          {currency} {money(result.sourceRounded)} · {result.shareRounded}%
        </span>
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