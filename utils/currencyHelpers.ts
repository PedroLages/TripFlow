/**
 * Currency Helpers
 *
 * Utilities for currency formatting and conversion.
 */

/**
 * Format amount as currency with proper symbol and locale
 *
 * @param amount - Amount to format
 * @param currency - Currency code (USD, EUR, GBP, etc.)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    console.error(`Invalid currency code: ${currency}`, error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format amount as compact currency (e.g., $1.2K)
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale for formatting
 * @returns Compact formatted currency string
 */
export const formatCompactCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  } catch (error) {
    console.error(`Invalid currency code: ${currency}`, error);
    return formatCurrency(amount, currency, locale);
  }
};

/**
 * Get currency symbol for a currency code
 *
 * @param currency - Currency code (USD, EUR, etc.)
 * @param locale - Locale for formatting
 * @returns Currency symbol
 */
export const getCurrencySymbol = (
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find(part => part.type === 'currency')?.value || currency;
  } catch (error) {
    console.error(`Invalid currency code: ${currency}`, error);
    return currency;
  }
};

/**
 * Static exchange rates (for Phase 1 MVP)
 * In Phase 2, integrate with real-time API (e.g., exchangerate-api.com)
 */
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.12,
    MXN: 17.08,
  },
  EUR: {
    USD: 1.09,
    EUR: 1,
    GBP: 0.86,
    JPY: 162.50,
    CAD: 1.48,
    AUD: 1.66,
    CHF: 0.96,
    CNY: 7.87,
    INR: 90.33,
    MXN: 18.58,
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    GBP: 1,
    JPY: 189.00,
    CAD: 1.72,
    AUD: 1.93,
    CHF: 1.11,
    CNY: 9.15,
    INR: 105.00,
    MXN: 21.60,
  },
};

/**
 * Convert amount from one currency to another
 *
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = EXCHANGE_RATES[fromCurrency];
  if (!rates) {
    console.warn(`No exchange rates available for ${fromCurrency}, returning original amount`);
    return amount;
  }

  const rate = rates[toCurrency];
  if (!rate) {
    console.warn(`No exchange rate available for ${fromCurrency} to ${toCurrency}, returning original amount`);
    return amount;
  }

  return parseFloat((amount * rate).toFixed(2));
};

/**
 * Supported currency codes and their display names
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
] as const;

/**
 * Check if a currency code is supported
 *
 * @param currency - Currency code to check
 * @returns true if supported, false otherwise
 */
export const isSupportedCurrency = (currency: string): boolean => {
  return SUPPORTED_CURRENCIES.some(c => c.code === currency);
};

/**
 * Parse currency string to number
 * Handles various formats: "$1,234.56", "1.234,56 €", "1234.56"
 *
 * @param value - Currency string to parse
 * @returns Parsed number or NaN if invalid
 */
export const parseCurrencyString = (value: string): number => {
  // Remove currency symbols and whitespace
  const cleaned = value
    .replace(/[^0-9.,\-]/g, '')
    .trim();

  // Handle different decimal separators
  // If there are multiple periods and commas, last one is decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');

  let normalized: string;

  if (lastComma === -1 && lastPeriod === -1) {
    // No decimal separator
    normalized = cleaned;
  } else if (lastComma > lastPeriod) {
    // Comma is decimal separator (e.g., "1.234,56")
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Period is decimal separator (e.g., "1,234.56")
    normalized = cleaned.replace(/,/g, '');
  }

  return parseFloat(normalized);
};
