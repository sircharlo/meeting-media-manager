<template>
  <q-banner
    v-for="announcement in activeAnnouncements"
    :key="announcement.id"
    :class="`q-ma-sm ${bgColor(announcement.type)}`"
    dense
    rounded
  >
    {{ t(announcement.message) }}
    <template #avatar>
      <q-icon :name="`mmm-${announcement.type}`" />
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
</template>
<script setup lang="ts">
import type { Announcement } from 'src/types';

import { whenever } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { fetchAnnouncements, fetchLatestVersion } from 'src/helpers/api';
import {
  camelToKebabCase,
  isVersionValid,
  parseVersion,
} from 'src/helpers/general';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const { getAppVersion, openDiscussion, openExternal } = window.electronApi;

const version = ref('');
const latestVersion = ref('');

const loadAppVersion = async () => {
  version.value = await getAppVersion();
};

const loadLatestVersion = async () => {
  if (latestVersion.value) return;
  latestVersion.value = (await fetchLatestVersion()) || '';
};

onMounted(() => {
  loadAppVersion();
  if (currentStateStore.online) {
    loadLatestVersion();
    loadAnnouncements();
  }
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
      return 'bg-info';
  }
};

const announcements = ref<Announcement[]>([]);

const loadAnnouncements = async () => {
  if (announcements.value.length) return;
  announcements.value = await fetchAnnouncements();
};

const newUpdateAnnouncement = computed((): Announcement => {
  const { major, minor, patch } = parseVersion(latestVersion.value || '1.1.0');
  return {
    actions: ['update'],
    id: 'new-update',
    maxVersion: `${major}.${patch ? minor : minor - 1}.${patch ? patch - 1 : 99}`,
    message: 'update-available',
    persistent: true,
    platform: ['mac'],
  };
});

const { localeObject } = useLocale();

const translatorAnnouncement = computed((): Announcement => {
  return {
    actions: ['translate'],
    id: `translator-wanted-${localeObject.value?.langcode}`,
    message: 'translator-wanted',
  };
});

const openTranslateDiscussion = () => {
  if (!localeObject.value) return;
  openDiscussion(
    'translations',
    `New translation in ${localeObject.value.englishName}`,
    JSON.stringify({
      language: `I would like to help translate M³ into a language I speak: ${localeObject.value.label}/${localeObject.value.englishName} - ${localeObject.value.langcode}/${camelToKebabCase(localeObject.value.value)}`,
    }),
  );
};

const activeAnnouncements = computed(() => {
  return announcements.value
    .concat([newUpdateAnnouncement.value, translatorAnnouncement.value])
    .filter((a) => {
      if (!currentStateStore.currentCongregation) return false;
      if (a.persistent && dismissed.value.has(a.id)) return false;
      if (
        a.platform &&
        !a.platform.some((p) => $q.platform.is.platform === p)
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

      if (version.value) {
        return isVersionValid(version.value, a.minVersion, a.maxVersion);
      } else {
        return true;
      }
    });
});
</script>
