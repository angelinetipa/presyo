// src/components/GoodFor.jsx
// The mirror of Limits.jsx, and it has to sit beside it.
//
// The limits section says this page will not tell you when to send
// money. On its own that reads as a page with no purpose. It has one,
// and it is a better one: a mid-market rate is a BENCHMARK. Without a
// reference number you cannot tell a fair quote from a bad one, and the
// gap between providers is far larger and far more reliable than the
// day-to-day movement anyone would be trying to time.
//
// So: not "when should I send", but "what should I expect, and who
// should I send through". The first question is unanswerable. The
// second is answerable, and it is where the money actually is.

const USES = [
  {
    title: 'Check whether a quote is fair',
    body: 'This is the mid-market rate — the middle of what the market is trading at. Whatever a bank, counter, or app offers you will be lower. The gap between the two is what they are charging you, and now you can see it.',
    example: 'If this page says one dollar is ₱61.72 and a counter offers ₱59.80, that ₱1.92 gap is roughly 3%. On ₱30,000 sent, that is about ₱900 — every time you send.',
  },
  {
    title: 'Know what to plan for',
    body: 'The range shows what a given amount has actually been worth across the days recorded. Budget against the low end and a weak week does not catch you short.',
    example: 'If ₱28,500 to ₱30,900 is the range for what you usually send, plan around ₱28,500.',
  },
  {
    title: 'See whether it is worth worrying about',
    body: 'Some months the rate barely moves and the worry costs more than the money. The chart shows you which kind of month you are in, without anyone telling you what to do about it.',
    example: null,
  },
];

export default function GoodFor() {
  return (
    <section className="panel">
      <h2 className="panel__title">What this is good for</h2>
      <p className="panel__sub">
        Three things a reference rate genuinely helps with.
      </p>

      <ol className="uses">
        {USES.map((u, i) => (
          <li key={u.title} className="use">
            <span className="use__n" aria-hidden="true">{i + 1}</span>
            <div>
              <h3 className="use__title">{u.title}</h3>
              <p className="use__body">{u.body}</p>
              {u.example && <p className="use__eg">{u.example}</p>}
            </div>
          </li>
        ))}
      </ol>

      <p className="prose">
        Notice that none of these is <em>when</em> to send. That question cannot be answered
        honestly by anyone, and the section below explains why chasing it usually costs more
        than it saves.
      </p>
    </section>
  );
}