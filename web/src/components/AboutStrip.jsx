// src/components/AboutStrip.jsx
// The reading material, kept out of the way.
//
// Each item is a native <details> element, so it opens and closes
// without any script and works with the keyboard. The closed state is
// one line with a short hint, so the strip stays slim.

import Source from './Source';
import WhoItsFor from './WhoItsFor';
import GoodFor from './GoodFor';
import RunLog from './RunLog';
import Limits from './Limits';

export default function AboutStrip({ runs }) {
  const folds = [
    {
      id: 'how',
      label: 'How it works',
      hint: 'Source, daily checks, and what gets rejected',
      body: <Source />,
    },
    {
      id: 'why',
      label: 'Why it matters',
      hint: 'Who feels the number, and what a 1% move is worth',
      body: <WhoItsFor />,
    },
    {
      id: 'use',
      label: 'How to use it',
      hint: 'Check a quote, plan a budget, judge a month',
      body: <GoodFor />,
    },
    runs?.length > 0 && {
      id: 'health',
      label: 'Health log',
      hint: 'Every run, including the ones that failed',
      body: <RunLog runs={runs} />,
    },
    {
      id: 'limits',
      label: 'Limits',
      hint: 'What this page cannot tell you',
      body: <Limits />,
    },
  ].filter(Boolean);

  return (
    <section className="folds" aria-label="More about Presyo">
      {folds.map((fold) => (
        <details key={fold.id} className="fold">
          <summary>
            <span className="fold__label">{fold.label}</span>
            <span className="fold__hint">{fold.hint}</span>
          </summary>
          <div className="fold__body">{fold.body}</div>
        </details>
      ))}
    </section>
  );
}