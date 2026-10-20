import type { HttpHandler } from 'msw';

import { setupServer, type SetupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

let activeServer: null | SetupServer = null;

/** The MSW server of the current test file, e.g. to let a request through. */
export const getHttpServer = () => activeServer;

export const initHttpHandlers = (handlers: HttpHandler[]) => {
  const server = setupServer(...handlers);
  activeServer = server;

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

  //  Close server after all tests
  afterAll(() => server.close());

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
};
