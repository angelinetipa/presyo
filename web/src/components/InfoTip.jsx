// src/components/InfoTip.jsx
// A small info button that holds a hint, so the hint does not take up space
// on the page.
//
// How it opens
//   Mouse        hovering the button or the hint opens it
//   Click, tap   pins it open. Click again to close
//   Keyboard     Tab to the button opens it. Enter or Space pins it
//   Esc          closes it
//   Outside      a click or tap anywhere else closes it
//
// Touch devices have no hover, so only a tap opens the hint there.
//
// The hint is always in the page and linked to the button with
// aria-describedby, so a screen reader reads it with the button name.
//
// Props
//   label     the button name read by a screen reader
//   tone      'light' for a light panel, 'dark' for a dark panel. The hint
//             uses the opposite colour so it stands out from the panel.
//   align     'end' opens toward the left, 'start' opens toward the right
//   children  the hint. Use <span className="infotip__line"> for each line.

import { useEffect, useId, useRef, useState } from 'react';
import './InfoTip.css';

export default function InfoTip({ label = 'More information', tone = 'light', align = 'end', children }) {
  const id = useId();
  const wrap = useRef(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hover || pinned || focused;

  const closeAll = () => {
    setHover(false);
    setPinned(false);
    setFocused(false);
  };

  // Listen for Esc and outside clicks only while the hint is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeAll();
    };
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  function toggle() {
    if (pinned) closeAll();
    else setPinned(true);
  }

  return (
    <span
      ref={wrap}
      className={`infotip infotip--${tone} infotip--${align}`}
      data-open={open || undefined}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onBlur={(e) => {
        // Focus left the whole control, so release the pin too.
        if (!wrap.current?.contains(e.relatedTarget)) {
          setFocused(false);
          setPinned(false);
        }
      }}
    >
      <button
        type="button"
        className="infotip__btn"
        aria-label={label}
        aria-describedby={id}
        onClick={toggle}
        onFocus={(e) => {
          // Keyboard focus only. A mouse click already pins it.
          if (e.currentTarget.matches(':focus-visible')) setFocused(true);
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
          <path d="M8 7.3v4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <span id={id} role="tooltip" className="infotip__tip">{children}</span>
    </span>
  );
}