import { i18n } from 'boot/i18n';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMusicStore } from '../music';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-21T12:00:00'));
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('music store', () => {
  it('can be instantiated outside a component setup (e.g. at boot)', () => {
    // Boot files (dev-menu) and demo-mode helpers create this store before
    // any component mounts, where no component instance exists. Calling
    // `useI18n()` there throws "Must be called at the top of a setup
    // function", so the store must translate via the global composer.
    expect(() => useMusicStore()).not.toThrow();

    const music = useMusicStore();
    expect(music.displayStatusText).toBe(i18n.global.t('music.not-playing'));
    expect(music.summaryText).toBe(i18n.global.t('background-music-idle'));
  });
});
