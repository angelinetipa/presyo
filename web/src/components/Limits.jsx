// src/components/Limits.jsx
// The refusal, written down.
//
// The obvious next feature for a page like this is "should I send money
// today?" It is not built, and this section says why in plain words.
//
// Three reasons, in order of how much they matter. Fifteen days of
// indicative rates cannot forecast anything. The number here is the
// mid-market rate, which is not what a counter will hand you. And the
// fees on a transfer are usually larger than the daily movement anyone
// would be timing around — so someone who waits a week to catch a
// better rate can easily lose more than they save, while their family
// waits.
//
// A dashboard that guesses at that on someone's behalf is worse than no
// dashboard. Saying so is the most useful thing on the page.

const LIMITS = [
  {
    q: 'Can this tell me if the peso will go up or down?',
    a: 'No, and neither can anything else. This page records what already happened. Nobody can tell you what a currency will do next, and any page that says otherwise is guessing with your money.',
  },
  {
    q: 'Is this the rate I will actually get?',
    a: 'No. This is the mid-market rate — the midpoint between what buyers and sellers are asking. A bank, a remittance counter, or an app will quote you something less favourable. Always check with the place you are actually sending through.',
  },
  {
    q: 'Should I wait for a better rate before sending?',
    a: 'This page will not tell you that, on purpose. The fee and the margin on a transfer are usually bigger than the day-to-day movement, so waiting can cost more than it saves — and your family is waiting too. Compare what different providers charge; that is where the real money is.',
  },
  {
    q: 'How far back does this go?',
    a: 'Only as far as the table above says. Collection started recently, so this is a short record, not a trend. A few weeks of anything can look like a pattern when it is not.',
  },
];

export default function Limits() {
  return (
    <section className="panel">
      <h2 className="panel__title">What this cannot tell you</h2>
      <p className="panel__sub">
        The honest limits of a page like this one.
      </p>

      <dl className="limits">
        {LIMITS.map(({ q, a }) => (
          <div key={q} className="limit">
            <dt className="limit__q">{q}</dt>
            <dd className="limit__a">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}