/**
 * Unit Tests for Analytics Helpers
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCategoryBreakdown,
  calculateDailySpending,
  calculateSpendingTrend,
  calculatePersonSpending,
  calculateSpendingInsights,
  compareTrips,
} from './analyticsHelpers';
import type { Trip, Expense } from '../types';

// Mock expenses for testing
const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'Flights',
    amount: 500,
    description: 'Flight to Paris',
    date: '2024-01-15',
    currency: 'USD',
    isSplit: false,
  },
  {
    id: '2',
    category: 'Accommodation',
    amount: 300,
    description: 'Hotel',
    date: '2024-01-16',
    currency: 'USD',
    isSplit: false,
  },
  {
    id: '3',
    category: 'Food',
    amount: 100,
    description: 'Dinner',
    date: '2024-01-16',
    currency: 'USD',
    isSplit: false,
  },
  {
    id: '4',
    category: 'Food',
    amount: 50,
    description: 'Lunch',
    date: '2024-01-17',
    currency: 'USD',
    isSplit: false,
  },
];

const mockTrip: Trip = {
  id: 'trip1',
  name: 'Paris Adventure',
  destinations: ['Paris'],
  startDate: '2024-01-15',
  endDate: '2024-01-17',
  budget: 1000,
  expenses: mockExpenses,
  itinerary: [],
  packingList: [],
  wishlist: [],
  collaborators: [],
  ownerEmail: 'test@example.com',
};

describe('analyticsHelpers', () => {
  describe('calculateCategoryBreakdown', () => {
    it('should correctly calculate category totals', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);

      expect(breakdown).toHaveLength(3);
      expect(breakdown[0].category).toBe('Flights');
      expect(breakdown[0].amount).toBe(500);
      expect(breakdown[1].category).toBe('Accommodation');
      expect(breakdown[1].amount).toBe(300);
    });

    it('should calculate percentages correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const total = 950; // 500 + 300 + 100 + 50

      expect(breakdown[0].percentage).toBeCloseTo((500 / total) * 100, 2);
      expect(breakdown[1].percentage).toBeCloseTo((300 / total) * 100, 2);
    });

    it('should calculate expense counts', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const foodCategory = breakdown.find(b => b.category === 'Food');

      expect(foodCategory?.count).toBe(2);
      expect(foodCategory?.amount).toBe(150);
    });

    it('should calculate average per expense', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const foodCategory = breakdown.find(b => b.category === 'Food');

      expect(foodCategory?.averagePerExpense).toBe(75);
    });

    it('should handle empty expenses array', () => {
      const breakdown = calculateCategoryBreakdown([]);

      expect(breakdown).toEqual([]);
    });

    it('should sort by amount descending', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);

      for (let i = 0; i < breakdown.length - 1; i++) {
        expect(breakdown[i].amount).toBeGreaterThanOrEqual(breakdown[i + 1].amount);
      }
    });
  });

  describe('calculateDailySpending', () => {
    it('should include all days in trip range', () => {
      const dailySpending = calculateDailySpending(mockTrip);

      expect(dailySpending).toHaveLength(3); // Jan 15-17 = 3 days
      expect(dailySpending[0].date).toBe('2024-01-15');
      expect(dailySpending[1].date).toBe('2024-01-16');
      expect(dailySpending[2].date).toBe('2024-01-17');
    });

    it('should calculate daily totals correctly', () => {
      const dailySpending = calculateDailySpending(mockTrip);

      expect(dailySpending[0].amount).toBe(500); // Day 1: Flight
      expect(dailySpending[1].amount).toBe(400); // Day 2: Hotel + Dinner
      expect(dailySpending[2].amount).toBe(50);  // Day 3: Lunch
    });

    it('should group expenses by date', () => {
      const dailySpending = calculateDailySpending(mockTrip);

      expect(dailySpending[0].count).toBe(1);
      expect(dailySpending[1].count).toBe(2);
      expect(dailySpending[2].count).toBe(1);
    });

    it('should handle days with no expenses', () => {
      const trip: Trip = {
        ...mockTrip,
        startDate: '2024-01-15',
        endDate: '2024-01-20',
      };

      const dailySpending = calculateDailySpending(trip);

      expect(dailySpending).toHaveLength(6);
      expect(dailySpending[3].amount).toBe(0);
      expect(dailySpending[4].amount).toBe(0);
    });
  });

  describe('calculateSpendingTrend', () => {
    it('should calculate cumulative spending', () => {
      const trend = calculateSpendingTrend(
        mockExpenses,
        '2024-01-15',
        '2024-01-17'
      );

      expect(trend[0].cumulative).toBe(500);
      expect(trend[1].cumulative).toBe(900); // 500 + 400
      expect(trend[2].cumulative).toBe(950); // 900 + 50
    });

    it('should calculate daily amounts', () => {
      const trend = calculateSpendingTrend(
        mockExpenses,
        '2024-01-15',
        '2024-01-17'
      );

      expect(trend[0].amount).toBe(500);
      expect(trend[1].amount).toBe(400);
      expect(trend[2].amount).toBe(50);
    });

    it('should include all days in range', () => {
      const trend = calculateSpendingTrend(
        mockExpenses,
        '2024-01-15',
        '2024-01-17'
      );

      expect(trend).toHaveLength(3);
      expect(trend[0].period).toBe('2024-01-15');
      expect(trend[2].period).toBe('2024-01-17');
    });
  });

  describe('calculateSpendingInsights', () => {
    it('should calculate average daily spend', () => {
      const { stats } = calculateSpendingInsights(mockTrip);

      // 950 total / 3 days = 316.67
      expect(stats.averageDailySpend).toBeCloseTo(316.67, 2);
    });

    it('should identify biggest category', () => {
      const { stats } = calculateSpendingInsights(mockTrip);

      expect(stats.biggestCategory).toBe('Flights');
    });

    it('should calculate budget utilization', () => {
      const { stats } = calculateSpendingInsights(mockTrip);

      // 950 / 1000 = 95%
      expect(stats.budgetUtilization).toBe(95);
    });

    it('should generate warning when over budget', () => {
      const overBudgetTrip: Trip = {
        ...mockTrip,
        budget: 500,
      };

      const { insights } = calculateSpendingInsights(overBudgetTrip);

      const overBudgetInsight = insights.find(i => i.type === 'warning' && i.message.includes('Over budget'));
      expect(overBudgetInsight).toBeDefined();
    });

    it('should generate warning when approaching budget', () => {
      const nearBudgetTrip: Trip = {
        ...mockTrip,
        budget: 1000,
      };

      const { insights } = calculateSpendingInsights(nearBudgetTrip);

      const approachingInsight = insights.find(i => i.type === 'warning' && i.message.includes('Approaching budget'));
      expect(approachingInsight).toBeDefined();
    });

    it('should generate success when well within budget', () => {
      const wellWithinBudgetTrip: Trip = {
        ...mockTrip,
        budget: 2000,
      };

      const { insights } = calculateSpendingInsights(wellWithinBudgetTrip);

      const successInsight = insights.find(i => i.type === 'success');
      expect(successInsight).toBeDefined();
    });

    it('should identify dominant category spending', () => {
      const { insights } = calculateSpendingInsights(mockTrip);

      const categoryInsight = insights.find(i =>
        i.message.includes('Flights') && i.message.includes('%')
      );
      expect(categoryInsight).toBeDefined();
    });
  });

  describe('compareTrips', () => {
    it('should calculate totals for each trip', () => {
      const trips: Trip[] = [
        mockTrip,
        {
          ...mockTrip,
          id: 'trip2',
          name: 'London Trip',
          expenses: [
            { ...mockExpenses[0], amount: 600 },
            { ...mockExpenses[1], amount: 400 },
          ],
        },
      ];

      const comparison = compareTrips(trips);

      expect(comparison[0].totalSpent).toBe(1000);
      expect(comparison[1].totalSpent).toBe(950);
    });

    it('should calculate daily averages', () => {
      const trips: Trip[] = [mockTrip];

      const comparison = compareTrips(trips);

      // 950 total / 3 days = 316.67
      expect(comparison[0].dailyAverage).toBeCloseTo(316.67, 2);
    });

    it('should sort by total spent descending', () => {
      const trips: Trip[] = [
        mockTrip,
        {
          ...mockTrip,
          id: 'trip2',
          expenses: [{ ...mockExpenses[0], amount: 1200 }],
        },
      ];

      const comparison = compareTrips(trips);

      expect(comparison[0].totalSpent).toBeGreaterThan(comparison[1].totalSpent);
    });

    it('should handle empty trips array', () => {
      const comparison = compareTrips([]);

      expect(comparison).toEqual([]);
    });
  });
});
