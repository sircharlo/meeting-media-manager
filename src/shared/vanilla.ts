import type { FontName } from 'src/types';

/**
 * Generates a UUID.
 * @returns The generated UUID.
 * @example
 * uuid() // '8e8679e3-02b1-410b-9399-2c1e5606a971'
 */
export const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(
    /[xy]/g,
    function (c) {
      const r = Math.trunc(Math.random() * 16),
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
};

/**
 * Throttles a function to run at regular intervals AND at the end
 * @param func The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function with trailing execution
 */
export const throttleWithTrailing = <T>(
  func: (...args: T[]) => void,
  delay: number,
) => {
  let lastExecTime = 0;
  let timeoutId: null | ReturnType<typeof setTimeout> = null;
  let lastArgs: null | T[] = null;

  return (...args: T[]) => {
    const now = Date.now();
    lastArgs = args;

    // Execute immediately if enough time has passed
    if (now - lastExecTime >= delay) {
      lastExecTime = now;
      func(...args);

      // Clear any pending trailing execution
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      // Schedule trailing execution if not already scheduled
      timeoutId ??= setTimeout(
        () => {
          if (lastArgs) {
            lastExecTime = Date.now();
            func(...lastArgs);
            timeoutId = null;
            lastArgs = null;
          }
        },
        delay - (now - lastExecTime),
      );
    }
  };
};

/**
 * Debounces a function to run only after it stops being called for a delay period
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced function
 */
export const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number,
) => {
  let timeoutId: null | ReturnType<typeof setTimeout> = null;

  return (...args: T) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Schedule new execution
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

// Matches the OS home-directory segment of a filesystem path or file:// URL
// (Windows `C:\Users\<name>` or `C:/Users/<name>`, macOS `/Users/<name>`,
// Linux `/home/<name>`) so the username can be redacted while the rest of
// the path is preserved.
const HOME_DIRECTORY_PATH_PATTERNS: RegExp[] = [
  /([A-Za-z]:[\\/]Users[\\/])[^\\/]+/g,
  /(\/Users\/)[^/]+/g,
  /(\/home\/)[^/]+/g,
];

/**
 * Redacts the username segment of any OS home-directory path found in a
 * string, so error messages don't leak PII and so the same underlying error
 * from different users' machines produces an identical message (letting
 * Sentry group them into a single issue instead of one per user/path).
 * @param value The string to scrub
 * @returns The string with home-directory usernames replaced by `<user>`
 */
export const scrubUserPaths = (value: string): string =>
  HOME_DIRECTORY_PATH_PATTERNS.reduce(
    (result, pattern) => result.replace(pattern, '$1<user>'),
    value,
  );

/**
 * Recursively applies {@link scrubUserPaths} to every string value in an
 * object/array tree, e.g. a Sentry event (exception messages, stack frame
 * paths, breadcrumbs, extra/context data, etc).
 * @param value The value to scrub
 * @returns A deep copy of `value` with home-directory usernames redacted
 */
export const scrubUserPathsDeep = <T>(value: T): T => {
  if (typeof value === 'string') return scrubUserPaths(value) as T;
  if (Array.isArray(value)) return value.map(scrubUserPathsDeep) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        scrubUserPathsDeep(val),
      ]),
    ) as T;
  }
  return value;
};

const logPrefixes = {
  api: '🌐 API',
  backgroundMusic: '🎵 Background Music',
  cacheAutoClear: '🧹 Cache Auto-Clear',
  cleanup: '🧽 Cleanup',
  congregation: '⛪ Congregation',
  congregationLookup: '🏛️ Congregation Lookup',
  congregationSchedule: '🗓️ Congregation Schedule',
  coWeek: '📅 Co-Week',
  customSections: '🧩 Custom Sections',
  dateHelpers: '📆 Date Helpers',
  dateUtils: '📆 Date Utils',
  dialog: '🪟 Dialog',
  display: '🖥️ Display',
  dividers: '🔤 Dividers',
  electron: '⚡ Electron',
  electronDependencies: '🧪 Electron Dependencies',
  electronDownloads: '⬇️ Electron Downloads',
  electronFilesystem: '📁 Electron Filesystem',
  electronIpc: '🔌 Electron IPC',
  electronScreen: '🖥️ Electron Screen',
  electronUpdater: '🆕 Electron Updater',
  electronWindow: '🪟 Electron Window',
  errorHandling: '🚨 Error Handling',
  fileImport: '📥 File Import',
  filesystem: '📁 Filesystem',
  jw: '📚 JW',
  jwPlaylist: '📋 JW Playlist',
  jwpub: '📦 JWPub',
  keyboardShortcuts: '⌨️ Keyboard Shortcuts',
  mainLayout: '🏠 Main Layout',
  mediaCalendar: '🗓️ Media Calendar',
  mediaFetching: '🔍 Media Fetching',
  mediaList: '🧾 Media List',
  mediaPlayback: '▶️ Media Playback',
  mediaPlayer: '🎬 Media Player',
  mediaPreview: '🎬 Media Preview',
  mediaProcessing: '🔄 Media Processing',
  mediaSectionRepeat: '🔁 Media Section Repeat',
  mediaSections: '🗂️ Media Sections',
  migrations: '🧱 Migrations',
  mwMedia: '🌅 Midweek Meeting Media',
  obs: '📡 OBS',
  publicationMedia: '📰 Publication Media',
  sentry: '🐛 Sentry',
  shortcutInput: '🎹 Shortcut Input',
  sqlite: '🗄️ SQLite',
  stores: '🧠 Stores',
  timer: '⏱️ Timer',
  watchedFolder: '📁 Watched Folder',
  weMedia: '🌅 Weekend Meeting Media',
  zoom: '🔎 Zoom',
} as const;

