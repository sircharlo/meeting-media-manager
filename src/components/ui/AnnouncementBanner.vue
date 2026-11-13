<template>
  <q-slide-transition
    v-for="announcement in activeAnnouncements"
    :key="announcement.id"
  >
    <q-banner :class="`q-ma-md ${bgColor(announcement.type)}`" rounded>
      {{ t(announcement.message) }}
      <template #avatar>
        <q-icon
          :name="`mmm-${announcement.icon || announcement.type || 'info'}`"
        />
      </template>
      <template #action>
        <q-btn flat :label="t('dismiss')" @click="dismiss(announcement.id)" />
        <q-btn
          v-for="action in announcement.actions || []"
          :key="action"
          flat
          :label="t(actionDefs[action].labelKey)"
          @click="actionDefs[action].onClick"
        />
      </template>
    </q-banner>
  </q-slide-transition>
  <Teleport to="body">
    <Transition appear name="update-toast">
      <UpdateProgressToast
        v-if="updatePhase && !updateToastDismissed"
        :key="updateToastKey"
        :install-countdown="installCountdown"
        :phase="updatePhase"
        :progress="updateProgress"
        :version-info="updateVersionInfo"
        @dismiss="dismissUpdateToast()"
        @install="installUpdate()"
        @postpone="stopInstallCountdown()"
      />
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import type {
  Announcement,
  AnnouncementAction,
  UpdaterProgressInfo,
  UpdateVersionInfo,
} from 'src/types';

