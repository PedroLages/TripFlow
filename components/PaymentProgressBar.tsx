/**
 * Payment Progress Bar Component
 *
 * Visual indicator showing partial payment progress for split expenses
 */

import React from 'react';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';
import type { ExpenseSplit } from '../types';
import {
  calculatePaymentProgress,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../utils/partialPaymentHelpers';
import { formatCurrency } from '../utils/currencyHelpers';

interface PaymentProgressBarProps {
  split: ExpenseSplit;
  currency?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export function PaymentProgressBar({
  split,
  currency = 'USD',
  compact = false,
  showDetails = true,
}: PaymentProgressBarProps) {
  const progress = calculatePaymentProgress(split);
  const colors = getPaymentStatusColor(progress);
  const label = getPaymentStatusLabel(progress);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {progress.isFullyPaid ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
        ) : progress.isPartiallyPaid ? (
          <Clock className="w-4 h-4 text-orange-500" aria-hidden="true" />
        ) : (
          <DollarSign className="w-4 h-4 text-red-500" aria-hidden="true" />
        )}
        <div className="flex-1">
          <div
            className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress.percentagePaid}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Payment progress: ${progress.percentagePaid.toFixed(0)}% paid, ${formatCurrency(progress.amountPaid, currency)} of ${formatCurrency(progress.totalAmount, currency)}`}
          >
            <div
              className={`h-full ${progress.isFullyPaid ? 'bg-green-500' : progress.isPartiallyPaid ? 'bg-orange-500' : 'bg-red-500'} transition-all duration-500`}
              style={{ width: `${progress.percentagePaid}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400" aria-hidden="true">
          {progress.percentagePaid.toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress.isFullyPaid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
            ) : progress.isPartiallyPaid ? (
              <Clock className="w-5 h-5 text-orange-500" aria-hidden="true" />
            ) : (
              <DollarSign className="w-5 h-5 text-red-500" aria-hidden="true" />
            )}
            <span className={`text-sm font-bold ${colors.text}`}>
              {label}
            </span>
          </div>
          <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest" aria-hidden="true">
            {progress.percentagePaid.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div
            className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress.percentagePaid}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Payment progress: ${label}, ${progress.percentagePaid.toFixed(0)}% paid`}
          >
            <div
              className={`h-full ${
                progress.isFullyPaid
                  ? 'bg-green-500'
                  : progress.isPartiallyPaid
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              } transition-all duration-500 ease-out`}
              style={{ width: `${progress.percentagePaid}%` }}
            />
          </div>
        </div>

        {/* Payment Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid</p>
              <p className={`text-sm font-bold ${colors.text}`}>
                {formatCurrency(progress.amountPaid, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
              <p className={`text-sm font-bold ${progress.amountRemaining > 0 ? 'text-gray-900 dark:text-white' : colors.text}`}>
                {formatCurrency(progress.amountRemaining, currency)}
              </p>
            </div>
          </div>
        )}

        {/* Total Amount */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Total Amount
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {formatCurrency(progress.totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
