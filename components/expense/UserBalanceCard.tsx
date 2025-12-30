/**
 * UserBalanceCard Component
 *
 * Display user's balance summary for split expenses.
 * Shows what they owe and are owed with net balance.
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyHelpers';
import type { UserBalance } from '../../types';

interface UserBalanceCardProps {
  balance: UserBalance;
  currency?: string;
  userName: string;
  onViewSettlements?: () => void;
  className?: string;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  balance,
  currency = 'USD',
  userName,
  onViewSettlements,
  className = '',
}) => {
  const isPositive = balance.netBalance >= 0;
  const isZero = Math.abs(balance.netBalance) < 0.01;

  // Color scheme based on balance
  const getBalanceColors = () => {
    if (isZero) {
      return {
        bg: 'bg-slate-50 dark:bg-slate-900/50',
        border: 'border-slate-200 dark:border-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        accent: 'text-slate-500',
      };
    }
    if (isPositive) {
      return {
        bg: 'bg-green-50 dark:bg-green-950/20',
        border: 'border-green-200 dark:border-green-800/30',
        text: 'text-green-700 dark:text-green-400',
        accent: 'text-green-600 dark:text-green-500',
      };
    }
    return {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800/30',
      text: 'text-red-700 dark:text-red-400',
      accent: 'text-red-600 dark:text-red-500',
    };
  };

  const colors = getBalanceColors();

  return (
    <div
      className={`p-6 rounded-3xl border ${colors.bg} ${colors.border} transition-all hover:shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Balance
        </h3>
        <DollarSign className={`w-5 h-5 ${colors.accent}`} />
      </div>

      {/* Net Balance */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {!isZero && (
            isPositive ? (
              <TrendingUp className={`w-5 h-5 ${colors.accent}`} />
            ) : (
              <TrendingDown className={`w-5 h-5 ${colors.accent}`} />
            )
          )}
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Net Balance
          </p>
        </div>
        <p className={`text-4xl font-display font-bold ${colors.text}`}>
          {isPositive && !isZero && '+'}
          {formatCurrency(Math.abs(balance.netBalance), currency)}
        </p>
        {!isZero && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            {isPositive
              ? "You're owed money"
              : 'You owe money'}
          </p>
        )}
        {isZero && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            All settled up! ✨
          </p>
        )}
      </div>

      {/* Breakdown */}
      {!isZero && (
        <div className="space-y-3 mb-6">
          {/* Amount Owed */}
          {balance.owed > 0 && (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  You're Owed
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(balance.owed, currency)}
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          )}

          {/* Amount Owes */}
          {balance.owes > 0 && (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  You Owe
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(balance.owes, currency)}
                </p>
              </div>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>
      )}

      {/* View Settlements Button */}
      {onViewSettlements && !isZero && (
        <button
          onClick={onViewSettlements}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
            isPositive
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
          }`}
        >
          View Settlements
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default UserBalanceCard;
