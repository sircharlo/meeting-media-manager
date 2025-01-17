import { vi } from 'vitest';

import { initHttpHandlers } from './../mocks/http';

vi.mock('main/utils', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    captureElectronError: vi.fn(async (error: Error | string | unknown) => {
      if (
        error instanceof Error &&
        error.message === 'Function not implemented.'
      ) {
        console.error(error);
      }
    }),
  };
});

vi.mock('preload/log', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    capturePreloadError: vi.fn(async (error: Error | string | unknown) => {
      if (
        error instanceof Error &&
        error.message === 'Function not implemented.'
      ) {
        console.error(error);
      }
    }),
  };
});

initHttpHandlers([]);
