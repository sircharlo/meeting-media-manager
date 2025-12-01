<template>
  <q-slide-transition>
    <q-banner
      v-if="showAutoUpdateAvailableBanner"
      class="bg-info q-ma-md"
      inline-actions
      rounded
    >
      <div>
        {{ t('update-downloading') }}
        <div v-if="downloadProgress" class="q-mt-sm">
          <q-linear-progress
            color="primary"
            rounded
            size="md"
            stripe
            :value="(downloadProgress.percent || 0) / 100"
          />
          <div v-if="downloadProgressText" class="text-caption q-mt-xs">
            {{ downloadProgressText }}
          </div>
        </div>
      </div>
      <template #avatar>
        <q-icon name="mmm-download" />
      </template>
      <template #action>
        <q-btn
          flat
          :label="t('dismiss')"
          @click="showAutoUpdateAvailableBanner = false"
        />
      </template>
    </q-banner>
    <q-banner
      v-else-if="showAutoUpdateDownloadedBanner"
      class="bg-positive q-ma-md"
      inline-actions
      rounded
    >
      {{ t('update-downloaded') }}
      <template #avatar>
        <q-icon name="mmm-check" />
      </template>
      <template #action>
        <q-btn flat :label="t('quit-and-install')" @click="quitAndInstall()" />
        <q-btn
          flat
          :label="t('dismiss')"
          @click="showAutoUpdateDownloadedBanner = false"
        />
      </template>
    </q-banner>
  </q-slide-transition>
  <q-slide-transition>
    <q-banner
      v-for="announcement in activeAnnouncements"
      :key="announcement.id"
      :class="`q-ma-md ${bgColor(announcement.type)}`"
      inline-actions
      rounded
    >
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
import type { Announcement, AnnouncementAction } from 'src/types';

import prettyBytes from 'pretty-bytes';
import { useQuasar } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { localeOptions } from 'src/i18n';
import { fetchAnnouncements, fetchLatestVersion } from 'src/utils/api';
import { updatesDisabled } from 'src/utils/fs';
import { getPreviousVersion, isVersionWithinBounds } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const {
  onUpdateAvailable,
  onUpdateDownloaded,
  onUpdateDownloadProgress,
  onUpdateError,
  openDiscussion,
  openExternal,
  quitAndInstall,
} = window.electronApi;

const version = process.env.version;
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

const showAutoUpdateAvailableBanner = ref(false);
const showAutoUpdateDownloadedBanner = ref(false);
const downloadProgress = ref<null | {
  bytesPerSecond: number;
  delta: number;
  percent: number;
  total: number;
  transferred: number;
}>(null);

const downloadProgressText = computed(() => {
  if (!downloadProgress.value) return '';

  const parts: string[] = [];

  // Add percentage if available
  if (downloadProgress.value.percent != null) {
    parts.push(`${Math.round(downloadProgress.value.percent)}%`);
  }

  // Add transferred/total if both are available
  if (
    downloadProgress.value.transferred != null &&
    downloadProgress.value.total != null
  ) {
    parts.push(
      `${prettyBytes(downloadProgress.value.transferred)} / ${prettyBytes(downloadProgress.value.total)}`,
    );
  }

  // Add speed if available
  if (
    downloadProgress.value.bytesPerSecond != null &&
    downloadProgress.value.bytesPerSecond > 0
  ) {
    parts.push(
      `(${prettyBytes(downloadProgress.value.bytesPerSecond)}${t('perSecond')})`,
    );
  }

  return parts.join(' - ');
});

onMounted(() => {
  try {
    onUpdateAvailable(() => {
      try {
        showAutoUpdateAvailableBanner.value = true;
        showAutoUpdateDownloadedBanner.value = false;
        downloadProgress.value = null;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'onUpdateAvailable' } },
        });
      }
    });

    onUpdateDownloadProgress((info) => {
      try {
        downloadProgress.value = info;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { info, name: 'onUpdateDownloadProgress' } },
        });
      }
    });

    onUpdateDownloaded(() => {
      try {
        showAutoUpdateAvailableBanner.value = false;
        showAutoUpdateDownloadedBanner.value = true;
        downloadProgress.value = null;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'onUpdateDownloaded' } },
        });
      }
    });

    onUpdateError(() => {
      createTemporaryNotification({
        caption: t('update-failed'),
        icon: 'mmm-error',
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
});

const isTestVersion = process.env.IS_TEST;

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

watchEffect(() => {
  if (!currentStateStore.online) return;
  loadLatestVersion();
  loadAnnouncements();
  getUpdatesEnabled();
});

if (import.meta.env.NEVER) {
  defineExpose({});
}
</script>
