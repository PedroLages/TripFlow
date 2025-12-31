/**
 * Unit Tests for Export Helpers
 */

import { describe, it, expect } from 'vitest';
import { exportExpensesToCSV, exportTripSummaryToCSV } from './exportHelpers';
import type { Trip, Expense } from '../types';

const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'Flights',
    amount: 500.00,
    description: 'Flight to Paris',
    date: '2024-01-15',
    currency: 'USD',
    isSplit: false,
  },
  {
    id: '2',
    category: 'Accommodation',
    amount: 300.50,
    description: 'Hotel booking',
    date: '2024-01-16',
    currency: 'EUR',
    isSplit: false,
  },
];

const mockTrip: Trip = {
  id: 'trip1',
  name: 'Paris Adventure',
  destinations: ['Paris', 'Versailles'],
  startDate: '2024-01-15',
  endDate: '2024-01-17',
  budget: 1000,
  expenses: mockExpenses,
  itinerary: [
    {
      id: 'act1',
      title: 'Eiffel Tower Visit',
      date: '2024-01-15',
      time: '14:00',
      location: 'Eiffel Tower',
      description: 'Visit the iconic tower',
    },
  ],
  packingList: [
    {
      id: 'item1',
      item: 'Passport',
      category: 'Documents',
      quantity: 1,
      isPacked: true,
    },
  ],
  wishlist: [],
  collaborators: [],
  ownerEmail: 'test@example.com',
};

describe('exportHelpers', () => {
  describe('exportExpensesToCSV', () => {
    it('should include CSV headers', () => {
      const csv = exportExpensesToCSV(mockTrip);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('Date');
      expect(lines[0]).toContain('Category');
      expect(lines[0]).toContain('Description');
      expect(lines[0]).toContain('Amount');
      expect(lines[0]).toContain('Currency');
    });

    it('should export all expenses', () => {
      const csv = exportExpensesToCSV(mockTrip);
      const lines = csv.split('\n');

      // Header + 2 expenses = 3 lines
      expect(lines.length).toBe(3);
    });

    it('should include expense data', () => {
      const csv = exportExpensesToCSV(mockTrip);

      expect(csv).toContain('Flights');
      expect(csv).toContain('500.00');
      expect(csv).toContain('Flight to Paris');
      expect(csv).toContain('2024-01-15');
    });

    it('should escape CSV special characters', () => {
      const tripWithSpecialChars: Trip = {
        ...mockTrip,
        expenses: [
          {
            ...mockExpenses[0],
            description: 'Dinner, lunch, and breakfast',
          },
        ],
      };

      const csv = exportExpensesToCSV(tripWithSpecialChars);

      // Commas should be escaped with quotes
      expect(csv).toContain('"Dinner, lunch, and breakfast"');
    });

    it('should handle empty expenses', () => {
      const emptyTrip: Trip = {
        ...mockTrip,
        expenses: [],
      };

      const csv = exportExpensesToCSV(emptyTrip);
      const lines = csv.split('\n');

      // Should only have header
      expect(lines.length).toBe(1);
    });

    it('should include currency information', () => {
      const csv = exportExpensesToCSV(mockTrip);

      expect(csv).toContain('USD');
      expect(csv).toContain('EUR');
    });

    it('should format amounts to 2 decimal places', () => {
      const csv = exportExpensesToCSV(mockTrip);

      expect(csv).toContain('500.00');
      expect(csv).toContain('300.50');
    });
  });

  describe('exportTripSummaryToCSV', () => {
    it('should include trip information section', () => {
      const csv = exportTripSummaryToCSV(mockTrip);

      expect(csv).toContain('TRIP INFORMATION');
      expect(csv).toContain('Paris Adventure');
      expect(csv).toContain('Paris, Versailles');
      expect(csv).toContain('2024-01-15');
      expect(csv).toContain('2024-01-17');
    });

    it('should include budget and total spent', () => {
      const csv = exportTripSummaryToCSV(mockTrip);

      expect(csv).toContain('Budget');
      expect(csv).toContain('$1,000.00');
      expect(csv).toContain('Total Spent');
      expect(csv).toContain('$800.50');
    });

    it('should include expenses section', () => {
      const csv = exportTripSummaryToCSV(mockTrip);

      expect(csv).toContain('EXPENSES');
      expect(csv).toContain('Flights');
      expect(csv).toContain('Accommodation');
    });

    it('should include itinerary section when present', () => {
      const csv = exportTripSummaryToCSV(mockTrip);

      expect(csv).toContain('ITINERARY');
      expect(csv).toContain('Eiffel Tower Visit');
      expect(csv).toContain('14:00');
    });

    it('should include packing list section when present', () => {
      const csv = exportTripSummaryToCSV(mockTrip);

      expect(csv).toContain('PACKING LIST');
      expect(csv).toContain('Passport');
      expect(csv).toContain('Documents');
      expect(csv).toContain('Yes'); // isPacked = true
    });

    it('should skip empty sections', () => {
      const minimalTrip: Trip = {
        ...mockTrip,
        itinerary: [],
        packingList: [],
      };

      const csv = exportTripSummaryToCSV(minimalTrip);

      expect(csv).not.toContain('ITINERARY');
      expect(csv).not.toContain('PACKING LIST');
    });

    it('should escape special characters in trip data', () => {
      const tripWithSpecialChars: Trip = {
        ...mockTrip,
        name: 'Trip, Paris "City of Light"',
      };

      const csv = exportTripSummaryToCSV(tripWithSpecialChars);

      expect(csv).toContain('"Trip, Paris ""City of Light"""');
    });

    it('should have proper section spacing', () => {
      const csv = exportTripSummaryToCSV(mockTrip);
      const lines = csv.split('\n');

      // Sections should be separated by empty lines
      const emptyLines = lines.filter(line => line.trim() === '');
      expect(emptyLines.length).toBeGreaterThan(0);
    });
  });
});
