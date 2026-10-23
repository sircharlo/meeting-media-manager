import type {
  FeatureNudge,
  FeatureNudgeContext,
  FeatureNudgeId,
  FeatureNudgeProfileState,
  SettingsValues,
} from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { Platform } from 'quasar';
import { FEATURE_NUDGES } from 'src/constants/feature-nudges';
import { defaultSettings } from 'src/constants/settings';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getFeatureNudgeContext,
  isOutsideMeetingTime,
  pickFeatureNudge,
  resetFeatureNudgesForCurrentProfile,
} from '../feature-nudges';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-20T10:00:00');

const context = (
  overrides: Partial<Omit<FeatureNudgeContext, 'settings'>> = {},
  settings: Partial<SettingsValues> = {},
): FeatureNudgeContext => ({
  congregationCount: 1,
  lowDiskSpace: false,
  obsSceneCount: null,
  online: true,
  platform: 'win32',
  screenCount: 2,
  zoomLayoutEnabled: false,
  ...overrides,
  settings: { ...defaultSettings, enableMediaDisplayButton: true, ...settings },
});

const fakeNudge = (id: FeatureNudgeId, eligible = true): FeatureNudge => ({
  acceptLabel: 'feature-nudge-show-me',
  action: { event: 'test', type: 'event' },
  getBody: () => `${id}-body`,
  icon: 'mmm-info',
  id,
  isEligible: () => eligible,
  title: `${id}-title`,
});

const answered = (
  answers: Partial<
    Record<FeatureNudgeId, ['accepted' | 'declined' | 'snoozed', number]>
  >,
  stopped = false,
): FeatureNudgeProfileState => ({
  responses: Object.fromEntries(
    Object.entries(answers).map(([id, [response, at]]) => [
      id,
      { at, response },
    ]),
  ),
  stopped,
});

describe('pickFeatureNudge', () => {
  const nudges = [fakeNudge('obs'), fakeNudge('zoom'), fakeNudge('auto-start')];
  const pick = (state?: FeatureNudgeProfileState, list = nudges) =>
    pickFeatureNudge(context(), state, NOW, list)?.id ?? null;

  it('suggests the first eligible feature, in order', () => {
    expect(pick()).toBe('obs');
    expect(pick(undefined, [fakeNudge('obs', false), fakeNudge('zoom')])).toBe(
      'zoom',
    );
  });

  it('never brings back an accepted or declined suggestion', () => {
    const yesterday = NOW.getTime() - DAY_MS;
    expect(
      pick(answered({ obs: ['accepted', yesterday], zoom: ['declined', 1] })),
    ).toBe('auto-start');
    expect(
      pick(
        answered({
          'auto-start': ['declined', 1],
          obs: ['accepted', 1],
          zoom: ['declined', 1],
        }),
      ),
    ).toBeNull();
  });

  it('suggests nothing once suggestions are stopped', () => {
    expect(pick(answered({}, true))).toBeNull();
  });

  it('shows every other eligible suggestion before a snoozed one', () => {
    const lastWeek = NOW.getTime() - 7 * DAY_MS;
    expect(pick(answered({ obs: ['snoozed', lastWeek] }))).toBe('zoom');
    expect(
      pick(
        answered({ obs: ['snoozed', lastWeek], zoom: ['declined', lastWeek] }),
      ),
    ).toBe('auto-start');
  });

  it('brings a snoozed suggestion back once the others were shown, oldest first', () => {
    const twoDaysAgo = NOW.getTime() - 2 * DAY_MS;
    const yesterday = NOW.getTime() - DAY_MS;
    expect(
      pick(
        answered({
          'auto-start': ['accepted', twoDaysAgo],
          obs: ['snoozed', yesterday],
          zoom: ['snoozed', twoDaysAgo],
        }),
      ),
    ).toBe('zoom');
  });

  it('never brings a snoozed suggestion back the same day', () => {
    const thisMorning = new Date('2026-10-20T08:00:00').getTime();
    expect(
      pick(answered({ obs: ['snoozed', thisMorning] }), [fakeNudge('obs')]),
    ).toBeNull();
    // A snooze late last night is a different day
    const lastNight = new Date('2026-10-19T23:30:00').getTime();
    expect(
      pick(answered({ obs: ['snoozed', lastNight] }), [fakeNudge('obs')]),
    ).toBe('obs');
  });

  it("doesn't bring back a snoozed suggestion that's no longer eligible", () => {
    const yesterday = NOW.getTime() - DAY_MS;
    expect(
      pick(answered({ obs: ['snoozed', yesterday] }), [
        fakeNudge('obs', false),
      ]),
    ).toBeNull();
  });
});

