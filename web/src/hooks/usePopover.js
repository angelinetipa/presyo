// src/hooks/usePopover.js
// Open and close logic for a popover that is opened by buttons.
//
// One popover can be open at a time inside one group. The group is the
// element that gets rootRef. It should wrap the buttons and the popover.
//
//   toggle(id, event)  opens the popover for id, or closes it if it is open
//   close(restore)     closes it. restore moves focus back to the button
//   openId             the id that is open, or null
//
// Esc closes it and returns focus to the button that opened it. A click or
// tap outside the group closes it and leaves focus where the person put it.

import { useCallback, useEffect, useRef, useState } from 'react';

export default function usePopover() {
  const [openId, setOpenId] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const close = useCallback((restore = false) => {
    setOpenId(null);
    if (restore) triggerRef.current?.focus();
  }, []);

  // Listen for Esc and outside clicks only while a popover is open.
  useEffect(() => {
    if (!openId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close(true);
    };
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [openId, close]);

  const toggle = useCallback((id, event) => {
    triggerRef.current = event.currentTarget;
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return { openId, rootRef, toggle, close };
}