export type LogPrefix = keyof typeof logPrefixes;
export type LogType = 'debug' | 'error' | 'info' | 'log' | 'trace' | 'warn';

type ConsoleMethod = (...args: unknown[]) => void;

const getConsoleMethod = (type: LogType): ConsoleMethod => {
  const consoleObject = Reflect.get(globalThis, 'console') as
    Partial<Record<LogType, ConsoleMethod>> | undefined;

  return consoleObject?.[type] ?? consoleObject?.log ?? (() => undefined);
};

export const log = (
  message: unknown,
  prefix?: LogPrefix,
  type: LogType = 'log',
  ...details: unknown[]
) => {
  try {
    const prefixLabel = prefix ? `[${logPrefixes[prefix]}]` : '';
    const logger = getConsoleMethod(type);

    if (typeof message === 'string') {
      const logMessage = prefixLabel ? `${prefixLabel} ${message}` : message;
      logger(logMessage, ...details);
      return;
    }

    logger(prefixLabel || '[log]', message, ...details);
  } catch (error) {
    const fallbackLogger = getConsoleMethod('error');
    fallbackLogger(error, { details, message, prefix, type });
  }
};

const illegalFilenameChars = () => /[/?<>\\:*|"]/g;
const reservedDots = () => /^\.+$/g;
const windowsReservedFilename = () =>
  /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/gi;
const MAX_FILENAME_BYTES = 255;

const replaceTrailingDotsAndSpaces = (value: string, replacement: string) => {
  let end = value.length;
  while (end > 0 && (value[end - 1] === '.' || value[end - 1] === ' ')) end--;
  return end < value.length ? value.slice(0, end) + replacement : value;
};

const truncateUtf8Bytes = (value: string, maxBytes: number) => {
  const encoder = new TextEncoder();
  if (encoder.encode(value).length <= maxBytes) return value;

  let result = '';
  for (const char of value) {
    const next = result + char;
    if (encoder.encode(next).length > maxBytes) break;
    result = next;
  }
  return result;
};

const sanitizeFilenameInternal = (input: string, replacement: string) => {
  const withoutControlChars = Array.from(input, (char) => {
    const code = char.codePointAt(0);
    if (!code) return replacement;
    return code <= 31 || (code >= 128 && code <= 159) ? replacement : char;
  }).join('');

  const sanitized = replaceTrailingDotsAndSpaces(
    withoutControlChars
      .replaceAll(illegalFilenameChars(), replacement)
      .replaceAll(reservedDots(), replacement)
      .replaceAll(windowsReservedFilename(), replacement),
    replacement,
  );
  return truncateUtf8Bytes(sanitized, MAX_FILENAME_BYTES);
};

export const sanitizeFilename = (input: string, replacement = ''): string => {
  if (typeof input !== 'string') throw new Error('Input must be string');

  const output = sanitizeFilenameInternal(input, replacement);
  if (!replacement) return output;

  return sanitizeFilenameInternal(output, '');
};

/**
 * Extracts .css stylesheet URLs referenced via `<link href="...">` tags in
 * HTML, resolving any origin-relative ones against the WOL (wol.<baseUrl>)
 * domain. Framework-agnostic so it can also run outside the app (e.g. the
 * scripts/refresh-jw-icons-fallbacks.mjs CI script).
 * @param html The HTML to scan
 * @param baseUrl The congregation's base domain (e.g. `jw.org`)
 * @returns The list of discovered, fully-qualified CSS URLs
 */
export const extractCssUrls = (html: string, baseUrl: string): string[] => {
  const cssRegex = /href=["']([^"']+\.css)["']/g;
  const cssUrls: string[] = [];
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    let url = match[1];
    if (!url) continue;
    if (url.startsWith('/')) {
      url = `https://wol.${baseUrl}${url}`;
    }
    cssUrls.push(url);
  }
  return cssUrls;
};