import { useIntervalFn, whenever } from '@vueuse/core';
import UpdateProgressToast from 'components/ui/UpdateProgressToast.vue';
import { useQuasar } from 'quasar';
import { getMeetingStartToday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { log } from 'src/shared/vanilla';
import { fetchAnnouncements, fetchLatestVersion } from 'src/utils/api';
import { updatesDisabled } from 'src/utils/fs';
import { getPreviousVersion, isVersionWithinBounds } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { type MusicState, useMusicStore } from 'stores/music';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();
const musicStore = useMusicStore();

const {
  getUpdaterState,
  onUpdateAvailable,
  onUpdateDownloaded,
  onUpdateDownloadProgress,
  onUpdateError,
  openDiscussion,
  openExternal,
  quitAndInstall,
} = globalThis.electronApi;

const version = import.meta.env.version;
const latestVersion = ref('');
const updatesEnabled = ref(true);

const getUpdatesEnabled = async () => {
  updatesEnabled.value = !(await updatesDisabled());
};

const loadLatestVersion = async () => {
  if (latestVersion.value) return;
  latestVersion.value = (await fetchLatestVersion()) ?? '';
};
const dismissed = ref<Set<string>>(new Set());

const dismiss = (id: string) => {
  dismissed.value.add(id);
  congregationStore.dismissAnnouncement(
    currentStateStore.currentCongregation,
    id,
  );
};

const typeToBg: Record<NonNullable<Announcement['type']>, string> = {
  error: 'bg-negative',
  info: 'bg-info',
  warning: 'bg-warning',
};
const bgColor = (type?: Announcement['type']) =>
  type ? typeToBg[type] : typeToBg.info;

const announcements = ref<Announcement[]>([]);

const loadAnnouncements = async () => {
  if (announcements.value.length) return;
  announcements.value = await fetchAnnouncements();
};

// Which step of the updater lifecycle the toast is showing, if any.
type UpdatePhase = 'downloaded' | 'downloading' | null;
const updatePhase = ref<UpdatePhase>(null);
const updateProgress = shallowRef<UpdaterProgressInfo>();
const updateVersionInfo = shallowRef<UpdateVersionInfo>();
const updateToastDismissed = ref(false);
// Each new update gets a fresh toast, rather than reusing a finished one.
const updateToastKey = ref(0);

// An update that has waited since an earlier session installs by itself
// after this countdown, unless the user postpones it (the main process
// decides which updates are due: see shouldInstallOnLaunch in updater.ts).
const INSTALL_COUNTDOWN_SECONDS = 15;
// Installing closes M³ for a minute or so, which must not happen from a bit
// before the meeting until it's surely over.
const MINUTES_BEFORE_MEETING_WITHOUT_INSTALL = 15;
const MINUTES_AFTER_MEETING_START_WITHOUT_INSTALL = 120;
const MS_PER_MINUTE = 60_000;

// Background music that is starting, playing or fading out.
const MUSIC_STATES_IN_USE = new Set<MusicState>([
  'music.playing',
  'music.starting',
  'music.stopping',
]);

// Seconds left before the update installs, while counting down.
const installCountdown = ref<number>();

// The version of an update that is due now, until a profile is loaded: its
// meeting times tell whether it's a good time to install. None is loaded yet
// right after launch, when the profile picker can still be open.
const dueVersion = ref<string>();
// Due updates whose countdown already started, or was skipped, in this
// session. Checking for updates again (turning beta updates on, say) downloads
// the same update again: an update put off, or held back, stays that way
// until the next launch, or until the toast's own install button.
const handledDueVersions = new Set<string>();

const isAroundMeetingTime = () => {
  const meetingStart = getMeetingStartToday();
  if (!meetingStart) return false;
  const minutesUntilStart =
    (meetingStart.getTime() - Date.now()) / MS_PER_MINUTE;
  return (
    minutesUntilStart < MINUTES_BEFORE_MEETING_WITHOUT_INSTALL &&
    minutesUntilStart > -MINUTES_AFTER_MEETING_START_WITHOUT_INSTALL
  );
};

// Background music can start by itself well before the meeting.
const isMusicOn = () =>
  musicStore.musicPlaying || MUSIC_STATES_IN_USE.has(musicStore.musicState);

/**
 * What M³ is needed for right now, if anything, which installing would
 * interrupt: it closes M³ for a minute or so.
 * @returns Why it's not a good time to install, or null when it is
 */
const findInstallBlocker = () => {
  if (currentStateStore.mediaIsPlaying) return 'media is shown';
  if (isMusicOn()) {
    return `background music is on (state: "${musicStore.musicState}", playing: ${musicStore.musicPlaying})`;
  }
  if (isAroundMeetingTime()) return 'it is around meeting time';
  return null;
};

const { pause: pauseInstallCountdown, resume: resumeInstallCountdown } =
  useIntervalFn(
    () => {
      tickInstallCountdown();
    },
    1000,
    { immediate: false },
  );

const stopInstallCountdown = () => {
  pauseInstallCountdown();
  installCountdown.value = undefined;
};

// Every second of the countdown checks again that it's still a good time,
// before the last one installs the update.
const tickInstallCountdown = () => {
  const blocker = findInstallBlocker();
  if (blocker) {
    log(
      `Stopped the countdown to install the update, ${installCountdown.value} s before the end: ${blocker}.`,
      'electronUpdater',
      'log',
    );
    stopInstallCountdown();
    return;
  }
  if (installCountdown.value) installCountdown.value -= 1;
};

const installUpdate = () => {
  stopInstallCountdown();
  quitAndInstall();
};

const dismissUpdateToast = () => {
  stopInstallCountdown();
  updateToastDismissed.value = true;
};

// The toast just showed an update that is due now: it counts down once a
// profile is loaded (see startDueInstallCountdown).
const markUpdateDue = (versionInfo?: UpdateVersionInfo) => {
  if (!versionInfo?.installOnLaunch) return;
  if (handledDueVersions.has(versionInfo.version)) return;
  dueVersion.value = versionInfo.version;
};

// Starts the countdown for the due update, unless the toast was closed or M³
// is needed right now. The update then waits for the next launch, or for the
// toast's own install button.
const startDueInstallCountdown = () => {
  const version = dueVersion.value;
  dueVersion.value = undefined;
  if (!version) return;
  handledDueVersions.add(version);
  if (updateToastDismissed.value) return;

  const blocker = findInstallBlocker();
  if (blocker) {
    log(
      `Not installing update ${version} now: ${blocker}.`,
      'electronUpdater',
      'log',
    );
    return;
  }
  installCountdown.value = INSTALL_COUNTDOWN_SECONDS;
  resumeInstallCountdown();
};

// True once any updater event has been received over IPC. The main process
// runs the update check at startup, concurrently with the renderer booting,
// so update-available/download-progress/update-downloaded can fire before
// these listeners are registered and get silently dropped. When that
// happens we catch up via getUpdaterState() on mount instead; this flag
// prevents double-showing when the events did arrive normally.
let updateEventReceived = false;

const handleUpdateAvailable = () => {
  updateEventReceived = true;
  stopInstallCountdown();
  dueVersion.value = undefined;
  updatePhase.value = 'downloading';
  updateProgress.value = undefined;
  updateToastDismissed.value = false;
  updateToastKey.value++;
};

const handleUpdateDownloadProgress = (info: UpdaterProgressInfo) => {
  updateEventReceived = true;
  updateProgress.value = info;
};

const handleUpdateDownloaded = (versionInfo?: UpdateVersionInfo) => {
  updateEventReceived = true;

  // Already in downloaded state: the same event can fire more than once
  // (e.g. the IPC event arriving after catchUpUpdaterState handled it).
  if (updatePhase.value === 'downloaded') return;

  // When an update was already downloaded in a previous session,
  // electron-updater may fire update-downloaded directly without a
  // preceding update-available, so this can be the toast's first state.
  updatePhase.value = 'downloaded';
  updateVersionInfo.value = versionInfo;
  markUpdateDue(versionInfo);
};

// The updater check runs at startup, concurrently with the renderer booting,
// so its push events can arrive before these listeners are registered and be
// silently dropped - the download would still proceed, but no notification
// would ever appear. Re-query the main process's tracked
// state on mount so a missed update is still announced.
const catchUpUpdaterState = async () => {
  if (updateEventReceived) return;

  try {
    const state = await getUpdaterState();
    // Re-check after the await: a real update-available/downloaded event
    // may have arrived over IPC while this round-trip was in flight, and
    // its handler already set updateEventReceived - acting on the
    // now-stale catch-up snapshot here would redundantly replay
    // handleUpdateAvailable() and reset the notification it just built.
    if (updateEventReceived) return;
    if (!state?.phase) return;

    // Build the base notification first (it may not exist yet if the
    // update-available event was also missed), then apply the current step.
    handleUpdateAvailable();
    if (state.phase === 'downloading') {
      if (state.progress) handleUpdateDownloadProgress(state.progress);
    } else if (state.phase === 'downloaded') {
      handleUpdateDownloaded(state.versionInfo ?? undefined);
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'getUpdaterState' } },
    });
  }
};

