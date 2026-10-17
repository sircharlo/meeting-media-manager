import type * as VanillaModule from 'src/shared/vanilla';
import type { SettingsValues } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import {
  fetchSongLibrary,
  prepareMeetingDaySongQueue,
} from 'src/helpers/background-music';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMusicStore } from '../music';

const SONG_URL = 'file:///cache/song-1.mp3';
const CONG_ID = '00000000-0000-4000-8000-000000000001';

vi.mock('src/helpers/background-music', () => ({
  enrichSongsWithMetadata: vi.fn((songs: unknown[]) => songs),
  fetchSongLibrary: vi.fn(async () => [{ path: SONG_URL, title: 'Song 1' }]),
  formatRemainingTime: vi.fn(() => ''),
  getNextSongFromQueue: vi.fn(async () => ({ nextSongUrl: SONG_URL })),
  prepareMeetingDaySongQueue: vi.fn(() => ({
    queue: [{ path: SONG_URL, title: 'Song 1' }],
    startOffsetSeconds: 12.5,
  })),
}));

vi.mock('src/helpers/error-catcher', () => ({ errorCatcher: vi.fn() }));

vi.mock('src/helpers/jw-media', () => ({ downloadBackgroundMusic: vi.fn() }));

vi.mock('src/helpers/zoom', () => ({
  autoLaunchZoomMeetingIfNeeded: vi.fn(async () => undefined),
  automateZoomMeetingSettings: vi.fn(async () => undefined),
  automateZoomPostMeetingSettings: vi.fn(async () => undefined),
}));

vi.mock('src/shared/vanilla', async (importOriginal) => ({
  ...(await importOriginal<typeof VanillaModule>()),
  log: vi.fn(),
}));

// What playMusic does with the outcome of the audio element's play() call.
describe('playMusic', () => {
  const playMock = vi.fn<() => Promise<void>>();
  const pauseMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T12:00:00'));
    vi.clearAllMocks();
    setActivePinia(createPinia());
    playMock.mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pauseMock);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
      () => undefined,
    );

    seedSettings();
    useCurrentStateStore().currentCongregation = CONG_ID;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const seedSettings = (overrides: Partial<SettingsValues> = {}) => {
    useCongregationSettingsStore().congregations = {
      [CONG_ID]: {
        ...defaultSettings,
        autoStartMusic: false,
        enableMusicButton: true,
        lang: 'E',
        musicVolume: 50,
        ...overrides,
      },
    };
  };

  const logMessages = () =>
    vi.mocked(log).mock.calls.map(([message]) => message);

  it('does not start while the music button is turned off', async () => {
    seedSettings({ enableMusicButton: false });
    const music = useMusicStore();

    await music.playMusic();

    expect(fetchSongLibrary).not.toHaveBeenCalled();
    expect(playMock).not.toHaveBeenCalled();
    expect(music.musicState).toBe('');
  });

  it('does not start while meeting media is playing', async () => {
    useCurrentStateStore().mediaPlaying.action = 'play';
    const music = useMusicStore();

    await music.playMusic();

    expect(fetchSongLibrary).not.toHaveBeenCalled();
    expect(music.musicState).toBe('');
  });

  it('plays the next song and fades in to the configured volume', async () => {
    const music = useMusicStore();

    await music.playMusic();

    expect(fetchSongLibrary).toHaveBeenCalledWith('E');
    expect(music.musicPlayer?.querySelector('source')?.src).toBe(SONG_URL);
    expect(playMock).toHaveBeenCalledOnce();
    expect(logMessages()).toContain('Fading to volume level 0.5');
    expect(logMessages()).toContain('Music started at 0 seconds');
    expect(
      logMessages().some((message) =>
        String(message).endsWith('into first song to align with meeting time'),
      ),
    ).toBe(false);
    expect(music.musicState).toBe('music.starting');
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('starts the first song part-way through to line it up with the meeting', async () => {
    // Today (a Friday) is the midweek meeting day, an hour from now.
    seedSettings({ mwDay: '4', mwStartTime: '13:00' });
    useJwStore().lookupPeriod[CONG_ID] = [
      { date: new Date(), mediaSections: [], status: null },
    ];
    const music = useMusicStore();

    await music.playMusic();

    expect(prepareMeetingDaySongQueue).toHaveBeenCalledOnce();
    expect(logMessages()).toContain(
      'Starting 12.5s into first song to align with meeting time',
    );
    expect(logMessages()).toContain('Music started at 12.5 seconds');
    expect(logMessages()).toContain('Fading to volume level 0.5');
  });

  it('ignores a play request interrupted on purpose', async () => {
    playMock.mockRejectedValue(
      new Error('The play() request was interrupted by a call to pause().'),
    );
    const music = useMusicStore();

    await music.playMusic();

    expect(music.musicState).toBe('music.starting');
    expect(errorCatcher).not.toHaveBeenCalled();
    expect(logMessages()).not.toContain('Fading to volume level 0.5');
  });

  it('reports a failed play request and schedules a retry', async () => {
    const error = new Error('PIPELINE_ERROR_DECODE: audio decode error');
    playMock.mockRejectedValue(error);
    const music = useMusicStore();
    const timersBefore = vi.getTimerCount();

    await music.playMusic('auto');

    expect(music.musicState).toBe('music.error');
    expect(errorCatcher).toHaveBeenCalledExactlyOnceWith(error, {
      contexts: {
        fn: { lang: 'E', name: 'playMusic', pub: 'sjjm', reason: 'auto' },
      },
    });
    expect(vi.getTimerCount()).toBe(timersBefore + 1);
  });

  it('treats a failure that is not an Error as a real one', async () => {
    playMock.mockRejectedValue('interrupted by a call to pause');
    const music = useMusicStore();

    await music.playMusic();

    expect(music.musicState).toBe('music.error');
    expect(errorCatcher).toHaveBeenCalledWith(
      'interrupted by a call to pause',
      expect.objectContaining({
        contexts: { fn: expect.objectContaining({ name: 'playMusic' }) },
      }),
    );
  });

  describe('when stopped while play() is pending', () => {
    let settlePlay: { reject: (error: unknown) => void; resolve: () => void };

    beforeEach(() => {
      playMock.mockImplementation(
        () =>
          new Promise<void>((resolve, reject) => {
            settlePlay = { reject, resolve };
          }),
      );
    });

    const startThenStop = async () => {
      const music = useMusicStore();
      const started = music.playMusic();
      await vi.waitFor(() => expect(playMock).toHaveBeenCalled());
      music.stopMusic();
      return { music, started };
    };

    it('pauses again instead of fading in', async () => {
      const { music, started } = await startThenStop();
      pauseMock.mockClear();

      settlePlay.resolve();
      await started;

      expect(pauseMock).toHaveBeenCalledOnce();
      expect(logMessages()).not.toContain('Fading to volume level 0.5');
      expect(music.musicState).toBe('');
    });

    it('does not report the failure of the replaced start', async () => {
      const { music, started } = await startThenStop();

      settlePlay.reject(new Error('PIPELINE_ERROR_DECODE: audio decode error'));
      await started;

      expect(music.musicState).toBe('');
      expect(errorCatcher).not.toHaveBeenCalled();
    });
  });
});
