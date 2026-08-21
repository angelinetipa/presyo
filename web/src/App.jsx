// src/App.jsx
// The page reads: who this is for → what it is worth now → what your
// money would be worth → how it moved → who feels it → what the
// pipeline is doing → what none of it can tell you.
//
// The order matters. The rate board is the hook, but the converter is
// the point: a number in pesos beats a number on a board for anyone who
// is not a trader. The limits sit last because they are the conclusion,
// not a disclaimer — a page about somebody's household money has to say
// plainly what it will not do.

import { useEffect, useState } from 'react';
import { fetchRates, fetchRuns, shape } from './lib/api';
import Board from './components/Board';
import Converter from './components/Converter';
import RateChart from './components/RateChart';
import WhoItsFor from './components/WhoItsFor';
import RunLog from './components/RunLog';
import Limits from './components/Limits';

export default function App() {
  const [data, setData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchRates(), fetchRuns()])
      .then(([rates, runRows]) => {
        setData(shape(rates));
        setRuns(runRows);
      })
      .catch((e) => setError(e.message));
  }, []);

  const lastRun = runs[0];
  const ready = data && data.days > 0;

  return (
    <main className="wrap">
      <header className="masthead">
        <div>
          <h1 className="logo">Presyo</h1>
          <p className="tagline">
            If you send money home, receive it, or get paid in a currency you cannot spend here —
            this is what one unit has been worth, recorded every morning.
          </p>
        </div>
        {lastRun && (
          <p className={`beat beat--${lastRun.status}`}>
            <span className="beat__dot" aria-hidden="true" />
            Last check {lastRun.status === 'success' ? 'succeeded' : 'failed'}
          </p>
        )}
      </header>

      {error && (
        <section className="panel panel--bad">
          <h2 className="panel__title">Cannot reach the data</h2>
          <p className="panel__sub">{error}</p>
        </section>
      )}

      {!data && !error && <p className="loading">Loading rates…</p>}

      {data && data.days === 0 && (
        <section className="panel">
          <h2 className="panel__title">Nothing recorded yet</h2>
          <p className="panel__sub">Run the pipeline once and this page will fill itself in.</p>
        </section>
      )}

      {ready && (
        <>
          <Board latest={data.latest} lastDate={data.lastDate} />
          <p className="coverage">
            <strong>{data.days}</strong> days recorded, without anyone touching it, since{' '}
            {new Date(data.series[0].date).toLocaleDateString('en-PH', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            .
          </p>

          <Converter series={data.series} latest={data.latest} />
          <RateChart series={data.series} latest={data.latest} />
          <WhoItsFor />
          <RunLog runs={runs} />
        </>
      )}

      <section className="panel">
        <h2 className="panel__title">Where these numbers come from</h2>
        <p className="prose">
          A job runs every morning on its own. It fetches the day's rates, checks each one before
          saving it — throwing out dates in the future, feeds that have gone stale, and any value
          outside a sensible range for that currency — then writes to the database using the date
          and the currency as the key, so running it twice changes nothing. Every run is logged,
          including the ones that fail.
        </p>
        <p className="prose">
          <a href="https://github.com/angelinetipa/presyo">See the code and the pipeline on GitHub →</a>
        </p>
      </section>

      <Limits />

      <footer className="foot">
        Rates from open.er-api.com · Built by{' '}
        <a href="https://opal-portfolio.vercel.app">Ma. Angeline Tipa</a>
      </footer>
    </main>
  );
}