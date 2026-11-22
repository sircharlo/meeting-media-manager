import { describe, expect, it } from 'vitest';

import {
  countEntries,
  describeFile,
  describeFolder,
  redactStateForSentry,
  redactValue,
} from '../sentry-state';

// A state like a real error report's, with made-up values.
const makeState = () => ({
  'app-settings': { migrations: ['firstRun'], screenPreferences: {} },
  'congregation-settings': {
    congregations: {
      'congregation-id': {
        baseUrl: 'jw.org',
        cacheFolder: String.raw`C:\Users\<user>\Documents\M3`,
        congregationName: 'Springfield East',
        darkMode: true,
        folderToWatch: String.raw`G:\My Drive\Talk media`,
        lang: 'E',
        mediaAutoExportFolder: '',
        mwDay: '3',
        mwStartTime: '19:30',
        obsPassword: 'secret',
        obsPort: '4455',
        pinyinSongFolder: null,
        recordingFolder: '/media/usb/Recordings',
        settingsPin: '1234',
        zoomMeetingManagerMeetingId: '12345678901',
      },
    },
  },
  'current-state': {
    currentCongregation: 'congregation-id',
    mediaPlaying: {
      subtitlesUrl: '',
      url: 'file:///C:/Users/<user>/Documents/M3/Additional%20Media/01%20-%20A%20talk.mp4',
    },
    mediaWindowCustomBackground: String.raw`C:\Pictures\Hall.jpg`,
    selectedDate: '2026/11/21',
    timerRemoteUrls: ['http://192.168.1.20:8787'],
    zoomHelperLogs: ['18:38:01 [Zoom Helper] Process started'],
  },
  'hand-alert': { manual: false, raisedHands: ['Jane Doe', 'John Smith'] },
  'jw-store': {
    jwBibleFiles: {},
    jwLanguages: { list: [1, 2, 3] },
    jwMepsLanguages: { list: [1] },
    jwSongs: { a: 1, b: 2 },
    urlVariables: { base: 'jw.org', mediator: 'https://b.jw-cdn.org' },
    yeartexts: {},
  },
  'media-conversion': {
    checks: {
      'C:/Users/<user>/Documents/M3/Additional Media/01 - A talk.mp4': {},
    },
    jobs: [],
  },
  'zoom-state': {
    meeting: { found: true, title: 'Zoom Meeting Participant ID: 123456' },
  },
});

