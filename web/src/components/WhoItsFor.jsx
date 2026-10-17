// src/components/WhoItsFor.jsx
// Who feels the rate, and what a small move is worth in pesos.
// Shown inside the "Why it matters" fold. Outside figures come from
// constants/facts.js, each with its source.

import { FACTS, COVERED, MISSED, REMITTANCE_SOURCES, TRACKED_BEYOND_LIST } from '../constants/facts';

const peso = (n) => '₱' + Math.round(n).toLocaleString('en-PH');

const GROUPS = [
  {
    title: 'People sending money home',
    body: 'You earn in one currency and your family spends in another. The rate decides how much of your work arrives.',
  },
  {
    title: 'Families receiving it',
    body: 'You do not choose the rate. It sets what lands in the account, so the same amount sent can arrive smaller or larger.',
  },
  {
    title: 'People paid in another currency',
    body: 'Remote workers, freelancers, and anyone employed abroad. Your invoice is in dollars and your rent is in pesos.',
  },
];

export default function WhoItsFor() {
  const onePercent = FACTS.averageRemittance.value * 0.01;

  return (
    <>
      <section className="panel">
        <h2 className="panel__title">Who this is for</h2>

        <div className="groups">
          {GROUPS.map((g) => (
            <div key={g.title} className="group">
              <h3 className="group__title">{g.title}</h3>
              <p className="group__body">{g.body}</p>
            </div>
          ))}
        </div>

        <div className="stats">
          <p className="stat">
            <strong>{FACTS.ofwCount.value}</strong> {FACTS.ofwCount.text} {FACTS.ofwCount.detail}
          </p>
          <p className="stat">
            <strong>{FACTS.totalRemittance.value}</strong> {FACTS.totalRemittance.text}
          </p>
        </div>
        <p className="cite">
          Sources are {FACTS.ofwCount.source} and {FACTS.totalRemittance.source}.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">What a 1% move is worth</h2>
        <p className="prose">
          The average person working abroad sent home <strong>{FACTS.averageRemittance.display}</strong>{' '}
          over 2024. If the peso moves just <strong>1%</strong> against the currency they are
          paid in, that year of sending is worth about <strong>{peso(onePercent)}</strong> more
          or less. The number looks small until you multiply it by a year of sending.
        </p>
        <p className="cite">Source is {FACTS.averageRemittance.source}.</p>
      </section>

      <section className="panel">
        <h2 className="panel__title">What the tracked currencies cover</h2>
        <p className="panel__sub">Share of cash sent home in 2025, by the country it came from.</p>

        <ul className="coverage-list">
          {REMITTANCE_SOURCES.map((s) => (
            <li key={s.country} className={s.tracked ? 'cov cov--on' : 'cov'}>
              <span className="cov__country">{s.country}</span>
              <span className="cov__bar" aria-hidden="true">
                <span style={{ width: `${(s.share / 40) * 100}%` }} />
              </span>
              <span className="cov__share">{s.share.toFixed(1)}%</span>
              <span className="cov__flag">{s.tracked ? s.currency : 'not tracked'}</span>
            </li>
          ))}
        </ul>

        <p className="prose">
          Together these cover at least <strong>{COVERED.toFixed(0)}%</strong> of the cash sent
          home in 2025.
          {MISSED > 0 && (
            <> Another <strong>{MISSED.toFixed(0)}%</strong> comes from places not tracked here,
              so if that is where your money comes from, this page cannot help you yet.</>
          )}{' '}
          {TRACKED_BEYOND_LIST.join(' and ')} are tracked too, but the central bank does not list
          them among its top sources, so no share is shown. That makes the figure a floor, not a
          total.
        </p>
        <p className="cite">Source is Bangko Sentral ng Pilipinas, 2025 full year data.</p>
      </section>
    </>
  );
}