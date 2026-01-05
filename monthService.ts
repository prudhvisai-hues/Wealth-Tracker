import { Expense } from './expenseModel';
import { getMonthlyExpenses, getTotalSpent } from './breakdownUtils';
import { MonthSnapshot } from './monthModel';

const padMonth = (month: number) => `${month}`.padStart(2, '0');

export const getMonthKeyFromDate = (date: Date): string => {
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}`;
};

export const getMonthKeyFromDateString = (dateString: string): string => {
  const parsed = new Date(`${dateString}T00:00:00`);
  if (!Number.isNaN(parsed.getTime())) {
    return getMonthKeyFromDate(parsed);
  }

  const fallback = new Date(dateString);
  if (!Number.isNaN(fallback.getTime())) {
    return getMonthKeyFromDate(fallback);
  }

  return getMonthKeyFromDate(new Date());
};

export const getCurrentMonthKey = (today: Date = new Date()): string => {
  return getMonthKeyFromDate(today);
};

export const getNextMonthKey = (monthKey: string): string => {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return getCurrentMonthKey();
  }

  const next = new Date(year, month, 1);
  return getMonthKeyFromDate(next);
};

export const getMonthLabel = (monthKey: string): string => {
  const [yearPart, monthPart] = monthKey.split('-');
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }

  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    date
  );
};

export const getExpenseMonthKey = (expense: Expense): string => {
  return getMonthKeyFromDateString(expense.date || expense.createdAt);
};

export const isMonthCompleted = (monthKey: string, completedMonths: string[]): boolean =>
  completedMonths.includes(monthKey);

export const isExpenseLocked = (expense: Expense, completedMonths: string[]): boolean => {
  return isMonthCompleted(getExpenseMonthKey(expense), completedMonths);
};

export const createMonthSnapshot = (params: {
  month: string;
  income: number;
  expenses: Expense[];
}): MonthSnapshot => {
  const { month, income, expenses } = params;
  const monthlyExpenses = getMonthlyExpenses(expenses, month);
  const totalSpent = getTotalSpent(monthlyExpenses);
  const savings = income - totalSpent;

  return {
    month,
    income,
    totalSpent,
    savings,
    completedAt: new Date().toISOString(),
  };
};
