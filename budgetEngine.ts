import { formatCurrencyINR } from '../utils/currency';

export interface BudgetConfig {
  fixedExpensesPercentage: number; // e.g., 0.50 for 50%
  savingsPercentage: number; // e.g., 0.15 for 15%
  investmentPercentage: number; // e.g., 0.05 for 5%
}

export interface Budget {
  monthlyIncome: number;
  fixedExpenses: number;
  plannedSavings: number;
  investmentAllocation: number;
  lifestyleBalance: number;
  dailySafeToSpend: number;
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  fixedExpensesPercentage: 0.5,
  savingsPercentage: 0.15,
  investmentPercentage: 0.05,
};

/**
 * Calculates the number of days remaining in the current month.
 */
const getRemainingDaysInMonth = (): number => {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
  return Math.max(remainingDays, 1); // Ensure at least 1 day to avoid division by zero
};

/**
 * Calculates all budget values based on monthly income and configuration.
 * @param monthlyIncome The total monthly income.
 * @param config The budget allocation percentages.
 * @returns A Budget object with all calculated financial metrics.
 */
export const calculateBudget = (
  monthlyIncome: number,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG
): Budget => {
  const fixedExpenses = monthlyIncome * config.fixedExpensesPercentage;
  const plannedSavings = monthlyIncome * config.savingsPercentage;
  const investmentAllocation = monthlyIncome * config.investmentPercentage;

  const lifestyleBalance =
    monthlyIncome - fixedExpenses - plannedSavings - investmentAllocation;

  const remainingDays = getRemainingDaysInMonth();
  const dailySafeToSpend = lifestyleBalance / remainingDays;

  return {
    monthlyIncome,
    fixedExpenses,
    plannedSavings,
    investmentAllocation,
    lifestyleBalance,
    dailySafeToSpend,
  };
};