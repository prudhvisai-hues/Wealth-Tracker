export type ExpenseCategory =
  | 'Fixed Expenses'
  | 'Savings'
  | 'Investments'
  | 'Lifestyle'
  | 'Other';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fixed Expenses',
  'Savings',
  'Investments',
  'Lifestyle',
  'Other',
];

export type BudgetBucket =
  | 'fixedExpenses'
  | 'plannedSavings'
  | 'investmentAllocation'
  | 'lifestyleBalance';

export const getBudgetBucketForCategory = (
  category: ExpenseCategory
): BudgetBucket => {
  switch (category) {
    case 'Fixed Expenses':
      return 'fixedExpenses';
    case 'Savings':
      return 'plannedSavings';
    case 'Investments':
      return 'investmentAllocation';
    case 'Lifestyle':
    case 'Other':
    default:
      return 'lifestyleBalance';
  }
};

export const createExpenseId = (): string =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getExpenseSortTime = (expense: Expense): number => {
  const datePart = expense.date ? `${expense.date}T00:00:00` : expense.createdAt;
  const time = Date.parse(datePart);
  return Number.isNaN(time) ? Date.parse(expense.createdAt) : time;
};

export const sortExpensesByRecent = (expenses: Expense[]): Expense[] =>
  [...expenses].sort((a, b) => getExpenseSortTime(b) - getExpenseSortTime(a));
