import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  requireString,
  requireAmount,
  requireTransactionType,
  requireDate,
  requireCategory,
} from '../../api/_lib/validate.js';

describe('requireString', () => {
  it('accepts a valid string', () => {
    expect(requireString('hello', 'field')).toBe('hello');
  });

  it('trims whitespace', () => {
    expect(requireString('  hello  ', 'field')).toBe('hello');
  });

  it('throws on empty string', () => {
    expect(() => requireString('', 'name')).toThrow(ValidationError);
  });

  it('throws on whitespace-only string', () => {
    expect(() => requireString('   ', 'name')).toThrow(ValidationError);
  });

  it('throws on non-string', () => {
    expect(() => requireString(123, 'field')).toThrow(ValidationError);
    expect(() => requireString(null, 'field')).toThrow(ValidationError);
  });

  it('throws when exceeding maxLen', () => {
    expect(() => requireString('a'.repeat(501), 'description')).toThrow(ValidationError);
  });

  it('accepts a string at exactly maxLen', () => {
    expect(() => requireString('a'.repeat(500), 'description')).not.toThrow();
  });
});

describe('requireAmount', () => {
  it('accepts a valid positive number', () => {
    expect(requireAmount(25.5)).toBe(25.5);
  });

  it('accepts a numeric string', () => {
    expect(requireAmount('25.50')).toBe(25.5);
  });

  it('throws on zero', () => {
    expect(() => requireAmount(0)).toThrow(ValidationError);
  });

  it('throws on negative', () => {
    expect(() => requireAmount(-1)).toThrow(ValidationError);
  });

  it('throws over 1,000,000', () => {
    expect(() => requireAmount(1_000_001)).toThrow(ValidationError);
  });

  it('accepts exactly 1,000,000', () => {
    expect(requireAmount(1_000_000)).toBe(1_000_000);
  });

  it('throws on NaN', () => {
    expect(() => requireAmount('abc')).toThrow(ValidationError);
  });
});

describe('requireTransactionType', () => {
  it('accepts income', () => expect(requireTransactionType('income')).toBe('income'));
  it('accepts expense', () => expect(requireTransactionType('expense')).toBe('expense'));
  it('throws on invalid type', () => {
    expect(() => requireTransactionType('transfer')).toThrow(ValidationError);
    expect(() => requireTransactionType('')).toThrow(ValidationError);
    expect(() => requireTransactionType(null)).toThrow(ValidationError);
  });
});

describe('requireDate', () => {
  it('accepts a valid ISO date', () => {
    expect(requireDate('2025-06-15')).toBe('2025-06-15');
  });

  it('accepts a valid datetime string', () => {
    expect(() => requireDate('2025-06-15T10:30:00Z')).not.toThrow();
  });

  it('throws on empty string', () => {
    expect(() => requireDate('')).toThrow(ValidationError);
  });

  it('throws on non-date string', () => {
    expect(() => requireDate('not-a-date')).toThrow(ValidationError);
  });

  it('throws on non-string', () => {
    expect(() => requireDate(null)).toThrow(ValidationError);
  });

  it('throws on date >50 years in the future', () => {
    expect(() => requireDate('2200-01-01')).toThrow(ValidationError);
  });
});

describe('requireCategory', () => {
  it('accepts a known category', () => {
    expect(requireCategory('Food')).toBe('Food');
    expect(requireCategory('Salary')).toBe('Salary');
    expect(requireCategory('Other')).toBe('Other');
  });

  it('throws on an unknown category', () => {
    expect(() => requireCategory('Gambling')).toThrow(ValidationError);
    expect(() => requireCategory('')).toThrow(ValidationError);
    expect(() => requireCategory(null)).toThrow(ValidationError);
  });
});
