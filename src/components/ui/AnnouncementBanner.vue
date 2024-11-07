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

import { useQuasar } from 'quasar';
import { getAnnouncements } from 'src/boot/axios';
import { isVersionValid } from 'src/helpers/general';
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

const loadAppVersion = async () => {
  version.value = await getAppVersion();
};

onMounted(() => {
  loadAppVersion();
  loadAnnouncements();
});

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
  announcements.value = await getAnnouncements();
};

const activeAnnouncements = computed(() => {
  return announcements.value.filter((a) => {
    if (!currentStateStore.currentCongregation) return false;
    if (a.persistent && dismissed.value.has(a.id)) return false;
    if (a.platform && !a.platform.some((p) => $q.platform.is.platform === p)) {
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
