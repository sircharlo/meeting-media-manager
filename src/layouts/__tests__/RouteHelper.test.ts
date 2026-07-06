import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RouteHelper from '../RouteHelper.vue';

installQuasarPlugin();

const baseUrl = 'http://localhost:3000/';
const locationUrl = `${baseUrl}?page=media-calendar/initial`;

describe('RouteHelper', () => {
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
});
