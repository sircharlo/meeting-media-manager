import { createTestingPinia } from '@pinia/testing';
import { config } from '@vue/test-utils';
import { vol } from 'memfs';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeEach } from 'node:test';
import appMessages from 'src/i18n';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import { electronApi } from './mocks/electronApi';
import { announcements, releases } from './mocks/github';
import { jwLangs, jwYeartext } from './mocks/jw';

// Module mocks

vi.mock('node:fs');
vi.mock('node:fs/promises');

// Global mocks

vi.stubGlobal('electronApi', electronApi);

// Vue plugins

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: appMessages.en },
});

config.global.plugins = [i18n, createTestingPinia({ createSpy: vi.fn })];

// Http mocks

export const restHandlers = [
  http.get('https://www.jw.org/en/languages/', () => {
    return HttpResponse.json(jwLangs);
  }),
  http.get('https://wol.jw.org/wol/finder', () => {
    return HttpResponse.json(jwYeartext);
  }),
  http.get(
    `${process.env.repository?.replace(
      'github.com',
      'api.github.com/repos',
    )}/releases`,
    () => {
      return HttpResponse.json(releases);
    },
  ),
  http.get(
    `${process.env.repository?.replace(
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
