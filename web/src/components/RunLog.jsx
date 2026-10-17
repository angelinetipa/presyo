// src/components/RunLog.jsx
// Recent pipeline runs, failed ones included.
// Shown inside the "Health log" fold. A log that only lists successes
// cannot tell a dead pipeline from one that has not run yet.
//
// Start times are real moments, so they show in the viewer's local time.

import { colors } from '../constants/theme';

const stamp = (iso) =>
  new Date(iso).toLocaleString('en-PH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export default function RunLog({ runs }) {
  if (!runs?.length) return null;

  return (
    <section className="panel">
      <p className="panel__sub" style={{ marginTop: 0 }}>
        Every run writes a row, including the ones that fail.
      </p>

      <table className="log">
        <thead>
          <tr>
            <th>Started</th><th>Status</th>
            <th className="num">Read</th><th className="num">Loaded</th><th className="num">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => {
            const ok = run.status === 'success';
            return (
              <tr key={i}>
                <td>{stamp(run.started_at)}</td>
                <td>
                  <span
                    className="pill"
                    style={{
                      color: ok ? colors.up : colors.down,
                      borderColor: ok ? colors.up : colors.down,
                    }}
                  >
                    {run.status}
                  </span>
                </td>
                <td className="num">{run.rows_read ?? 0}</td>
                <td className="num">{run.rows_loaded ?? 0}</td>
                <td className="num">{run.rows_rejected ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}