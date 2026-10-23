import type * as MeetingQuickActionsHelpers from 'src/helpers/meeting-quick-actions';
import type * as VanillaModule from 'src/shared/vanilla';
import type { SettingsValues } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { fetchSongLibrary } from 'src/helpers/background-music';
import { getMusicStartMeetingConflict } from 'src/helpers/meeting-quick-actions';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
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
    startOffsetSeconds: 0,
  })),
}));

vi.mock('src/helpers/error-catcher', () => ({ errorCatcher: vi.fn() }));

vi.mock('src/helpers/jw-media', () => ({ downloadBackgroundMusic: vi.fn() }));

vi.mock('src/helpers/meeting-quick-actions', async (importOriginal) => ({
  ...(await importOriginal<typeof MeetingQuickActionsHelpers>()),
  getMusicStartMeetingConflict: vi.fn(() => null),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(() => vi.fn()),
}));

vi.mock('src/helpers/zoom', () => ({
  autoLaunchZoomMeetingIfNeeded: vi.fn(async () => undefined),
  automateZoomMeetingSettings: vi.fn(async () => undefined),
  automateZoomPostMeetingSettings: vi.fn(async () => undefined),
}));

vi.mock('src/shared/vanilla', async (importOriginal) => ({
  ...(await importOriginal<typeof VanillaModule>()),
  log: vi.fn(),
}));

// Every manual start (buttons, the shortcut, notifications) goes through
// requestMusicStart, which holds it back while the meeting may still be on.
describe('requestMusicStart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T12:00:00'));
    vi.clearAllMocks();
    setActivePinia(createPinia());
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
      () => undefined,
    );

    vi.mocked(getMusicStartMeetingConflict).mockReturnValue(null);
    seedSettings();
    useCurrentStateStore().currentCongregation = CONG_ID;
  });

  afterEach(() => {
    // Stops its shortcut listener, which would answer the next test's too.
    useMusicStore().$dispose();
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
        ...overrides,
      },
    };
  };

  it('starts straight away outside the meeting', async () => {
    const music = useMusicStore();

    music.requestMusicStart('manual-button');

    await vi.waitFor(() => expect(fetchSongLibrary).toHaveBeenCalled());
    expect(music.pendingMusicStart).toBeNull();
  });

  it('asks first during the meeting, and starts once confirmed', async () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('meeting');
    const music = useMusicStore();

    music.requestMusicStart('manual-button');

    expect(music.pendingMusicStart).toBe('manual-button');
    expect(music.musicState).toBe('');

    music.confirmPendingMusicStart();

    expect(music.pendingMusicStart).toBeNull();
    await vi.waitFor(() => expect(fetchSongLibrary).toHaveBeenCalled());
  });

  it('starts nothing when the confirmation is declined', () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('meeting');
    const music = useMusicStore();

    music.requestMusicStart('quick-action');
    music.cancelPendingMusicStart();

    expect(music.pendingMusicStart).toBeNull();
    expect(music.musicState).toBe('');
    expect(fetchSongLibrary).not.toHaveBeenCalled();
  });

  it('explains instead of starting just before the meeting', () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('final-approach');
    const music = useMusicStore();

    music.requestMusicStart('manual-button');

    expect(music.pendingMusicStart).toBeNull();
    expect(music.musicState).toBe('');
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' }),
    );
  });

  it('neither asks nor starts while music cannot start at all', () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('meeting');
    useCurrentStateStore().mediaPlaying.action = 'play';
    const music = useMusicStore();

    music.requestMusicStart('manual-button');

    expect(music.pendingMusicStart).toBeNull();
    expect(fetchSongLibrary).not.toHaveBeenCalled();
  });

  it('brings M³ forward to ask when the shortcut starts music', () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('meeting');
    const focusMainWindow = vi.spyOn(globalThis.electronApi, 'focusMainWindow');
    const music = useMusicStore();

    globalThis.dispatchEvent(new CustomEvent('toggleMusic'));

    expect(music.pendingMusicStart).toBe('manual-shortcut');
    expect(focusMainWindow).toHaveBeenCalledOnce();
  });

  it('leaves M³ where it is when the shortcut starts music right away', () => {
    const focusMainWindow = vi.spyOn(globalThis.electronApi, 'focusMainWindow');
    useMusicStore();

    globalThis.dispatchEvent(new CustomEvent('toggleMusic'));

    expect(focusMainWindow).not.toHaveBeenCalled();
  });
});

describe('offerMusicAfterLastSong', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T12:00:00'));
    vi.clearAllMocks();
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue(null);
    setActivePinia(createPinia());
    useCurrentStateStore().currentCongregation = CONG_ID;
    useJwStore().lookupPeriod[CONG_ID] = [
      { date: new Date(), mediaSections: [], status: null },
    ];
  });

  afterEach(() => {
    useMusicStore().$dispose();
    vi.useRealTimers();
  });

  // Today (a Friday) is the midweek meeting day.
  const seedMeetingDay = (
    mwStartTime: SettingsValues['mwStartTime'],
    overrides: Partial<SettingsValues> = {},
  ) => {
    useCongregationSettingsStore().congregations = {
      [CONG_ID]: {
        ...defaultSettings,
        autoStartMusic: false,
        enableMeetingQuickActions: false,
        enableMusicButton: true,
        lang: 'E',
        mwDay: '4',
        mwStartTime,
        ...overrides,
      },
    };
  };

  const lastPromptActions = () =>
    vi.mocked(createTemporaryNotification).mock.lastCall?.[0].actions;

  it('offers to start the music once the meeting is over', () => {
    seedMeetingDay('10:00');
    const music = useMusicStore();

    music.offerMusicAfterLastSong();

    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 0, type: 'info' }),
    );
  });

  it('starts the music from the notification through the same check', () => {
    vi.mocked(getMusicStartMeetingConflict).mockReturnValue('meeting');
    seedMeetingDay('10:00');
    const music = useMusicStore();

    music.offerMusicAfterLastSong();
    const [playAction] = lastPromptActions() ?? [];
    playAction?.handler?.();

    expect(music.pendingMusicStart).toBe('after-meeting-prompt');
  });

  it('leaves it to the after-meeting panel when that shows', () => {
    seedMeetingDay('10:00', { enableMeetingQuickActions: true });
    const music = useMusicStore();

    music.offerMusicAfterLastSong();

    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });

  it('offers it when the after-meeting panel was dismissed', () => {
    seedMeetingDay('10:00', { enableMeetingQuickActions: true });
    useMeetingQuickActionsStore().dismissAfter();
    const music = useMusicStore();

    music.offerMusicAfterLastSong();

    expect(createTemporaryNotification).toHaveBeenCalledOnce();
  });

  it('stays quiet for a last song played before the meeting', () => {
    seedMeetingDay('13:00');
    const music = useMusicStore();

    music.offerMusicAfterLastSong();

    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });

  it('stays quiet without background music', () => {
    seedMeetingDay('10:00', { enableMusicButton: false });
    const music = useMusicStore();

    music.offerMusicAfterLastSong();

    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });
});
