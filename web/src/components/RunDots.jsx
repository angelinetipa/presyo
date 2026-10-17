// src/components/RunDots.jsx
// A row of small dots, one per recent pipeline run, oldest on the left.
// Green is a successful run, red is a failed run, grey is a run still open.
// Hovering a dot shows its date and status. The full table is in the
// health log at the bottom of the page.

const day = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });

export default function RunDots({ runs }) {
  if (!runs?.length) return null;

  const oldestFirst = [...runs].reverse();
  const passed = runs.filter((r) => r.status === 'success').length;

  return (
    <span
      className="rundots"
      role="img"
      aria-label={`Last ${runs.length} runs, oldest first. ${passed} succeeded.`}
    >
      {oldestFirst.map((run, i) => (
        <span
          key={i}
          className={`rundots__dot rundots__dot--${run.status}`}
          title={`${day(run.started_at)}, ${run.status}`}
        />
      ))}
    </span>
  );
}