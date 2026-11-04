// src/components/PopPanel.jsx
// The popover that opens from a button in the bottom row.
//
// It is not modal. The page behind it can still be read. Focus moves into
// the panel when it opens, so a keyboard user lands on it. Esc and the
// close button both close it. The logic for opening and closing is in
// hooks/usePopover.js.
//
// On wide screens the panel opens above its group, lined up with the left
// or right edge (align). On narrow screens it becomes a sheet at the bottom
// of the screen. See BottomRow.css.
//
// Props
//   id        the id the opening button points to with aria-controls
//   title     the heading, also the panel name for a screen reader
//   align     'left' or 'right'
//   onClose   called when the close button is used
//   children  the content

import { useEffect, useRef } from 'react';

export default function PopPanel({ id, title, align = 'right', onClose, children }) {
  const panel = useRef(null);

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      id={id}
      ref={panel}
      className={`pop pop--${align}`}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
    >
      <div className="pop__head">
        <h2 className="pop__title">{title}</h2>
        <button type="button" className="pop__close" aria-label={`Close ${title}`} onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="pop__body">{children}</div>
    </div>
  );
}