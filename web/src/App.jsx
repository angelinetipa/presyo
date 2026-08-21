// src/App.jsx
// One page, four blocks: what the peso is worth now, how it moved, how
// the pipeline is behaving, and where the numbers come from.
//
// It reads the same public tables the pipeline writes to, so the page
// cannot show anything the database does not actually contain.

import { useEffect, useState } from 'react';
import { fetchRates, fetchRuns, shape } from './lib/api';
import Board from './components/Board';
import RateChart from './components/RateChart';
import RunLog from './components/RunLog';

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

  return (
    <main className="wrap">
      <header className="masthead">
        <div>
          <h1 className="logo">Presyo</h1>
          <p className="tagline">What the peso is worth, recorded every morning.</p>
        </div>
        {lastRun && (
          <p className={`beat beat--${lastRun.status}`}>
            <span className="beat__dot" aria-hidden="true" />
            Last run {lastRun.status === 'success' ? 'succeeded' : 'failed'}
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
          <p className="panel__sub">
            Run the pipeline once and this page will fill itself in.
          </p>
        </section>
      )}

      {data && data.days > 0 && (
        <>
          <Board latest={data.latest} lastDate={data.lastDate} />
          <p className="coverage">
            <strong>{data.days}</strong> days collected, unattended, since{' '}
            {new Date(data.series[0].date).toLocaleDateString('en-PH', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
            .
          </p>
          <RateChart series={data.series} latest={data.latest} />
          <RunLog runs={runs} />
        </>
      )}

      <section className="panel">
        <h2 className="panel__title">How the numbers get here</h2>
        <p className="prose">
          A scheduled job fetches rates each morning, checks every row before saving it —
          rejecting future dates, stale feeds, and values outside a sane band for that
          currency — then writes to Postgres using the date and currency as the key, so
          re-running it changes nothing. Each run logs what it read, loaded, and rejected.
        </p>
        <p className="prose">
          Rates are indicative, from a public feed. They are not what a bank or remittance
          counter will quote you.
        </p>
        <p className="prose">
          <a href="https://github.com/angelinetipa/presyo">Source and pipeline on GitHub →</a>
        </p>
      </section>

      <footer className="foot">
        Data: open.er-api.com · Built by{' '}
        <a href="https://opal-portfolio.vercel.app">Ma. Angeline Tipa</a>
      </footer>
    </main>
  );
}
