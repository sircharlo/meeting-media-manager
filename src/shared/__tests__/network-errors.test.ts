import { describe, expect, it } from 'vitest';

import { isFetchNetworkError } from '../network-errors';

describe('isFetchNetworkError', () => {
  it('returns false for non-Error values', () => {
    expect(isFetchNetworkError('Failed to fetch')).toBe(false);
    expect(isFetchNetworkError(undefined)).toBe(false);
  });

  it('returns true for AbortError and ConnectTimeoutError', () => {
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';
    expect(isFetchNetworkError(abort)).toBe(true);

    const timeout = new Error('Connect timeout');
    timeout.name = 'ConnectTimeoutError';
    expect(isFetchNetworkError(timeout)).toBe(true);
  });

  it('returns true for known network error codes', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });
    expect(isFetchNetworkError(error)).toBe(true);
  });

  it('returns true for a bare browser "Failed to fetch" TypeError', () => {
    const error = new Error('Failed to fetch');
    error.name = 'TypeError';
    expect(isFetchNetworkError(error)).toBe(true);
  });

  it('returns false for a TypeError with an unrelated message', () => {
    const error = new Error('Cannot read properties of undefined');
    error.name = 'TypeError';
    expect(isFetchNetworkError(error)).toBe(false);
  });

  it('returns true for a SyntaxError from an empty/truncated JSON response body', () => {
    const error = new Error(
      "Failed to execute 'json' on 'Response': Unexpected end of JSON input",
    );
    error.name = 'SyntaxError';
    expect(isFetchNetworkError(error)).toBe(true);
  });

  it('returns false for a SyntaxError with an unrelated message', () => {
    const error = new Error('Unexpected token < in JSON at position 0');
    error.name = 'SyntaxError';
    expect(isFetchNetworkError(error)).toBe(false);
  });

  it('returns true for undici "fetch failed" with a network-error cause', () => {
    const error = new Error('fetch failed', {
      cause: { code: 'ENOTFOUND' },
    });
    expect(isFetchNetworkError(error)).toBe(true);
  });

  it('returns false for "fetch failed" with an unrelated cause', () => {
    const error = new Error('fetch failed', {
      cause: { code: 'SOME_OTHER_CODE' },
    });
    expect(isFetchNetworkError(error)).toBe(false);
  });
});
