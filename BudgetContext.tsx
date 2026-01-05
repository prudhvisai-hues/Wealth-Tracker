import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Budget, BudgetConfig, calculateBudget, DEFAULT_BUDGET_CONFIG } from './budgetEngine';
import { Expense } from './expenseModel';
import storageService from './storageService';

interface AppState {
  income: number;
  config: BudgetConfig;
  budget: Budget;
  expenses: Expense[];
}

type Action =
  | { type: 'SET_INCOME'; payload: number }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'RECALCULATE_BUDGET' };

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

const STORAGE_KEY = 'appState';

const getInitialState = (): AppState => {
  const savedState = storageService.get<AppState>(STORAGE_KEY);
  if (savedState) {
    const savedIncome = savedState.income ?? 0;
    const savedConfig = savedState.config ?? DEFAULT_BUDGET_CONFIG;
    const savedExpenses = savedState.expenses ?? [];

    // Recalculate budget on load to account for date changes (remaining days)
    const freshBudget = calculateBudget(savedIncome, savedConfig, savedExpenses);
    return {
      ...savedState,
      income: savedIncome,
      config: savedConfig,
      expenses: savedExpenses,
      budget: freshBudget,
    };
  }

  // Default initial state
  const initialIncome = 0;
  return {
    income: initialIncome,
    config: DEFAULT_BUDGET_CONFIG,
    expenses: [],
    budget: calculateBudget(initialIncome, DEFAULT_BUDGET_CONFIG, []),
  };
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INCOME': {
      const newIncome = action.payload;
      const newBudget = calculateBudget(newIncome, state.config, state.expenses);
      return {
        ...state,
        income: newIncome,
        budget: newBudget,
      };
    }
    case 'ADD_EXPENSE': {
      const updatedExpenses = [action.payload, ...state.expenses];
      const newBudget = calculateBudget(state.income, state.config, updatedExpenses);
      return {
        ...state,
        expenses: updatedExpenses,
        budget: newBudget,
      };
    }
    case 'DELETE_EXPENSE': {
      const updatedExpenses = state.expenses.filter(
        (expense) => expense.id !== action.payload
      );
      const newBudget = calculateBudget(state.income, state.config, updatedExpenses);
      return {
        ...state,
        expenses: updatedExpenses,
        budget: newBudget,
      };
    }
    case 'RECALCULATE_BUDGET': {
      // Recalculate with existing income and config, useful for date changes
      const freshBudget = calculateBudget(state.income, state.config, state.expenses);
      return {
        ...state,
        budget: freshBudget,
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  }
};

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    // Persist state to localStorage whenever it changes
    storageService.set(STORAGE_KEY, state);
  }, [state]);

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
    <AppStateContext.Provider value={state}>
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
