import { VALID_CATEGORIES } from './categories.js';

/** Thrown when input validation fails. Handlers should catch this and return 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Validates that val is a non-empty string, optionally bounded to maxLen chars. */
export function requireString(val: unknown, field: string, maxLen = 500): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string.`);
  }
  if (val.trim().length > maxLen) {
    throw new ValidationError(`${field} must be at most ${maxLen} characters.`);
  }
  return val.trim();
}

/** Validates that val is a finite positive number within a sane monetary range. */
export function requireAmount(val: unknown): number {
  const n = typeof val === 'number' ? val : parseFloat(val as string);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) {
    throw new ValidationError('amount must be a number between 0.01 and 1,000,000.');
  }
  return n;
}

/** Validates that val is 'income' or 'expense'. */
export function requireTransactionType(val: unknown): 'income' | 'expense' {
  if (val !== 'income' && val !== 'expense') {
    throw new ValidationError("type must be 'income' or 'expense'.");
  }
  return val;
}

/**
 * Validates that val is a parseable date string and not more than
 * 50 years in the future (guards against junk values).
 */
export function requireDate(val: unknown): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ValidationError('date is required.');
  }
  const parsed = new Date(val.trim());
  if (isNaN(parsed.getTime())) {
    throw new ValidationError('date is not a valid date.');
  }
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 50);
  if (parsed > maxFuture) {
    throw new ValidationError('date is too far in the future.');
  }
  return val.trim();
}

/** Validates that val is a known category name. */
export function requireCategory(val: unknown): string {
  if (typeof val !== 'string' || !VALID_CATEGORIES.has(val)) {
    throw new ValidationError(`category '${val}' is not valid.`);
  }
  return val;
}
