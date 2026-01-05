import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from './BudgetContext';
import { formatCurrencyINR } from './currency';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome: number;
}

const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, currentIncome }) => {
  const [income, setIncome] = useState(currentIncome.toString());
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync local state if the prop changes while the modal is open or being re-rendered
    setIncome(currentIncome.toString());
    setError(null); // Reset error when modal is re-opened or income changes
  }, [currentIncome, isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on new submission

    const newIncome = parseFloat(income.trim());
    if (income.trim() !== '' && !isNaN(newIncome) && newIncome >= 0) {
      dispatch({ type: 'SET_INCOME', payload: newIncome });
      onClose();
    } else {
      setError('Please enter a valid, non-negative number for the income.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" ref={modalContentRef}>
        <h2 id="modal-title">Update Monthly Income</h2>
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
            {error && <p className="error-message">{error}</p>}
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