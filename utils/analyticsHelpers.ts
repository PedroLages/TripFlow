/**
 * Analytics Helpers
 *
 * Utilities for calculating spending trends, patterns, and insights from expenses
 */

import { differenceInDays, parseISO, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { Expense, Trip, Collaborator } from '../types';

/**
 * Spending by category breakdown
 */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  averagePerExpense: number;
}

/**
 * Daily spending data point
 */
export interface DailySpending {
  date: string;
  amount: number;
  count: number;
  expenses: Expense[];
}

/**
 * Per-person spending summary
 */
export interface PersonSpending {
  userId: string;
  userName: string;
  totalSpent: number;
  expenseCount: number;
  averageExpense: number;
  categoryBreakdown: CategoryBreakdown[];
}

/**
 * Spending trend data
 */
export interface SpendingTrend {
  period: string;
  amount: number;
  cumulative: number;
}

/**
 * Calculate category breakdown from expenses
 *
 * @param expenses - Array of expenses
 * @returns Category breakdown with amounts and percentages
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown[] {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryMap = new Map<string, { amount: number; count: number }>();

  expenses.forEach(exp => {
    const existing = categoryMap.get(exp.category) || { amount: 0, count: 0 };
    categoryMap.set(exp.category, {
      amount: existing.amount + exp.amount,
      count: existing.count + 1,
    });
  });

  const breakdown: CategoryBreakdown[] = [];

  categoryMap.forEach((value, category) => {
    breakdown.push({
      category,
      amount: value.amount,
      count: value.count,
      percentage: total > 0 ? (value.amount / total) * 100 : 0,
      averagePerExpense: value.count > 0 ? value.amount / value.count : 0,
    });
  });

  // Sort by amount descending
  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate daily spending breakdown
 *
 * @param trip - Trip object with expenses
 * @returns Daily spending data
 */
export function calculateDailySpending(trip: Trip): DailySpending[] {
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate);

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const dailyMap = new Map<string, { amount: number; expenses: Expense[] }>();

  // Initialize all days with zero
  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    dailyMap.set(dateKey, { amount: 0, expenses: [] });
  });

  // Populate with actual expenses
  trip.expenses.forEach(exp => {
    const dateKey = exp.date;
    const existing = dailyMap.get(dateKey) || { amount: 0, expenses: [] };
    dailyMap.set(dateKey, {
      amount: existing.amount + exp.amount,
      expenses: [...existing.expenses, exp],
    });
  });

  const dailySpending: DailySpending[] = [];

  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const data = dailyMap.get(dateKey)!;
    dailySpending.push({
      date: dateKey,
      amount: data.amount,
      count: data.expenses.length,
      expenses: data.expenses,
    });
  });

  return dailySpending;
}

/**
 * Calculate spending trend (cumulative over time)
 *
 * @param expenses - Array of expenses
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @returns Trend data with cumulative amounts
 */
export function calculateSpendingTrend(
  expenses: Expense[],
  startDate: string,
  endDate: string
): SpendingTrend[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const allDays = eachDayOfInterval({ start, end });

  let cumulative = 0;
  const trend: SpendingTrend[] = [];

  allDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayExpenses = expenses.filter(exp => exp.date === dateKey);
    const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    cumulative += dayTotal;

    trend.push({
      period: dateKey,
      amount: dayTotal,
      cumulative,
    });
  });

  return trend;
}

/**
 * Calculate per-person spending
 *
 * @param trip - Trip object
 * @returns Spending breakdown by person
 */
