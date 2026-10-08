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

  // MMM-V2-3JQ: fetchJson bounds each attempt with AbortSignal.timeout(),
  // whose rejection is a DOMException named TimeoutError, not AbortError.
  it('returns true for the TimeoutError an AbortSignal.timeout() rejects with', async () => {
    const signal = AbortSignal.timeout(0);
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });

    expect(signal.reason).toBeInstanceOf(Error);
    expect((signal.reason as Error).name).toBe('TimeoutError');
    expect(isFetchNetworkError(signal.reason)).toBe(true);
  });

  it('returns true for known network error codes', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });
    expect(isFetchNetworkError(error)).toBe(true);
  });

  it.each<{ error: () => Error; expected: boolean; name: string }>([
    {
      error: () =>
        Object.assign(new Error('Failed to fetch'), { name: 'TypeError' }),
      expected: true,
      name: 'a bare browser "Failed to fetch" TypeError',
    },
    {
      error: () =>
        Object.assign(new Error('Failed to fetch (b.some-cdn.org)'), {
          name: 'TypeError',
        }),
      expected: true,
      name: 'a "Failed to fetch" TypeError with a host suffix',
    },
    {
      error: () =>
        Object.assign(new Error('Cannot read properties of undefined'), {
          name: 'TypeError',
        }),
      expected: false,
      name: 'a TypeError with an unrelated message',
    },
    {
      error: () =>
        Object.assign(
          new Error(
            "Failed to execute 'json' on 'Response': Unexpected end of JSON input",
          ),
          { name: 'SyntaxError' },
        ),
      expected: true,
      name: 'a SyntaxError from an empty/truncated JSON response body',
    },
    {
      error: () =>
        Object.assign(new Error('Unexpected token < in JSON at position 0'), {
          name: 'SyntaxError',
        }),
      expected: true,
      name: 'a SyntaxError from an HTML response body (older V8 message format)',
    },
    {
      error: () =>
        Object.assign(
          new Error(
            "Failed to execute 'json' on 'Response': Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON",
          ),
          { name: 'SyntaxError' },
        ),
      expected: true,
      name: 'a SyntaxError from an HTML response body (newer V8 message format)',
    },
    {
      error: () =>
        Object.assign(new Error('Unexpected token } in JSON at position 12'), {
          name: 'SyntaxError',
        }),
      expected: false,
      name: 'a SyntaxError with an unrelated message',
    },
    {
      error: () => new Error('fetch failed', { cause: { code: 'ENOTFOUND' } }),
      expected: true,
      name: 'undici "fetch failed" with a network-error cause',
    },
    {
      error: () =>
        new Error('fetch failed', { cause: { code: 'SOME_OTHER_CODE' } }),
      expected: false,
      name: '"fetch failed" with an unrelated cause',
    },
  ])('returns $expected for $name', ({ error, expected }) => {
    expect(isFetchNetworkError(error())).toBe(expected);
  });
});
