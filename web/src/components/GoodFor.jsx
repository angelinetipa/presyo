// src/components/GoodFor.jsx
// What a reference rate is good for, and when a plain search is better.
// Shown inside the "How to use it" fold. It pairs with Limits.jsx, which
// explains what the page will not do.
//
// The "why not search" part lists what a search does better first. A
// comparison that only lists its own strengths reads as an advert.

const USES = [
  {
    title: 'Check whether a quote is fair',
    body: 'This is the midpoint rate. A bank, counter, or app will offer you less. The gap between the two is what they charge you.',
    example: 'If this page says one dollar is ₱61.72 and a counter offers ₱59.80, the ₱1.92 gap is about 3%. On ₱30,000 worth of dollars, that is about ₱930 every time you send.',
  },
  {
    title: 'Know what to plan for',
    body: 'The range shows what an amount has been worth across the days recorded. Budget against the low end and a weak week does not catch you short.',
    example: 'If ₱28,500 to ₱30,900 is the range for what you usually send, plan around ₱28,500.',
  },
  {
    title: 'See whether it is worth worrying about',
    body: 'In some months the rate barely moves. The chart shows which kind of month you are in.',
    example: null,
  },
];

const SEARCH_WINS = [
  'It gives you today’s number instantly, for any currency.',
  'It has years of history, not weeks.',
  'It updates through the day, not once every morning.',
];

const THIS_WINS = [
  {
    title: 'It keeps a record',
    body: 'A search shows today and forgets it. Every day recorded here stays in one public table.',
  },
  {
    title: 'It tells you when it is broken',
    body: 'The health log shows failed runs too. A rate site will just show you an old number.',
  },
  {
    title: 'It has nothing to sell',
    body: 'Most rate pages want you to transfer money through them. This one does not.',
  },
  {
    title: 'It is built for one country',
    body: 'Eight currencies, chosen because most money sent to the Philippines comes from places that use them.',
  },
];

export default function GoodFor() {
  return (
    <section className="panel">
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
        None of these says <em>when</em> to send. Nobody can answer that honestly. See Limits.
      </p>

      <h3 className="sub-head">Why not just search for the rate?</h3>
      <p className="prose">Often you should. A search is better at three things.</p>
      <ul className="plain">
        {SEARCH_WINS.map((s) => <li key={s}>{s}</li>)}
      </ul>

      <p className="prose">If today&rsquo;s number is all you need, use one. Presyo adds four things.</p>
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