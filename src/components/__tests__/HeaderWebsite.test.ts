import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import HeaderWebsite from '../header/HeaderWebsite.vue';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

installQuasarPlugin();
installPinia();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ component: { template: '<div />' }, path: '/' }],
});

// MMM-V2-3P7: the website window couldn't load the website (the computer
// couldn't look up its address) and stayed blank, with nothing to say why.
describe('HeaderWebsite - website that fails to load', () => {
  let loadFailed: (() => void) | undefined;
  const unsubscribe = vi.fn();
  const navigateWebsiteWindow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    loadFailed = undefined;
    // The component reads these from electronApi as it's set up.
    globalThis.electronApi.onWebsiteLoadFailed = (callback) => {
      loadFailed = callback;
      return unsubscribe;
    };
    globalThis.electronApi.navigateWebsiteWindow = navigateWebsiteWindow;
  });

  const mountHeader = () =>
    mount(HeaderWebsite, { global: { plugins: [router] } });

  it('says the website could not be reached, with a way to try again', () => {
    mountHeader();

    loadFailed?.();

    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        group: 'website-unreachable',
        message:
          'The website couldn’t be loaded because this computer couldn’t reach it. Check the internet connection, then refresh the page.',
        type: 'negative',
      }),
    );
    const [notification] = vi.mocked(createTemporaryNotification).mock
      .calls[0] ?? [{}];
    const refresh = notification.actions?.find(
      (action) => action.label === 'Refresh',
    );
    refresh?.handler?.();
    expect(navigateWebsiteWindow).toHaveBeenCalledExactlyOnceWith('refresh');
  });

  it('stops listening once the page is left', () => {
    const wrapper = mountHeader();

    wrapper.unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
