<template>
  <q-slide-transition>
    <q-banner
      v-for="announcement in activeAnnouncements"
      :key="announcement.id"
      :class="`q-ma-md ${bgColor(announcement.type)}`"
      dense
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
          v-if="announcement.actions?.includes('docs')"
          flat
          :label="t('user-guide')"
          @click="openExternal('docs')"
        />
        <q-btn
          v-if="announcement.actions?.includes('repo')"
          flat
          :label="t('github-repo')"
          @click="openExternal('repo')"
        />
        <q-btn
          v-if="announcement.actions?.includes('update')"
          flat
          :label="t('update')"
          @click="openExternal('latestRelease')"
        />
        <q-btn
          v-if="announcement.actions?.includes('translate')"
          flat
          :label="t('help-translate')"
          @click="openTranslateDiscussion"
        />
      </template>
    </q-banner>
  </q-slide-transition>
</template>
<script setup lang="ts">
import type { Announcement } from 'src/types';

import { whenever } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { localeOptions } from 'src/i18n';
import { fetchAnnouncements, fetchLatestVersion } from 'src/utils/api';
import { updatesDisabled } from 'src/utils/fs';
import { getPreviousVersion, isVersionWithinBounds } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const { openDiscussion, openExternal } = window.electronApi;

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

onMounted(() => {
  if (currentStateStore.online) {
    loadLatestVersion();
    loadAnnouncements();
  }
  getUpdatesEnabled();
});

whenever(
  () => currentStateStore.online,
  () => {
    loadLatestVersion();
    loadAnnouncements();
  },
);

const dismissed = ref<Set<string>>(new Set());

const dismiss = (id: string) => {
  dismissed.value.add(id);
  congregationStore.dismissAnnouncement(
    currentStateStore.currentCongregation,
    id,
  );
};

const bgColor = (type?: 'error' | 'info' | 'warning') => {
  switch (type) {
    case 'error':
      return 'bg-negative';
    case 'warning':
      return 'bg-warning';
    default:
      return 'bg-primary-semi-transparent';
  }
};

const announcements = ref<Announcement[]>([]);

const loadAnnouncements = async () => {
  if (announcements.value.length) return;
  announcements.value = await fetchAnnouncements();
};

const newUpdateAnnouncement = computed((): Announcement => {
  return {
    actions: ['update'],
    id: 'new-update',
    maxVersion: getPreviousVersion(latestVersion.value || '1.1.0'),
    message: 'update-available',
    persistent: true,
    platform: updatesEnabled.value ? [] : undefined,
  };
});

const currentJwLang = computed(() => currentStateStore.currentLangObject);
const langIsSupported = computed(() => {
  if (!currentJwLang.value) return true;
  return localeOptions.some(
    (l) =>
      l.langcode === currentJwLang.value?.langcode ||
      (currentJwLang.value &&
        l.signLangCodes?.includes(currentJwLang.value.langcode)),
  );
});

const untranslatedAnnouncement = computed((): Announcement => {
  return {
    actions: ['translate'],
    icon: 'ui-language',
    id: `untranslated-${currentJwLang.value?.langcode}}`,
    message: 'help-translate-new',
    platform: langIsSupported.value ? [] : undefined,
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

const activeAnnouncements = computed(() => {
  return announcements.value
    .concat([newUpdateAnnouncement.value, untranslatedAnnouncement.value])
    .filter((a) => {
      if (!currentStateStore.currentCongregation) return false;
      if (dismissed.value.has(a.id)) return false;
      if (
        a.platform &&
        !a.platform.some((p) => $q.platform.is.platform === p)
      ) {
        return false;
      }

      if (
        a.scope?.includes('obs') &&
        !currentStateStore.currentSettings?.obsEnable
      ) {
        return false;
      }

      if (
        !a.persistent &&
        congregationStore.announcements[
          currentStateStore.currentCongregation
        ]?.includes(a.id)
      ) {
        return false;
      }

      if (version) {
        return isVersionWithinBounds(version, a.minVersion, a.maxVersion);
      } else {
        return true;
      }
    });
});
</script>