describe('isOutsideMeetingTime', () => {
  const start = new Date('2026-10-20T19:00:00');
  const at = (time: string) => new Date(`2026-10-20T${time}`);

  it('allows suggestions on a day without a meeting', () => {
    expect(isOutsideMeetingTime(at('18:55:00'), null)).toBe(true);
  });

  it('allows them until 15 minutes before the meeting', () => {
    expect(isOutsideMeetingTime(at('18:44:59'), start)).toBe(true);
    expect(isOutsideMeetingTime(at('18:45:00'), start)).toBe(false);
  });

  it('holds them during the meeting, until its scheduled end', () => {
    expect(isOutsideMeetingTime(at('19:30:00'), start)).toBe(false);
    expect(isOutsideMeetingTime(at('20:45:00'), start)).toBe(false);
    expect(isOutsideMeetingTime(at('20:45:01'), start)).toBe(true);
  });
});

describe('FEATURE_NUDGES', () => {
  const nudge = (id: FeatureNudgeId) => {
    const found = FEATURE_NUDGES.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`No ${id} suggestion`);
    return found;
  };
  const eligible = (
    id: FeatureNudgeId,
    overrides: Partial<Omit<FeatureNudgeContext, 'settings'>> = {},
    settings: Partial<SettingsValues> = {},
  ) => nudge(id).isEligible(context(overrides, settings));

  it('suggests features in the agreed order', () => {
    expect(FEATURE_NUDGES.map((n) => n.id)).toEqual([
      'schedule-sync',
      'zoom',
      'zoom-window-layout',
      'shared-folder',
      'meeting-timer',
      'songbook-videos',
      'auto-start',
      'obs',
    ]);
  });

  it('has a title and a plain-language body for each suggestion', () => {
    FEATURE_NUDGES.forEach((n) => {
      expect(n.title).toBe(`feature-nudge-${n.id}-title`);
      expect(n.getBody(context())).toMatch(/^feature-nudge-.+-body$/);
    });
  });

  it('suggests schedule sync for a profile not linked to its congregation', () => {
    expect(
      eligible('schedule-sync', {}, { congregationNameModified: true }),
    ).toBe(true);
    expect(
      eligible('schedule-sync', {}, { congregationNameModified: false }),
    ).toBe(false);
    expect(
      eligible(
        'schedule-sync',
        {},
        { congregationNameModified: true, disableMediaFetching: true },
      ),
    ).toBe(false);
    expect(
      eligible(
        'schedule-sync',
        { online: false },
        { congregationNameModified: true },
      ),
    ).toBe(false);
  });

  describe('Zoom Meeting Manager', () => {
    const obsWithMediaScene: Partial<SettingsValues> = {
      obsCameraScene: 'Camera',
      obsEnable: true,
      obsMediaScene: 'Media',
      obsPassword: 'secret',
      obsPort: '4455',
    };

    it('is suggested on Windows when no Zoom integration is on', () => {
      expect(eligible('zoom')).toBe(true);
      expect(eligible('zoom', { platform: 'darwin' })).toBe(false);
      expect(eligible('zoom', {}, { zoomMeetingManagerEnable: true })).toBe(
        false,
      );
      expect(eligible('zoom', {}, { zoomEnable: true })).toBe(false);
    });

    it('is suggested alongside OBS Studio without a media scene', () => {
      const settings = { ...obsWithMediaScene, obsMediaScene: null };
      expect(eligible('zoom', {}, settings)).toBe(true);
      expect(nudge('zoom').getBody(context({}, settings))).toBe(
        'feature-nudge-zoom-body',
      );
    });

    it('is offered to a simple OBS Studio setup, as a simpler way', () => {
      const simple = context({ obsSceneCount: 2 }, obsWithMediaScene);
      expect(nudge('zoom').isEligible(simple)).toBe(true);
      expect(nudge('zoom').getBody(simple)).toBe('feature-nudge-zoom-obs-body');
    });

    it('is not offered to an OBS Studio setup doing more than showing media', () => {
      expect(eligible('zoom', { obsSceneCount: 4 }, obsWithMediaScene)).toBe(
        false,
      );
      expect(
        eligible(
          'zoom',
          { obsSceneCount: 2 },
          { ...obsWithMediaScene, obsImageScene: 'Images' },
        ),
      ).toBe(false);
      // Unknown until OBS Studio is connected
      expect(eligible('zoom', { obsSceneCount: null }, obsWithMediaScene)).toBe(
        false,
      );
    });

    it('suggests the window layout once Zoom is managed, at its step of the setup assistant', () => {
      const managed = { zoomMeetingManagerEnable: true };
      expect(eligible('zoom-window-layout', {}, managed)).toBe(true);
      expect(eligible('zoom-window-layout')).toBe(false);
      expect(
        eligible('zoom-window-layout', { zoomLayoutEnabled: true }, managed),
      ).toBe(false);
      expect(
        eligible('zoom-window-layout', { platform: 'darwin' }, managed),
      ).toBe(false);
      expect(nudge('zoom-window-layout').action).toEqual({
        detail: { step: 'layout' },
        event: 'openZoomSetupAssistant',
        type: 'event',
      });
    });
  });

  it('suggests the shared folder when media display is on', () => {
    expect(eligible('shared-folder')).toBe(true);
    expect(eligible('shared-folder', {}, { enableFolderWatcher: true })).toBe(
      false,
    );
    expect(
      eligible('shared-folder', {}, { enableMediaDisplayButton: false }),
    ).toBe(false);
  });

  it('suggests the meeting timer only with a screen free for it', () => {
    expect(eligible('meeting-timer', { screenCount: 3 })).toBe(true);
    expect(eligible('meeting-timer', { screenCount: 2 })).toBe(false);
    expect(
      eligible(
        'meeting-timer',
        { screenCount: 3 },
        { enableTimerDisplay: true },
      ),
    ).toBe(false);
    expect(nudge('meeting-timer').beta).toBe(true);
  });

  it('suggests songbook videos only with room and bandwidth for them', () => {
    expect(eligible('songbook-videos')).toBe(true);
    expect(eligible('songbook-videos', { lowDiskSpace: true })).toBe(false);
    expect(eligible('songbook-videos', { online: false })).toBe(false);
    expect(eligible('songbook-videos', {}, { meteredConnection: true })).toBe(
      false,
    );
    expect(eligible('songbook-videos', {}, { enableExtraCache: true })).toBe(
      false,
    );
  });

  it('suggests starting at login where it works, for a single profile with music at launch', () => {
    expect(eligible('auto-start')).toBe(true);
    expect(eligible('auto-start', { platform: 'darwin' })).toBe(true);
    expect(eligible('auto-start', { platform: 'linux' })).toBe(false);
    expect(eligible('auto-start', { congregationCount: 2 })).toBe(false);
    expect(eligible('auto-start', {}, { autoStartMusic: false })).toBe(false);
    expect(eligible('auto-start', {}, { autoStartAtLogin: true })).toBe(false);
  });

  it('suggests OBS Studio only when no Zoom integration is on', () => {
    expect(eligible('obs')).toBe(true);
    expect(eligible('obs', {}, { obsEnable: true })).toBe(false);
    expect(eligible('obs', {}, { zoomEnable: true })).toBe(false);
    expect(eligible('obs', {}, { zoomMeetingManagerEnable: true })).toBe(false);
  });
});

