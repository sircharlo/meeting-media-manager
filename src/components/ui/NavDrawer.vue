<template>
  <q-drawer
    v-model="drawer"
    :breakpoint="5"
    :mini="miniState"
    bordered
    class="column justify-between no-wrap bg-secondary-contrast text-weight-medium text-dark-grey"
  >
    <q-item
      v-if="$q.screen.gt.xs"
      v-ripple
      clickable
      @click="miniState = !miniState"
    >
      <q-tooltip
        v-if="miniState"
        :delay="1000"
        anchor="center right"
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
      :disable="!currentSettings || invalidSettings()"
      :to="{ path: '/media-calendar', exact: true }"
      active-class="bg-accent-100 text-primary blue-bar"
      clickable
    >
      <q-tooltip
        v-if="miniState"
        :delay="1000"
        anchor="center right"
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
      v-if="!$q.platform.is.mac"
      v-ripple
      :disable="!currentSettings || invalidSettings() || mediaPlaying"
      :to="{ path: '/present-website', exact: true }"
      active-class="bg-accent-100 text-primary blue-bar"
      clickable
    >
      <q-tooltip
        v-if="miniState"
        :delay="1000"
        anchor="center right"
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
      :disable="mediaPlaying"
      :to="{ path: '/congregation-selector', exact: true }"
      active-class="bg-accent-100 text-primary blue-bar"
      clickable
    >
      <q-tooltip
        v-if="miniState"
        :delay="1000"
        anchor="center right"
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
      :disable="
        !currentSettings || mediaPlaying || route.fullPath.includes('wizard')
      "
      :to="{ path: '/settings', exact: true }"
      active-class="bg-accent-100 text-primary blue-bar"
      clickable
    >
      <q-tooltip
        v-if="miniState"
        :delay="1000"
        anchor="center right"
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
// Packages
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

// Stores
import { useCurrentStateStore } from 'src/stores/current-state';

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const { currentSettings, mediaPlaying } = storeToRefs(currentState);

const route = useRoute();

const drawer = ref(true);
const miniState = defineModel<boolean>({ required: true });

const $q = useQuasar();

watch(
  () => $q?.screen?.lt?.sm,
  (isNowExtraSmall) => {
    if (isNowExtraSmall) {
      miniState.value = true;
    }
  },
);
</script>
