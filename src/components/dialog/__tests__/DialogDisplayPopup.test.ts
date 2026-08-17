import type { Display } from 'src/types';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogDisplayPopup from '../DialogDisplayPopup.vue';

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

installQuasarPlugin();
installPinia();

const getAllScreensMock = vi.fn<() => Promise<Display[]>>();

// The component destructures `getAllScreens` from `globalThis.electronApi`
// during setup, so it must be replaced before `mount` runs.
const installElectronApiMocks = () => {
  globalThis.electronApi.getAllScreens = getAllScreensMock;
};

let wrapper: ReturnType<typeof mount<typeof DialogDisplayPopup>> | undefined;

// Open the popup the way a user would (closed -> open), which registers the
// screen-trigger-update listener and fires the initial fetchScreens().
const openPopup = async () => {
  wrapper = mount(DialogDisplayPopup, {
    props: { dialogId: 'display-popup', modelValue: false },
  });
  await wrapper.setProps({ modelValue: true });
};

const closePopup = async () => {
  await wrapper?.setProps({ modelValue: false });
  wrapper?.unmount();
  wrapper = undefined;
};

const triggerScreenUpdate = () => {
  globalThis.dispatchEvent(new CustomEvent('screen-trigger-update'));
};

beforeEach(() => {
  vi.clearAllMocks();
  getAllScreensMock.mockReset();
  installElectronApiMocks();
});

afterEach(async () => {
  await closePopup();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('DialogDisplayPopup - getAllScreens freeze resilience', () => {
  it('does not pile up overlapping getAllScreens IPC calls while one is in flight', async () => {
    let resolveFirst: ((screens: Display[]) => void) | undefined;
    getAllScreensMock.mockImplementationOnce(
      () =>
        new Promise<Display[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    await openPopup();
    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // A burst of screen-trigger-update events (display churn while the main
    // process is wedged) must not stack up more IPC round-trips.
    for (let i = 0; i < 5; i++) {
      triggerScreenUpdate();
    }
    await flushPromises();

    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // Once the in-flight fetch settles, the guard releases and a later event
    // is allowed to start a fresh fetch.
    getAllScreensMock.mockResolvedValue([]);
    resolveFirst?.([]);
    await flushPromises();

    triggerScreenUpdate();
    await flushPromises();

    expect(getAllScreensMock).toHaveBeenCalledTimes(2);
  });

  it('times out a hung getAllScreens and releases the in-flight guard', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    // A wedged main process never answers the invoke.
    getAllScreensMock.mockReturnValue(
      new Promise<Display[]>(() => {
        // Intentionally never settles.
      }),
    );

    await openPopup();
    expect(getAllScreensMock).toHaveBeenCalledTimes(1);

    // The renderer must not wait forever; after the 5s timeout it reports the
    // error and the guard is released in `finally`.
    await vi.advanceTimersByTimeAsync(5000);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'getAllScreens timed out' }),
    );

    getAllScreensMock.mockResolvedValue([]);
    triggerScreenUpdate();
    await vi.advanceTimersByTimeAsync(0);

    expect(getAllScreensMock).toHaveBeenCalledTimes(2);
  });
});
