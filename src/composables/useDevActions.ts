import type { DevEmitChannel, DevFault, DevMenuCommand } from 'src/types';

import { FEATURE_NUDGES } from 'src/constants/feature-nudges';
import {
  isMwMeetingDay,
  isWeMeetingDay,
  updateLookupPeriod,
} from 'src/helpers/date';
import {
  resetDateRemindersClosedThisSession,
  showDateReminder,
} from 'src/helpers/date-reminders';
import { type DevUpdateSimulation, useDevBus } from 'src/helpers/dev-bus';
import { runDevMenuCommand } from 'src/helpers/dev-menu-commands';
import {
  devMainFaults,
  devMeetingOverride,
  devRendererFaults,
  setDevMainFault,
} from 'src/helpers/dev-state';
import { resetFeatureNudgeSession } from 'src/helpers/feature-nudges';
import { fetchMedia } from 'src/helpers/jw-media';
import {
  checkLowDiskSpaceAndNotify,
  maybeWarnAboutExpectedDownloadIssue,
  notifyDiskFull,
} from 'src/helpers/notifications';
import { handleRaisedHands } from 'src/helpers/zoom-hand-alert';
import { formatDate } from 'src/utils/date';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useHandAlertStore } from 'stores/hand-alert';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

// The Dev actions popup's actions (see DialogDevActionsPopup): ways to see,
// at any time, what a user only sees at a given moment (before or after a
// meeting, in December), on a failure (a download, a crash, the disk), or
// once (a suggestion, a tour). Dev builds only, and hardcoded English like
// the Demo menu's: never user-facing copy.

export type DevAction = DevButton | DevSwitch;

export interface DevActionGroup {
  actions: DevAction[];
  icon: string;
  id: string;
  label: string;
}

/** A button: does something once. */
export interface DevButton extends DevActionBase {
  /** Closes the popup first, for actions that open something of their own. */
  closesPopup?: boolean;
  kind: 'button';
  run: () => unknown;
}

/** A switch: fakes something until turned off. */
export interface DevSwitch extends DevActionBase {
  kind: 'switch';
  set: (on: boolean) => void;
  value: boolean;
}

interface DevActionBase {
  caption?: string;
  /** Greyed out, with the caption saying why. */
  disabled?: boolean;
  label: string;
}

const MINUTE_MS = 60 * 1000;
const FAKE_DOWNLOAD_PREFIX = 'dev-download-';

// Today's real meeting type, from before the meeting override, so turning
// the override off knows whether it changed today's meeting.
let todaysRealMeetingType: 'mw' | 'we' | null = null;

const getTodaysMeetingType = () => {
  const today = new Date();
  if (isMwMeetingDay(today)) return 'mw';
  if (isWeMeetingDay(today)) return 'we';
  return null;
};

const todayKey = () => formatDate(new Date(), 'YYYY/MM/DD');

const button = (
  label: string,
  run: () => unknown,
  options: Omit<DevButton, 'kind' | 'label' | 'run'> = {},
): DevButton => ({ kind: 'button', label, run, ...options });

const toggle = (
  label: string,
  value: boolean,
  set: (on: boolean) => void,
  options: Omit<DevSwitch, 'kind' | 'label' | 'set' | 'value'> = {},
): DevSwitch => ({ kind: 'switch', label, set, value, ...options });

const emit = (channel: DevEmitChannel, payload?: unknown) => {
  globalThis.electronApi?.devEmit(channel, payload);
};

const command = (devCommand: DevMenuCommand) => () => {
  runDevMenuCommand(devCommand);
};

