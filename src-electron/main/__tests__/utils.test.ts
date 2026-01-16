import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    getVersion: vi.fn(),
  },
}));

vi.mock('@sentry/electron/main', () => ({
  captureException: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  urlVariables: {},
}));

vi.mock('is-online', () => ({
  default: vi.fn(),
}));

vi.mock('app/package.json', () => ({
  version: '1.0.0',
}));

import { isIgnoredUpdateError } from '../utils';

describe('isIgnoredUpdateError', () => {
  it('should return true for ERR_NETWORK_CHANGED', () => {
    expect(isIgnoredUpdateError('net::ERR_NETWORK_CHANGED')).toBe(true);
    expect(isIgnoredUpdateError(new Error('net::ERR_NETWORK_CHANGED'))).toBe(
      true,
    );
    expect(
      isIgnoredUpdateError(
        new Error('something else'),
        'Error: net::ERR_NETWORK_CHANGED',
      ),
    ).toBe(true);
  });

  it('should return true for other ignored errors', () => {
    expect(isIgnoredUpdateError('ECONNRESET')).toBe(true);
    expect(isIgnoredUpdateError('HttpError: 404')).toBe(true);
    expect(isIgnoredUpdateError('504 Gateway Time-out')).toBe(true);
    expect(isIgnoredUpdateError('net::ERR_CONNECTION_CLOSED')).toBe(true);
    expect(
      isIgnoredUpdateError(
        "Error: ENOENT: no such file or directory, unlink '/home/test/dir/meeting-media-manager-30.1.4-x86_64.AppImage'",
      ),
    ).toBe(true);
  });

  it('should return false for non-ignored errors', () => {
    expect(isIgnoredUpdateError('Unknown error')).toBe(false);
    expect(isIgnoredUpdateError(new Error('Fatal exception'))).toBe(false);
  });

  it('should handle error objects with codes', () => {
    const error = new Error('Some error') as { code?: string };
    error.code = 'ECONNRESET';
    expect(isIgnoredUpdateError(error)).toBe(true);
  });

  it('should return true for YAMLException based on error name', () => {
    // Simulate the actual YAMLException from the Sentry report
    const error = new Error(
      'null byte is not allowed in input (1:1)\n\n 1 | \n-----^\n 2 | \n 3 | ',
    );
    error.name = 'YAMLException';
    expect(isIgnoredUpdateError(error)).toBe(true);
  });
});
