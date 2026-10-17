// src/components/Limits.jsx
// What the page will not tell you, and why.
// Shown inside the "Limits" fold.
//
// The page does not say when to send money. A short record of midpoint
// rates cannot forecast anything, the midpoint is not what a counter
// pays, and transfer fees are usually larger than the daily movement.
//
// The last answer uses the real number of days recorded, passed in as
// props, so it stays true as the record grows.

const SHORT_RECORD = 90; // below this many days, the answer calls the record short

function recordAnswer(days, since) {
  if (!days) return 'Nothing is recorded yet.';
  const base = `Presyo has ${days} ${days === 1 ? 'day' : 'days'} recorded, since ${since}.`;
  return days < SHORT_RECORD
    ? `${base} That is a short record, not a trend. A few weeks of anything can look like a pattern when it is not.`
    : `${base} Past moves do not predict the next one.`;
}

export default function Limits({ days, since }) {
  const limits = [
    {
      q: 'Can this tell me if the peso will go up or down?',
      a: 'No, and neither can anything else. This page records what already happened. Any page that says it knows what a currency will do next is guessing with your money.',
    },
    {
      q: 'Is this the rate I will actually get?',
      a: 'No. This is the midpoint rate. A bank, remittance counter, or app will quote you a worse one. Check with the place you are sending through.',
    },
    {
      q: 'Should I wait for a better rate before sending?',
      a: 'This page will not say, on purpose. The fee and margin on a transfer are usually bigger than the daily movement, so waiting can cost more than it saves, and your family is waiting too. Compare what providers charge. That is where the real money is.',
    },
    {
      q: 'How far back does this go?',
      a: recordAnswer(days, since),
    },
  ];

  return (
    <section className="panel">
      <dl className="limits">
        {limits.map(({ q, a }) => (
          <div key={q} className="limit">
            <dt className="limit__q">{q}</dt>
            <dd className="limit__a">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}