/**
 * Finds the jw-icons font URL within CSS text by locating its @font-face
 * block and extracting the url() it declares.
 * @param cssText The CSS to scan
 * @param cssUrl The URL `cssText` was fetched from, used to resolve
 * relative url()s
 * @returns The absolute font URL, or null if no jw-icons @font-face was found
 */
export const findIconUrlInCss = (
  cssText: string,
  cssUrl: string,
): null | string => {
  const fontFaceBlocks = cssText.match(/@font-face\s*\{[^}]*\}/gi);
  if (!fontFaceBlocks) return null;

  for (const block of fontFaceBlocks) {
    if (block.includes('jw-icons')) {
      const fontMatch = new RegExp(
        /url\(["']?([^"']+\.(woff2?|ttf|otf)[^"']*)["']?\)/i,
      ).exec(block);
      if (fontMatch?.[1]) {
        return new URL(fontMatch[1], cssUrl).href;
      }
    }
  }
  return null;
};

// Maps the CSS font-family name WOL's stylesheets use for each WT/Manna
// yeartext font to this app's FontName identifier.
const wtFontCssNames: Record<string, FontName> = {
  WTBaeumMyungjo: 'Wt-BaeumMyungjo',
  WTClearText: 'Wt-ClearText-Bold',
  WTClearTextGeorgian: 'WTClearTextGeorgian',
  WTClearTextJapanese: 'WTClearTextJapanese',
  WTMannaSansKaren: 'WTMannaSansKaren',
  WTMannaSansMongolian: 'WTMannaSansMongolian',
  WTMannaSansMyammar: 'WTMannaSansMyanmar',
  WTMannaSansMyanmar: 'WTMannaSansMyanmar',
  WTMannaSansTibetan: 'WTMannaSansTibetan',
  WTSetthaSpecial: 'WTSetthaSpecial',
  WTTextNew: 'WTTextNew',
  WTXBZSpecial: 'WTXBZSpecial',
};

const getFontFileUrl = (fontFaceBlock: string): string | undefined => {
  const urlRegex = /url\(["']?(https?:\/\/[^"')]+\.woff2?)["']?\)/g;
  let woffUrl: string | undefined;

  let match;
  while ((match = urlRegex.exec(fontFaceBlock)) !== null) {
    const url = match[1];
    if (!url) continue;
    if (url.endsWith('.woff2')) return url; // prefer woff2, return immediately
    if (!woffUrl && url.endsWith('.woff')) woffUrl = url;
  }

  return woffUrl;
};

/**
 * Extracts each WT/Manna yeartext font's URL from WOL's CSS by matching its
 * @font-face block's font-family name against {@link wtFontCssNames}.
 * @param cssText The CSS to scan
 * @returns A map of discovered font URLs, keyed by FontName
 */
export const getYeartextFontUrlsFromCss = (
  cssText: string,
): Partial<Record<FontName, string>> => {
  const fontUrls: Partial<Record<FontName, string>> = {};

  // Use [\s\S] instead of [^}]* to handle newlines, and [\s\S]*? to avoid
  // crossing block boundaries while staying SonarQube-safe
  const fontFaceRegex = /@font-face\s*\{([\s\S]*?)\}/g;
  const fontFamilyRegex = /font-family:\s*['"]?([\w-]+)['"]?/;
  const fontStyleRegex = /font-style:\s*italic/i;

  let match;
  while ((match = fontFaceRegex.exec(cssText)) !== null) {
    const blockContent = match[1];
    if (!blockContent) continue;

    const familyMatch = fontFamilyRegex.exec(blockContent);
    const cssName = familyMatch?.[1];
    if (!cssName) continue;

    // Some families (e.g. WTClearText, WTBaeumMyungjo) declare an italic
    // @font-face under the same font-family name - skip it so it doesn't
    // win over the upright weight when both share a FontName below.
    if (fontStyleRegex.test(blockContent)) continue;

    const fontName = wtFontCssNames[cssName];
    const url = getFontFileUrl(match[0]);
    if (fontName && url) {
      fontUrls[fontName] = url;
    }
  }

  return fontUrls;
};
