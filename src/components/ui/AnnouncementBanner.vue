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
</template>
<script setup lang="ts">
import type {
  Announcement,
  AnnouncementAction,
  OsSupportWarning,
  UpdaterProgressInfo,
} from 'src/types';

import prettyBytes from 'pretty-bytes';
import { type QNotifyUpdateOptions, useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { fetchAnnouncements, fetchLatestVersion } from 'src/utils/api';
import { updatesDisabled } from 'src/utils/fs';
import { getPreviousVersion, isVersionWithinBounds } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { locale, t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const {
  getOsSupportWarning,
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
  latestVersion.value = (await fetchLatestVersion()) || '';
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

// The updater function returned by Notify.create()/createTemporaryNotification():
// calling it with props updates the existing notification in place (per
// https://quasar.dev/quasar-plugins/notify#updatable-notifications); calling
// it with no args dismisses it. Only non-grouped notifications support this,
// which is why the update/downloaded notification below never sets `group`.
let updateNotify: ((props?: QNotifyUpdateOptions) => void) | undefined;

// Tracks which step of the updater lifecycle is currently shown, so the
// notification's text can be re-translated in place if the active locale
// changes (e.g. when switching to a congregation with a different app
// language) without losing or resetting the notification itself.
type UpdatePhase = 'downloaded' | 'downloading' | null;
let updatePhase: UpdatePhase = null;
let lastProgressInfo: undefined | UpdaterProgressInfo;

// True once any updater event has been received over IPC. The main process
// runs the update check at startup, concurrently with the renderer booting,
// so update-available/download-progress/update-downloaded can fire before
// these listeners are registered and get silently dropped. When that
// happens we catch up via getUpdaterState() on mount instead; this flag
// prevents double-showing when the events did arrive normally.
let updateEventReceived = false;

const downloadProgressCaption = (info: UpdaterProgressInfo) => {
  const parts: string[] = [];

  if (info.percent != null) {
    parts.push(`${Math.round(info.percent)}%`);
  }

  if (info.transferred != null && info.total != null) {
    parts.push(`${prettyBytes(info.transferred)} / ${prettyBytes(info.total)}`);
  }

  if (info.bytesPerSecond != null && info.bytesPerSecond > 0) {
    parts.push(`(${prettyBytes(info.bytesPerSecond)}${t('perSecond')})`);
  }

  return parts.join(' - ');
};

const handleUpdateAvailable = () => {
  updateEventReceived = true;
  updateNotify?.();
  updatePhase = 'downloading';
  lastProgressInfo = undefined;
  updateNotify = createTemporaryNotification({
    caption: t('update-preparing'),
    message: t('update-downloading'),
    // Survives dismissAllTemporaryNotifications() (e.g. congregation
    // switches) since it isn't tied to any specific congregation.
    protect: true,
    type: 'ongoing',
  });
};

const handleUpdateDownloadProgress = (info: UpdaterProgressInfo) => {
  updateEventReceived = true;
  lastProgressInfo = info;
  updateNotify?.({ caption: downloadProgressCaption(info) });
};

const handleUpdateDownloaded = () => {
  updateEventReceived = true;

  // Already in downloaded state — avoid re-creating or re-updating the
  // notification when the same event fires more than once (e.g. the IPC
  // event arriving after catchUpUpdaterState already handled it).
  if (updatePhase === 'downloaded') return;

  updatePhase = 'downloaded';

  // When an update was already downloaded in a previous session,
  // electron-updater may fire update-downloaded directly without a
  // preceding update-available, so updateNotify may not exist yet.
  if (updateNotify) {
    updateNotify({
      actions: [
        {
          color: 'white',
          handler: () => quitAndInstall(),
          label: t('quit-and-install'),
        },
        { color: 'white', icon: 'close', round: true },
      ],
      caption: undefined,
      icon: 'mmm-check',
      message: t('update-downloaded'),
      spinner: false,
      timeout: 0,
      type: 'positive',
    });
  } else {
    updateNotify = createTemporaryNotification({
      actions: [
        {
          color: 'white',
          handler: () => quitAndInstall(),
          label: t('quit-and-install'),
        },
        { color: 'white', icon: 'close', round: true },
      ],
      icon: 'mmm-check',
      message: t('update-downloaded'),
      protect: true,
      timeout: 0,
      type: 'positive',
    });
  }
};

// The updater check runs at startup, concurrently with the renderer booting,
// so its push events can arrive before these listeners are registered and be
// silently dropped - the download would still proceed and install on quit,
// but no notification would ever appear. Re-query the main process's tracked
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
    if (!state || !state.phase) return;

    // Build the base notification first (it may not exist yet if the
    // update-available event was also missed), then apply the current step.
    handleUpdateAvailable();
    if (state.phase === 'downloading') {
      if (state.progress) handleUpdateDownloadProgress(state.progress);
    } else if (state.phase === 'downloaded') {
      handleUpdateDownloaded();
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

    onUpdateDownloaded(() => {
      try {
        handleUpdateDownloaded();
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
        timeout: 10000,
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
        transferred + total * (0.05 + Math.random() * 0.1),
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

  onMounted(() => {
    createTemporaryNotification({
      actions: [
        {
          color: 'white',
          handler: simulateUpdateFlow,
          label: 'Simulate updater',
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

const osSupportWarning = ref<null | OsSupportWarning>(null);

onMounted(async () => {
  try {
    osSupportWarning.value = await getOsSupportWarning();
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'getOsSupportWarning' } },
    });
  }
});

// Banner warning users whose OS/architecture will soon lose Electron support
const osSupportAnnouncement = computed((): Announcement => {
  return {
    icon: 'warning',
    id: `os-support-${osSupportWarning.value}`,
    message:
      osSupportWarning.value === 'mac-legacy'
        ? 'os-support-warning-mac'
        : 'os-support-warning-win32-ia32',
    persistent: true,
    platform: osSupportWarning.value ? 'all' : 'none',
    type: 'warning',
  };
});

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
    osSupportAnnouncement.value,
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
    loadLatestVersion();
    loadAnnouncements();
    getUpdatesEnabled();
  },
  { immediate: true },
);

// Re-translate the in-progress updater notification, if any, when the
// active locale changes (e.g. after switching to a congregation configured
// with a different app language) so its text always matches what's shown.
watch(locale, () => {
  if (!updateNotify || !updatePhase) return;

  if (updatePhase === 'downloading') {
    updateNotify({
      caption: lastProgressInfo
        ? downloadProgressCaption(lastProgressInfo)
        : t('update-preparing'),
      message: t('update-downloading'),
    });
  } else if (updatePhase === 'downloaded') {
    updateNotify({
      actions: [
        {
          color: 'white',
          handler: () => quitAndInstall(),
          label: t('quit-and-install'),
        },
        { color: 'white', icon: 'close', round: true },
      ],
      message: t('update-downloaded'),
    });
  }
});

if (import.meta.env.NEVER) {
  defineExpose({});
}
</script>
