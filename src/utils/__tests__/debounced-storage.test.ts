import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDebouncedStorage } from '../debounced-storage';

describe('createDebouncedStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('collapses rapid setItem calls into a single trailing write', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    const debounced = createDebouncedStorage(storage, 500);

    debounced.setItem('jw-store', 'v1');
    debounced.setItem('jw-store', 'v2');
    debounced.setItem('jw-store', 'v3');

    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith('jw-store', 'v3');
  });

  it('delegates getItem synchronously for hydration', () => {
    const storage = {
      getItem: vi.fn(() => 'stored'),
      setItem: vi.fn(),
    };
    const debounced = createDebouncedStorage(storage, 500);

    expect(debounced.getItem('jw-store')).toBe('stored');
    expect(storage.getItem).toHaveBeenCalledWith('jw-store');
  });

  it('flush writes the latest pending value immediately and is idempotent', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    const debounced = createDebouncedStorage(storage, 500);

    debounced.setItem('jw-store', 'v1');
    debounced.setItem('jw-store', 'v2');
    debounced.flush();

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith('jw-store', 'v2');

    debounced.flush();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('does not write again after flush when nothing new is pending', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    const debounced = createDebouncedStorage(storage, 500);

    debounced.setItem('jw-store', 'v1');
    debounced.flush();
    vi.advanceTimersByTime(1000);

    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});
