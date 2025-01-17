import type { HttpHandler } from 'msw';

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

export const initHttpHandlers = (handlers: HttpHandler[]) => {
  const server = setupServer(...handlers);

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  //  Close server after all tests
  afterAll(() => server.close());

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
};
