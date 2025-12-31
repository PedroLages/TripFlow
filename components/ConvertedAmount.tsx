/**
 * Converted Amount Component
 *
 * Displays an amount with currency conversion and original amount indicator
 */

import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/currencyHelpers';
import { useCurrencyConversion } from '../hooks/useCurrencyConversion';

interface ConvertedAmountProps {
  amount: number;
  currency: string;
  displayCurrency?: string;
  showOriginal?: boolean;
  className?: string;
  compact?: boolean;
}

export function ConvertedAmount({
  amount,
  currency,
  displayCurrency,
  showOriginal = true,
  className = '',
  compact = false,
}: ConvertedAmountProps) {
  const {
    convertedAmount,
    originalCurrency,
    displayCurrency: targetCurrency,
    isConverted,
    isLoading,
    error,
  } = useCurrencyConversion(amount, currency, displayCurrency || currency);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-gray-400">Converting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-orange-600 dark:text-orange-400 ${className}`}>
        {formatCurrency(amount, currency)}
      </div>
    );
  }

  if (!isConverted) {
    // No conversion needed
    return (
      <div className={className}>
        {formatCurrency(amount, currency)}
      </div>
    );
  }

  if (compact) {
    // Compact mode: just show converted amount with small original
    return (
      <div className={`flex items-baseline gap-1.5 ${className}`}>
        <span className="font-semibold">
          {formatCurrency(convertedAmount, targetCurrency)}
        </span>
        {showOriginal && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({formatCurrency(amount, originalCurrency)})
          </span>
        )}
      </div>
    );
  }

  // Full mode: show both with arrow
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {showOriginal && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(amount, originalCurrency)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </>
        )}
        <span className="font-semibold text-brand-primary dark:text-brand-primary-light">
          {formatCurrency(convertedAmount, targetCurrency)}
        </span>
      </div>
    </div>
  );
}

/**
 * Inline conversion info tooltip
 */
interface ConversionRateTooltipProps {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export function ConversionRateTooltip({
  fromCurrency,
  toCurrency,
  rate,
}: ConversionRateTooltipProps) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
      <span className="text-gray-600 dark:text-gray-400">
        1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
      </span>
    </div>
  );
}
