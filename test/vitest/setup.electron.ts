import { vol } from 'memfs';
import { setupServer } from 'msw/node';
import { beforeEach } from 'node:test';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

vi.mock('node:fs');
vi.mock('node:fs/promises');

export const restHandlers = [];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

beforeEach(() => {
  vol.reset();
});

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  server.resetHandlers();
});
