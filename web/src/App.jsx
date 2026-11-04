// src/App.jsx
// One dashboard, no tabs. A 12 column grid with a 12px gap.
//
//   Header         title, last check, and a dot for each recent run
//   Row one        rate board (4 columns), then the KPI tiles over the
//                  chart (8 columns)
//   Row two        budget planner (8 columns), savings calculator (4)
//   Row three      pipeline health grid (4 columns), then three slim cards
//                  that open the reading material in a popover (8)
//
// The dark panels, the board and the calculator, sit on one diagonal.
// Below 900px wide every panel takes the full width, in the same order.
//
// The header dots show the newest 6 runs. The tiles and the health grid use
// all the runs that were fetched.
//
// The selected currency is held here, so the KPI tiles and the chart
// always show the same one.

import { useEffect, useState } from 'react';
import { fetchRates, fetchRuns, shape } from './lib/api';
import { defaultCurrency } from './lib/rank';
import Board from './components/Board';
import KpiTiles from './components/KpiTiles';
import RateChart from './components/RateChart';
import Plan from './components/Plan';
import RunDots from './components/RunDots';
import RunGrid from './components/RunGrid';
import AboutCards from './components/AboutCards';
import { formatDay } from './lib/format';

export default function App() {
  const [data, setData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);

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

  // A picked currency that has no data falls back to the default.
  const currency = ready ? (data.latest[picked] ? picked : defaultCurrency(data.latest)) : null;
  const since = ready ? formatDay(data.series[0].date, 'medium') : '';

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
            <RunDots runs={runs.slice(0, 6)} />
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
          <div className="dash__board">
            <Board latest={data.latest} lastDate={data.lastDate} days={data.days} since={since} />
          </div>

          <div className="dash__main">
            <KpiTiles series={data.series} currency={currency} runs={runs} />
            <RateChart
              series={data.series}
              latest={data.latest}
              currency={currency}
              onCurrency={setPicked}
            />
          </div>

          <Plan series={data.series} latest={data.latest} lastDate={data.lastDate} />

          <RunGrid runs={runs} />
          <AboutCards days={data.days} since={formatDay(data.series[0].date, 'long')} />
        </div>
      )}

      <footer className="foot">
        Rates from open.er-api.com · Built by{' '}
        <a href="https://opal-portfolio.vercel.app">Ma. Angeline Tipa</a>
      </footer>
    </main>
  );
}