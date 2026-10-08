import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { createPinia, setActivePinia } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RouteHelper from '../RouteHelper.vue';

installQuasarPlugin();

const baseUrl = 'http://localhost:3000/';
const locationUrl = `${baseUrl}?page=media-calendar/initial`;

describe('RouteHelper', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    history.replaceState(null, '', baseUrl);
    vi.restoreAllMocks();
  });

  it('falls back to hash navigation when router injection is unavailable', () => {
    history.replaceState(null, '', locationUrl);
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    expect(() => mount(RouteHelper)).not.toThrow();
    expect(location.hash).toBe('#/media-calendar/initial');

    warnSpy.mockRestore();
  });

  it('opens the congregation switcher as a bootstrap open and falls back to /media-calendar for the initial-congregation-selector param', () => {
    history.replaceState(
      null,
      '',
      `${baseUrl}?page=initial-congregation-selector`,
    );
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    expect(() => mount(RouteHelper)).not.toThrow();

    const currentState = useCurrentStateStore();
    expect(currentState.congregationSwitcherOpen).toBe(true);
    expect(currentState.congregationSwitcherBootstrap).toBe(true);
    expect(location.hash).toBe('#/media-calendar');

    warnSpy.mockRestore();
  });
});
