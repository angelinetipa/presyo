// src/components/RunGrid.jsx
// The pipeline health card: one square for each of the last 30 daily runs,
// oldest on the left.
//
// A passed run is a solid green square. A failed run is a red square with
// stripes, so it does not rely on colour alone. A run still open is grey.
// An empty outline is a day with no run recorded yet, so a short history
// never looks like a run of failures.
//
// The Log button opens the full table in a popover. Every run writes a row,
// failed ones included, because a log that only lists successes cannot tell
// a dead pipeline from one that has not run yet.
//
// runs is the list from fetchRuns in lib/api.js, newest first.

import usePopover from '../hooks/usePopover';
import InfoTip from './InfoTip';
import PopPanel from './PopPanel';
import RunLog from './RunLog';
import './BottomRow.css';

const SLOTS = 30;

const day = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });

export default function RunGrid({ runs }) {
  const { openId, rootRef, toggle, close } = usePopover();

  const list = (runs ?? []).slice(0, SLOTS);
  const oldestFirst = [...list].reverse();
  const empty = SLOTS - oldestFirst.length;
  const passed = list.filter((r) => r.status === 'success').length;
  const failed = list.filter((r) => r.status === 'failed').length;
  const open = openId === 'log';

  return (
    <div className="bottom__health" ref={rootRef}>
      <section className="panel health" aria-label="Pipeline health">
        <div className="health__head">
          <h2 className="panel__title">Pipeline health</h2>
          <div className="health__tools">
            <button
              type="button"
              className="linkbtn"
              aria-expanded={open}
              aria-controls="pop-log"
              aria-haspopup="dialog"
              disabled={list.length === 0}
              onClick={(e) => toggle('log', e)}
            >
              Log
            </button>
            <InfoTip label="About the run squares" align="end">
              <span className="infotip__line">
                Every morning run adds one square. Green passed. Red with stripes failed.
              </span>
              <span className="infotip__line">
                An empty outline is a day with no run recorded yet.
              </span>
            </InfoTip>
          </div>
        </div>

        <p className="panel__sub health__sub">Last 30 daily runs, green passed</p>

        <div
          className="health__grid"
          role="img"
          aria-label={`Last ${list.length} runs, oldest first. ${passed} passed, ${failed} failed.`}
        >
          {Array.from({ length: empty }, (_, i) => (
            <span key={`empty-${i}`} className="cell cell--none" />
          ))}
          {oldestFirst.map((run, i) => (
            <span
              key={i}
              className={`cell cell--${run.status}`}
              title={`${day(run.started_at)}, ${run.status}`}
            />
          ))}
        </div>
      </section>

      {open && (
        <PopPanel id="pop-log" title="Health log" align="left" onClose={() => close(true)}>
          <RunLog runs={list} />
        </PopPanel>
      )}
    </div>
  );
}