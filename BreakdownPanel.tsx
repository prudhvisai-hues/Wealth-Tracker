import React, { useMemo } from 'react';
import { useAppState } from './BudgetContext';
import { formatCurrencyINR } from './currency';
import {
  getCategoryTotals,
  getMonthlyExpenses,
  getTotalSpent,
  toPercent,
} from './breakdownUtils';
import { EXPENSE_CATEGORIES } from './expenseModel';

const BreakdownPanel: React.FC = () => {
  const { expenses, income } = useAppState();

  const monthlyExpenses = useMemo(() => getMonthlyExpenses(expenses), [expenses]);
  const totals = useMemo(() => getCategoryTotals(monthlyExpenses), [monthlyExpenses]);
  const totalSpent = useMemo(() => getTotalSpent(monthlyExpenses), [monthlyExpenses]);

  return (
    <div className="card card-wide">
      <div className="card-header">
        <h2>Spending Breakdown</h2>
        <p className="card-meta">% of monthly income · Current month</p>
      </div>
      {totalSpent === 0 ? (
        <p className="empty-state">No spending recorded yet this month.</p>
      ) : (
        <ul className="breakdown-list">
          {EXPENSE_CATEGORIES.map((category) => {
            const amount = totals[category];
            const percentOfIncome = toPercent(amount, income);
            return (
              <li key={category} className="breakdown-item">
                <div className="breakdown-row">
                  <div>
                    <p className="breakdown-title">{category}</p>
                    <p className="breakdown-meta">{formatCurrencyINR(amount)}</p>
                  </div>
                  <span className="breakdown-percent">
                    {percentOfIncome.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(percentOfIncome, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BreakdownPanel;
