// src/components/Tabs.jsx
// Tab bar. The parent owns the active tab and passes it in.
//
// Keyboard support follows the standard tabs pattern: left and right
// arrows move between tabs, Home and End jump to the first and last.
// Only the active tab is in the tab order. Each tab points at a panel
// with id "panel-<id>", which the parent renders.

import { useRef } from 'react';
import '../tabs.css';

export default function Tabs({ tabs, active, onChange }) {
  const refs = useRef({});

  function handleKey(event, index) {
    const last = tabs.length - 1;
    let next = null;

    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;
    if (next === null) return;

    event.preventDefault();
    const id = tabs[next].id;
    onChange(id);
    refs.current[id]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label="Sections">
      {tabs.map((tab, i) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[tab.id] = el; }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`panel-${tab.id}`}
            tabIndex={on ? 0 : -1}
            className={on ? 'tabs__btn tabs__btn--on' : 'tabs__btn'}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKey(e, i)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}