import { describe, expect, it } from 'vitest';

import {
  camelToKebabCase,
  capitalize,
  getPreviousVersion,
  isEmpty,
  isUUID,
  isVersionWithinBounds,
  kebabToCamelCase,
  pad,
  parseJsonSafe,
  parseVersion,
  sanitizeId,
  sortByVersion,
  uuid,
} from '../general';

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

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('a title')).toBe('A title');
  });
});

describe('isEmpty', () => {
  it('should check if a value is empty', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('string')).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('sanitizeId', () => {
  it('should sanitize an id', () => {
    expect(sanitizeId('Figure_: "2-persons!".')).toBe('Figure_:__2-persons__.');
  });
});

describe('parseVersion', () => {
  it('should parse a version string', () => {
    expect(parseVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: undefined,
      prereleaseVersion: 0,
    });
    expect(parseVersion('24.10.0-alpha.11')).toEqual({
      major: 24,
      minor: 10,
      patch: 0,
      prerelease: 'alpha',
      prereleaseVersion: 11,
    });
    expect(parseVersion('1.2.3-beta.0')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'beta',
      prereleaseVersion: 0,
    });
  });
});

describe('getPreviousVersion', () => {
  it('should get the previous version', () => {
    expect(getPreviousVersion('1.2.3')).toBe('1.2.3-rc.999');
    expect(getPreviousVersion('1.2.3-rc.1')).toBe('1.2.3-rc.0');
    expect(getPreviousVersion('1.2.3-rc.0')).toBe('1.2.3-beta.999');
    expect(getPreviousVersion('1.2.3-beta.0')).toBe('1.2.3-alpha.999');
    expect(getPreviousVersion('1.2.3-alpha.0')).toBe('1.2.2');
    expect(getPreviousVersion('1.2.0-alpha.0')).toBe('1.1.999');
  });
});

describe('isVersionWithinBounds', () => {
  it('should check if a version is within bounds', () => {
    expect(isVersionWithinBounds('1.2.3', '1.2.3', '1.2.3')).toBe(true);
    expect(isVersionWithinBounds('1.2.3', '1.2.3', '1.2.4')).toBe(true);
    expect(isVersionWithinBounds('1.2.3', '1.2.2', '1.2.3')).toBe(true);
    expect(isVersionWithinBounds('1.2.3', '1.2.4', '1.2.5')).toBe(false);
    expect(isVersionWithinBounds('1.2.3-beta.0', '1.2.2', '1.2.3')).toBe(true);
    expect(isVersionWithinBounds('1.2.3-beta.0', '1.2.3', '1.2.4')).toBe(false);
    expect(
      isVersionWithinBounds('1.2.3-beta.0', '1.2.3-beta.0', '1.2.3-beta.0'),
    ).toBe(true);
    expect(
      isVersionWithinBounds('1.2.3-beta.0', '1.2.3-beta.0', '1.2.3-beta.1'),
    ).toBe(true);
    expect(isVersionWithinBounds('1.2.3-beta.1', '1.2.3-beta.0', '1.2.3')).toBe(
      true,
    );
  });
});

describe('sortByVersion', () => {
  it('should sort versions', () => {
    expect(sortByVersion('1.2.3', '1.2.3')).toBe(0);
    expect(sortByVersion('1.2.3', '1.2.4')).toBe(-1);
    expect(sortByVersion('1.2.4', '1.2.3')).toBe(1);
    expect(sortByVersion('1.2.3', '1.2.3-alpha.0')).toBe(1);
    expect(sortByVersion('1.2.3-alpha.0', '1.2.3')).toBe(-1);
    expect(sortByVersion('1.2.3-alpha.0', '1.2.3-alpha.1')).toBe(-1);
    expect(sortByVersion('1.2.3-alpha.1', '1.2.3-alpha.0')).toBe(1);
    expect(sortByVersion('1.2.3-alpha.0', '1.2.3-beta.0')).toBe(-1);
    expect(sortByVersion('1.2.3-beta.0', '1.2.3-alpha.12')).toBe(1);
  });
});

describe('pad', () => {
  it('should pad a number', () => {
    expect(pad(1, 2)).toBe('01');
    expect(pad(10, 2)).toBe('10');
    expect(pad(100, 4, '.')).toBe('.100');
  });
});

describe('uuid', () => {
  it('should generate a UUID', () => {
    expect(isUUID(uuid())).toBe(true);
  });
});

describe('isUUID', () => {
  it('should check if a string is a UUID', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
    expect(isUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false);
  });
});

describe('parseJsonSafe', () => {
  it('should parse valid JSON', () => {
    expect(parseJsonSafe('{"key":"value"}', { fallback: true })).toEqual({
      key: 'value',
    });
  });

  it('should return the fallback value for invalid JSON', () => {
    expect(parseJsonSafe('invalid', { fallback: true })).toEqual({
      fallback: true,
    });
  });

  it('should return the fallback value for undefined JSON', () => {
    expect(parseJsonSafe(undefined, { fallback: true })).toEqual({
      fallback: true,
    });
  });
});
