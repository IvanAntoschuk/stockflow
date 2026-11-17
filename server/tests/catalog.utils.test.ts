import { describe, expect, it } from 'vitest';
import { buildMeta, optionalText } from '../src/modules/catalog/catalog.utils.js';

describe('buildMeta', () => {
  it('returns zero totalPages for an empty result set', () => {
    expect(buildMeta(1, 10, 0)).toEqual({
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('rounds totalPages up for partial pages', () => {
    expect(buildMeta(1, 10, 25)).toEqual({
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('handles exact multiples and preserves the requested page', () => {
    expect(buildMeta(2, 10, 20)).toEqual({
      page: 2,
      pageSize: 10,
      total: 20,
      totalPages: 2,
    });
  });
});

describe('optionalText', () => {
  it('trims surrounding whitespace', () => {
    expect(optionalText('  hello  ')).toBe('hello');
  });

  it('converts blank strings to null', () => {
    expect(optionalText('')).toBeNull();
    expect(optionalText('   ')).toBeNull();
  });

  it('passes through null and undefined as null', () => {
    expect(optionalText(null)).toBeNull();
    expect(optionalText(undefined)).toBeNull();
  });
});
