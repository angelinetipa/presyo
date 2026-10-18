// src/components/BudgetNotice.jsx
// The one message under the rows. It says whether the split is complete
// or what to do next, and always includes what is left to assign.
//
// The text comes from the status returned by computeSplit. It is a live
// region, so a screen reader announces changes as the user types.

import { formatMoney, formatPeso } from '../lib/format';

const pct = (n) => `${Number(n.toFixed(1))}%`;

/** The sentence for a split result. Also used by the printed summary. */
export function describe(result, currency) {
  const left = `${formatPeso(result.leftPhp)} (${currency} ${formatMoney(result.left)}, ${pct(result.leftShare)})`;
  const names = (ids) => ids
    .map((id) => result.rows.find((r) => r.id === id)?.label || 'a row')
    .join(', ');

  switch (result.status) {
    case 'invalid':
      return { tone: 'bad', text: `Use numbers only in ${names(result.invalidIds)}.` };

    case 'needmore': {
      const n = result.needMore;
      return {
        tone: 'warn',
        text: `Fill in ${n} more ${n === 1 ? 'row' : 'rows'} so only one is left empty. ${left} is left to assign.`,
      };
    }

    case 'under':
      return { tone: 'warn', text: `${left} is left to assign. Clear one row and it fills itself.` };

    case 'over': {
      const over = `${formatPeso(result.overPhp)} (${currency} ${formatMoney(result.over)}, ${pct(result.overShare)})`;
      return { tone: 'bad', text: `The rows add up to ${over} more than your income.` };
    }

    case 'complete': {
      const auto = result.rows.find((r) => r.id === result.autoId);
      if (auto) {
        return { tone: 'ok', text: `${auto.label || 'The empty row'} filled itself with ${formatPeso(auto.phpRounded)}. Every peso is assigned.` };
      }
      return { tone: 'ok', text: 'Every peso is assigned.' };
    }

    default:
      return null;
  }
}

export default function BudgetNotice({ result, currency }) {
  const note = describe(result, currency);
  if (!note) return null;
  return (
    <p className={`notice notice--${note.tone}`} role="status" aria-live="polite">
      {note.text}
    </p>
  );
}