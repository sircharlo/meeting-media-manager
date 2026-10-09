import { createPersistedPinia } from 'app/test/vitest/mocks/pinia';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shouldUpdateList, useJwStore } from '../jw';

describe('jw store persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    setActivePinia(createPersistedPinia());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('omits the Bible files cache and defers the write until the debounce settles', () => {
    const store = useJwStore();

    store.jwBibleFiles = { E: { list: [], updated: new Date() } };
    store.jwMepsLanguages = { list: [], updated: new Date() };
    store.lookupPeriod = {
      'cong-1': [
        { date: new Date('2026-08-14'), mediaSections: [], status: null },
      ],
    };
    store.jwIconsUrl = 'https://example.com/jw-icons.woff2';

    store.$persist();
    store.$persist();

    // The persistence write is debounced, so nothing is on disk yet.
    expect(localStorage.getItem('jw-store')).toBeNull();

    vi.advanceTimersByTime(500);

    const persisted = JSON.parse(localStorage.getItem('jw-store') || '{}');
    expect(persisted).not.toHaveProperty('jwBibleFiles');
    expect(persisted).toHaveProperty('lookupPeriod');
    expect(persisted.jwIconsUrl).toBe('https://example.com/jw-icons.woff2');
  });

  it('persists the MEPS language list so it is not rebuilt on every launch', () => {
    const store = useJwStore();
    const updated = new Date();

    store.jwMepsLanguages = {
      list: [
        {
          LanguageId: 0,
          PrimaryFallbackLanguageId: 0,
          PrimaryIetfCode: 'en',
          Symbol: 'E',
        },
      ],
      updated,
    };
    store.$persist();
    vi.advanceTimersByTime(500);

    const persisted = JSON.parse(localStorage.getItem('jw-store') || '{}');
    expect(persisted.jwMepsLanguages).toEqual({
      list: [
        {
          LanguageId: 0,
          PrimaryFallbackLanguageId: 0,
          PrimaryIetfCode: 'en',
          Symbol: 'E',
        },
      ],
      updated: updated.toISOString(),
    });

    // A fresh launch hydrates it back, so the refresh check sees a recent,
    // non-empty list.
    setActivePinia(createPersistedPinia());
    const hydrated = useJwStore();
    expect(hydrated.jwMepsLanguages.list).toHaveLength(1);
    expect(shouldUpdateList(hydrated.jwMepsLanguages, 3)).toBe(false);
  });

  it('hydrates previously persisted state on store creation', () => {
    localStorage.setItem(
      'jw-store',
      JSON.stringify({ jwIconsUrl: 'https://example.com/hydrated.woff2' }),
    );

    const store = useJwStore();

    expect(store.jwIconsUrl).toBe('https://example.com/hydrated.woff2');
  });
});
