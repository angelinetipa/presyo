// src/components/AboutCards.jsx
// Three slim cards with the reading material: How it works, Why it matters
// and Limits. Each one opens its content in a popover, so the page stays on
// one screen. The popover logic is in hooks/usePopover.js.
//
// Each card is a real button. It says whether its popover is open with
// aria-expanded, and points to it with aria-controls.
//
// days and since describe the recorded data. They go to Limits so its
// answer about the record stays true.

import usePopover from '../hooks/usePopover';
import PopPanel from './PopPanel';
import Source from './Source';
import WhoItsFor from './WhoItsFor';
import Limits from './Limits';
import './BottomRow.css';

export default function AboutCards({ days, since }) {
  const { openId, rootRef, toggle, close } = usePopover();

  const cards = [
    { id: 'how', label: 'How it works', hint: 'Where the rates come from', body: <Source /> },
    { id: 'why', label: 'Why it matters', hint: 'Who feels the rate', body: <WhoItsFor /> },
    { id: 'limits', label: 'Limits', hint: 'What this page cannot tell you', body: <Limits days={days} since={since} /> },
  ];
  const current = cards.find((c) => c.id === openId);

  return (
    <div className="bottom__cards" ref={rootRef}>
      {cards.map((card) => {
        const open = card.id === openId;
        return (
          <button
            key={card.id}
            type="button"
            className="slim"
            aria-expanded={open}
            aria-controls={`pop-${card.id}`}
            aria-haspopup="dialog"
            onClick={(e) => toggle(card.id, e)}
          >
            <span className="slim__top">
              <span className="slim__label">{card.label}</span>
              <span className="slim__plus" aria-hidden="true">{open ? '–' : '+'}</span>
            </span>
            <span className="slim__hint">{card.hint}</span>
          </button>
        );
      })}

      {current && (
        <PopPanel id={`pop-${current.id}`} title={current.label} align="right" onClose={() => close(true)}>
          {current.body}
        </PopPanel>
      )}
    </div>
  );
}