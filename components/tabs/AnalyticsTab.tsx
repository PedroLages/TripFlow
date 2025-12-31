/**
 * Analytics Tab Component
 *
 * Comprehensive analytics dashboard showing spending trends, insights, and comparisons
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, PieChart as PieChartIcon,
  DollarSign, Calendar, Users, Award, AlertTriangle,
  CheckCircle, Info, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { Trip } from '../../types';
import {
  calculateCategoryBreakdown,
  calculateDailySpending,
  calculateSpendingTrend,
  calculatePersonSpending,
  calculateSpendingInsights,
} from '../../utils/analyticsHelpers';
import { formatCurrency } from '../../utils/currencyHelpers';

interface AnalyticsTabProps {
  trip: Trip;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Flights': '#6366f1',
  'Accommodation': '#14b8a6',
  'Food': '#f59e0b',
  'Activities': '#8b5cf6',
  'Transport': '#64748b',
  'Shopping': '#ec4899',
  'Other': '#94a3b8',
};

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ trip }) => {
  // Calculate analytics data
  const categoryBreakdown = useMemo(() => calculateCategoryBreakdown(trip.expenses), [trip.expenses]);
  const dailySpending = useMemo(() => calculateDailySpending(trip), [trip]);
  const spendingTrend = useMemo(
    () => calculateSpendingTrend(trip.expenses, trip.startDate, trip.endDate),
    [trip.expenses, trip.startDate, trip.endDate]
  );
  const personSpending = useMemo(() => calculatePersonSpending(trip), [trip]);
  const { insights, stats } = useMemo(() => calculateSpendingInsights(trip), [trip]);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-brand-primary rounded-2xl shadow-lg shadow-indigo-500/20">
            <BarChart3 className="text-white" size={24} />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">
          Analytics <span className="text-brand-primary">Dashboard</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Spending trends, insights, and visualizations for {trip.name}
        </p>
      </section>

      {/* Key Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Avg Daily</span>
          </div>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            ${stats.averageDailySpend.toFixed(2)}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Projected</span>
          </div>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            ${stats.projectedTotal.toFixed(2)}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Category</span>
          </div>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {stats.biggestCategory}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${
              stats.budgetUtilization > 100 ? 'bg-red-50 dark:bg-red-900/20' :
              stats.budgetUtilization > 80 ? 'bg-orange-50 dark:bg-orange-900/20' :
              'bg-green-50 dark:bg-green-900/20'
            }`}>
              <Calendar className={`w-5 h-5 ${
                stats.budgetUtilization > 100 ? 'text-red-500' :
                stats.budgetUtilization > 80 ? 'text-orange-500' :
                'text-green-500'
              }`} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Budget Used</span>
          </div>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {stats.budgetUtilization.toFixed(0)}%
          </p>
        </div>
      </section>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-5 rounded-2xl border flex items-start gap-3 ${
                  insight.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                {insight.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />}
                {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                {insight.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                <p className={`text-sm font-medium ${
                  insight.type === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                  insight.type === 'success' ? 'text-green-700 dark:text-green-300' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Spending Trend Chart */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Spending Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={spendingTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              stroke="#94a3b8"
            />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
              labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
            />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#6366f1" name="Daily Spend" strokeWidth={2} />
            <Line type="monotone" dataKey="cumulative" stroke="#14b8a6" name="Cumulative" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Category Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.category}: ${entry.percentage.toFixed(0)}%`}
                outerRadius={100}
                dataKey="amount"
              >
                {categoryBreakdown.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Table */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Category Details</h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{cat.category}</p>
                    <p className="text-xs text-slate-500">
                      {cat.count} {cat.count === 1 ? 'expense' : 'expenses'} • Avg: ${cat.averagePerExpense.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">${cat.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{cat.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-Person Spending */}
      {personSpending.length > 0 && (
        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Spending by Person</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={personSpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="userName" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="totalSpent" fill="#6366f1" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
};

export default AnalyticsTab;
