/**
 * Currency Rate Info Component
 *
 * Displays exchange rate status, last update time, and refresh controls
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { CurrencyService } from '../src/services/CurrencyService';

interface CurrencyRateInfoProps {
  baseCurrency?: string;
  compact?: boolean;
}

export function CurrencyRateInfo({ baseCurrency = 'USD', compact = false }: CurrencyRateInfoProps) {
  const [rateInfo, setRateInfo] = useState<{
    lastUpdated: string;
    nextUpdate: string;
    isLive: boolean;
    failureCount: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rate info on mount and when baseCurrency changes
  useEffect(() => {
    loadRateInfo();
  }, [baseCurrency]);

  const loadRateInfo = async () => {
    try {
      const info = await CurrencyService.getRateInfo(baseCurrency);
      setRateInfo(info);
      setError(null);
    } catch (err) {
      console.error('Failed to load rate info:', err);
      setError('Unable to load rate information');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await CurrencyService.refreshRates(baseCurrency);
      await loadRateInfo();
    } catch (err) {
      console.error('Failed to refresh rates:', err);
      setError('Failed to refresh rates. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!rateInfo && !error) {
    return null; // Loading
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {rateInfo?.isLive ? (
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs">Live rates</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs">Offline rates</span>
          </div>
        )}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          aria-label="Refresh exchange rates"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // Full display mode
  const lastUpdatedDate = rateInfo?.lastUpdated === 'Static rates (offline)'
    ? null
    : new Date(rateInfo?.lastUpdated || Date.now());

  const timeAgo = lastUpdatedDate
    ? formatDistance(lastUpdatedDate, new Date(), { addSuffix: true })
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Exchange Rates
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            bg-brand-primary text-white
            hover:bg-brand-primary-dark
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
          `}
          aria-label="Refresh exchange rates"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {rateInfo?.isLive ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Using live exchange rates
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Using offline rates (API unavailable)
              </span>
            </>
          )}
        </div>

        {/* Last updated */}
        {timeAgo && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              Last updated: <span className="font-medium">{timeAgo}</span>
            </span>
          </div>
        )}

        {/* Next update */}
        {rateInfo?.isLive && rateInfo.nextUpdate !== 'N/A' && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Next automatic update: {new Date(rateInfo.nextUpdate).toLocaleString()}
          </div>
        )}

        {/* Failure warning */}
        {rateInfo?.failureCount && rateInfo.failureCount > 0 && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {rateInfo.failureCount} failed {rateInfo.failureCount === 1 ? 'attempt' : 'attempts'} to fetch live rates.
              {rateInfo.failureCount >= 3 && ' Using offline rates as fallback.'}
            </p>
          </div>
        )}

        {/* Base currency info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Rates shown are relative to <span className="font-semibold">{baseCurrency}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
