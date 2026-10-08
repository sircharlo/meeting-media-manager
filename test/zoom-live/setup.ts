import { createPersistedPinia } from 'app/test/vitest/mocks/pinia';
import { setActivePinia } from 'pinia';
import { vi } from 'vitest';

import { electronApi } from '../vitest/mocks/electronApi';

// The renderer code under test only needs `zoomCommand` from the real
// Electron API; the live test wires that to the real helper itself.
vi.stubGlobal('electronApi', {
  ...electronApi,
  launchZoomMeeting: () => undefined,
  toggleMediaWindow: () => undefined,
});

// Print what M³ would show the user, instead of Quasar notifications.
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: ({ message }: { message?: string }) => {
    console.log(`    [M³ notification] ${message}`);
  },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (error: unknown) => {
    console.error('    [M³ error]', error);
  },
}));

setActivePinia(createPersistedPinia());
