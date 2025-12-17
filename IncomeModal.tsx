import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../context/BudgetContext';
import { formatCurrencyINR } from '../utils/currency';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome: number;
}

const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, currentIncome }) => {
  const [income, setIncome] = useState(currentIncome.toString());
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Sync local state if the prop changes while the modal is open or being re-rendered
    setIncome(currentIncome.toString());
  }, [currentIncome]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIncome = parseFloat(income);
    if (!isNaN(newIncome) && newIncome >= 0) {
      dispatch({ type: 'SET_INCOME', payload: newIncome });
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Monthly Income</h2>
        <p>
          Your current monthly income is set to{' '}
          <strong>{formatCurrencyINR(currentIncome)}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="income">New Monthly Income (INR)</label>
            <input
              type="number"
              id="income"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g., 50000"
              min="0"
              step="100"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeModal;