// src/hooks/useBudget.js
// Holds the budget settings and everything worked out from them, so more
// than one panel can read and change the same budget.
//
// What it keeps
//   settings   the income currency, the income and the rows. Saved in this
//              browser (see lib/budgetStorage.js).
//   rateText   the rate as typed. null means "use today's rate". It is not
//              saved, so tomorrow always starts from the new day's rate.
//   balanceId  the row that last filled itself. See rebalance in lib/split.js.
//
// What it gives back
//   the settings, the rate, the split result, the Savings link, and one
//   function for each change a person can make.
//
// Every change that can break the total goes through rebalance, so the
// balancing row refills itself. Name edits and locks cannot change the total.
//
// Changing the income currency keeps every number as typed. An amount of
// 300 in the income currency stays 300, and only the label changes.
//
// The Savings link is in lib/savingsLink.js. savings is the Savings row as a
// monthly peso amount, or null. changeSavings sets that amount in pesos.

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_INCOME, DEFAULT_ROWS } from '../constants/budget';
import { rankCurrencies, defaultCurrency } from '../lib/rank';
import { rebalance, computeSplit, makeRow, parseAmount } from '../lib/split';
import { savingsFromBudget, applySavings } from '../lib/savingsLink';
import { loadSettings, saveSettings, clearSettings } from '../lib/budgetStorage';

export default function useBudget(latest) {
  const available = rankCurrencies(latest);
  const fallback = defaultCurrency(latest);

  const [settings, setSettings] = useState(() => loadSettings(available, fallback));
  const [rateText, setRateText] = useState(null); // null means "use today's rate"
  const [balanceId, setBalanceId] = useState(null); // the row that last filled itself

  const { currency, income, rows } = settings;
  const today = latest[currency]?.value ?? 0;
  // The field shows four decimals. The maths uses the full stored rate until
  // the person types their own. The exact value is in the field's hover title.
  const rateShown = rateText ?? (today ? today.toFixed(4) : '');
  const edited = rateText !== null && parseAmount(rateText) !== today;
  const rate = rateText === null ? today : parseAmount(rateText);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const result = useMemo(() => computeSplit({ total: income, rate, rows }), [income, rate, rows]);
  const savings = useMemo(() => savingsFromBudget({ rows, income, rate }), [rows, income, rate]);

  // Remember which row filled itself last. Later edits balance against it.
  useEffect(() => {
    if (result.autoId) setBalanceId(result.autoId);
  }, [result.autoId]);

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const keepBalanced = (nextRows, next = {}, editedId = null) => rebalance({
    rows: nextRows,
    total: next.income ?? income,
    rate: next.rate ?? rate,
    editedId,
    balanceId,
  });

  function changeRow(id, patch) {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    const touchesAmount = 'value' in patch || 'unit' in patch; // a lock or a name cannot break the total
    update({ rows: touchesAmount ? keepBalanced(next, {}, id) : next });
  }

  function changeIncome(text) {
    update({ income: text, rows: keepBalanced(rows, { income: text }) });
  }

  function changeRate(text) {
    setRateText(text);
    update({ rows: keepBalanced(rows, { rate: parseAmount(text) }) });
  }

  function resetRate() {
    setRateText(null);
    update({ rows: keepBalanced(rows, { rate: today }) });
  }

  const removeRow = (id) => update({ rows: rows.filter((r) => r.id !== id) });
  const addRow = () => update({ rows: [...rows, makeRow()] });

  function pickPreset(preset) {
    setBalanceId(null);
    update({
      rows: preset.rows.map(([label, value]) => makeRow({ label, unit: 'percent', value: String(value) })),
    });
  }

  function chooseCurrency(c) {
    setRateText(null);
    update({ currency: c, rows: keepBalanced(rows, { rate: latest[c]?.value ?? 0 }) });
  }

  // Sets the monthly savings in pesos. Another row adjusts to keep the total.
  function changeSavings(php) {
    update({ rows: applySavings({ rows, income, rate, balanceId, php }) });
  }

  function resetAll() {
    clearSettings();
    setRateText(null);
    setSettings({ currency: fallback, income: DEFAULT_INCOME, rows: DEFAULT_ROWS });
  }

  return {
    available, currency, income, rows,
    rate, rateShown, edited, today,
    result, savings,
    changeRow, changeIncome, changeRate, resetRate,
    removeRow, addRow, pickPreset, chooseCurrency, changeSavings, resetAll,
  };
}