// src/components/Source.jsx
// Where the number comes from, in plain words.
//
// "Data: open.er-api.com" tells a reader nothing. Anyone deciding
// whether to trust a rate deserves to know who produced it, how, and
// how often — especially on a page about money. The attribution is also
// required by the provider's terms.

export default function Source() {
  return (
    <section className="panel">
      <h2 className="panel__title">Where these numbers come from</h2>

      <h3 className="sub-head">The source</h3>
      <p className="prose">
        The rates come from the open endpoint of{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">
          ExchangeRate-API
        </a>
        , a service that publishes exchange rates for free with no sign-up. It does not invent
        the numbers: it collects published reference rates from central banks and commercial
        sources, then blends them, so one bad source cannot drag the result off. A currency is
        only published if at least three sources cover it. The free feed updates once every
        24 hours, which is why this page records one value per day and no more.
      </p>
      <p className="prose">
        The rates are what the provider calls <strong>indicative midpoint rates</strong> — the
        middle between what buyers and sellers are asking, good enough for estimates and
        comparisons. They are not a price anyone is offering you.
      </p>

      <h3 className="sub-head">How it gets here</h3>
      <p className="prose">
        A job runs every morning on its own. It asks the feed for the day's rates, then checks
        every single one before saving it: a date in the future is thrown out, a feed that has
        not updated in a week is treated as dead, and any value outside a sensible range for
        that currency is rejected with the reason written down. What survives is written to the
        database using the date and currency together as the key, so running the job twice
        changes nothing. Every run is logged — including the runs that fail.
      </p>
      <p className="prose">
        <a href="https://github.com/angelinetipa/presyo">See the code and the pipeline on GitHub →</a>
      </p>
    </section>
  );
}