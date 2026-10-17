// src/App.jsx
// Page layout. A short header, a tab bar, and one panel at a time.
//
//   Rates         the board and the chart, for a quick read
//   Budget split  the calculator (holds the converter until the new one is built)
//   About         who it is for, what it is good for, run log, sources, limits
//
// The active tab is kept in the URL hash, so a refresh stays on the same tab.

import { useEffect, useState } from 'react';
import { fetchRates, fetchRuns, shape } from './lib/api';
import Tabs from './components/Tabs';
import Board from './components/Board';
import Converter from './components/Converter';
import RateChart from './components/RateChart';
import WhoItsFor from './components/WhoItsFor';
import GoodFor from './components/GoodFor';
import RunLog from './components/RunLog';
import Source from './components/Source';
import Limits from './components/Limits';

const TABS = [
  { id: 'rates', label: 'Rates' },
  { id: 'budget', label: 'Budget split' },
  { id: 'about', label: 'About' },
];

const tabFromHash = () => {
  const id = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'rates';
};

export default function App() {
  const [data, setData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(tabFromHash);

  useEffect(() => {
    Promise.all([fetchRates(), fetchRuns()])
      .then(([rates, runRows]) => {
        setData(shape(rates));
        setRuns(runRows);
      })
      .catch((e) => setError(e.message));
  }, []);

  function chooseTab(id) {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  }

  const lastRun = runs[0];
  const ready = data && data.days > 0;

  return (
    <main className="wrap">
      <header className="masthead">
        <div>
          <h1 className="logo">Presyo</h1>
          <p className="tagline">
            If you send money home, receive it, or get paid in a currency you cannot spend here,
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

      <Tabs tabs={TABS} active={tab} onChange={chooseTab} />

      <div
        className="tabpanel"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'rates' && ready && (
          <>
            <Board latest={data.latest} lastDate={data.lastDate} />
            <p className="coverage">
              <strong>{data.days}</strong> days recorded, without anyone touching it, since{' '}
              {new Date(data.series[0].date).toLocaleDateString('en-PH', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
              .
            </p>
            <RateChart series={data.series} latest={data.latest} />
          </>
        )}

        {tab === 'budget' && ready && (
          <Converter series={data.series} latest={data.latest} />
        )}

        {tab === 'about' && (
          <>
            <WhoItsFor />
            <GoodFor />
            <RunLog runs={runs} />
            <Source />
            <Limits />
          </>
        )}
      </div>

      <footer className="foot">
        Rates from open.er-api.com · Built by{' '}
        <a href="https://opal-portfolio.vercel.app">Ma. Angeline Tipa</a>
      </footer>
    </main>
  );
}