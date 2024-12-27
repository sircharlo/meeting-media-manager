import pkg from 'app/package.json';
import { vol } from 'memfs';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeEach } from 'node:test';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { electronApi } from './mocks/electronApi';
import { announcements, releases } from './mocks/github';
import { jwLangs, jwYeartext } from './mocks/jw';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.stubGlobal('electronApi', electronApi);

export const restHandlers = [
  http.get('https://www.jw.org/en/languages/', () => {
    return HttpResponse.json(jwLangs);
  }),
  http.get('https://wol.jw.org/wol/finder', () => {
    return HttpResponse.json(jwYeartext);
  }),
  http.get(
    `${pkg.repository.url
      .replace('.git', '')
      .replace('github.com', 'api.github.com/repos')}/releases`,
    () => {
      return HttpResponse.json(releases);
    },
  ),
  http.get(
    `${pkg.repository.url
      .replace('.git', '')
      .replace(
        'github',
        'raw.githubusercontent',
      )}/refs/heads/master/announcements.json`,
    () => {
      return HttpResponse.json(announcements);
    },
  ),
];

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