describe('redactStateForSentry', () => {
  it('leaves out what identifies a congregation or holds a secret', () => {
    const settings = redactStateForSentry(makeState())[
      'congregation-settings'
    ] as {
      congregations: Record<string, Record<string, unknown>>;
    };
    const congregation = settings.congregations['congregation-id'];

    expect(congregation).toMatchObject({
      congregationName: '[redacted]',
      obsPassword: '[redacted]',
      settingsPin: '[redacted]',
      zoomMeetingManagerMeetingId: '[redacted]',
    });
  });

  it('keeps the technical settings that explain a bug', () => {
    const settings = redactStateForSentry(makeState())[
      'congregation-settings'
    ] as {
      congregations: Record<string, Record<string, unknown>>;
    };

    expect(settings.congregations['congregation-id']).toMatchObject({
      baseUrl: 'jw.org',
      darkMode: true,
      lang: 'E',
      mwDay: '3',
      mwStartTime: '19:30',
      obsPort: '4455',
    });
  });

  it("keeps only a folder's root, and empty folders as they are", () => {
    const settings = redactStateForSentry(makeState())[
      'congregation-settings'
    ] as {
      congregations: Record<string, Record<string, unknown>>;
    };

    expect(settings.congregations['congregation-id']).toMatchObject({
      cacheFolder: String.raw`C:\…`,
      folderToWatch: String.raw`G:\…`,
      mediaAutoExportFolder: '',
      pinyinSongFolder: null,
      recordingFolder: '/media/…',
    });
  });

  it('only says a website setting other than the default is custom', () => {
    const state = makeState();
    state['congregation-settings'].congregations['congregation-id'].baseUrl =
      'example.org';
    state['jw-store'].urlVariables.base = 'example.org';

    const redacted = redactStateForSentry(state);

    expect(
      (
        redacted['congregation-settings'] as {
          congregations: Record<string, Record<string, unknown>>;
        }
      ).congregations['congregation-id']?.baseUrl,
    ).toBe('[custom]');
    expect(
      (redacted['jw-store'] as { urlVariables: { base: string } }).urlVariables
        .base,
    ).toBe('[custom]');
  });

  it("leaves out local files' names, participants' names and local addresses", () => {
    const redacted = redactStateForSentry(makeState());

    expect(redacted['current-state']).toMatchObject({
      mediaPlaying: { subtitlesUrl: '', url: '[local file].mp4' },
      mediaWindowCustomBackground: '[local file].jpg',
      selectedDate: '2026/11/21',
      timerRemoteUrls: 'FILTERED (length: 1)',
      zoomHelperLogs: 'FILTERED (length: 1)',
    });
    expect(redacted['hand-alert']).toEqual({
      manual: false,
      raisedHands: 'FILTERED (length: 2)',
    });
    expect(redacted['media-conversion']).toEqual({
      checks: 'FILTERED (length: 1)',
      jobs: [],
    });
    expect(redacted['zoom-state']).toEqual({
      meeting: { found: true, title: '[redacted]' },
    });
  });

  it('shortens the long lists, and keeps the official addresses', () => {
    expect(redactStateForSentry(makeState())['jw-store']).toEqual({
      jwBibleFiles: 'FILTERED (length: 0)',
      jwLanguages: 'FILTERED (length: 3)',
      jwMepsLanguages: 'FILTERED (length: 1)',
      jwSongs: 'FILTERED (length: 2)',
      urlVariables: { base: 'jw.org', mediator: 'https://b.jw-cdn.org' },
      yeartexts: 'FILTERED (length: 0)',
    });
  });

  it('leaves the stores it knows nothing about as they are', () => {
    expect(redactStateForSentry(makeState())['app-settings']).toEqual({
      migrations: ['firstRun'],
      screenPreferences: {},
    });
  });

  it("handles a window's state without most stores", () => {
    expect(
      redactStateForSentry({ 'current-state': { selectedDate: 'x' } }),
    ).toMatchObject({ 'current-state': { selectedDate: 'x' } });
  });

  it('never sends the raw state when the redaction fails', () => {
    const state = {
      get 'congregation-settings'(): never {
        throw new Error('getter failed');
      },
    };

    expect(redactStateForSentry(state)).toEqual({ redactionFailed: true });
  });
});

describe('helpers', () => {
  it.each([
    [null, null],
    ['', ''],
    [undefined, undefined],
    ['1234', '[redacted]'],
  ])('redactValue(%j) is %j', (value, expected) => {
    expect(redactValue(value)).toBe(expected);
  });

  it.each([
    [['a', 'b'], 'FILTERED (length: 2)'],
    [{ a: 1 }, 'FILTERED (length: 1)'],
    [undefined, 'FILTERED (length: 0)'],
  ])('countEntries(%j) is %j', (entries, expected) => {
    expect(countEntries(entries)).toBe(expected);
  });

  it.each([
    [String.raw`D:\Kingdom Hall\Media`, String.raw`D:\…`],
    [String.raw`\\server\share\Media`, String.raw`\\…`],
    ['/home/user/Media', '/home/…'],
    ['relative/folder', '[redacted]'],
    ['', ''],
  ])('describeFolder(%j) is %j', (path, expected) => {
    expect(describeFolder(path)).toBe(expected);
  });

  it.each([
    ['file:///C:/Media/A%20talk.mp4', '[local file].mp4'],
    [String.raw`C:\Media\Photo.JPG`, '[local file].JPG'],
    ['/home/user/song.mp3?x=1', '[local file].mp3'],
    ['/home/user/no-extension', '[local file]'],
    ['https://b.jw-cdn.org/a/b.mp4', 'https://b.jw-cdn.org/a/b.mp4'],
  ])('describeFile(%j) is %j', (value, expected) => {
    expect(describeFile(value)).toBe(expected);
  });
});
