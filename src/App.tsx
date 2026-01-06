import React, { useMemo, useState } from 'react';
import { BudgetProvider, useAppState } from '../BudgetContext';
import ExpenseTracker from '../ExpenseTracker';
import IncomeModal from '../IncomeModal';
import { formatCurrencyINR } from '../currency';
import SummaryCards from '../SummaryCards';
import BreakdownPanel from '../BreakdownPanel';
import GoalCalculator from '../GoalCalculator';
import FinancialInsightsPanel from '../FinancialInsightsPanel';
import MonthLifecyclePanel from '../MonthLifecyclePanel';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const Dashboard: React.FC = () => {
  const { income, budget, isHydrated } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayLabel = useMemo(() => formatDate(new Date()), []);
  const dailyQuote = useMemo(() => {
    const quotes = [
      'Budgeting: telling your money where to go instead of wondering where it went.',
      'Your future self called. It wants you to save a little more today.',
      'Spend smart, save steady, and let your money do the heavy lifting.',
      'Small expenses leak boats. Patch the leaks, keep the cash.',
      'Track it, plan it, and watch your savings grow.',
      'Saving money is a lot like dieting: small habits beat big promises.',
      'Every expense is a vote for the life you want.',
    ];
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const dayIndex = dayOfYear % quotes.length;
    return quotes[dayIndex];
  }, []);

  if (!isHydrated) {
    return (
      <div className="app-shell">
        <div className="card card-wide loading-card">
          <h2>Loading dashboard</h2>
          <p className="card-meta">Syncing your latest financial snapshot.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Wealth Guard</p>
          <h1>Financial Command Center</h1>
          <p className="app-quote">{dailyQuote}</p>
        </div>
        <div className="app-date">
          <span>Today</span>
          <strong>{todayLabel}</strong>
        </div>
      </header>

      <section className="dashboard-grid">
        <div className="card card-primary">
          <h2>Safe-to-Spend (Daily)</h2>
          <p className="card-value">{formatCurrencyINR(budget.dailySafeToSpend)}</p>
          <p className="card-meta">Based on current lifestyle balance</p>
        </div>

        <div className="card">
          <h2>Lifestyle Balance</h2>
          <p className="card-value">{formatCurrencyINR(budget.lifestyleBalance)}</p>
          <p className="card-meta">Remaining after fixed, savings, and investments</p>
        </div>

        <div className="card">
          <h2>Monthly Income</h2>
          <p className="card-value">{formatCurrencyINR(income)}</p>
          <p className="card-meta">Advisory totals refresh with every transaction</p>
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
            Update Income
          </button>
        </div>

        <MonthLifecyclePanel />
        <SummaryCards />
        <BreakdownPanel />
        <GoalCalculator />
        <FinancialInsightsPanel />

        <div className="card card-wide">
          <ExpenseTracker />
        </div>
      </section>

      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentIncome={income}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BudgetProvider>
      <Dashboard />
    </BudgetProvider>
  );
};

export default App;
