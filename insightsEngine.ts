import { BudgetConfig } from './budgetEngine';
import { Expense, getBudgetBucketForCategory } from './expenseModel';
import { getMonthlyExpenses, getTotalSpent } from './breakdownUtils';

export type InsightTone = 'neutral' | 'warning' | 'positive';

export interface Insight {
  id: string;
  title: string;
  message: string;
  tone: InsightTone;
}

const DAYS_IN_WEEK = 7;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseExpenseDate = (expense: Expense): Date => {
  const fallback = new Date(expense.createdAt);
  if (!expense.date) return fallback;
  const parsed = new Date(`${expense.date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const sumExpensesInRange = (expenses: Expense[], start: Date, end: Date): number => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return expenses.reduce((sum, expense) => {
    const expenseDate = parseExpenseDate(expense);
    const time = expenseDate.getTime();
    if (time >= startTime && time <= endTime) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
};

const filterLifestyleExpenses = (expenses: Expense[]) =>
  expenses.filter(
    (expense) => getBudgetBucketForCategory(expense.category) === 'lifestyleBalance'
  );

const getWeeklyTrend = (expenses: Expense[], today: Date): number => {
  const endCurrent = startOfDay(today);
  const startCurrent = new Date(endCurrent);
  startCurrent.setDate(startCurrent.getDate() - (DAYS_IN_WEEK - 1));

  const endPrevious = new Date(startCurrent);
  endPrevious.setDate(endPrevious.getDate() - 1);
  const startPrevious = new Date(endPrevious);
  startPrevious.setDate(startPrevious.getDate() - (DAYS_IN_WEEK - 1));

  const currentTotal = sumExpensesInRange(expenses, startCurrent, endCurrent);
  const previousTotal = sumExpensesInRange(expenses, startPrevious, endPrevious);

  if (previousTotal <= 0) {
    return currentTotal > 0 ? 1 : 0;
  }

  return (currentTotal - previousTotal) / previousTotal;
};

export const generateInsights = (params: {
  income: number;
  config: BudgetConfig;
  expenses: Expense[];
  today?: Date;
  referenceMonth?: string;
}): Insight[] => {
  const { income, config, expenses } = params;
  const today = params.today ?? new Date();
  const reference = params.referenceMonth ?? today;
  const monthlyExpenses = getMonthlyExpenses(expenses, reference);
  const lifestyleExpenses = filterLifestyleExpenses(monthlyExpenses);

  const fixedSpent = monthlyExpenses
    .filter((expense) => getBudgetBucketForCategory(expense.category) === 'fixedExpenses')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const lifestyleSpent = lifestyleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const savingsSpent = monthlyExpenses
    .filter((expense) => getBudgetBucketForCategory(expense.category) === 'plannedSavings')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const rentThreshold = income * 0.3;
  const rentRatio = income > 0 ? fixedSpent / income : 0;

  const trend = getWeeklyTrend(lifestyleExpenses, today);

  const savingsAllocated = income * config.savingsPercentage;
  const projectedSavings = Math.max(savingsAllocated - savingsSpent, 0);

  const fixedAllocated = income * config.fixedExpensesPercentage;
  const investmentsAllocated = income * config.investmentPercentage;
  const lifestyleAllocated =
    income - fixedAllocated - savingsAllocated - investmentsAllocated;
  const lifestyleRemaining = lifestyleAllocated - lifestyleSpent;

  const totalSpent = getTotalSpent(monthlyExpenses);

  const budgetHealth: Insight = (() => {
    if (income <= 0) {
      return {
        id: 'budget-health',
        title: 'Budget health status',
        message: 'Add your income to evaluate overall budget health.',
        tone: 'neutral',
      };
    }

    if (lifestyleRemaining < 0) {
      return {
        id: 'budget-health',
        title: 'Budget health status',
        message: 'Lifestyle spending is running over the planned allocation.',
        tone: 'warning',
      };
    }

    if (totalSpent === 0 || lifestyleRemaining > lifestyleAllocated * 0.35) {
      return {
        id: 'budget-health',
        title: 'Budget health status',
        message: 'Spending is comfortably within the monthly plan.',
        tone: 'positive',
      };
    }

    return {
      id: 'budget-health',
      title: 'Budget health status',
      message: 'Spending is close to plan. Monitor remaining lifestyle buffer.',
      tone: 'neutral',
    };
  })();

  const projectedSavingsTone: InsightTone =
    income <= 0 ? 'neutral' : projectedSavings > 0 ? 'positive' : 'warning';

  return [
    {
      id: 'rent-threshold',
      title: 'Rent vs income',
      message:
        income > 0 && fixedSpent > rentThreshold
          ? `Fixed expenses are ${Math.round(rentRatio * 100)}% of income, which is above the 30% rent threshold.`
          : 'Fixed expenses remain within the 30% rent guideline.',
      tone: income > 0 && fixedSpent > rentThreshold ? 'warning' : 'neutral',
    },
    {
      id: 'lifestyle-trend',
      title: 'Lifestyle spending trend',
      message:
        trend > 0.15
          ? 'Lifestyle spending is trending upward versus the prior week.'
          : trend < -0.15
          ? 'Lifestyle spending is easing compared to the prior week.'
          : 'Lifestyle spending is stable week-over-week.',
      tone: trend > 0.15 ? 'warning' : trend < -0.15 ? 'positive' : 'neutral',
    },
    {
      id: 'projected-savings',
      title: 'Projected monthly savings',
      message:
        income > 0
          ? `${Math.round((projectedSavings / income) * 100)}% of income remains for savings this month.`
          : 'Set income to project monthly savings.',
      tone: projectedSavingsTone,
    },
    budgetHealth,
  ];
};
