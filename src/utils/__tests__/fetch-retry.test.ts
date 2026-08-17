import { describe, expect, it, vi } from 'vitest';

import { withFetchRetry } from '../fetch-retry';

const abortError = () =>
  Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
const nonNetworkError = () => new Error('Unexpected token in JSON');

describe('withFetchRetry', () => {
  it('returns the result on the first attempt when nothing fails', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(withFetchRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a network-classified error and succeeds on a later attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(abortError())
      .mockRejectedValueOnce(abortError())
      .mockResolvedValueOnce('ok');

    await expect(withFetchRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-network error', async () => {
    const error = nonNetworkError();
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withFetchRetry(fn)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries and rethrows the last network error', async () => {
    const errors = [abortError(), abortError(), abortError()];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(errors[0])
      .mockRejectedValueOnce(errors[1])
      .mockRejectedValueOnce(errors[2]);

    await expect(withFetchRetry(fn)).rejects.toBe(errors[2]);
    // Initial attempt + 2 retries = 3 total calls.
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('waits with backoff between retries', async () => {
    vi.useFakeTimers();
    try {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(abortError())
        .mockRejectedValueOnce(abortError())
        .mockResolvedValueOnce('ok');

      const promise = withFetchRetry(fn);

      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(300);
      expect(fn).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(600);
      expect(fn).toHaveBeenCalledTimes(3);

      await expect(promise).resolves.toBe('ok');
    } finally {
      vi.useRealTimers();
    }
  });
});
