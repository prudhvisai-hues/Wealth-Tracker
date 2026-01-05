import React, { useMemo } from 'react';
import { useAppState } from './BudgetContext';
import { formatCurrencyINR } from './currency';
import { getBucketTotals, getMonthlyExpenses, toPercent } from './breakdownUtils';

const SummaryCards: React.FC = () => {
  const { income, config, expenses, currentMonth } = useAppState();

  const monthlyExpenses = useMemo(
    () => getMonthlyExpenses(expenses, currentMonth),
    [expenses, currentMonth]
  );
  const bucketTotals = useMemo(() => getBucketTotals(monthlyExpenses), [monthlyExpenses]);

  const fixedAllocated = income * config.fixedExpensesPercentage;
  const savingsAllocated = income * config.savingsPercentage;
  const investmentsAllocated = income * config.investmentPercentage;
  const lifestyleAllocated =
    income - fixedAllocated - savingsAllocated - investmentsAllocated;

  const investmentSpent = bucketTotals.investmentAllocation;
  const investmentRemaining = investmentsAllocated - investmentSpent;
  const investmentPercent = Math.min(toPercent(investmentSpent, investmentsAllocated), 100);

  const buckets = [
    {
      label: 'Fixed / Bills',
      allocated: fixedAllocated,
      spent: bucketTotals.fixedExpenses,
      tone: 'fixed',
    },
    {
      label: 'Savings',
      allocated: savingsAllocated,
      spent: bucketTotals.plannedSavings,
      tone: 'savings',
    },
    {
      label: 'Lifestyle',
      allocated: lifestyleAllocated,
      spent: bucketTotals.lifestyleBalance,
      tone: 'lifestyle',
    },
  ];

  return (
    <>
      <div className="card card-half">
        <div className="card-header">
          <h2>Bucket Summaries</h2>
          <p className="card-meta">Current month totals</p>
        </div>
        <div className="bucket-list">
          {buckets.map((bucket) => {
            const percent = Math.min(toPercent(bucket.spent, bucket.allocated), 100);
            const remaining = bucket.allocated - bucket.spent;
            return (
              <div key={bucket.label} className="bucket-row">
                <div className="bucket-title">
                  <span>{bucket.label}</span>
                  <span className="bucket-amount">{formatCurrencyINR(bucket.spent)}</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill progress-${bucket.tone}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="bucket-meta">
                  {formatCurrencyINR(Math.max(remaining, 0))} remaining of{' '}
                  {formatCurrencyINR(bucket.allocated)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-half card-accent">
        <div className="card-header">
          <h2>Investment Fund</h2>
          <p className="card-meta">Monthly summary</p>
        </div>
        <p className="card-value">{formatCurrencyINR(investmentSpent)}</p>
        <p className="card-meta">
          {formatCurrencyINR(Math.max(investmentRemaining, 0))} remaining of{' '}
          {formatCurrencyINR(investmentsAllocated)}
        </p>
        <div className="progress-track">
          <div
            className="progress-fill progress-invest"
            style={{ width: `${investmentPercent}%` }}
          />
        </div>
      </div>
    </>
  );
};

export default SummaryCards;
