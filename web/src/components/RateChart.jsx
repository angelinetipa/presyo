// src/components/RateChart.jsx
// One currency at a time, in pesos.
//
// Each currency sits on a very different scale, so they share no axis.
// A selector switches between them. Buttons follow the board order,
// highest peso value first, and the chart starts on USD.
//
// The y axis does not start at zero. The rate moves in a narrow band,
// and a zero baseline would flatten it. The axis is labelled so the
// range is clear.

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { colors } from '../constants/theme';
import { rankCurrencies, defaultCurrency } from '../lib/rank';

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', { day: 'numeric', month: 'short' });

export default function RateChart({ series, latest }) {
  const available = rankCurrencies(latest);
  const [active, setActive] = useState(defaultCurrency(latest));

  const points = series.filter((d) => d[active] != null);
  if (points.length === 0) return null;

  const values = points.map((d) => d[active]);
  const pad = (Math.max(...values) - Math.min(...values)) * 0.15 || 0.01;
  const domain = [Math.min(...values) - pad, Math.max(...values) + pad];
  const move = latest[active]?.sinceStart ?? 0;

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2 className="panel__title">One peso against {active}, day by day</h2>
          <p className="panel__sub">
            {points.length} days recorded · {move >= 0 ? 'up' : 'down'}{' '}
            {Math.abs(move).toFixed(2)}% since collection began
          </p>
        </div>

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
          <LineChart data={points} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={colors.rule} vertical={false} />
            <XAxis
              dataKey="date" tickFormatter={shortDate} minTickGap={38}
              tick={{ fontSize: 11, fill: colors.inkSoft }} stroke={colors.rule}
            />
            <YAxis
              domain={domain} width={58}
              tickFormatter={(v) => v.toFixed(2)}
              tick={{ fontSize: 11, fill: colors.inkSoft }} stroke={colors.rule}
            />
            <Tooltip
              formatter={(v) => [`PHP ${Number(v).toFixed(4)}`, `1 ${active}`]}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}