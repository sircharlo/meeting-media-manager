import { i18n } from 'boot/i18n';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';

/**
 * Media files Chromium can't open at all (see isUnopenableMediaError): most
 * likely cut short by a download or copy that didn't finish, so nothing M³
 * can fix (MMM-V2-3CF, MMM-V2-3N6). The user is told, so there's time to
 * get the file again before the meeting, instead of Sentry.
 */

const { basename } = globalThis.electronApi;

// A file's thumbnail and its duration fail together: one notice for both,
// and for every file found at about the same time.
const NOTICE_GROUPING_MS = 1500;

// Once per file per session: its thumbnail is asked for again and again.
const toldAbout = new Set<string>();
let pendingPaths: string[] = [];
let noticeTimer: ReturnType<typeof setTimeout> | undefined;

// A count picks the plural form; named values fill in the message.
const t = (key: string, values?: number | Record<string, unknown>) =>
  (i18n.global.t as (key: string, values: unknown) => string)(
    key,
    values ?? {},
  );

const showNotice = () => {
  const names = pendingPaths.map((path) => basename(path));
  pendingPaths = [];
  const [first] = names;
  if (!first) return;
  createTemporaryNotification({
    caption: t('media-cannot-open-notice-caption', names.length),
    message:
      names.length === 1
        ? t('media-cannot-open-notice', { name: first })
        : t('media-cannot-open-notice-many', {
            count: names.length,
            names: names.join(', '),
          }),
    timeout: 0,
    type: 'warning',
  });
};

/**
 * Tells the user that a media file can't be opened, once per file per
 * session, a moment later and together with any others found meanwhile.
 * @param path The file.
 * @param mediaError Chromium's reason, for the log.
 */
export const noticeUnopenableMedia = (path: string, mediaError?: string) => {
  log(`Can't open ${path}: ${mediaError}`, 'mediaProcessing', 'warn');
  if (toldAbout.has(path)) return;
  toldAbout.add(path);
  pendingPaths.push(path);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(showNotice, NOTICE_GROUPING_MS);
};
