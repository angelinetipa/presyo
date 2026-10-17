// src/lib/format.js
// Date formatting for plain calendar days such as "2026-10-18".
//
// A bare date string is read as midnight UTC. Showing it in the viewer's
// own time zone can move it back a day for anyone west of UTC. These
// helpers format in UTC, so every viewer sees the same day.
//
// Do not use them for full timestamps, such as a run's start time. Those
// are real moments and should show in the viewer's local time.

const STYLES = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
};

/** Formats a plain day. style is 'short' (Oct 18), 'medium' (Oct 18, 2026) or 'long'. */
export function formatDay(iso, style = 'short') {
  return new Date(iso).toLocaleDateString('en-PH', { ...STYLES[style], timeZone: 'UTC' });
}