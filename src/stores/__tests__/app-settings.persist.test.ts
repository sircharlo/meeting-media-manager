import { createPersistedPinia } from 'app/test/vitest/mocks/pinia';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAppSettingsStore } from '../app-settings';

describe('app-settings persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the full state to localStorage', () => {
    setActivePinia(createPersistedPinia());
    const store = useAppSettingsStore();

    store.displayCameraId = 'camera-123';
    store.screenPreferences = {
      preferredScreenNumber: 2,
      preferWindowed: true,
    };
    store.$persist();

    const persisted = JSON.parse(localStorage.getItem('app-settings') || '{}');
    expect(persisted.displayCameraId).toBe('camera-123');
    expect(persisted.screenPreferences).toEqual({
      preferredScreenNumber: 2,
      preferWindowed: true,
    });
  });

  it('hydrates previously persisted state on store creation', () => {
    localStorage.setItem(
      'app-settings',
      JSON.stringify({ displayCameraId: 'camera-hydrated' }),
    );
    setActivePinia(createPersistedPinia());

    const store = useAppSettingsStore();

    expect(store.displayCameraId).toBe('camera-hydrated');
  });
});
