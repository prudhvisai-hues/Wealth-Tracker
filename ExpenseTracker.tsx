import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from './BudgetContext';
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  createExpenseId,
  sortExpensesByRecent,
} from './expenseModel';
import { formatCurrencyINR } from './currency';
import {
  getMonthKeyFromDateString,
  isExpenseLocked,
  isMonthCompleted,
} from './monthService';
import { validateAmount, validateDate, validateRequiredText } from './validationUtils';

const getToday = () => new Date().toISOString().slice(0, 10);

const ExpenseTracker: React.FC = () => {
  const { expenses, completedMonths } = useAppState();
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Lifestyle');
  const [date, setDate] = useState(getToday());
  const [error, setError] = useState<string | null>(null);

  const recentExpenses = useMemo(
    () => sortExpensesByRecent(expenses),
    [expenses]
  );

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Lifestyle');
    setDate(getToday());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const descriptionResult = validateRequiredText(description, 'short description');
    if (descriptionResult.error) {
      setError(descriptionResult.error);
      return;
    }

    const amountResult = validateAmount(amount, { min: 0.01 });
    if (amountResult.error) {
      setError(amountResult.error);
      return;
    }

    const dateResult = validateDate(date);
    if (dateResult.error) {
      setError(dateResult.error);
      return;
    }

    const expenseMonth = getMonthKeyFromDateString(dateResult.value);
    if (isMonthCompleted(expenseMonth, completedMonths)) {
      setError('This month is closed. Choose a date in an open month.');
      return;
    }

    const newExpense: Expense = {
      id: createExpenseId(),
      amount: amountResult.value,
      description: descriptionResult.value,
      category,
      date: dateResult.value,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    resetForm();
  };

  const handleDelete = (expenseId: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
  };

  return (
    <section className="expense-tracker">
      <div className="expense-form">
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="expense-amount">Amount</label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g., 2500"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-description">Description</label>
            <input
              id="expense-description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Add Expense
          </button>
        </form>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentExpenses.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <ul className="activity-list">
            {recentExpenses.map((expense) => {
              const isLocked = isExpenseLocked(expense, completedMonths);
              return (
                <li key={expense.id} className="activity-item">
                  <div className="activity-main">
                    <span className="activity-description">{expense.description}</span>
                    <span className="activity-meta">
                      {expense.category} ? {expense.date}
                    </span>
                    {isLocked && <span className="lock-badge">Locked</span>}
                  </div>
                  <div className="activity-actions">
                    <span className="activity-amount">
                      {formatCurrencyINR(expense.amount)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDelete(expense.id)}
                      disabled={isLocked}
                      title={
                        isLocked
                          ? 'Completed months cannot be edited.'
                          : 'Delete this transaction.'
                      }
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ExpenseTracker;