export const useDevActions = () => {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const bus = useDevBus();

  const appSettings = useAppSettingsStore();
  const congregationSettings = useCongregationSettingsStore();
  const currentState = useCurrentStateStore();
  const demoMode = useDemoModeStore();
  const handAlert = useHandAlertStore();
  const music = useMusicStore();
  const quickActions = useMeetingQuickActionsStore();
  const zoomDisplaySetup = useZoomDisplaySetupStore();
  const zoomState = useZoomStateStore();

  /** Which meeting the meeting-time actions fake. */
  const meetingType = ref<'mw' | 'we'>(
    devMeetingOverride.value?.type ?? getTodaysMeetingType() ?? 'mw',
  );

  // ---- Meeting time -------------------------------------------------------

  const showToday = () => {
    currentState.selectedDate = todayKey();
    if (route.name !== 'media-calendar') void router.push('/media-calendar');
  };

  const startMeetingAt = (startsAt: number) => {
    if (!devMeetingOverride.value) {
      todaysRealMeetingType = getTodaysMeetingType();
    }
    devMeetingOverride.value = { startsAt, type: meetingType.value };
    // The panels show again, as on a new meeting day.
    quickActions.resetCurrentScope();
    showToday();
  };

  const startMeetingIn = (ms: number) => () => {
    startMeetingAt(Date.now() + ms);
  };

  const clearMeetingOverride = () => {
    const override = devMeetingOverride.value;
    if (!override) return;
    devMeetingOverride.value = null;
    quickActions.resetCurrentScope();
    // Today was another meeting, or none: whatever was fetched for the fake
    // one goes, and the week's real meetings are fetched again.
    if (override.type !== todaysRealMeetingType) {
      updateLookupPeriod({ onlyForWeekIncluding: todayKey(), reset: true });
      void fetchMedia();
    }
  };

  const endLastSong = () => {
    if (!devMeetingOverride.value && !getTodaysMeetingType()) {
      startMeetingAt(Date.now() - 100 * MINUTE_MS);
    }
    quickActions.recordLastSongEnded(Date.now());
    music.offerMusicAfterLastSong();
  };

  const stopBufferSeconds = computed(
    () => currentState.currentSettings?.meetingStopBufferSeconds ?? 60,
  );

  const meetingOverrideCaption = computed(() => {
    const override = devMeetingOverride.value;
    if (!override) return 'Today goes by the real schedule';
    const kind = override.type === 'mw' ? 'Midweek' : 'Weekend';
    return `${kind} meeting today at ${new Date(override.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const meetingGroup = computed<DevActionGroup>(() => ({
    actions: [
      button('Starts in 10 minutes', startMeetingIn(10 * MINUTE_MS), {
        caption: 'Before panel; background music starts by itself',
      }),
      button('Starts in 3 minutes', startMeetingIn(3 * MINUTE_MS), {
        caption: 'The last minutes of the countdown',
      }),
      button(
        `Starts in ${stopBufferSeconds.value + 20} seconds`,
        startMeetingIn((stopBufferSeconds.value + 20) * 1000),
        { caption: 'Background music counts down, then fades out' },
      ),
      button('Started 2 minutes ago', startMeetingIn(-2 * MINUTE_MS), {
        caption: '"Started at"; the Before panel goes away at 5 minutes',
      }),
      button('Near its end', startMeetingIn(-101 * MINUTE_MS), {
        caption: 'The After panel',
      }),
      button('Last song just ended', endLastSong, {
        caption: 'The After panel, and the offer to play music',
      }),
      button('Back to the real schedule', clearMeetingOverride, {
        caption: meetingOverrideCaption.value,
        disabled: !devMeetingOverride.value,
      }),
    ],
    icon: 'mmm-time',
    id: 'meeting',
    label: 'Meeting time',
  }));

  // ---- Background music ---------------------------------------------------

  const musicGroup = computed<DevActionGroup>(() => ({
    actions: [
      button('Play music', command({ type: 'play-music' })),
      button('Stop music', command({ type: 'stop-music' })),
      button('Offer music after the meeting', () => {
        music.offerMusicAfterLastSong();
      }),
      button(
        'Ask to start music during the meeting',
        () => {
          music.pendingMusicStart = 'dev-actions';
        },
        { caption: 'Yes plays music' },
      ),
    ],
    icon: 'mmm-music-note',
    id: 'music',
    label: 'Background music',
  }));

  // ---- Downloads ----------------------------------------------------------

  // A media item of the selected day, so its thumbnail shows the fake
  // download too.
  const pickFilename = () => {
    const fileUrl = (currentState.selectedDateObject?.mediaSections ?? [])
      .flatMap((section) => section.items ?? [])
      .find((item) => item.fileUrl?.startsWith('file:'))?.fileUrl;
    if (!fileUrl) return 'dev-simulated-video.mp4';
    const { basename, fileUrlToPath } = globalThis.electronApi;
    return basename(fileUrlToPath(fileUrl));
  };

  const simulateDownload = (fails: boolean) => () => {
    const id = `${FAKE_DOWNLOAD_PREFIX}${Date.now()}`;
    const total = 48 * 1024 * 1024;
    let loaded = 0;
    currentState.downloadProgress[id] = {
      filename: pickFilename(),
      loaded,
      meetingDate: formatDate(
        currentState.selectedDateObject?.date ?? new Date(),
        'YYYYMMDD',
      ),
      total,
    };
    const timer = setInterval(() => {
      const item = currentState.downloadProgress[id];
      if (!item) {
        clearInterval(timer);
        return;
      }
      loaded = Math.min(total, loaded + total * 0.07);
      if (fails && loaded >= total * 0.6) {
        item.error = true;
        clearInterval(timer);
      } else if (loaded >= total) {
        item.complete = true;
        delete item.loaded;
        clearInterval(timer);
      } else {
        item.loaded = loaded;
      }
    }, 400);
  };

  const clearFakeDownloads = () => {
    Object.keys(currentState.downloadProgress)
      .filter((id) => id.startsWith(FAKE_DOWNLOAD_PREFIX))
      .forEach((id) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete currentState.downloadProgress[id];
      });
  };

  const selectedDayKey = computed(() =>
    formatDate(currentState.selectedDateObject?.date, 'YYYYMMDD'),
  );

  const mainFaultToggle = (
    fault: DevFault,
    label: string,
    options: Omit<DevSwitch, 'kind' | 'label' | 'set' | 'value'> = {},
  ) =>
    toggle(
      label,
      devMainFaults[fault],
      (on) => {
        setDevMainFault(fault, on);
      },
      options,
    );

  const downloadsGroup = computed<DevActionGroup>(() => ({
    actions: [
      button('Fake a download', simulateDownload(false), {
        caption: "Of the selected day, on one of its items' thumbnail",
      }),
      button('Fake a failed download', simulateDownload(true)),
      button('Remove fake downloads', clearFakeDownloads),
      toggle(
        "Selected day's media check failed",
        currentState.meetingCheckStatus[selectedDayKey.value] === 'error',
        (on) => {
          const key = selectedDayKey.value;
          if (on) {
            currentState.meetingCheckStatus[key] = 'error';
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete currentState.meetingCheckStatus[key];
        },
        { disabled: !selectedDayKey.value },
      ),
      mainFaultToggle('failDownloads', 'New downloads fail', {
        caption: 'As a missing file (404). Cached files never download again',
      }),
      button('Pause all downloads', () => {
        globalThis.electronApi.pauseAllDownloads();
      }),
      button('Resume all downloads', () => {
        globalThis.electronApi.resumeAllDownloads();
      }),
      button(
        'Cancel all downloads',
        () => {
          globalThis.electronApi.cancelAllDownloads();
        },
        { caption: 'The real ones: as on a change of profile' },
      ),
    ],
    icon: 'mmm-download',
    id: 'downloads',
    label: 'Downloads',
  }));

  // ---- Network and disk ---------------------------------------------------

  const networkGroup = computed<DevActionGroup>(() => ({
    actions: [
      toggle('Offline', !currentState.online, (on) => {
        runDevMenuCommand({ offline: on, type: 'set-offline' });
      }),
      toggle(
        'Requests fail',
        devRendererFaults.failFetches,
        (on) => {
          devRendererFaults.failFetches = on;
        },
        { caption: 'As when the connection drops, while M³ thinks it is up' },
      ),
      toggle(
        'Disk space is low',
        devMainFaults.lowDiskSpace,
        (on) => {
          setDevMainFault('lowDiskSpace', on);
          if (on) void checkLowDiskSpaceAndNotify();
        },
        { caption: 'Warns now, then on every check while it is on' },
      ),
      button('Disk full', notifyDiskFull, {
        caption: 'At most every 5 minutes',
      }),
      button(
        'Disk full during a download',
        () => {
          emit('downloadError', { diskFull: true, id: 'dev-disk-full' });
        },
        { caption: 'Through the main process; at most every 5 minutes' },
      ),
      button(
        'Download issues expected here',
        maybeWarnAboutExpectedDownloadIssue,
        { caption: 'As for users in some countries; at most every 5 minutes' },
      ),
    ],
    icon: 'mmm-cloud-error',
    id: 'network',
    label: 'Network and disk',
  }));

  // ---- Updates ------------------------------------------------------------

  const simulateUpdate = (simulation: DevUpdateSimulation) => () => {
    bus.emit({ simulation, type: 'simulate-update' });
  };

  const updatesGroup = computed<DevActionGroup>(() => ({
    actions: [
      button('Download an update', simulateUpdate('flow'), {
        caption: 'Downloading, its progress, then downloaded',
      }),
      button('Download stalls', simulateUpdate('stalled'), {
        caption: 'Waiting for the network after a few seconds',
      }),
      button('Install on launch', simulateUpdate('install-on-launch'), {
        caption: 'Counts down, unless media, music or a meeting is on',
      }),
      button('Installed for all users', simulateUpdate('all-users'), {
        caption: 'Windows asks for permission to install',
      }),
      button('Back to an older version', simulateUpdate('downgrade')),
      button('Update failed: disk full', () => {
        emit('update-error', 'disk-full');
      }),
      button('Update failed: read-only disk', () => {
        emit('update-error', 'read-only-volume');
      }),
    ],
    icon: 'mmm-updates-disabled',
    id: 'updates',
    label: 'Updates',
  }));

  // ---- Crashes and windows ------------------------------------------------

  const windowsGroup = computed<DevActionGroup>(() => ({
    actions: [
      button('Toggle media window', command({ type: 'toggle-media-window' })),
      button('Toggle timer window', command({ type: 'toggle-timer-window' })),
      button('Graphics crashed', () => {
        emit('gpu-crash-detected');
      }),
      button('Hardware acceleration off for this session', () => {
        emit('hardware-acceleration-temporary-disabled');
      }),
      button(
        "A video couldn't be decoded",
        () => {
          const channel = new BroadcastChannel('gpu-decode-failed');
          channel.postMessage(Date.now());
          channel.close();
        },
        { caption: 'Once per session; never with hardware acceleration off' },
      ),
      button('Camera access needed', () => {
        emit('video-capture-crash-detected');
      }),
      button(
        'Media window restarted',
        () => {
          emit('media-window-renderer-gone', { reloading: true });
        },
        { caption: 'Only while media is shown, which stops' },
      ),
      button('Media window keeps stopping', () => {
        emit('media-window-renderer-gone', { reloading: false });
      }),
      button(
        'Watched folder error',
        () => {
          emit('watchFolderError');
        },
        { caption: 'Once per session' },
      ),
      button(
        'Network folder is slow',
        () => {
          emit('pathProbeNetworkWarning');
        },
        { caption: 'Once per session' },
      ),
      button(
        "Website can't be reached",
        () => {
          emit('websiteLoadFailed');
        },
        { caption: 'While a website is presented' },
      ),
    ],
    icon: 'mmm-window',
    id: 'windows',
    label: 'Crashes and windows',
  }));

  // ---- Yeartext -----------------------------------------------------------

  const offerYeartextPreview = () => {
    const nextYear = new Date().getFullYear() + 1;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete appSettings.yeartextPreviewDismissed[nextYear];
    bus.emit({ type: 'offer-yeartext-preview' });
  };

  const yeartextGroup = computed<DevActionGroup>(() => ({
    actions: [
      button("Offer next year's yeartext", offerYeartextPreview, {
        caption:
          "As in December, even if answered. Needs this year's yeartext, the media display and a connection",
      }),
    ],
    icon: 'mmm-yeartext',
    id: 'yeartext',
    label: 'Yeartext',
  }));

  // ---- Zoom ---------------------------------------------------------------

  const showAutomationOverlay = () => {
    zoomState.beginRun('zoom-run-meeting-sequence');
    zoomState.setRunStep('zoom-run-host-mic');
    setTimeout(() => {
      zoomState.abortRun();
    }, 5000);
  };

  const zoomGroup = computed<DevActionGroup>(() => ({
    actions: [
      button(
        'Ask "Is anyone on Zoom?"',
        () => {
          zoomDisplaySetup.open(meetingType.value);
        },
        {
          caption: 'Closes by itself unless a meeting is coming',
          closesPopup: true,
        },
      ),
      button(
        'Media display tour',
        () => {
          zoomDisplaySetup.startTour();
        },
        { closesPopup: true },
      ),
      button(
        'Ask before testing Zoom',
        () => {
          zoomState.promptForCheck();
        },
        { closesPopup: true },
      ),
      button(
        'Test Zoom now',
        () => {
          globalThis.dispatchEvent(new Event('testZoomAgain'));
        },
        { caption: 'A real check: may start Zoom' },
      ),
      button(
        'Zoom setup assistant',
        () => {
          globalThis.dispatchEvent(new CustomEvent('openZoomSetupAssistant'));
        },
        { closesPopup: true },
      ),
      toggle(
        'Automations paused',
        !!zoomState.pause,
        (on) => {
          if (on) {
            zoomState.pauseAutomations(currentState.currentCongregation, [
              'zoom-setup-check-meeting',
            ]);
          } else {
            zoomState.resumeAutomations();
          }
        },
        { caption: 'As after a failed check' },
      ),
      button('Automation overlay for 5 seconds', showAutomationOverlay, {
        closesPopup: true,
      }),
      toggle(
        'Hands raised',
        handAlert.raisedHands.length > 0,
        (on) => {
          handleRaisedHands(on ? ['Jane Doe', 'John Smith'] : []);
        },
        { caption: 'A real hand watcher replaces them within seconds' },
      ),
    ],
    icon: 'mmm-video-meeting',
    id: 'zoom',
    label: 'Zoom',
  }));

  // ---- Prompts and tours --------------------------------------------------

  const showReminder = (id: 'coWeek' | 'memorialDate') => () => {
    resetDateRemindersClosedThisSession();
    const isCo = id === 'coWeek';
    showDateReminder({
      caption: t(
        isCo
          ? 'dont-forget-to-add-circuit-overseer-date'
          : 'dont-forget-to-add-memorial-date',
      ),
      congId: currentState.currentCongregation,
      id,
      message: t(
        isCo ? 'no-circuit-overseer-date-set' : 'no-memorial-date-set',
      ),
      onGoToSettings: () => {
        void router.push(`/settings/${id}`);
      },
    });
  };

  const showAnnouncement = (type: 'error' | 'info' | 'warning') => () => {
    bus.emit({
      announcement: {
        actions: ['docs'],
        id: `dev-announcement-${type}`,
        message: `A ${type} announcement, as the announcements file can show one`,
        persistent: true,
        type,
      },
      type: 'show-announcement',
    });
  };

  const forgetFeatureNudgeAnswers = () => {
    congregationSettings.resetFeatureNudges(currentState.currentCongregation);
    resetFeatureNudgeSession();
  };

  const promptsGroup = computed<DevActionGroup>(() => ({
    actions: [
      ...FEATURE_NUDGES.map((nudge) =>
        button(
          `Suggest: ${t(nudge.title)}`,
          () => {
            bus.emit({ id: nudge.id, type: 'show-feature-nudge' });
          },
          { closesPopup: true },
        ),
      ),
      button('Forget the answers to suggestions', forgetFeatureNudgeAnswers, {
        caption: 'For this profile: it gets suggestions again',
      }),
      button(
        'Quick-start tour',
        () => {
          bus.emit({ type: 'replay-quick-start-tour' });
        },
        { caption: 'On the media calendar', closesPopup: true },
      ),
      button('Reminder: no CO visit date', showReminder('coWeek')),
      button('Reminder: no Memorial date', showReminder('memorialDate')),
      button('Announcement: info', showAnnouncement('info')),
      button('Announcement: warning', showAnnouncement('warning')),
      button('Announcement: error', showAnnouncement('error')),
      button(
        'Profile switcher',
        () => {
          currentState.openCongregationSwitcher();
        },
        { closesPopup: true },
      ),
    ],
    icon: 'mmm-guide',
    id: 'prompts',
    label: 'Prompts and tours',
  }));

  // ---- Demo mode ----------------------------------------------------------

  const demoGroup = computed<DevActionGroup>(() => {
    const demoOff = !demoMode.enabled;
    const needsDemo = { caption: 'In demo mode', disabled: demoOff };
    return {
      actions: [
        toggle('Demo mode', demoMode.enabled, (on) => {
          runDevMenuCommand({ enabled: on, type: 'set-demo-enabled' });
        }),
        button('Reseed demo congregation', command({ type: 'reseed-demo' }), {
          caption: 'Replaces every profile',
        }),
        button('Reset demo state', command({ type: 'reset-demo' })),
        button(
          'Jump to pre-meeting',
          command({ type: 'jump-pre-meeting' }),
          needsDemo,
        ),
        button(
          'Jump to last song',
          command({ type: 'jump-last-song' }),
          needsDemo,
        ),
        button(
          'Finish last song',
          command({ type: 'finish-last-song' }),
          needsDemo,
        ),
        button('Show the panels again', command({ type: 'reshow-panels' })),
        button(
          'Dismiss the Before panel',
          command({ type: 'dismiss-before-panel' }),
        ),
        button(
          'Dismiss the After panel',
          command({ type: 'dismiss-after-panel' }),
        ),
      ],
      icon: 'mmm-play-box-outline',
      id: 'demo',
      label: 'Demo mode',
    };
  });

  const groups = computed<DevActionGroup[]>(() => [
    meetingGroup.value,
    musicGroup.value,
    downloadsGroup.value,
    networkGroup.value,
    updatesGroup.value,
    windowsGroup.value,
    yeartextGroup.value,
    zoomGroup.value,
    promptsGroup.value,
    demoGroup.value,
  ]);

  // ---- What's faked, and turning it all off --------------------------------

  const faked = computed(() => {
    const things: string[] = [];
    if (devMeetingOverride.value) things.push(meetingOverrideCaption.value);
    if (!currentState.online) things.push('offline');
    if (devRendererFaults.failFetches) things.push('requests fail');
    if (devMainFaults.failDownloads) things.push('downloads fail');
    if (devMainFaults.lowDiskSpace) things.push('low disk space');
    return things;
  });

  const stopFakingEverything = () => {
    clearMeetingOverride();
    devRendererFaults.failFetches = false;
    (Object.keys(devMainFaults) as DevFault[]).forEach((fault) => {
      if (devMainFaults[fault]) setDevMainFault(fault, false);
    });
    if (!currentState.online) {
      runDevMenuCommand({ offline: false, type: 'set-offline' });
    }
  };

  return { faked, groups, meetingType, stopFakingEverything };
};
