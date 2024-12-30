import { describe, expect, it } from 'vitest';

import { camelToKebabCase, kebabToCamelCase } from '../general';

describe('camelToKebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(camelToKebabCase('camelCaseString')).toBe('camel-case-string');
  });
});

describe('kebabToCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(kebabToCamelCase('kebab-case-string')).toBe('kebabCaseString');
  });
});
