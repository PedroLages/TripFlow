/**
 * SettlementsTab Component
 *
 * Complete settlement management interface showing:
 * - What you owe and are owed
 * - Simplified settlements (who pays whom)
 * - Mark settlements as paid
 * - Settlement history
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Check, X,
  ArrowRight, History, Filter, CheckCircle, XCircle,
  Users, Calendar, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Trip, Settlement } from '../../types';
import { calculateSettlements, calculateUserBalances } from '../../utils/expenseSplitCalculations';
import { formatCurrency } from '../../utils/currencyHelpers';

interface SettlementsTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
  currentUserEmail: string;
}

type FilterType = 'all' | 'pending' | 'completed';

const SettlementsTab: React.FC<SettlementsTabProps> = ({
  trip,
  updateTrip,
  currentUserEmail
}) => {
  const [filter, setFilter] = useState<FilterType>('pending');

  // Calculate settlements from split expenses
  const calculatedSettlements = useMemo(() => {
    return calculateSettlements(trip.expenses, trip.collaborators, trip.ownerEmail);
  }, [trip.expenses, trip.collaborators, trip.ownerEmail]);

  // Merge with saved settlements (for status updates)
  const settlements = useMemo(() => {
    const savedSettlements = trip.settlements || [];
    return calculatedSettlements.map(calc => {
      const saved = savedSettlements.find(
        s => s.fromUser === calc.fromUser && s.toUser === calc.toUser
      );
      return saved || calc;
    });
  }, [calculatedSettlements, trip.settlements]);

  // Calculate user balances
  const userBalances = useMemo(() => {
    return calculateUserBalances(trip.expenses, trip.collaborators, trip.ownerEmail);
  }, [trip.expenses, trip.collaborators, trip.ownerEmail]);

  const currentUserBalance = userBalances.get(currentUserEmail);

  // Filter settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      if (filter === 'pending') return s.status === 'pending';
      if (filter === 'completed') return s.status === 'completed';
      return true;
    });
  }, [settlements, filter]);

  // User-relevant settlements
  const userOwesSettlements = filteredSettlements.filter(s => s.fromUser === currentUserEmail);
  const userOwedSettlements = filteredSettlements.filter(s => s.toUser === currentUserEmail);

  // Get user display info
  const allUsers = [
    { email: trip.ownerEmail, avatar: 'https://i.pravatar.cc/150?u=demo', name: 'Owner' },
    ...trip.collaborators.map(c => ({ email: c.email, avatar: c.avatar, name: c.email.split('@')[0] }))
  ];

  const getUserInfo = (email: string) => {
    const user = allUsers.find(u => u.email === email);
    return user || { email, avatar: `https://i.pravatar.cc/150?u=${email}`, name: email.split('@')[0] };
  };

  // Mark settlement as completed
  const markAsCompleted = (settlement: Settlement) => {
    const updatedSettlements = settlements.map(s =>
      s.fromUser === settlement.fromUser && s.toUser === settlement.toUser
        ? { ...s, status: 'completed' as const, completedAt: new Date().toISOString() }
        : s
    );
    updateTrip({ ...trip, settlements: updatedSettlements });
  };

  // Mark settlement as pending (undo)
  const markAsPending = (settlement: Settlement) => {
    const updatedSettlements = settlements.map(s =>
      s.fromUser === settlement.fromUser && s.toUser === settlement.toUser
        ? { ...s, status: 'pending' as const, completedAt: undefined }
        : s
    );
    updateTrip({ ...trip, settlements: updatedSettlements });
  };

  const pendingCount = settlements.filter(s => s.status === 'pending').length;
  const completedCount = settlements.filter(s => s.status === 'completed').length;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-brand-primary rounded-2xl shadow-lg shadow-indigo-500/20">
            <Users className="text-white" size={24} />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
          Settlement <span className="text-brand-primary">Command</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Simplified transactions to balance split expenses. Settle up with minimal transfers.
        </p>
      </section>

      {/* Balance Summary */}
      {currentUserBalance && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Balance */}
          <div className={`p-8 rounded-[3rem] border ${
            currentUserBalance.netBalance >= 0
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              {currentUserBalance.netBalance >= 0 ? (
                <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
              ) : (
                <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
              )}
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Net Balance
              </p>
            </div>
            <p className={`text-4xl font-display font-bold ${
              currentUserBalance.netBalance >= 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {currentUserBalance.netBalance >= 0 && '+'}
              {formatCurrency(Math.abs(currentUserBalance.netBalance))}
            </p>
          </div>

          {/* You Owe */}
          <div className="p-8 rounded-[3rem] border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="text-red-500" size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                You Owe
              </p>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900 dark:text-white">
              {formatCurrency(currentUserBalance.owes)}
            </p>
          </div>

          {/* You're Owed */}
          <div className="p-8 rounded-[3rem] border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-500" size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                You're Owed
              </p>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900 dark:text-white">
              {formatCurrency(currentUserBalance.owed)}
            </p>
          </div>
        </section>
      )}

      {/* Filter Controls */}
      <section className="flex flex-wrap items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Filter:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === 'all'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All ({settlements.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === 'pending'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === 'completed'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </section>

      {/* What You Owe */}
      {userOwesSettlements.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white px-4 flex items-center gap-3">
            <TrendingDown className="text-red-500" size={24} />
            What You Owe
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {userOwesSettlements.map(settlement => {
              const toUser = getUserInfo(settlement.toUser);
              return (
                <div
                  key={settlement.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    settlement.status === 'completed'
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={toUser.avatar}
                        alt={toUser.name}
                        className="w-16 h-16 rounded-2xl border-2 border-red-200 dark:border-red-800/30"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-500 mb-1">You owe</p>
                        <p className="text-xl font-display font-bold text-slate-900 dark:text-white">
                          {toUser.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{toUser.email}</p>
                      </div>
                      <ArrowRight className="text-slate-300 hidden md:block" size={24} />
                      <div className="text-right">
                        <p className="text-3xl font-display font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(settlement.amount, settlement.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {settlement.status === 'pending' ? (
                        <button
                          onClick={() => markAsCompleted(settlement)}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
                        >
                          <Check size={18} />
                          Mark as Paid
                        </button>
                      ) : (
                        <>
                          <div className="px-6 py-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold rounded-2xl flex items-center gap-2">
                            <CheckCircle size={18} />
                            Paid on {format(new Date(settlement.completedAt!), 'MMM d')}
                          </div>
                          <button
                            onClick={() => markAsPending(settlement)}
                            className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-all"
                            aria-label="Undo"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* What You're Owed */}
      {userOwedSettlements.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white px-4 flex items-center gap-3">
            <TrendingUp className="text-green-500" size={24} />
            What You're Owed
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {userOwedSettlements.map(settlement => {
              const fromUser = getUserInfo(settlement.fromUser);
              return (
                <div
                  key={settlement.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    settlement.status === 'completed'
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-800/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={fromUser.avatar}
                        alt={fromUser.name}
                        className="w-16 h-16 rounded-2xl border-2 border-green-200 dark:border-green-800/30"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-500 mb-1">{fromUser.name} owes you</p>
                        <p className="text-3xl font-display font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(settlement.amount, settlement.currency)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{fromUser.email}</p>
                      </div>
                    </div>
                    <div>
                      {settlement.status === 'pending' ? (
                        <div className="px-6 py-3 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 font-bold rounded-2xl flex items-center gap-2">
                          <AlertCircle size={18} />
                          Awaiting Payment
                        </div>
                      ) : (
                        <>
                          <div className="px-6 py-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold rounded-2xl flex items-center gap-2">
                            <CheckCircle size={18} />
                            Received on {format(new Date(settlement.completedAt!), 'MMM d')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredSettlements.length === 0 && (
        <section className="py-24 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-white/5">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
            {filter === 'completed' ? (
              <CheckCircle className="text-slate-300 dark:text-slate-600" size={48} />
            ) : (
              <AlertCircle className="text-slate-300 dark:text-slate-600" size={48} />
            )}
          </div>
          <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {filter === 'completed' ? 'No Completed Settlements' : 'All Settled Up!'}
          </h4>
          <p className="text-slate-400 mt-2">
            {filter === 'completed'
              ? 'Completed settlements will appear here'
              : 'No pending settlements. Everyone is square!'}
          </p>
        </section>
      )}
    </div>
  );
};

export default SettlementsTab;
