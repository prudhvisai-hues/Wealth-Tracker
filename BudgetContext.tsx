import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
} from 'react';
import { Budget, BudgetConfig, calculateBudget, DEFAULT_BUDGET_CONFIG } from './budgetEngine';
import { Expense } from './expenseModel';
import { getMonthlyExpenses } from './breakdownUtils';
import {
  createMonthSnapshot,
  getCurrentMonthKey,
  getExpenseMonthKey,
  getNextMonthKey,
  isMonthCompleted,
} from './monthService';
import { MonthSnapshot } from './monthModel';
import storageService from './storageService';

interface CoreAppState {
  income: number;
  config: BudgetConfig;
  budget: Budget;
  expenses: Expense[];
  currentMonth: string;
  completedMonths: string[];
  snapshots: MonthSnapshot[];
  carryoverBalance: number;
}

interface AppState extends CoreAppState {
  isHydrated: boolean;
}

type Action =
  | { type: 'SET_INCOME'; payload: number }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'RECALCULATE_BUDGET' }
  | { type: 'COMPLETE_MONTH' }
  | { type: 'RESET_APP' };

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

const STORAGE_KEY = 'appState';

const getDefaultState = (): CoreAppState => {
  const initialIncome = 0;
  const currentMonth = getCurrentMonthKey();
  return {
    income: initialIncome,
    config: DEFAULT_BUDGET_CONFIG,
    expenses: [],
    currentMonth,
    completedMonths: [],
    snapshots: [],
    carryoverBalance: 0,
    budget: calculateBudget(initialIncome, DEFAULT_BUDGET_CONFIG, [], 0),
  };
};

const getInitialState = (): CoreAppState => {
  const savedState = storageService.get<CoreAppState>(STORAGE_KEY);
  if (savedState) {
    const defaults = getDefaultState();
    const savedIncome = savedState.income ?? defaults.income;
    const savedConfig = savedState.config ?? defaults.config;
    const savedExpenses = savedState.expenses ?? defaults.expenses;
    const currentMonth = savedState.currentMonth ?? defaults.currentMonth;
    const completedMonths = savedState.completedMonths ?? defaults.completedMonths;
    const snapshots = savedState.snapshots ?? defaults.snapshots;
    const carryoverBalance = savedState.carryoverBalance ?? defaults.carryoverBalance;

    // Recalculate budget on load to account for date changes (remaining days)
    const monthlyExpenses = getMonthlyExpenses(savedExpenses, currentMonth);
    const freshBudget = calculateBudget(
      savedIncome,
      savedConfig,
      monthlyExpenses,
      carryoverBalance
    );
    return {
      ...defaults,
      income: savedIncome,
      config: savedConfig,
      expenses: savedExpenses,
      currentMonth,
      completedMonths,
      snapshots,
      carryoverBalance,
      budget: freshBudget,
    };
  }

  return getDefaultState();
};

const recalculateBudget = (state: CoreAppState): CoreAppState => {
  const monthlyExpenses = getMonthlyExpenses(state.expenses, state.currentMonth);
  return {
    ...state,
    budget: calculateBudget(
      state.income,
      state.config,
      monthlyExpenses,
      state.carryoverBalance
    ),
  };
};

const appReducer = (state: CoreAppState, action: Action): CoreAppState => {
  switch (action.type) {
    case 'SET_INCOME': {
      const newIncome = action.payload;
      return recalculateBudget({ ...state, income: newIncome });
    }
    case 'ADD_EXPENSE': {
      const expenseMonth = getExpenseMonthKey(action.payload);
      if (isMonthCompleted(expenseMonth, state.completedMonths)) {
        return state;
      }

      const updatedExpenses = [action.payload, ...state.expenses];
      return recalculateBudget({ ...state, expenses: updatedExpenses });
    }
    case 'DELETE_EXPENSE': {
      const expenseToDelete = state.expenses.find(
        (expense) => expense.id === action.payload
      );
      if (expenseToDelete && isMonthCompleted(getExpenseMonthKey(expenseToDelete), state.completedMonths)) {
        return state;
      }

      const updatedExpenses = state.expenses.filter(
        (expense) => expense.id !== action.payload
      );
      return recalculateBudget({ ...state, expenses: updatedExpenses });
    }
    case 'RECALCULATE_BUDGET': {
      // Recalculate with existing income and config, useful for date changes
      return recalculateBudget(state);
    }
    case 'COMPLETE_MONTH': {
      if (isMonthCompleted(state.currentMonth, state.completedMonths)) {
        return state;
      }

      const snapshot = createMonthSnapshot({
        month: state.currentMonth,
        income: state.income,
        expenses: state.expenses,
      });
      const nextMonth = getNextMonthKey(state.currentMonth);
      const carryoverBalance = state.carryoverBalance + snapshot.savings;

      return recalculateBudget({
        ...state,
        currentMonth: nextMonth,
        completedMonths: [...state.completedMonths, state.currentMonth],
        snapshots: [snapshot, ...state.snapshots],
        carryoverBalance,
      });
    }
    case 'RESET_APP': {
      return getDefaultState();
    }
    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  }
};

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Persist state to localStorage whenever it changes
    storageService.set(STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsHydrated(true), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      // Recalculate budget when tab becomes active again
      dispatch({ type: 'RECALCULATE_BUDGET' });
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <AppStateContext.Provider value={{ ...state, isHydrated }}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a BudgetProvider');
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within a BudgetProvider');
  }
  return context;
};
