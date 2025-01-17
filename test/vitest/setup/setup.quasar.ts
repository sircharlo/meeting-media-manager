import { config } from '@vue/test-utils';
import fs from 'fs-extra';
import { http, HttpResponse } from 'msw';
import appMessages from 'src/i18n';
import { afterAll, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import { initHttpHandlers } from '../mocks/http';
import { basePath, electronApi } from './../mocks/electronApi';
import { announcements, releases } from './../mocks/github';
import { jwLangs, jwYeartext } from './../mocks/jw';

vi.mock('src/helpers/error-catcher', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    errorCatcher: vi.fn(async (error: Error | string | unknown) => {
      if (
        error instanceof Error &&
        error.message === 'Function not implemented.'
      ) {
        console.error(error);
      }
    }),
  };
});

vi.stubGlobal('electronApi', electronApi);

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: appMessages.en },
});

config.global.plugins = [i18n];

initHttpHandlers([
  http.get('https://www.jw.org/en/languages/', () =>
    HttpResponse.json(jwLangs),
  ),
  http.get('https://wol.jw.org/wol/finder', () =>
    HttpResponse.json(jwYeartext),
  ),
  http.get(
    `${process.env.repository?.replace(
      'github.com',
      'api.github.com/repos',
    )}/releases`,
    () => HttpResponse.json(releases),
  ),
  http.get(
    `${process.env.repository?.replace(
      'github',
      'raw.githubusercontent',
    )}/refs/heads/master/announcements.json`,
    () => HttpResponse.json(announcements),
  ),
]);

afterAll(async () => {
  await fs.emptyDir(basePath);
});
