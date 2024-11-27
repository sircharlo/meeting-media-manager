<template>
  <q-drawer
    v-model="drawer"
    bordered
    :breakpoint="5"
    class="column justify-between no-wrap bg-secondary-contrast text-weight-medium text-dark-grey"
    :mini="miniState"
  >
    <q-item
      v-if="$q.screen.gt.xs"
      v-ripple
      clickable
      @click="(miniState = !miniState)"
    >
      <q-tooltip
        v-if="miniState"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ $t('expand-sidebar') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-menu" />
      </q-item-section>
      <q-item-section>{{ $t('collapse-sidebar') }}</q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="route.path.startsWith('/media-calendar') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || invalidSettings()"
      :disabled="mediaPlaying || undefined"
      :to="mediaPlaying ? undefined : { path: '/media-calendar' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{
          !currentSettings
            ? $t('select-a-congregation-to-enable')
            : $t('titles.meetingMedia')
        }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-media" />
      </q-item-section>
      <q-item-section>{{ $t('titles.meetingMedia') }}</q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="route.path.startsWith('/present-website') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || invalidSettings()"
      :disabled="mediaPlaying || undefined"
      :to="mediaPlaying ? undefined : { path: '/present-website' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ $t('titles.presentWebsite') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-open-web" />
      </q-item-section>
      <q-item-section>{{ $t('titles.presentWebsite') }}</q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="
        route.path.startsWith('/congregation-selector') ? navActiveClass : ''
      "
      clickable
      :disabled="mediaPlaying || undefined"
      :to="mediaPlaying ? undefined : { path: '/congregation-selector' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ $t('titles.profileSelection') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-groups" />
      </q-item-section>
      <q-item-section>
        {{ $t('titles.profileSelection') }}
      </q-item-section>
    </q-item>
    <q-space />
    <q-item
      v-ripple
      :class="route.path.startsWith('/settings') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || route.fullPath.includes('wizard')"
      :disabled="mediaPlaying || undefined"
      :to="mediaPlaying ? undefined : { path: '/settings' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ $t('titles.settings') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon
          :color="invalidSettings() ? 'negative' : ''"
          name="mmm-settings"
        />
      </q-item-section>
      <q-item-section :class="invalidSettings() ? 'text-negative' : ''">
        {{ $t('titles.settings') }}
      </q-item-section>
    </q-item>
  </q-drawer>
</template>
<script setup lang="ts">
import { whenever } from '@vueuse/core';
// Packages
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { createTemporaryNotification } from 'src/helpers/notifications';
// Stores
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const { currentSettings, mediaPlaying } = storeToRefs(currentState);

const $q = useQuasar();
const route = useRoute();

const drawer = ref(true);
const miniState = defineModel<boolean>({ required: true });

const navActiveClass = computed(
  () =>
    ($q.dark.isActive ? 'bg-accent-400' : 'bg-accent-100') +
    ' text-primary blue-bar',
);

whenever(
  () => $q.screen.lt.sm,
  () => {
    miniState.value = true;
  },
);

const { t } = useI18n();

const stopPlayingMediaFirst = () => {
  if (mediaPlaying.value) {
    createTemporaryNotification({
      caption: ref(t('stop-playing-media-first')).value,
      group: 'stop-playing-media',
      icon: 'mmm-media',
      message: ref(t('stop-playing-media-first-explain')).value,
    });
  }
};
</script>
