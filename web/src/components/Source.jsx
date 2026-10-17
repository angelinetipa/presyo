// src/components/Source.jsx
// Where the numbers come from and how they get to the page.
// Shown inside the "How it works" fold, so it has no title of its own.
// The attribution is also required by the provider's terms.

export default function Source() {
  return (
    <section className="panel">
      <h3 className="sub-head">The source</h3>
      <p className="prose">
        Rates come from{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">
          ExchangeRate-API
        </a>
        , a free service. It blends published reference rates from central banks and other
        sources, so one bad source cannot drag the result off. A currency is only published when
        at least three sources cover it. The free feed updates once a day, so Presyo records one
        value per day.
      </p>
      <p className="prose">
        These are <strong>indicative midpoint rates</strong>, halfway between what buyers and
        sellers ask. They are good for estimates and for comparing quotes. They are not a price
        anyone offers you.
      </p>

      <h3 className="sub-head">How it gets here</h3>
      <p className="prose">
        A job runs every morning and checks each rate before saving it. A date in the future is
        thrown out. A feed that has not updated in a week counts as dead. A value outside a
        sensible range for its currency is rejected, with the reason written down. Saving uses
        the date and currency together as the key, so running the job twice changes nothing.
        Every run is logged, including the ones that fail.
      </p>
      <p className="prose">
        <a href="https://github.com/angelinetipa/presyo">See the code on GitHub →</a>
      </p>
    </section>
  );
}