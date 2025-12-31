/**
 * Currency Conversion Hook
 *
 * Provides real-time currency conversion for expense display
 */

import { useState, useEffect } from 'react';
import { CurrencyService } from '../src/services/CurrencyService';

interface ConversionResult {
  amount: number;
  convertedAmount: number;
  displayCurrency: string;
  originalCurrency: string;
  rate: number;
  isConverted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for converting currency amounts
 *
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target/display currency
 * @param autoConvert - Automatically convert on mount (default: true)
 * @returns Conversion result with converted amount and metadata
 */
export function useCurrencyConversion(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  autoConvert: boolean = true
): ConversionResult {
  const [result, setResult] = useState<ConversionResult>({
    amount,
    convertedAmount: amount,
    displayCurrency: toCurrency,
    originalCurrency: fromCurrency,
    rate: 1,
    isConverted: fromCurrency !== toCurrency,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!autoConvert || fromCurrency === toCurrency) {
      setResult({
        amount,
        convertedAmount: amount,
        displayCurrency: toCurrency,
        originalCurrency: fromCurrency,
        rate: 1,
        isConverted: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    const convert = async () => {
      setResult(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const convertedAmount = await CurrencyService.convertCurrency(
          amount,
          fromCurrency,
          toCurrency
        );

        if (!isMounted) return;

        // Calculate the rate
        const rate = amount !== 0 ? convertedAmount / amount : 1;

        setResult({
          amount,
          convertedAmount,
          displayCurrency: toCurrency,
          originalCurrency: fromCurrency,
          rate: parseFloat(rate.toFixed(4)),
          isConverted: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Currency conversion failed:', error);
        setResult(prev => ({
          ...prev,
          isLoading: false,
          error: 'Conversion failed. Showing original amount.',
          convertedAmount: amount,
          rate: 1,
          isConverted: false,
        }));
      }
    };

    convert();

    return () => {
      isMounted = false;
    };
  }, [amount, fromCurrency, toCurrency, autoConvert]);

  return result;
}

/**
 * Hook for batch currency conversions (optimized for lists)
 *
 * @param conversions - Array of amounts with their currencies
 * @param toCurrency - Target display currency
 * @returns Array of conversion results
 */
export function useBatchCurrencyConversion(
  conversions: Array<{ amount: number; currency: string }>,
  toCurrency: string = 'USD'
): {
  results: ConversionResult[];
  totalConverted: number;
  isLoading: boolean;
} {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const convertAll = async () => {
      setIsLoading(true);

      try {
        const converted = await Promise.all(
          conversions.map(async ({ amount, currency }) => {
            if (currency === toCurrency) {
              return {
                amount,
                convertedAmount: amount,
                displayCurrency: toCurrency,
                originalCurrency: currency,
                rate: 1,
                isConverted: false,
                isLoading: false,
                error: null,
              };
            }

            try {
              const convertedAmount = await CurrencyService.convertCurrency(
                amount,
                currency,
                toCurrency
              );

              const rate = amount !== 0 ? convertedAmount / amount : 1;

              return {
                amount,
                convertedAmount,
                displayCurrency: toCurrency,
                originalCurrency: currency,
                rate: parseFloat(rate.toFixed(4)),
                isConverted: true,
                isLoading: false,
                error: null,
              };
            } catch (error) {
              return {
                amount,
                convertedAmount: amount,
                displayCurrency: toCurrency,
                originalCurrency: currency,
                rate: 1,
                isConverted: false,
                isLoading: false,
                error: 'Failed to convert',
              };
            }
          })
        );

        if (!isMounted) return;

        setResults(converted);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    convertAll();

    return () => {
      isMounted = false;
    };
  }, [conversions, toCurrency]);

  const totalConverted = results.reduce(
    (sum, result) => sum + result.convertedAmount,
    0
  );

  return {
    results,
    totalConverted,
    isLoading,
  };
}
