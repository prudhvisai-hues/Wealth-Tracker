import React, { useEffect, useMemo, useState } from 'react';
import { useAppState } from './BudgetContext';
import { formatCurrencyINR } from './currency';
import storageService from './storageService';

interface GoalState {
  goalName: string;
  totalCost: string;
  targetMonths: string;
}

const GOAL_STORAGE_KEY = 'goalCalculator';

const getStatus = (
  monthlySurplus: number,
  requiredMonthly: number
): { tone: 'positive' | 'warning'; label: string } => {
  if (requiredMonthly <= 0) {
    return { tone: 'warning', label: 'Add a goal cost and timeline to continue.' };
  }

  if (monthlySurplus >= requiredMonthly) {
    return { tone: 'positive', label: 'On track with current surplus.' };
  }

  return { tone: 'warning', label: 'Goal exceeds current surplus.' };
};

const GoalCalculator: React.FC = () => {
  const { budget } = useAppState();
  const [goalName, setGoalName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [targetMonths, setTargetMonths] = useState('');

  useEffect(() => {
    const saved = storageService.get<GoalState>(GOAL_STORAGE_KEY);
    if (saved) {
      setGoalName(saved.goalName ?? '');
      setTotalCost(saved.totalCost ?? '');
      setTargetMonths(saved.targetMonths ?? '');
    }
  }, []);

  useEffect(() => {
    const payload: GoalState = { goalName, totalCost, targetMonths };
    storageService.set(GOAL_STORAGE_KEY, payload);
  }, [goalName, totalCost, targetMonths]);

  const requiredMonthly = useMemo(() => {
    const cost = Number.parseFloat(totalCost);
    const months = Number.parseFloat(targetMonths);

    if (!Number.isFinite(cost) || !Number.isFinite(months) || cost <= 0 || months <= 0) {
      return 0;
    }

    return cost / months;
  }, [totalCost, targetMonths]);

  const monthlySurplus = Math.max(budget.lifestyleBalance, 0);
  const remainingBuffer = monthlySurplus - requiredMonthly;
  const status = getStatus(monthlySurplus, requiredMonthly);

  return (
    <div className="card card-wide goal-card">
      <div className="card-header">
        <h2>Goal Calculator</h2>
        <p className="card-meta">Advisory projection · Updates automatically</p>
      </div>
      <div className="goal-grid">
        <div className="goal-form">
          <div className="form-group">
            <label htmlFor="goal-name">Goal name</label>
            <input
              id="goal-name"
              type="text"
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="e.g., New laptop"
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-cost">Total cost (INR)</label>
            <input
              id="goal-cost"
              type="number"
              min="0"
              step="100"
              value={totalCost}
              onChange={(event) => setTotalCost(event.target.value)}
              placeholder="e.g., 85000"
            />
          </div>
          <div className="form-group">
            <label htmlFor="goal-months">Target months</label>
            <input
              id="goal-months"
              type="number"
              min="1"
              step="1"
              value={targetMonths}
              onChange={(event) => setTargetMonths(event.target.value)}
              placeholder="e.g., 6"
            />
          </div>
        </div>

        <div className="goal-results">
          <h3>{goalName.trim() || 'Goal summary'}</h3>
          <div className="goal-row">
            <span>Required monthly savings</span>
            <strong>{formatCurrencyINR(requiredMonthly)}</strong>
          </div>
          <div className="goal-row">
            <span>Current monthly surplus</span>
            <strong>{formatCurrencyINR(monthlySurplus)}</strong>
          </div>
          <div className="goal-row">
            <span>Remaining buffer</span>
            <strong>{formatCurrencyINR(remainingBuffer)}</strong>
          </div>
          <div className={`goal-status goal-status-${status.tone}`}>
            {status.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalCalculator;
