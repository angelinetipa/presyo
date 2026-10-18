// src/components/BudgetPresets.jsx
// A row of ready made splits. Picking one replaces the rows. The income
// and currency stay as they are, and every value can still be edited.
//
// The chip that matches the current rows is marked as selected.

import { PRESETS } from '../constants/budget';

const norm = (s) => String(s).trim().toLowerCase();

// A preset matches when every row has the same name and percent value.
function matches(preset, rows) {
  if (preset.rows.length !== rows.length) return false;
  return preset.rows.every(([label, value], i) => (
    rows[i].unit === 'percent'
    && norm(rows[i].label) === norm(label)
    && Number(rows[i].value) === value
    && String(rows[i].value).trim() !== ''
  ));
}

export default function BudgetPresets({ rows, onPick }) {
  return (
    <div className="presets" role="group" aria-label="Ready made splits">
      <span className="presets__label">Presets</span>
      {PRESETS.map((p) => {
        const on = matches(p, rows);
        return (
          <button
            key={p.id}
            type="button"
            className={`chip${on ? ' chip--on' : ''}`}
            aria-pressed={on}
            aria-label={p.rows.map(([label, value]) => `${label} ${value}`).join(', ')}
            onClick={() => onPick(p)}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}