onMounted(() => {
  try {
    onUpdateAvailable(() => {
      try {
        handleUpdateAvailable();
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'onUpdateAvailable' } },
        });
      }
    });

    onUpdateDownloadProgress((info) => {
      try {
        handleUpdateDownloadProgress(info);
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { info, name: 'onUpdateDownloadProgress' } },
        });
      }
    });

    onUpdateDownloaded((versionInfo) => {
      try {
        handleUpdateDownloaded(versionInfo);
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'onUpdateDownloaded' } },
        });
      }
    });

    onUpdateError(() => {
      createTemporaryNotification({
        caption: t('update-failed'),
        message: t('update-error-read-only-volume'),
        timeout: 10_000,
        type: 'negative',
      });
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'onUpdateListeners' } },
    });
  }

  void catchUpUpdaterState();
});

// Dev-only: lets a developer preview the whole updater notification
// lifecycle (downloading -> progress -> downloaded) without a real update.
if (import.meta.env.DEV) {
  const simulateUpdateFlow = () => {
    handleUpdateAvailable();

    const total = 87 * 1024 * 1024;
    let transferred = 0;
    const interval = setInterval(() => {
      transferred = Math.min(
        total,
        transferred + total * (0.05 + Math.random() * 0.1), // NOSONAR: DEV-only fake update-progress step
      );
      handleUpdateDownloadProgress({
        bytesPerSecond: total * 0.08,
        delta: 0,
        percent: (transferred / total) * 100,
        total,
        transferred,
      });

      if (transferred >= total) {
        clearInterval(interval);
        handleUpdateDownloaded();
      }
    }, 500);
  };

  // An update that waited since an earlier session, as at launch on Windows.
  // Each preview counts down again.
  const simulateInstallOnLaunch = () => {
    handledDueVersions.delete(version);
    handleUpdateAvailable();
    handleUpdateDownloaded({
      installOnLaunch: true,
      isDowngrade: false,
      version,
    });
  };

  // A downloaded update on Windows when M³ is installed for all users.
  const simulateUpdateAskingPermission = () => {
    handleUpdateAvailable();
    handleUpdateDownloaded({
      asksPermission: true,
      installOnLaunch: false,
      isDowngrade: false,
      version,
    });
  };

  onMounted(() => {
    createTemporaryNotification({
      actions: [
        {
          color: 'white',
          handler: simulateUpdateFlow,
          label: 'Simulate updater',
          noDismiss: true,
        },
        {
          color: 'white',
          handler: simulateInstallOnLaunch,
          label: 'Simulate install on launch',
          noDismiss: true,
        },
        {
          color: 'white',
          handler: simulateUpdateAskingPermission,
          label: 'Simulate all-users update',
          noDismiss: true,
        },
        { color: 'white', icon: 'close', round: true },
      ],
      message: 'Dev only: preview the auto-updater notifications',
      timeout: 0,
      type: 'info',
    });
  });
}

const isTestVersion = import.meta.env.IS_TEST;

// Test version banner for users who are using a test version
const testVersionAnnouncement = computed((): Announcement => {
  return {
    id: 'test-version',
    message: 'this-is-a-test-version',
    persistent: true,
    platform: isTestVersion ? 'all' : 'none',
    type: 'error',
  };
});

// Update banner for users who do not have updates enabled
const newUpdateAnnouncement = computed((): Announcement => {
  return {
    actions: ['update'],
    id: 'new-update',
    maxVersion: getPreviousVersion(latestVersion.value || '1.1.0'),
    message: 'update-available-please-update',
    persistent: true,
    platform: !updatesEnabled.value && !isTestVersion ? 'all' : 'none',
  };
});

