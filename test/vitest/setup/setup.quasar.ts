import { config } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import PQueue from 'p-queue';
import appMessages from 'src/i18n';
import { vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import { initHttpHandlers } from '../mocks/http';
import { electronApi } from './../mocks/electronApi';
import { announcements, releases } from './../mocks/github';
import { jwLangs, jwYeartext } from './../mocks/jw';

vi.mock('src/helpers/error-catcher', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    errorCatcher: vi.fn(async (error: unknown) => {
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

// Since Quasar 2.34, its Screen plugin reads `window.screen.orientation`
// (type, angle, 'change' events) on install, which happy-dom doesn't
// implement - so every component using it failed to mount.
if (!window.screen.orientation) {
  Object.defineProperty(window.screen, 'orientation', {
    configurable: true,
    value: Object.assign(new EventTarget(), {
      angle: 0,
      type: 'landscape-primary',
    }),
  });
}

// Since p-queue 10, PQueue extends the global EventTarget (happy-dom's here)
// and, whenever `process` exists, passes each queue to Node's
// events.setMaxListeners(), which throws for anything but Node's own
// EventTargets - so every `new PQueue()` failed. The Electron renderer has no
// `process`, so this only happens under test. Node recognises its
// EventTargets by this registry symbol on their class.
Object.defineProperty(PQueue, Symbol.for('nodejs.event_target'), {
  value: true,
});

const i18n = createI18n({
  allowComposition: true,
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
    `${import.meta.env.repository?.replace(
      'github.com',
      'api.github.com/repos',
    )}/releases`,
    () => HttpResponse.json(releases),
  ),
  http.get(
    `${import.meta.env.repository?.replace(
      'github',
      'raw.githubusercontent',
    )}/refs/heads/master/announcements.json`,
    () => HttpResponse.json(announcements),
  ),
]);
