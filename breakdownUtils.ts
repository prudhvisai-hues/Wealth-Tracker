import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  BudgetBucket,
  getBudgetBucketForCategory,
} from './expenseModel';

const parseExpenseDate = (expense: Expense): Date => {
  const fallback = new Date(expense.createdAt);
  if (!expense.date) return fallback;
  const parsed = new Date(`${expense.date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const isSameMonth = (date: Date, reference: Date): boolean => {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
};

export const getMonthlyExpenses = (
  expenses: Expense[],
  referenceDate: Date = new Date()
): Expense[] => {
  return expenses.filter((expense) => isSameMonth(parseExpenseDate(expense), referenceDate));
};

export const getCategoryTotals = (expenses: Expense[]) => {
  const totals = EXPENSE_CATEGORIES.reduce<Record<ExpenseCategory, number>>(
    (acc, category) => {
      acc[category] = 0;
      return acc;
    },
    {} as Record<ExpenseCategory, number>
  );

  expenses.forEach((expense) => {
    totals[expense.category] += expense.amount;
  });

  return totals;
};

export const getBucketTotals = (expenses: Expense[]) => {
  return expenses.reduce<Record<BudgetBucket, number>>(
    (acc, expense) => {
      const bucket = getBudgetBucketForCategory(expense.category);
      acc[bucket] += expense.amount;
      return acc;
    },
    {
      fixedExpenses: 0,
      plannedSavings: 0,
      investmentAllocation: 0,
      lifestyleBalance: 0,
    }
  );
};

export const getTotalSpent = (expenses: Expense[]): number =>
  expenses.reduce((sum, expense) => sum + expense.amount, 0);

export const toPercent = (amount: number, total: number): number => {
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return (amount / total) * 100;
};
