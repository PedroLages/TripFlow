/**
 * Partial Payment Modal
 *
 * Interface for recording partial payments towards split expenses
 */

import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, MessageSquare, Plus, History } from 'lucide-react';
import type { ExpenseSplit } from '../../types';
import {
  calculatePaymentProgress,
  addPartialPayment,
  validatePaymentAmount,
  suggestInstallmentSchedule,
  formatPaymentHistory,
} from '../../utils/partialPaymentHelpers';
import { formatCurrency } from '../../utils/currencyHelpers';
import { PaymentProgressBar } from '../PaymentProgressBar';

interface PartialPaymentModalProps {
  split: ExpenseSplit;
  currency?: string;
  onPayment: (updatedSplit: ExpenseSplit) => void;
  onClose: () => void;
}

export default function PartialPaymentModal({
  split,
  currency = 'USD',
  onPayment,
  onClose,
}: PartialPaymentModalProps) {
  const progress = calculatePaymentProgress(split);

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('card');
  const [error, setError] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  // Get installment suggestions
  const suggestions = suggestInstallmentSchedule(progress.amountRemaining, 3);

  const handleAmountChange = (value: string) => {
    setPaymentAmount(value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount);

    // Validate amount
    const validation = validatePaymentAmount(split, amount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid payment amount');
      return;
    }

    try {
      // Add payment
      const updatedSplit = addPartialPayment(
        split,
        amount,
        paymentNotes.trim() || undefined,
        paymentMethod
      );

      // Call onPayment callback
      onPayment(updatedSplit);

      // Close modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment');
    }
  };

  const formattedHistory = formatPaymentHistory(split.paymentHistory || []);

  return (
    <div className="fixed top-20 left-0 right-0 bottom-20 md:bottom-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between rounded-t-[2.5rem]">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              Record Payment
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add a partial or full payment towards this expense
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Payment Progress */}
          <PaymentProgressBar split={split} currency={currency} showDetails={true} />

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Payment Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={progress.amountRemaining}
                  value={paymentAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={`Max: ${progress.amountRemaining.toFixed(2)}`}
                  className={`w-full p-5 pl-14 bg-gray-50 dark:bg-slate-950 border-2 rounded-[1.5rem] font-bold outline-none transition-all dark:text-white ${
                    error ? 'border-red-500' : 'border-transparent focus:border-brand-primary'
                  }`}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {error}
                </p>
              )}

              {/* Quick Amount Suggestions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Quick amounts:</span>
                {suggestions.map((amt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAmountChange(amt.toString())}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-brand-primary hover:text-white transition-colors"
                  >
                    {formatCurrency(amt, currency)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAmountChange(progress.amountRemaining.toString())}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                >
                  Pay in Full
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(['card', 'cash', 'transfer', 'other'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-2xl font-bold text-sm capitalize transition-all ${
                      paymentMethod === method
                        ? 'bg-brand-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {method === 'card' && <CreditCard className="w-5 h-5 mx-auto mb-2" />}
                    {method === 'cash' && <DollarSign className="w-5 h-5 mx-auto mb-2" />}
                    {method === 'transfer' && <Plus className="w-5 h-5 mx-auto mb-2" />}
                    {method === 'other' && <Calendar className="w-5 h-5 mx-auto mb-2" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Notes (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-5 top-5 text-gray-400" size={20} />
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  className="w-full p-5 pl-14 bg-gray-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[1.5rem] font-medium outline-none transition-all dark:text-white resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full p-5 bg-brand-primary text-white rounded-[1.5rem] font-bold hover:bg-brand-primary-dark transition-all shadow-lg hover:shadow-xl"
            >
              Record Payment
            </button>
          </form>

          {/* Payment History */}
          {formattedHistory.length > 0 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-brand-primary transition-colors"
              >
                <History size={16} />
                Payment History ({formattedHistory.length})
              </button>

              {showHistory && (
                <div className="space-y-2">
                  {formattedHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {entry.amount}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{entry.method}</span>
                        {entry.notes !== 'No notes' && (
                          <>
                            <span>•</span>
                            <span className="italic">{entry.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
