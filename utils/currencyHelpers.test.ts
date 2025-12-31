/**
 * Unit Tests for Currency Helpers
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, convertCurrencyStatic, SUPPORTED_CURRENCIES } from './currencyHelpers';

describe('currencyHelpers', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });

    it('should format GBP correctly', () => {
      const result = formatCurrency(1234.56, 'GBP');
      expect(result).toBe('£1,234.56');
    });

    it('should format JPY correctly', () => {
      const result = formatCurrency(1234, 'JPY');
      expect(result).toBe('¥1,234.00');
    });

    it('should handle zero amounts', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100.50, 'USD');
      expect(result).toBe('-$100.50');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(1.999, 'USD');
      expect(result).toBe('$2.00');
    });

    it('should default to USD if currency not specified', () => {
      const result = formatCurrency(100);
      expect(result).toContain('$');
    });
  });

  describe('convertCurrencyStatic', () => {
    it('should return same amount for same currency', () => {
      const result = convertCurrencyStatic(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should convert USD to EUR correctly', () => {
      const result = convertCurrencyStatic(100, 'USD', 'EUR');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100); // EUR is typically less than 1:1
    });

    it('should convert USD to GBP correctly', () => {
      const result = convertCurrencyStatic(100, 'USD', 'GBP');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100); // GBP is typically less than 1:1
    });

    it('should convert EUR to USD correctly', () => {
      const result = convertCurrencyStatic(100, 'EUR', 'USD');
      expect(result).toBeGreaterThan(100); // EUR is stronger than USD
    });

    it('should round to 2 decimal places', () => {
      const result = convertCurrencyStatic(100, 'USD', 'EUR');
      const decimals = result.toString().split('.')[1];
      expect(decimals ? decimals.length : 0).toBeLessThanOrEqual(2);
    });

    it('should handle zero amounts', () => {
      const result = convertCurrencyStatic(0, 'USD', 'EUR');
      expect(result).toBe(0);
    });

    it('should return original amount for unsupported currency conversion', () => {
      const result = convertCurrencyStatic(100, 'USD', 'ZZZ' as any);
      expect(result).toBe(100);
    });

    it('should be commutative (reverse conversion should be inverse)', () => {
      const usdToEur = convertCurrencyStatic(100, 'USD', 'EUR');
      const eurToUsd = convertCurrencyStatic(usdToEur, 'EUR', 'USD');

      // Should be approximately 100 (within rounding tolerance)
      expect(eurToUsd).toBeCloseTo(100, 0);
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('should be an array of currencies', () => {
      expect(Array.isArray(SUPPORTED_CURRENCIES)).toBe(true);
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(0);
    });

    it('should include USD', () => {
      const usd = SUPPORTED_CURRENCIES.find(c => c.code === 'USD');

      expect(usd).toBeDefined();
      expect(usd?.name).toBe('US Dollar');
      expect(usd?.symbol).toBe('$');
    });

    it('should include EUR', () => {
      const eur = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR');

      expect(eur).toBeDefined();
      expect(eur?.name).toBe('Euro');
      expect(eur?.symbol).toBe('€');
    });

    it('should include GBP', () => {
      const gbp = SUPPORTED_CURRENCIES.find(c => c.code === 'GBP');

      expect(gbp).toBeDefined();
      expect(gbp?.name).toBe('British Pound');
      expect(gbp?.symbol).toBe('£');
    });

    it('should have currencies with required properties', () => {
      SUPPORTED_CURRENCIES.forEach(currency => {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.name).toBe('string');
        expect(typeof currency.symbol).toBe('string');
      });
    });

    it('should have unique currency codes', () => {
      const codes = SUPPORTED_CURRENCIES.map(c => c.code);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });
  });
});
