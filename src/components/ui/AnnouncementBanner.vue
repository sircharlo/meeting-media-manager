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
      <q-btn :label="t('dismiss')" flat @click="dismiss(announcement.id)" />
      <q-btn
        v-if="announcement.actions?.includes('docs')"
        :label="t('user-guide')"
        flat
        @click="openExternal('docs')"
      />
      <q-btn
        v-if="announcement.actions?.includes('repo')"
        :label="t('github-repo')"
        flat
        @click="openExternal('repo')"
      />
      <q-btn
        v-if="announcement.actions?.includes('update')"
        :label="t('update')"
        flat
        @click="openExternal('latestRelease')"
      />
    </template>
  </q-banner>
</template>
<script setup lang="ts">
import type { Announcement } from 'src/types';

import { whenever } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { fetchAnnouncements, fetchLatestVersion } from 'src/helpers/api';
import { isVersionValid, parseVersion } from 'src/helpers/general';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const { t } = useI18n();
const currentStateStore = useCurrentStateStore();
const congregationStore = useCongregationSettingsStore();

const { getAppVersion, openExternal } = window.electronApi;

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

const activeAnnouncements = computed(() => {
  return announcements.value
    .concat([newUpdateAnnouncement.value])
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
