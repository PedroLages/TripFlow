/**
 * Partial Payment Helpers
 *
 * Utilities for tracking and calculating partial payments for split expenses
 */

import { v4 as uuidv4 } from 'uuid';
import type { ExpenseSplit, PaymentHistoryEntry } from '../types';

/**
 * Calculate payment progress for a split
 *
 * @param split - Expense split to calculate progress for
 * @returns Payment progress information
 */
export function calculatePaymentProgress(split: ExpenseSplit): {
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  percentagePaid: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
} {
  const totalAmount = split.amount;
  const amountPaid = split.amountPaid || 0;
  const amountRemaining = Math.max(0, totalAmount - amountPaid);
  const percentagePaid = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
  const isFullyPaid = split.isPaid || amountRemaining === 0;
  const isPartiallyPaid = amountPaid > 0 && !isFullyPaid;

  return {
    totalAmount,
    amountPaid,
    amountRemaining,
    percentagePaid: parseFloat(percentagePaid.toFixed(2)),
    isFullyPaid,
    isPartiallyPaid,
  };
}

/**
 * Add a partial payment to a split
 *
 * @param split - Current split state
 * @param amount - Payment amount
 * @param notes - Optional payment notes
 * @param method - Payment method
 * @returns Updated split with payment recorded
 */
export function addPartialPayment(
  split: ExpenseSplit,
  amount: number,
  notes?: string,
  method?: 'cash' | 'card' | 'transfer' | 'other'
): ExpenseSplit {
  // Validate amount
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const currentPaid = split.amountPaid || 0;
  const remaining = split.amount - currentPaid;

  if (amount > remaining) {
    throw new Error(`Payment amount ($${amount}) exceeds remaining balance ($${remaining})`);
  }

  // Create payment history entry
  const paymentEntry: PaymentHistoryEntry = {
    id: uuidv4(),
    amount,
    paidAt: new Date().toISOString(),
    notes,
    method,
  };

  // Update split
  const newAmountPaid = currentPaid + amount;
  const isFullyPaid = newAmountPaid >= split.amount;

  return {
    ...split,
    amountPaid: parseFloat(newAmountPaid.toFixed(2)),
    isPaid: isFullyPaid,
    paidAt: isFullyPaid ? new Date().toISOString() : split.paidAt,
    paymentHistory: [...(split.paymentHistory || []), paymentEntry],
  };
}

/**
 * Remove the last partial payment (undo)
 *
 * @param split - Current split state
 * @returns Updated split with last payment removed
 */
export function removeLastPayment(split: ExpenseSplit): ExpenseSplit {
  const history = split.paymentHistory || [];

  if (history.length === 0) {
    throw new Error('No payments to remove');
  }

  // Remove last payment
  const newHistory = history.slice(0, -1);
  const lastPayment = history[history.length - 1];

  // Recalculate amount paid
  const newAmountPaid = Math.max(0, (split.amountPaid || 0) - lastPayment.amount);
  const isFullyPaid = newAmountPaid >= split.amount;

  return {
    ...split,
    amountPaid: parseFloat(newAmountPaid.toFixed(2)),
    isPaid: isFullyPaid,
    paidAt: isFullyPaid ? split.paidAt : undefined,
    paymentHistory: newHistory,
  };
}

/**
 * Get payment status color
 *
 * @param progress - Payment progress from calculatePaymentProgress
 * @returns Tailwind color classes
 */
export function getPaymentStatusColor(progress: ReturnType<typeof calculatePaymentProgress>): {
  bg: string;
  text: string;
  border: string;
} {
  if (progress.isFullyPaid) {
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    };
  }

  if (progress.isPartiallyPaid) {
    return {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
    };
  }

  return {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  };
}

/**
 * Get payment status label
 *
 * @param progress - Payment progress from calculatePaymentProgress
 * @returns Human-readable status label
 */
export function getPaymentStatusLabel(progress: ReturnType<typeof calculatePaymentProgress>): string {
  if (progress.isFullyPaid) {
    return 'Paid in Full';
  }

  if (progress.isPartiallyPaid) {
    return `Partially Paid (${progress.percentagePaid.toFixed(0)}%)`;
  }

  return 'Unpaid';
}

/**
 * Format payment history for display
 *
 * @param history - Payment history entries
 * @returns Formatted payment history
 */
export function formatPaymentHistory(
  history: PaymentHistoryEntry[]
): Array<{
  date: string;
  amount: string;
  notes: string;
  method: string;
}> {
  return history.map(entry => ({
    date: new Date(entry.paidAt).toLocaleDateString(),
    amount: `$${entry.amount.toFixed(2)}`,
    notes: entry.notes || 'No notes',
    method: entry.method ? entry.method.charAt(0).toUpperCase() + entry.method.slice(1) : 'Not specified',
  }));
}

/**
 * Calculate installment schedule suggestion
 *
 * @param totalAmount - Total amount to pay
 * @param numInstallments - Number of installments
 * @returns Suggested installment amounts
 */
export function suggestInstallmentSchedule(
  totalAmount: number,
  numInstallments: number = 3
): number[] {
  if (numInstallments < 1) {
    throw new Error('Number of installments must be at least 1');
  }

  const installmentAmount = totalAmount / numInstallments;
  const installments: number[] = [];

  for (let i = 0; i < numInstallments - 1; i++) {
    installments.push(parseFloat(installmentAmount.toFixed(2)));
  }

  // Last installment gets the remainder to handle rounding
  const paidSoFar = installments.reduce((sum, amt) => sum + amt, 0);
  installments.push(parseFloat((totalAmount - paidSoFar).toFixed(2)));

  return installments;
}

/**
 * Validate payment amount
 *
 * @param split - Split to validate payment for
 * @param amount - Payment amount to validate
 * @returns Validation result with error message if invalid
 */
export function validatePaymentAmount(
  split: ExpenseSplit,
  amount: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Payment amount must be greater than zero' };
  }

  const progress = calculatePaymentProgress(split);

  if (progress.isFullyPaid) {
    return { valid: false, error: 'This expense is already fully paid' };
  }

  if (amount > progress.amountRemaining) {
    return {
      valid: false,
      error: `Payment amount ($${amount.toFixed(2)}) exceeds remaining balance ($${progress.amountRemaining.toFixed(2)})`,
    };
  }

  return { valid: true };
}