describe('getFeatureNudgeContext', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gathers screens, disk space, platform, profiles and OBS scenes', async () => {
    Platform.is.win = true;
    vi.spyOn(globalThis.electronApi, 'getAllScreens').mockResolvedValue(
      Array.from({ length: 3 }, () => ({})) as Awaited<
        ReturnType<typeof globalThis.electronApi.getAllScreens>
      >,
    );
    vi.spyOn(globalThis.electronApi, 'getLowDiskSpaceStatus').mockResolvedValue(
      true,
    );
    useCongregationSettingsStore().congregations = {
      a: { ...defaultSettings },
      b: { ...defaultSettings },
    };
    const obsState = useObsStateStore();
    obsState.obsConnectionState = 'connected';
    obsState.scenes = [{ sceneName: 'Camera' }, { sceneName: 'Media' }];

    const result = await getFeatureNudgeContext({ ...defaultSettings });

    expect(result).toMatchObject({
      congregationCount: 2,
      lowDiskSpace: true,
      obsSceneCount: 2,
      platform: 'win32',
      screenCount: 3,
    });
  });

  it("doesn't count OBS scenes while OBS Studio isn't connected", async () => {
    vi.spyOn(globalThis.electronApi, 'getAllScreens').mockResolvedValue([]);
    vi.spyOn(globalThis.electronApi, 'getLowDiskSpaceStatus').mockRejectedValue(
      new Error('no disk info'),
    );
    useObsStateStore().scenes = [{ sceneName: 'Camera' }];

    const result = await getFeatureNudgeContext({ ...defaultSettings });

    expect(result.obsSceneCount).toBeNull();
    expect(result.lowDiskSpace).toBe(false);
  });
});

describe('resetFeatureNudgesForCurrentProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("forgets the current profile's answers only, and says so", () => {
    const store = useCongregationSettingsStore();
    store.featureNudges = {
      a: answered({ obs: ['declined', 1] }, true),
      b: answered({ zoom: ['declined', 1] }),
    };
    useCurrentStateStore().currentCongregation = 'a';

    resetFeatureNudgesForCurrentProfile();

    expect(store.featureNudges['a']).toBeUndefined();
    expect(store.featureNudges['b']).toBeDefined();
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' }),
    );
  });
});