const currentJwLang = computed(() => currentStateStore.currentLangObject);
const langIsNotSupported = computed(() => {
  if (!currentJwLang.value) return true;
  return !localeOptions.some(
    (l) =>
      l.langcode === currentJwLang.value?.langcode ||
      (currentJwLang.value &&
        l.signLangCodes?.includes(currentJwLang.value.langcode)),
  );
});

// Untranslated language banner for users who are using an unsupported language, asking them to translate
const untranslatedAnnouncement = computed((): Announcement | null => {
  if (!currentJwLang.value) return null;
  return {
    actions: ['translate'],
    icon: 'ui-language',
    id: `untranslated-${currentJwLang.value.langcode}`,
    message: 'help-translate-new',
    platform: langIsNotSupported.value ? 'all' : 'none',
  };
});

const openTranslateDiscussion = () => {
  if (!currentJwLang.value) return;
  openDiscussion(
    'translations',
    `New translation in ${currentJwLang.value.name}`,
    JSON.stringify({
      language: `I would like to help translate M³ into a language I speak: ${currentJwLang.value.vernacularName}/${currentJwLang.value.name} - ${currentJwLang.value.langcode}/${currentJwLang.value.symbol}`,
    }),
  );
};

const actionDefs: Record<
  AnnouncementAction,
  { labelKey: string; onClick: () => void }
> = {
  docs: { labelKey: 'user-guide', onClick: () => openExternal('docs') },
  repo: { labelKey: 'github-repo', onClick: () => openExternal('repo') },
  translate: {
    labelKey: 'help-translate',
    onClick: () => openTranslateDiscussion(),
  },
  update: { labelKey: 'update', onClick: () => openExternal('latestRelease') },
};

const matchesPlatform = (a: Announcement) => {
  if (!a.platform || a.platform === 'all') return true;
  if (a.platform === 'none') return false;
  return a.platform.some((p) => Boolean($q.platform.is[p]));
};

const isDismissed = (a: Announcement) =>
  dismissed.value.has(a.id) ||
  (!a.persistent &&
    congregationStore.announcements[
      currentStateStore.currentCongregation
    ]?.includes(a.id));

const matchesScope = (a: Announcement) =>
  !(a.scope?.includes('obs') && !currentStateStore.currentSettings?.obsEnable);

const isVersionOk = (a: Announcement) =>
  !version || isVersionWithinBounds(version, a.minVersion, a.maxVersion);

const systemAnnouncements = computed(() =>
  [
    newUpdateAnnouncement.value,
    untranslatedAnnouncement.value,
    testVersionAnnouncement.value,
  ].filter((a) => !!a),
);

const activeAnnouncements = computed(() =>
  [...announcements.value, ...systemAnnouncements.value].filter((a) => {
    if (!a.id || !a.message) return false;
    if (!currentStateStore.currentCongregation) return false;
    if (!matchesPlatform(a)) return false;
    if (isDismissed(a)) return false;
    if (!matchesScope(a)) return false;
    return isVersionOk(a);
  }),
);

watch(installCountdown, (secondsLeft) => {
  if (secondsLeft === 0) installUpdate();
});

whenever(
  () => !!dueVersion.value && !!currentStateStore.currentCongregation,
  startDueInstallCountdown,
);

// A plain watchEffect here is a trap: loadAnnouncements()/loadLatestVersion()
// each read their guard ref (announcements.value / latestVersion.value)
// synchronously before their first await, so watchEffect's auto-tracking
// picks them up as dependencies too. When the fetch keeps failing (e.g. no
// network, or demo mode's fetchRaw() rejects instantly), the later
// `announcements.value = []` / `latestVersion.value = ''` write is a *new*
// value that re-triggers this effect — an infinite reactive loop with no
// real I/O in between, since demo mode's rejection is synchronous. Watching
// only `online` explicitly avoids tracking those incidental reads.
watch(
  () => currentStateStore.online,
  (online) => {
    if (!online) return;
    loadLatestVersion().catch((error: unknown) => {
      errorCatcher(error, { contexts: { fn: { name: 'loadLatestVersion' } } });
    });
    loadAnnouncements().catch((error: unknown) => {
      errorCatcher(error, { contexts: { fn: { name: 'loadAnnouncements' } } });
    });
    getUpdatesEnabled().catch((error: unknown) => {
      errorCatcher(error, { contexts: { fn: { name: 'getUpdatesEnabled' } } });
    });
  },
  { immediate: true },
);

if (import.meta.env.NEVER) {
  defineExpose({});
}
</script>
