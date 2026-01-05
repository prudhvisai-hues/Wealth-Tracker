import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from './BudgetContext';
import { formatCurrencyINR } from './currency';
import { getMonthlyExpenses, getTotalSpent } from './breakdownUtils';
import { getMonthLabel, getNextMonthKey, isMonthCompleted } from './monthService';
import storageService from './storageService';

const MonthLifecyclePanel: React.FC = () => {
  const { currentMonth, completedMonths, snapshots, income, expenses, carryoverBalance } =
    useAppState();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  const monthlyExpenses = useMemo(
    () => getMonthlyExpenses(expenses, currentMonth),
    [expenses, currentMonth]
  );
  const totalSpent = useMemo(() => getTotalSpent(monthlyExpenses), [monthlyExpenses]);
  const nextMonth = getNextMonthKey(currentMonth);
  const isLocked = isMonthCompleted(currentMonth, completedMonths);

  const handleCompleteMonth = () => {
    setError(null);
    if (isLocked) {
      setError('This month is already completed.');
      return;
    }

    const confirmed = window.confirm(
      `Complete ${getMonthLabel(currentMonth)}? This will lock transactions and move to ${getMonthLabel(
        nextMonth
      )}.`
    );
    if (!confirmed) return;

    dispatch({ type: 'COMPLETE_MONTH' });
  };

  const handleResetApp = () => {
    setError(null);
    const confirmed = window.confirm(
      'Reset the app? This clears all locally stored data and cannot be undone.'
    );
    if (!confirmed) return;

    storageService.clearAll();
    dispatch({ type: 'RESET_APP' });
  };

  return (
    <div className="card card-wide lifecycle-card">
      <div className="card-header">
        <h2>Month Lifecycle</h2>
        <p className="card-meta">Close the month and roll balances forward</p>
      </div>
      <div className="lifecycle-grid">
        <div className="lifecycle-panel">
          <div className="lifecycle-row">
            <span className="lifecycle-label">Current month</span>
            <strong>{getMonthLabel(currentMonth)}</strong>
          </div>
          <div className="lifecycle-row">
            <span className="lifecycle-label">Income</span>
            <strong>{formatCurrencyINR(income)}</strong>
          </div>
          <div className="lifecycle-row">
            <span className="lifecycle-label">Total spent</span>
            <strong>{formatCurrencyINR(totalSpent)}</strong>
          </div>
          <div className="lifecycle-row">
            <span className="lifecycle-label">Carryover balance</span>
            <strong>{formatCurrencyINR(carryoverBalance)}</strong>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCompleteMonth}
            disabled={isLocked}
          >
            Complete Month
          </button>
        </div>

        <div className="lifecycle-panel lifecycle-secondary">
          <h3>Recent snapshots</h3>
          {snapshots.length === 0 ? (
            <p className="empty-state">No completed months yet.</p>
          ) : (
            <ul className="snapshot-list">
              {snapshots.slice(0, 3).map((snapshot) => (
                <li key={snapshot.month} className="snapshot-item">
                  <div>
                    <p className="snapshot-title">{getMonthLabel(snapshot.month)}</p>
                    <p className="snapshot-meta">
                      Income {formatCurrencyINR(snapshot.income)} · Spent{' '}
                      {formatCurrencyINR(snapshot.totalSpent)}
                    </p>
                  </div>
                  <span className="snapshot-savings">
                    {formatCurrencyINR(snapshot.savings)} saved
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-secondary" onClick={handleResetApp}>
            Reset App
          </button>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default MonthLifecyclePanel;
