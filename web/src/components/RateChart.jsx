// src/components/RateChart.jsx
// One currency at a time, in pesos, with the finding written as the title.
//
// Reading order: headline, context line, currency switch, chart, note.
//
// Declutter rules applied here:
//   no gridlines, no tick marks, no legend
//   the low, the high, and today are labelled on the line itself
//   the y axis does not start at zero, and a note says so
//
// Each currency sits on a very different scale, so they share no axis.
// Buttons follow the board order, highest peso value first, and the
// chart starts on USD.

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { colors } from '../constants/theme';
import { rankCurrencies, defaultCurrency } from '../lib/rank';
import { formatDay } from '../lib/format';

const PESO = '₱';
const SHORT_RECORD = 30; // below this many days, the page says it is too early to call a trend

// Dates are plain days, so they are formatted in UTC. See lib/format.js.
const shortDate = (iso) => formatDay(iso);

// Values under 1 (such as JPY) need more decimals to be readable.
const fmt = (v) => (v < 1 ? v.toFixed(4) : v.toFixed(2));
const fmtAxis = (v) => (v < 1 ? v.toFixed(3) : v.toFixed(2));

function headline(currency, now, move, since) {
  const base = `One ${currency} is ${PESO}${fmt(now)}`;
  if (move == null) return base;
  if (Math.abs(move) < 0.05) return `${base}, about the same as on ${since}`;
  return `${base}, ${move > 0 ? 'up' : 'down'} ${Math.abs(move).toFixed(2)}% since ${since}`;
}

export default function RateChart({ series, latest }) {
  const available = rankCurrencies(latest);
  const [active, setActive] = useState(defaultCurrency(latest));

  const points = series.filter((d) => d[active] != null);
  if (points.length === 0) return null;

  const values = points.map((d) => d[active]);
  const first = points[0];
  const last = points[points.length - 1];
  const low = points.reduce((m, p) => (p[active] < m[active] ? p : m), first);
  const high = points.reduce((m, p) => (p[active] > m[active] ? p : m), first);

  const pad = (high[active] - low[active]) * 0.15 || 0.01;
  const domain = [low[active] - pad, high[active] + pad];

  const since = shortDate(first.date);
  const move = points.length > 1 ? latest[active]?.sinceStart ?? null : null;
  const early = points.length < SHORT_RECORD;

  // Label the low and the high only when they are real points of interest:
  // not when the line is flat, and not when they sit within a few days of
  // today, where the label would crowd the amber dot.
  const spread = low[active] !== high[active];
  const lastIndex = points.length - 1;
  const farFromToday = (point) => lastIndex - points.indexOf(point) >= 3;
  const marks = [];
  if (spread && farFromToday(low)) marks.push({ key: 'low', point: low, text: `Low ${fmt(low[active])}`, position: 'bottom', fill: colors.down });
  if (spread && farFromToday(high)) marks.push({ key: 'high', point: high, text: `High ${fmt(high[active])}`, position: 'top', fill: colors.up });

  return (
    <section className="panel">
      <h2 className="panel__title">{headline(active, last[active], move, since)}</h2>
      <p className="panel__sub">
        {early
          ? `Only ${points.length} days recorded for ${active}, since ${since}. Too early to call a trend.`
          : `${points.length} days recorded for ${active}, since ${since}.`}
      </p>

      <div className="panel__head" style={{ marginTop: '0.9rem' }}>
        <div className="switch" role="group" aria-label="Choose a currency">
          {available.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              aria-pressed={c === active}
              className={c === active ? 'switch__btn switch__btn--on' : 'switch__btn'}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="chart__box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 22, right: 48, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="date" tickFormatter={shortDate} minTickGap={42}
              tick={{ fontSize: 11, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.rule }} tickLine={false}
            />
            <YAxis
              domain={domain} width={48} tickCount={4}
              tickFormatter={fmtAxis}
              tick={{ fontSize: 11, fill: colors.inkSoft }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${PESO}${Number(v).toFixed(4)}`, `1 ${active}`]}
              labelFormatter={shortDate}
              contentStyle={{
                border: `1px solid ${colors.rule}`, borderRadius: 10,
                fontSize: 12, fontFamily: 'IBM Plex Mono, monospace',
              }}
            />
            <Line
              type="monotone" dataKey={active}
              stroke={colors.ink} strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: colors.digit, stroke: colors.ink, strokeWidth: 2 }}
            />

            {marks.map((m) => (
              <ReferenceDot
                key={m.key} x={m.point.date} y={m.point[active]} r={4.5}
                fill={m.fill} stroke={colors.ink} strokeWidth={1.5} isFront
                label={{ value: m.text, position: m.position, fontSize: 11, fill: colors.ink }}
              />
            ))}

            <ReferenceDot
              x={last.date} y={last[active]} r={5}
              fill={colors.digit} stroke={colors.ink} strokeWidth={2} isFront
              label={{ value: fmt(last[active]), position: 'right', fontSize: 11, fontWeight: 600, fill: colors.ink }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="panel__sub">
        The amber dot is today. Up means one {active} buys more pesos. The scale does not
        start at zero, so small moves look bigger than they are.
      </p>
    </section>
  );
}