export function calculatePersonSpending(trip: Trip): PersonSpending[] {
  const allUsers = new Map<string, { name: string; expenses: Expense[] }>();

  // Initialize with collaborators
  trip.collaborators.forEach(collab => {
    allUsers.set(collab.email, {
      name: collab.email.split('@')[0],
      expenses: [],
    });
  });

  // Add owner
  if (!allUsers.has(trip.ownerEmail)) {
    allUsers.set(trip.ownerEmail, {
      name: 'Owner',
      expenses: [],
    });
  }

  // Group expenses by payer
  trip.expenses.forEach(exp => {
    if (exp.isSplit && exp.paidBy) {
      const user = allUsers.get(exp.paidBy);
      if (user) {
        user.expenses.push(exp);
      } else {
        allUsers.set(exp.paidBy, {
          name: exp.paidBy.split('@')[0],
          expenses: [exp],
        });
      }
    } else {
      // Personal expenses attributed to owner for now
      const user = allUsers.get(trip.ownerEmail);
      if (user) {
        user.expenses.push(exp);
      }
    }
  });

  const personSpending: PersonSpending[] = [];

  allUsers.forEach((userData, userId) => {
    if (userData.expenses.length === 0) return; // Skip users with no expenses

    const totalSpent = userData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = calculateCategoryBreakdown(userData.expenses);

    personSpending.push({
      userId,
      userName: userData.name,
      totalSpent,
      expenseCount: userData.expenses.length,
      averageExpense: userData.expenses.length > 0 ? totalSpent / userData.expenses.length : 0,
      categoryBreakdown,
    });
  });

  // Sort by total spent descending
  return personSpending.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Calculate spending insights and recommendations
 *
 * @param trip - Trip object
 * @returns Insights and recommendations
 */
export function calculateSpendingInsights(trip: Trip): {
  insights: Array<{ type: 'warning' | 'success' | 'info'; message: string }>;
  stats: {
    averageDailySpend: number;
    projectedTotal: number;
    biggestCategory: string;
    biggestExpense: Expense | null;
    budgetUtilization: number;
  };
} {
  const insights: Array<{ type: 'warning' | 'success' | 'info'; message: string }> = [];

  const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const tripDuration = Math.max(1, differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1);
  const averageDailySpend = totalSpent / tripDuration;
  const projectedTotal = averageDailySpend * tripDuration;
  const budgetUtilization = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;

  // Budget warnings
  if (budgetUtilization > 100) {
    insights.push({
      type: 'warning',
      message: `Over budget by $${(totalSpent - trip.budget).toFixed(2)} (${(budgetUtilization - 100).toFixed(0)}% over)`,
    });
  } else if (budgetUtilization > 80) {
    insights.push({
      type: 'warning',
      message: `Approaching budget limit: ${budgetUtilization.toFixed(0)}% used`,
    });
  } else if (budgetUtilization < 50) {
    insights.push({
      type: 'success',
      message: `Well within budget: ${budgetUtilization.toFixed(0)}% used`,
    });
  }

  // Category insights
  const categories = calculateCategoryBreakdown(trip.expenses);
  if (categories.length > 0) {
    const biggest = categories[0];
    if (biggest.percentage > 40) {
      insights.push({
        type: 'info',
        message: `${biggest.category} accounts for ${biggest.percentage.toFixed(0)}% of spending`,
      });
    }
  }

  // Spending pattern insights
  const dailySpending = calculateDailySpending(trip);
  const highSpendDays = dailySpending.filter(day => day.amount > averageDailySpend * 1.5);
  if (highSpendDays.length > 0) {
    insights.push({
      type: 'info',
      message: `${highSpendDays.length} days with above-average spending`,
    });
  }

  // Find biggest expense
  const biggestExpense = trip.expenses.length > 0
    ? trip.expenses.reduce((max, exp) => exp.amount > max.amount ? exp : max)
    : null;

  if (biggestExpense && biggestExpense.amount > averageDailySpend * 2) {
    insights.push({
      type: 'info',
      message: `Largest expense: ${biggestExpense.category} ($${biggestExpense.amount.toFixed(2)})`,
    });
  }

  return {
    insights,
    stats: {
      averageDailySpend,
      projectedTotal,
      biggestCategory: categories.length > 0 ? categories[0].category : 'N/A',
      biggestExpense,
      budgetUtilization,
    },
  };
}

/**
 * Compare spending across trips
 *
 * @param trips - Array of trips to compare
 * @returns Comparison data
 */
export function compareTrips(trips: Trip[]): Array<{
  tripId: string;
  tripName: string;
  totalSpent: number;
  daysCount: number;
  dailyAverage: number;
  expenseCount: number;
}> {
  return trips.map(trip => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const daysCount = Math.max(1, differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1);

    return {
      tripId: trip.id,
      tripName: trip.name,
      totalSpent,
      daysCount,
      dailyAverage: totalSpent / daysCount,
      expenseCount: trip.expenses.length,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}
