import { createPersistedPinia } from 'app/test/vitest/mocks/pinia';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCurrentStateStore } from '../current-state';

describe('current-state persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists only the fields in the pick allowlist (pinyinActive)', () => {
    setActivePinia(createPersistedPinia());
    const store = useCurrentStateStore();

    store.pinyinActive = true;
    store.currentCongregation = 'cong-1';
    store.$persist();

    const persisted = JSON.parse(localStorage.getItem('current-state') || '{}');
    expect(persisted).toEqual({ pinyinActive: true });
  });

  it('hydrates pinyinActive on store creation', () => {
    localStorage.setItem(
      'current-state',
      JSON.stringify({ pinyinActive: true }),
    );
    setActivePinia(createPersistedPinia());

    const store = useCurrentStateStore();

    expect(store.pinyinActive).toBe(true);
  });

  it('does not hydrate fields outside the pick allowlist', () => {
    localStorage.setItem(
      'current-state',
      JSON.stringify({ currentCongregation: 'cong-x', pinyinActive: true }),
    );
    setActivePinia(createPersistedPinia());

    const store = useCurrentStateStore();

    expect(store.pinyinActive).toBe(true);
    expect(store.currentCongregation).toBe('');
  });
});
