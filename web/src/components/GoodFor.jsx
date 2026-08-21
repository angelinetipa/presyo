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
// The second half answers the obvious follow-up — why not just search
// for the rate? It starts by conceding what a search does better,
// because a comparison that only lists your own strengths is an advert,
// and nobody believes one.

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

const SEARCH_WINS = [
  'Gives you today\u2019s number instantly, for any currency in the world.',
  'Has years of history behind it, not weeks.',
  'Updates through the day, not once every morning.',
];

const THIS_WINS = [
  {
    title: 'It keeps a record, not just a number',
    body: 'A search shows you today and forgets it. Every day recorded here stays, in one public table anyone can read.',
  },
  {
    title: 'It tells you when it is broken',
    body: 'The run log above shows failed runs as well as good ones. A rate site will never tell you its feed went down — it will just show you an old number.',
  },
  {
    title: 'It has nothing to sell you',
    body: 'Most rate pages belong to companies that want you to transfer money through them. This one does not, which is why it can tell you to go compare providers instead.',
  },
  {
    title: 'It is built for one country',
    body: 'Eight currencies, chosen because most money sent to the Philippines comes from places that use them — not one hundred and seventy for everybody.',
  },
];

export default function GoodFor() {
  return (
    <section className="panel">
      <h2 className="panel__title">What this is good for</h2>
      <p className="panel__sub">Three things a reference rate genuinely helps with.</p>

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
        honestly by anyone, and the last section explains why chasing it usually costs more
        than it saves.
      </p>

      <h3 className="sub-head">Why not just search for the rate?</h3>

      <p className="prose">
        Often you should — and for three things a search is simply better:
      </p>
      <ul className="plain">
        {SEARCH_WINS.map((s) => <li key={s}>{s}</li>)}
      </ul>

      <p className="prose">
        If today’s number is all you need, use one. These are the four things this page does
        that a search box does not:
      </p>

      <div className="diffs">
        {THIS_WINS.map((d) => (
          <div key={d.title} className="diff">
            <h4 className="diff__title">{d.title}</h4>
            <p className="diff__body">{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}