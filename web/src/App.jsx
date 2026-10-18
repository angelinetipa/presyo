// src/App.jsx
// One dashboard, no tabs. It reads left to right, top to bottom.
//
//   Header         title, last check, and a dot for each recent run
//   Row one        rate board (left), chart (right)
//   Row two        budget split calculator, full width
//   Bottom         slim folds with the reading material
//
// Below 900px wide the columns stack in the same order.

import { useEffect, useState } from 'react';
import { fetchRates, fetchRuns, shape } from './lib/api';
import Board from './components/Board';
import RateChart from './components/RateChart';
import BudgetSplit from './components/BudgetSplit';
import RunDots from './components/RunDots';
import AboutStrip from './components/AboutStrip';
import { formatDay } from './lib/format';

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
            What foreign money is worth in pesos, recorded every morning.
          </p>
        </div>
        {lastRun && (
          <div className="status">
            <p className={`beat beat--${lastRun.status}`}>
              <span className="beat__dot" aria-hidden="true" />
              Last check {lastRun.status === 'success' ? 'succeeded' : 'failed'}
            </p>
            <RunDots runs={runs} />
          </div>
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
        <div className="dash">
          <div className="dash__left">
            <Board latest={data.latest} lastDate={data.lastDate} />
            <p className="coverage">
              <strong>{data.days}</strong> days recorded, without anyone touching it, since{' '}
              {formatDay(data.series[0].date, 'long')}
              .
            </p>
          </div>

          <div className="dash__right">
            <RateChart series={data.series} latest={data.latest} />
          </div>

          <div className="dash__wide">
            <BudgetSplit series={data.series} latest={data.latest} lastDate={data.lastDate} />
          </div>
        </div>
      )}

      <AboutStrip
        runs={runs}
        days={data?.days ?? 0}
        since={data?.days ? formatDay(data.series[0].date, 'long') : ''}
      />

      <footer className="foot">
        Rates from open.er-api.com · Built by{' '}
        <a href="https://opal-portfolio.vercel.app">Ma. Angeline Tipa</a>
      </footer>
    </main>
  );
}