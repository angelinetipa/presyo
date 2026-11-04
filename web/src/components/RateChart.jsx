// src/components/RateChart.jsx
// One currency at a time, in pesos.
//
// The selected currency is held by the page (see App.jsx), so the KPI
// tiles and the chart always show the same currency.
//
// Reading order: title and currency switch, chart, with the reading notes
// in the info button. The finding (today, change, range) is in the tiles.
//
// Declutter rules applied here:
//   no gridlines, no tick marks, no legend
//   the low, the high, and today are labelled on the line itself
//   the y axis does not start at zero, and the info button says so
//
// Each currency sits on a very different scale, so they share no axis.
// Buttons follow the board order, highest peso value first.

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { colors } from '../constants/theme';
import { rankCurrencies } from '../lib/rank';
import { formatDay } from '../lib/format';
import InfoTip from './InfoTip';

const PESO = '₱';
const SHORT_RECORD = 30; // below this many days, the page says it is too early to call a trend

// Dates are plain days, so they are formatted in UTC. See lib/format.js.
const shortDate = (iso) => formatDay(iso);

// Values under 1 (such as JPY) need more decimals to be readable.
const fmt = (v) => (v < 1 ? v.toFixed(4) : v.toFixed(2));
const fmtAxis = (v) => (v < 1 ? v.toFixed(3) : v.toFixed(2));

export default function RateChart({ series, latest, currency, onCurrency }) {
  const available = rankCurrencies(latest);
  const active = currency;

  const points = series.filter((d) => d[active] != null);
  if (points.length === 0) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const low = points.reduce((m, p) => (p[active] < m[active] ? p : m), first);
  const high = points.reduce((m, p) => (p[active] > m[active] ? p : m), first);

  const pad = (high[active] - low[active]) * 0.15 || 0.01;
  const domain = [low[active] - pad, high[active] + pad];

  const since = shortDate(first.date);
  const early = points.length < SHORT_RECORD;

  // Label the low and the high only when they are real points of interest:
  // not when the line is flat, and not when they sit within a few days of
  // today, where the label would crowd the amber dot.
  const spread = low[active] !== high[active];
  const lastIndex = points.length - 1;
  const farFromToday = (point) => lastIndex - points.indexOf(point) >= 3;
  const marks = [];
  // The low label sits beside its dot, toward the middle of the chart, so it
  // does not run into the y axis numbers or the date labels.
  const lowSide = points.indexOf(low) < points.length / 2 ? 'right' : 'left';
  if (spread && farFromToday(low)) marks.push({ key: 'low', point: low, text: `Low ${fmt(low[active])}`, position: lowSide, fill: colors.down });
  if (spread && farFromToday(high)) marks.push({ key: 'high', point: high, text: `High ${fmt(high[active])}`, position: 'top', fill: colors.up });

  return (
    <section className="panel chart">
      <div className="chart__head">
        <h2 className="panel__title">One {active} in pesos</h2>
        <div className="chart__tools">
          <div className="switch" role="group" aria-label="Choose a currency">
            {available.map((c) => (
              <button
                key={c}
                onClick={() => onCurrency(c)}
                aria-pressed={c === active}
                className={c === active ? 'switch__btn switch__btn--on' : 'switch__btn'}
              >
                {c}
              </button>
            ))}
          </div>
          <InfoTip label="How to read this chart">
            The amber dot is today. Up means one {active} buys more pesos. The scale does not
            start at zero, so small moves look bigger than they are.
          </InfoTip>
        </div>
      </div>

      {early && (
        <p className="panel__sub chart__early">
          Only {points.length} days recorded for {active}, since {since}. Too early to call a trend.
        </p>
      )}

      <div className="chart__box">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 18, right: 44, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date" tickFormatter={shortDate} minTickGap={42}
              tick={{ fontSize: 11, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.rule }} tickLine={false}
            />
            <YAxis
              domain={domain} width={48} tickCount={3}
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
    </section>
  );
}