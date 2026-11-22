import { defaultSettings } from 'src/constants/settings';

/*
 * The Pinia state Sentry's Pinia plugin adds to every error report from M³'s
 * windows (its "state" context), without what could identify a congregation
 * or a person: see the privacy policy (docs/src/en/privacy.md). What stays
 * is what helps explain a bug: technical settings, and whether something was
 * set, where a folder is, or how many entries a list has.
 */

type State = Record<string, unknown>;

const REDACTED = '[redacted]';

// Congregation settings that identify a congregation, or are secrets.
const REDACTED_SETTINGS = [
  'congregationName',
  'obsPassword',
  'settingsPin',
  'zoomMeetingManagerMeetingId',
] as const;

// Congregation settings that are folders the user chose.
const FOLDER_SETTINGS = [
  'cacheFolder',
  'folderToWatch',
  'mediaAutoExportFolder',
  'pinyinSongFolder',
  'recordingFolder',
] as const;

const isRecord = (value: unknown): value is State =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether a value was set, without the value itself.
 * @param value The value.
 * @returns The value when it's empty, otherwise "[redacted]".
 */
export const redactValue = (value: unknown) =>
  value === null || value === undefined || value === '' ? value : REDACTED;

/**
 * How many entries a list or a map has, without its entries.
 * @param entries The list or map.
 * @returns "FILTERED (length: n)".
 */
export const countEntries = (entries: unknown) => {
  let length = 0;
  if (Array.isArray(entries)) length = entries.length;
  else if (isRecord(entries)) length = Object.keys(entries).length;
  return `FILTERED (length: ${length})`;
};

/**
 * A folder's root only: its drive, its network share or its top folder.
 * Enough to tell a network or removable drive from a local one, without the
 * folder names, which can name a congregation or a person.
 * @param path The folder.
 * @returns For example "G:\…", "\\…" or "/media/…".
 */
export const describeFolder = (path: unknown) => {
  if (typeof path !== 'string' || !path) return path;
  const drive = /^[A-Za-z]:[\\/]/.exec(path);
  if (drive) return `${drive[0]}…`;
  if (/^[\\/]{2}/.test(path)) return String.raw`\\…`;
  const top = /^\/[^/]+/.exec(path);
  return top ? `${top[0]}/…` : REDACTED;
};

/**
 * A local file's extension only: file names can be a talk's title or a
 * person's name. Web addresses (the official website's media) stay as they
 * are.
 * @param value A file path or URL.
 * @returns For example "[local file].mp4".
 */
export const describeFile = (value: unknown) => {
  if (typeof value !== 'string' || !value) return value;
  const isLocal =
    value.startsWith('file:') ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith('/') ||
    value.startsWith('\\');
  if (!isLocal) return value;
  const extension = /\.[A-Za-z0-9]{1,5}$/.exec(value.split(/[?#]/)[0] ?? '');
  return `[local file]${extension?.[0] ?? ''}`;
};

/**
 * The website setting, unless it's the default: another address could tell
 * where its user is.
 * @param baseUrl The website setting.
 * @returns The default address, "[custom]", or the empty value.
 */
const describeBaseUrl = (baseUrl: unknown) =>
  !baseUrl || baseUrl === defaultSettings.baseUrl ? baseUrl : '[custom]';

const redactCongregation = (settings: unknown) => {
  if (!isRecord(settings)) return settings;
  const redacted: State = { ...settings };
  for (const key of REDACTED_SETTINGS) {
    if (key in redacted) redacted[key] = redactValue(redacted[key]);
  }
  for (const key of FOLDER_SETTINGS) {
    if (key in redacted) redacted[key] = describeFolder(redacted[key]);
  }
  if ('baseUrl' in redacted) {
    redacted.baseUrl = describeBaseUrl(redacted.baseUrl);
  }
  return redacted;
};

const redactCongregationSettings = (store: unknown) => {
  if (!isRecord(store) || !isRecord(store.congregations)) return store;
  return {
    ...store,
    congregations: Object.fromEntries(
      Object.entries(store.congregations).map(([id, settings]) => [
        id,
        redactCongregation(settings),
      ]),
    ),
  };
};

const redactCurrentState = (store: unknown) => {
  if (!isRecord(store)) return store;
  const redacted: State = { ...store };
  if (isRecord(redacted.mediaPlaying)) {
    const mediaPlaying = { ...redacted.mediaPlaying };
    for (const key of ['url', 'slideshowAudioUrl', 'subtitlesUrl']) {
      if (key in mediaPlaying)
        mediaPlaying[key] = describeFile(mediaPlaying[key]);
    }
    redacted.mediaPlaying = mediaPlaying;
  }
  if ('mediaWindowCustomBackground' in redacted) {
    redacted.mediaWindowCustomBackground = describeFile(
      redacted.mediaWindowCustomBackground,
    );
  }
  // Addresses on the local network.
  if ('timerRemoteUrls' in redacted) {
    redacted.timerRemoteUrls = countEntries(redacted.timerRemoteUrls);
  }
  // The Zoom helper's output, which can name a meeting or its participants.
  if ('zoomHelperLogs' in redacted) {
    redacted.zoomHelperLogs = countEntries(redacted.zoomHelperLogs);
  }
  return redacted;
};

const redactJwStore = (store: unknown) => {
  if (!isRecord(store)) return store;
  const redacted: State = { ...store };
  // Long lists that only fill the report.
  for (const key of ['jwBibleFiles', 'jwSongs', 'yeartexts']) {
    if (key in redacted) redacted[key] = countEntries(redacted[key]);
  }
  for (const key of ['jwLanguages', 'jwMepsLanguages']) {
    const list = isRecord(redacted[key]) ? redacted[key].list : undefined;
    if (key in redacted) redacted[key] = countEntries(list);
  }
  if (isRecord(redacted.urlVariables) && 'base' in redacted.urlVariables) {
    redacted.urlVariables = {
      ...redacted.urlVariables,
      base: describeBaseUrl(redacted.urlVariables.base),
    };
  }
  return redacted;
};

const redactStore = (
  store: unknown,
  transform: (store: State) => State,
): unknown => (isRecord(store) ? transform({ ...store }) : store);

/**
 * The Pinia state to send with an error report: see the top of this file.
 * @param state Every store's state, by store ID.
 * @returns The state without what identifies a congregation or a person.
 */
export const redactStateForSentry = (state: State): State => {
  try {
    return {
      ...state,
      'congregation-settings': redactCongregationSettings(
        state['congregation-settings'],
      ),
      'current-state': redactCurrentState(state['current-state']),
      'hand-alert': redactStore(state['hand-alert'], (store) => ({
        ...store,
        // Zoom participants' names.
        raisedHands: countEntries(store.raisedHands),
      })),
      'jw-store': redactJwStore(state['jw-store']),
      'media-conversion': redactStore(state['media-conversion'], (store) => ({
        ...store,
        // Keyed by the files' paths, whose names can be a talk's title.
        checks: countEntries(store.checks),
      })),
      'zoom-state': redactStore(state['zoom-state'], (store) => ({
        ...store,
        // The Zoom window's title, with the meeting's or a participant's ID.
        meeting: isRecord(store.meeting)
          ? { ...store.meeting, title: redactValue(store.meeting.title) }
          : store.meeting,
      })),
    };
  } catch {
    // Never the raw state: it holds everything the above leaves out.
    return { redactionFailed: true };
  }
};
