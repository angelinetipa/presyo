// src/components/RunLog.jsx
// The health log, shown rather than hidden.
//
// A status page that only reports successes tells you nothing, because
// a dead pipeline looks exactly the same as one that has not run yet.
// Failed runs appear here in full, with their row counts.

import { colors } from '../constants/theme';

const stamp = (iso) =>
  new Date(iso).toLocaleString('en-PH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export default function RunLog({ runs }) {
  if (!runs?.length) return null;

  return (
    <section className="panel">
      <h2 className="panel__title">Recent runs</h2>
      <p className="panel__sub">
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
