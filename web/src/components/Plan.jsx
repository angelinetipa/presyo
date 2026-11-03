// src/components/Plan.jsx
// The planning section. It holds the budget settings once, so every panel
// in this section reads and changes the same budget.
//
// The budget split is on top. The savings calculator sits right under it,
// because its monthly amount is the Savings row of that budget.

import useBudget from '../hooks/useBudget';
import BudgetSplit from './BudgetSplit';
import SavingsCalc from './SavingsCalc';
import './Plan.css';

export default function Plan({ series, latest, lastDate }) {
  const budget = useBudget(latest);

  return (
    <div className="plan">
      <BudgetSplit budget={budget} series={series} lastDate={lastDate} />
      <SavingsCalc budget={budget} />
    </div>
  );
}