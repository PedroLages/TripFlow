/**
 * Currency Service
 *
 * Manages real-time exchange rates with caching and fallback to static rates.
 * Uses ExchangeRate-API (https://www.exchangerate-api.com/) for live data.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Exchange rate data structure
 */
interface ExchangeRateData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  nextUpdate: string;
}

/**
 * IndexedDB schema for currency data
 */
interface CurrencyDB extends DBSchema {
  exchangeRates: {
    key: string; // Currency code (e.g., 'USD')
    value: ExchangeRateData;
  };
  settings: {
    key: string;
    value: {
      apiKey?: string;
      lastFetchAttempt?: string;
      failureCount?: number;
    };
  };
}

/**
 * Static fallback rates (used when API is unavailable)
 */
const FALLBACK_RATES: Record<string, Record<string, number>> = {
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
 * Currency Service - Singleton pattern
 */
class CurrencyServiceClass {
  private db: IDBPDatabase<CurrencyDB> | null = null;
  private initPromise: Promise<void> | null = null;

  // Free tier API endpoint (no key required for basic usage)
  private readonly API_BASE = 'https://api.exchangerate-api.com/v4/latest';

  // Cache duration: 24 hours
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

  // Max retry failures before using fallback
  private readonly MAX_FAILURES = 3;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB<CurrencyDB>('TripFlowCurrency', 1, {
          upgrade(db) {
            // Exchange rates store
            if (!db.objectStoreNames.contains('exchangeRates')) {
              db.createObjectStore('exchangeRates', { keyPath: 'base' });
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings');
            }
          },
        });
      } catch (error) {
        console.error('Failed to initialize CurrencyService DB:', error);
        // Continue without DB - will use API/fallback only
      }
    })();

    return this.initPromise;
  }

  /**
   * Get exchange rates for a base currency
   *
   * @param baseCurrency - Base currency code (e.g., 'USD')
   * @param forceRefresh - Force fetch from API even if cached
   * @returns Exchange rate data
   */
  async getExchangeRates(
    baseCurrency: string = 'USD',
    forceRefresh: boolean = false
  ): Promise<ExchangeRateData> {
    await this.init();

    // Check cache first (unless force refresh)
    if (!forceRefresh && this.db) {
      const cached = await this.getCachedRates(baseCurrency);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    try {
      const liveRates = await this.fetchLiveRates(baseCurrency);

      // Cache the result
      if (this.db) {
        await this.cacheRates(liveRates);
      }

      // Reset failure count on success
      if (this.db) {
        await this.db.put('settings', { failureCount: 0 }, 'apiStatus');
      }

      return liveRates;
    } catch (error) {
      console.warn('Failed to fetch live rates, using fallback:', error);

      // Track failures
      if (this.db) {
        const status = await this.db.get('settings', 'apiStatus');
        const failureCount = (status?.failureCount || 0) + 1;
        await this.db.put('settings', {
          failureCount,
          lastFetchAttempt: new Date().toISOString(),
        }, 'apiStatus');
      }

      // Return fallback rates
      return this.getFallbackRates(baseCurrency);
    }
  }

  /**
   * Fetch live rates from API
   */
  private async fetchLiveRates(baseCurrency: string): Promise<ExchangeRateData> {
    const response = await fetch(`${this.API_BASE}/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      base: data.base,
      rates: data.rates,
      lastUpdated: data.date || new Date().toISOString(),
      nextUpdate: new Date(Date.now() + this.CACHE_DURATION_MS).toISOString(),
    };
  }

  /**
   * Get cached rates if still valid
   */
  private async getCachedRates(baseCurrency: string): Promise<ExchangeRateData | null> {
    if (!this.db) return null;

    try {
      const cached = await this.db.get('exchangeRates', baseCurrency);

      if (!cached) {
        return null;
      }

      // Check if cache is still valid
      const nextUpdate = new Date(cached.nextUpdate).getTime();
      if (Date.now() < nextUpdate) {
        return cached;
      }

      return null; // Cache expired
    } catch (error) {
      console.error('Failed to read cached rates:', error);
      return null;
    }
  }

  /**
   * Cache exchange rates
   */
  private async cacheRates(data: ExchangeRateData): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('exchangeRates', data);
    } catch (error) {
      console.error('Failed to cache rates:', error);
    }
  }

  /**
   * Get fallback static rates
   */
  private getFallbackRates(baseCurrency: string): ExchangeRateData {
    const rates = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.USD;

    return {
      base: baseCurrency,
      rates,
      lastUpdated: 'Static rates (offline)',
      nextUpdate: 'N/A',
    };
  }

  /**
   * Convert amount between currencies
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns Converted amount
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates(fromCurrency);
    const rate = rates.rates[toCurrency];

    if (!rate) {
      console.warn(`No rate available for ${fromCurrency} to ${toCurrency}`);
      return amount;
    }

    return parseFloat((amount * rate).toFixed(2));
  }

  /**
   * Get rate information for display
   */
  async getRateInfo(baseCurrency: string = 'USD'): Promise<{
    lastUpdated: string;
    nextUpdate: string;
    isLive: boolean;
    failureCount: number;
  }> {
    await this.init();

    const rates = await this.getExchangeRates(baseCurrency);

    let failureCount = 0;
    if (this.db) {
      const status = await this.db.get('settings', 'apiStatus');
      failureCount = status?.failureCount || 0;
    }

    return {
      lastUpdated: rates.lastUpdated,
      nextUpdate: rates.nextUpdate,
      isLive: rates.lastUpdated !== 'Static rates (offline)',
      failureCount,
    };
  }

  /**
   * Manually refresh rates
   */
  async refreshRates(baseCurrency: string = 'USD'): Promise<ExchangeRateData> {
    return this.getExchangeRates(baseCurrency, true);
  }

  /**
   * Clear all cached rates
   */
  async clearCache(): Promise<void> {
    await this.init();

    if (!this.db) return;

    try {
      const tx = this.db.transaction('exchangeRates', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (error) {
      console.error('Failed to clear currency cache:', error);
    }
  }

  /**
   * Get supported currencies with their current rates
   */
  async getSupportedCurrenciesWithRates(baseCurrency: string = 'USD'): Promise<Array<{
    code: string;
    name: string;
    symbol: string;
    rate: number;
  }>> {
    const rates = await this.getExchangeRates(baseCurrency);

    const currencies = [
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
    ];

    return currencies.map(currency => ({
      ...currency,
      rate: rates.rates[currency.code] || 1,
    }));
  }
}

// Export singleton instance
export const CurrencyService = new CurrencyServiceClass();
