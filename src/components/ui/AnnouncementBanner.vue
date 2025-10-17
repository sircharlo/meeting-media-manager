<template>
  <q-slide-transition>
    <q-banner
      v-if="showAutoUpdateAvailableBanner"
      class="bg-info q-ma-md"
      inline-actions
      rounded
    >
      {{ t('update-downloading') }}
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

import { useEventListener } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { localeOptions } from 'src/i18n';
import { fetchAnnouncements, fetchLatestVersion } from 'src/utils/api';
import { updatesDisabled } from 'src/utils/fs';
import { getPreviousVersion, isVersionWithinBounds } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const { openDiscussion, openExternal, quitAndInstall } = window.electronApi;

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

useEventListener(window, 'update-available', () => {
  showAutoUpdateAvailableBanner.value = true;
  showAutoUpdateDownloadedBanner.value = false;
});

useEventListener(window, 'update-downloaded', () => {
  showAutoUpdateAvailableBanner.value = false;
  showAutoUpdateDownloadedBanner.value = true;
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
const untranslatedAnnouncement = computed((): Announcement => {
  return {
    actions: ['translate'],
    icon: 'ui-language',
    id: `untranslated-${currentJwLang.value?.langcode}`,
    message: 'help-translate-new',
    platform: langIsNotSupported.value ? 'all' : 'none',
  };
});

const openTranslateDiscussion = () => {
  if (!currentJwLang.value) return;
  openDiscussion(
    'translations',
    `New translation in ${currentJwLang.value?.name}`,
    JSON.stringify({
      language: `I would like to help translate M³ into a language I speak: ${currentJwLang.value?.vernacularName}/${currentJwLang.value.name} - ${currentJwLang.value.langcode}/${currentJwLang.value.symbol}`,
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

const systemAnnouncements = computed(() => [
  newUpdateAnnouncement.value,
  untranslatedAnnouncement.value,
  testVersionAnnouncement.value,
]);

const activeAnnouncements = computed(() =>
  [...announcements.value, ...systemAnnouncements.value].filter((a) => {
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
