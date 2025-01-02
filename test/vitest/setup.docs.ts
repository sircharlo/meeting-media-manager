import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { releases } from './mocks/github';

export const restHandlers = [
  http.get(
    `${process.env.repository?.replace(
      'github.com',
      'api.github.com/repos',
    )}/releases`,
    () => {
      return HttpResponse.json(releases);
    },
  ),
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  server.resetHandlers();
});
