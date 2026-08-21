// src/components/WhoItsFor.jsx
// Who actually feels this number, and what a small move is worth in
// household terms.
//
// A rate page with no people on it is a page for traders. The people
// who live with this number are mostly not traders — they are a parent
// deciding what to send, a family working out whether it covers
// tuition, a freelancer invoicing in a currency they cannot spend.
//
// Outside figures live in constants/facts.js with their sources.

import { FACTS, REMITTANCE_SOURCES, COVERED, MISSED, TRACKED_BEYOND_LIST } from '../constants/facts';

const peso = (n) => '\u20B1' + Math.round(n).toLocaleString('en-PH');

const GROUPS = [
  {
    title: 'People sending money home',
    body: 'You earn in one currency and your family spends in another. The rate decides how much of your work actually arrives.',
  },
  {
    title: 'Families here receiving it',
    body: 'You did not choose the rate and cannot see it move, but it sets what lands in the account — the same amount sent can arrive smaller or larger.',
  },
  {
    title: 'People here paid in another currency',
    body: 'Remote workers, freelancers, and anyone employed by a company abroad. Your invoice is in dollars; your rent is in pesos.',
  },
];

export default function WhoItsFor() {
  const onePercent = FACTS.averageRemittance.value * 0.01;

  return (
    <>
      <section className="panel">
        <h2 className="panel__title">Who this is for</h2>
        <p className="panel__sub">Three groups, all living with the same number.</p>

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
          Sources: {FACTS.ofwCount.source}; {FACTS.totalRemittance.source}.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">What a small move is actually worth</h2>
        <p className="panel__sub">
          Percentages hide their own size. Here is one in pesos.
        </p>

        <p className="prose">
          The average person working abroad sent home <strong>{FACTS.averageRemittance.display}</strong>{' '}
          over 2024. If the peso moves just <strong>1%</strong> against the currency they are
          paid in, that same year of sending is worth about{' '}
          <strong>{peso(onePercent)}</strong> more — or less.
        </p>
        <p className="prose">
          That is the whole reason this page exists. The number looks small until you multiply it
          by everything a family sends in a year.
        </p>
        <p className="cite">Source: {FACTS.averageRemittance.source}.</p>
      </section>

      <section className="panel">
        <h2 className="panel__title">How much of the picture these five cover</h2>
        <p className="panel__sub">
          Five currencies, chosen because most money sent home comes from places that use them.
        </p>

        <ul className="coverage-list">
          {REMITTANCE_SOURCES.map((s) => (
            <li key={s.country} className={s.tracked ? 'cov cov--on' : 'cov'}>
              <span className="cov__country">{s.country}</span>
              <span className="cov__bar" aria-hidden="true">
                <span style={{ width: `${(s.share / 40) * 100}%` }} />
              </span>
              <span className="cov__share">{s.share}%</span>
              <span className="cov__flag">{s.tracked ? s.currency : 'not tracked'}</span>
            </li>
          ))}
        </ul>

        <p className="prose">
          Together the tracked currencies account for at least{' '}
          <strong>{COVERED.toFixed(0)}%</strong> of the cash sent home in 2025.
          {MISSED > 0 && (
            <> Another <strong>{MISSED.toFixed(0)}%</strong> comes from places not tracked here,
              so if that is where your money comes from, this page cannot help you yet.</>
          )}
        </p>
        <p className="prose">
          {TRACKED_BEYOND_LIST.join(' and ')} are tracked as well, but the central bank does not
          publish them among its top sources — so no share can be shown for them, and the figure
          above is a floor rather than a total.
        </p>
        <p className="cite">Source: Bangko Sentral ng Pilipinas, 2025 full-year data.</p>
      </section>
    </>
  );
}