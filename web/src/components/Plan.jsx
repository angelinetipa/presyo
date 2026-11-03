// src/components/Plan.jsx
// The planning section. It holds the budget settings once, so every panel
// in this section reads and changes the same budget.

import useBudget from '../hooks/useBudget';
import BudgetSplit from './BudgetSplit';

export default function Plan({ series, latest, lastDate }) {
  const budget = useBudget(latest);

  return <BudgetSplit budget={budget} series={series} lastDate={lastDate} />;
}