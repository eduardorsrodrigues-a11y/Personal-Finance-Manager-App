import { describe, it, expect } from 'vitest';
import { getCategoryConfig, CATEGORY_CONFIG } from '../app/utils/categoryConfig';

describe('getCategoryConfig', () => {
  it('returns config for every defined category', () => {
    for (const category of Object.keys(CATEGORY_CONFIG)) {
      const config = getCategoryConfig(category);
      expect(config).toBeDefined();
      expect(config.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.bg).toBeTruthy();
      expect(config.text).toBeTruthy();
      expect(config.icon).toBeDefined();
    }
  });

  it('returns a fallback for an unknown category', () => {
    const config = getCategoryConfig('__nonexistent__');
    expect(config).toBeDefined();
    expect(config.hex).toBe('#6b7280'); // fallback gray
  });

  it('returns the same object reference for repeated calls (no allocation)', () => {
    expect(getCategoryConfig('Food')).toBe(getCategoryConfig('Food'));
  });
});
