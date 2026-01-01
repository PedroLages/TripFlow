/**
 * SplitExpenseModal Component
 *
 * Multi-step modal for creating split expenses.
 * Steps: Amount & Payer → Split Method → Participants → Configure Amounts → Preview & Confirm
 */

import React, { useState, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Users, DollarSign,
  Check, AlertCircle, Calendar, Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Expense, Collaborator, SplitMethod, ExpenseSplit } from '../../types';
import {
  splitEqually,
  splitCustomAmounts,
  splitByPercentages,
  splitByShares,
  validateSplitAmounts
} from '../../utils/expenseSplitCalculations';
import { formatCurrency } from '../../utils/currencyHelpers';

interface SplitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Expense) => void;
  collaborators: Collaborator[];
  ownerEmail: string;
  tripCurrency?: string;
}

type Step = 'amount' | 'method' | 'participants' | 'configure' | 'preview';

const CATEGORY_COLORS: Record<string, string> = {
  'Flights': '#6366f1',
  'Accommodation': '#14b8a6',
  'Food': '#f59e0b',
  'Activities': '#8b5cf6',
  'Transport': '#64748b',
  'Shopping': '#ec4899',
  'Other': '#94a3b8'
};

const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  collaborators,
  ownerEmail,
  tripCurrency = 'USD'
}) => {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>(ownerEmail);
  const [category, setCategory] = useState<string>('Food');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Map<string, string>>(new Map());
  const [percentages, setPercentages] = useState<Map<string, string>>(new Map());
  const [shares, setShares] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string>('');

  // All users (owner + collaborators)
  const allUsers = [
    { email: ownerEmail, avatar: 'https://i.pravatar.cc/150?u=demo', name: 'You' },
    ...collaborators.map(c => ({ email: c.email, avatar: c.avatar, name: c.email.split('@')[0] }))
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('amount');
      setAmount('');
      setError('');
      setSelectedParticipants([]);
      setCustomAmounts(new Map());
      setPercentages(new Map());
      setShares(new Map());
    }
  }, [isOpen]);

  const handleNext = () => {
    setError('');

    if (step === 'amount') {
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      setStep('method');
    } else if (step === 'method') {
      setStep('participants');
    } else if (step === 'participants') {
      if (selectedParticipants.length === 0) {
        setError('Select at least one participant');
        return;
      }
      // Initialize amounts based on method
      if (splitMethod === 'equal') {
        // Skip configure step for equal splits
        setStep('preview');
      } else if (splitMethod === 'custom') {
        const newAmounts = new Map<string, string>();
        selectedParticipants.forEach(p => newAmounts.set(p, '0'));
        setCustomAmounts(newAmounts);
        setStep('configure');
      } else if (splitMethod === 'percentage') {
        const newPercentages = new Map<string, string>();
        selectedParticipants.forEach(p => newPercentages.set(p, '0'));
        setPercentages(newPercentages);
        setStep('configure');
      } else if (splitMethod === 'shares') {
        const newShares = new Map<string, string>();
        selectedParticipants.forEach(p => newShares.set(p, '1'));
        setShares(newShares);
        setStep('configure');
      }
    } else if (step === 'configure') {
      // Validate based on method
      if (splitMethod === 'custom') {
        const total = Array.from(customAmounts.values())
          .reduce((sum, v) => sum + parseFloat(v || '0'), 0);
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          setError(`Custom amounts must sum to $${amount} (currently: $${total.toFixed(2)})`);
          return;
        }
      } else if (splitMethod === 'percentage') {
        const total = Array.from(percentages.values())
          .reduce((sum, v) => sum + parseFloat(v || '0'), 0);
        if (Math.abs(total - 100) > 0.01) {
          setError(`Percentages must sum to 100% (currently: ${total.toFixed(1)}%)`);
          return;
        }
      } else if (splitMethod === 'shares') {
        const hasZero = Array.from(shares.values()).some(v => parseFloat(v || '0') <= 0);
        if (hasZero) {
          setError('All shares must be greater than 0');
          return;
        }
      }
      setStep('preview');
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'method') setStep('amount');
    else if (step === 'participants') setStep('method');
    else if (step === 'configure') setStep('participants');
    else if (step === 'preview') {
      if (splitMethod === 'equal') setStep('participants');
      else setStep('configure');
    }
  };

  const handleSubmit = () => {
    setError('');

    let splits: ExpenseSplit[];
    const totalAmount = parseFloat(amount);

    try {
      if (splitMethod === 'equal') {
        splits = splitEqually(totalAmount, selectedParticipants, paidBy);
      } else if (splitMethod === 'custom') {
        const amountsMap = new Map<string, number>();
        customAmounts.forEach((value, key) => {
          amountsMap.set(key, parseFloat(value || '0'));
        });
        splits = splitCustomAmounts(amountsMap, paidBy);
      } else if (splitMethod === 'percentage') {
        const percentsMap = new Map<string, number>();
        percentages.forEach((value, key) => {
          percentsMap.set(key, parseFloat(value || '0'));
        });
        splits = splitByPercentages(totalAmount, percentsMap, paidBy);
      } else {
        // shares
        const sharesMap = new Map<string, number>();
        shares.forEach((value, key) => {
          sharesMap.set(key, parseFloat(value || '0'));
        });
        splits = splitByShares(totalAmount, sharesMap, paidBy);
      }

      // Validate splits
      if (!validateSplitAmounts(totalAmount, splits)) {
        setError('Split amounts do not match total expense');
        return;
      }

      const expense: Expense = {
        id: uuidv4(),
        amount: totalAmount,
        category: category as any,
        date,
        notes,
        isSplit: true,
        paidBy,
        splitMethod,
        splits,
        currency: tripCurrency
      };

      onSubmit(expense);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create split expense');
    }
  };

  const toggleParticipant = (email: string) => {
    setSelectedParticipants(prev =>
      prev.includes(email)
        ? prev.filter(p => p !== email)
        : [...prev, email]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 flex-shrink-0">
          <div>
            <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
              Split Expense
            </h3>
            <p className="text-slate-400 font-medium">
              {step === 'amount' && 'Enter expense details'}
              {step === 'method' && 'Choose split method'}
              {step === 'participants' && 'Select participants'}
              {step === 'configure' && 'Configure amounts'}
              {step === 'preview' && 'Review and confirm'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-3xl transition-all text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 md:px-10 py-4 md:py-6 bg-slate-50 dark:bg-slate-950/30 flex justify-between items-center flex-shrink-0">
          {['amount', 'method', 'participants', 'configure', 'preview'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                ['amount', 'method', 'participants', 'configure', 'preview'].indexOf(step) >= i
                  ? 'bg-brand-primary'
                  : 'bg-slate-200 dark:bg-slate-800'
              } ${i > 0 ? 'ml-2' : ''}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto flex-1">
          {/* Step 1: Amount & Payer */}
          {step === 'amount' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Total Amount
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary font-display font-bold text-2xl">
                    $
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-6 pl-12 bg-slate-50 dark:bg-slate-950 rounded-3xl font-display font-bold text-3xl outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  >
                    {Object.keys(CATEGORY_COLORS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Notes
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  placeholder="e.g., Group dinner at Izakaya"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Who Paid?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {allUsers.map(user => (
                    <button
                      key={user.email}
                      onClick={() => setPaidBy(user.email)}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                        paidBy === user.email
                          ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      {paidBy === user.email && (
                        <Check className="ml-auto text-brand-primary" size={20} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Split Method */}
          {step === 'method' && (
            <div className="space-y-4">
              {[
                { value: 'equal', label: 'Split Equally', desc: 'Everyone pays the same amount' },
                { value: 'custom', label: 'Custom Amounts', desc: 'Set specific amounts for each person' },
                { value: 'percentage', label: 'By Percentage', desc: 'Assign percentage of total to each person' },
                { value: 'shares', label: 'By Shares', desc: 'Divide by shares (e.g., 2:1:1)' }
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setSplitMethod(method.value as SplitMethod)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all text-left ${
                    splitMethod === method.value
                      ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-slate-900 dark:text-white">
                        {method.label}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{method.desc}</p>
                    </div>
                    {splitMethod === method.value && (
                      <Check className="text-brand-primary flex-shrink-0" size={24} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Participants */}
          {step === 'participants' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Select everyone who will share this expense
              </p>
              <div className="grid grid-cols-1 gap-3">
                {allUsers.map(user => (
                  <button
                    key={user.email}
                    onClick={() => toggleParticipant(user.email)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      selectedParticipants.includes(user.email)
                        ? 'border-brand-primary bg-indigo-50 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    {selectedParticipants.includes(user.email) && (
                      <Check className="text-brand-primary" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Configure Amounts */}
          {step === 'configure' && splitMethod === 'custom' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter the amount each person should pay (must sum to ${amount})
              </p>
              {selectedParticipants.map(email => {
                const user = allUsers.find(u => u.email === email)!;
                return (
                  <div key={email} className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary font-bold">$</span>
                      <input
                        type="number"
                        value={customAmounts.get(email) || ''}
                        onChange={(e) => {
                          const newAmounts = new Map(customAmounts);
                          newAmounts.set(email, e.target.value);
                          setCustomAmounts(newAmounts);
                        }}
                        className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                        step="0.01"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Total:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    ${Array.from(customAmounts.values()).reduce((sum, v) => sum + parseFloat(v || '0'), 0).toFixed(2)} / ${amount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && splitMethod === 'percentage' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter the percentage each person should pay (must sum to 100%)
              </p>
              {selectedParticipants.map(email => {
                const user = allUsers.find(u => u.email === email)!;
                return (
                  <div key={email} className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                    </div>
                    <div className="relative w-32">
                      <input
                        type="number"
                        value={percentages.get(email) || ''}
                        onChange={(e) => {
                          const newPercentages = new Map(percentages);
                          newPercentages.set(email, e.target.value);
                          setPercentages(newPercentages);
                        }}
                        className="w-full p-3 pr-7 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                        step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary font-bold">%</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Total:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {Array.from(percentages.values()).reduce((sum, v) => sum + parseFloat(v || '0'), 0).toFixed(1)}% / 100%
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && splitMethod === 'shares' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter the number of shares for each person (e.g., 2 shares = 2x the amount of 1 share)
              </p>
              {selectedParticipants.map(email => {
                const user = allUsers.find(u => u.email === email)!;
                return (
                  <div key={email} className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                    </div>
                    <input
                      type="number"
                      value={shares.get(email) || ''}
                      onChange={(e) => {
                        const newShares = new Map(shares);
                        newShares.set(email, e.target.value);
                        setShares(newShares);
                      }}
                      className="w-32 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                      min="1"
                      step="1"
                    />
                  </div>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Total Shares:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {Array.from(shares.values()).reduce((sum, v) => sum + parseFloat(v || '0'), 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Total Amount</span>
                  <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    ${amount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Paid By</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {allUsers.find(u => u.email === paidBy)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Split Method</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {splitMethod}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500">Split Breakdown:</p>
                {(() => {
                  let splits: ExpenseSplit[] = [];
                  const totalAmount = parseFloat(amount);

                  if (splitMethod === 'equal') {
                    splits = splitEqually(totalAmount, selectedParticipants, paidBy);
                  } else if (splitMethod === 'custom') {
                    const amountsMap = new Map<string, number>();
                    customAmounts.forEach((value, key) => {
                      amountsMap.set(key, parseFloat(value || '0'));
                    });
                    splits = splitCustomAmounts(amountsMap, paidBy);
                  } else if (splitMethod === 'percentage') {
                    const percentsMap = new Map<string, number>();
                    percentages.forEach((value, key) => {
                      percentsMap.set(key, parseFloat(value || '0'));
                    });
                    splits = splitByPercentages(totalAmount, percentsMap, paidBy);
                  } else {
                    const sharesMap = new Map<string, number>();
                    shares.forEach((value, key) => {
                      sharesMap.set(key, parseFloat(value || '0'));
                    });
                    splits = splitByShares(totalAmount, sharesMap, paidBy);
                  }

                  return splits.map(split => {
                    const user = allUsers.find(u => u.email === split.userId)!;
                    return (
                      <div key={split.userId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {user.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ${split.amount.toFixed(2)}
                          </p>
                          {split.percentage && (
                            <p className="text-xs text-slate-400">{split.percentage}%</p>
                          )}
                          {split.shares && (
                            <p className="text-xs text-slate-400">{split.shares} shares</p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl text-red-700 dark:text-red-400">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 md:p-10 border-t border-slate-100 dark:border-white/5 flex gap-4 flex-shrink-0">
          {step !== 'amount' && (
            <button
              onClick={handleBack}
              className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          {step !== 'preview' ? (
            <button
              onClick={handleNext}
              className="flex-1 px-8 py-4 bg-brand-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-secondary transition-all flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-8 py-4 bg-brand-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-secondary transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Create Split Expense
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitExpenseModal;
