<template>
  <q-header
    class="header-elevated bg-primary text-white text-bigger text-weight-medium"
  >
    <DialogAbout
      v-model="aboutModal"
      :dialog-id="dialogId"
      @hide="aboutModal = false"
    />
    <div class="row items-center q-mr-md">
      <q-btn
        round
        style="width: 56px; height: 56px"
        unelevated
        @click="aboutModal = true"
      >
        <q-avatar>
          <q-img
            v-if="isBetaVersion && !isDemoMode"
            loading="lazy"
            src="~assets/img/beta-logo-no-background.svg"
            width="40px"
          />
          <q-img
            v-else
            loading="lazy"
            src="~assets/img/logo-no-background.svg"
            width="40px"
          />
          <q-badge
            v-if="updatesAreDisabled"
            color="warning"
            floating
            style="top: -1px; right: 0px"
          >
            <q-icon name="mmm-updates-disabled" size="small" />
          </q-badge>
        </q-avatar>
        <q-tooltip anchor="center right" :delay="1000" self="center left">
          {{ t('about') }}
        </q-tooltip>
      </q-btn>
      <q-separator class="bg-semi-white-24 q-ml-none" inset vertical />
      <div class="col q-ml-md flex items-center">
        <div class="col-shrink items-center">
          <q-icon
            v-if="route.meta.icon"
            class="q-mr-md"
            :name="route.meta.icon.toString()"
            size="md"
          />
        </div>
        <div class="col items-center">
          <div class="row items-center text-current-page">
            <div v-if="route.meta.title" class="ellipsis">
              {{ t(route.meta.title.toString()) }}
            </div>
            <q-badge
              v-if="showDemoBadge"
              class="q-ml-sm"
              color="warning"
              outline
            >
              <q-icon class="q-mr-xs" name="mmm-warning" size="xs" />
              <span class="no-wrap">{{ t('demo-mode-active') }}</span>
              <span v-if="stageLabel" class="no-wrap">· {{ stageLabel }}</span>
              <span v-if="virtualClock" class="no-wrap">
                · {{ virtualClock }}
              </span>
              <q-tooltip :delay="500">
                {{ t('demo-mode-active-tooltip') }}
              </q-tooltip>
            </q-badge>
          </div>
          <div class="row text-congregation">
            <div class="ellipsis">
              {{
                congregationSettings?.congregations?.[currentCongregation]
                  ?.congregationName
              }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-shrink q-gutter-x-sm">
        <HeaderCalendar v-if="route.fullPath.includes('/media-calendar')" />
        <HeaderSettings v-else-if="route.fullPath.includes('/settings')" />
        <HeaderWebsite
          v-else-if="route.fullPath.includes('/present-website')"
        />
      </div>
    </div>
  </q-header>
</template>
<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import DialogAbout from 'components/dialog/DialogAbout.vue';
import { storeToRefs } from 'pinia';
import { updatesDisabled } from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { type DemoMeetingStage, useDemoModeStore } from 'stores/demo-mode';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import HeaderCalendar from './HeaderCalendar.vue';
import HeaderSettings from './HeaderSettings.vue';
import HeaderWebsite from './HeaderWebsite.vue';

const isBetaVersion = import.meta.env.IS_BETA;
const { t } = useI18n();
// Live demo-mode flag (M3_DEMO_MODE launch or runtime Demo-menu enable), so
// the beta logo swaps back in the moment demo mode is turned off.
const demoMode = useDemoModeStore();
const isDemoMode = computed(() => demoMode.enabled);
// Demo-mode badge: dev builds only, so packaged-build screenshots (launched
// with M3_DEMO_MODE) stay clean; tracks the live store so the badge appears
// and disappears the moment demo mode is toggled at runtime.
const showDemoBadge = computed(() => import.meta.env.DEV && isDemoMode.value);
// The badge doubles as a status chip: it shows the current simulated meeting
// stage and the virtual clock time (only meaningful while demo mode is on).
const stageLabels: Record<DemoMeetingStage, string> = {
  'after-song': t('demo-mode-stage-after-song'),
  'last-song': t('demo-mode-stage-last-song'),
  'pre-meeting': t('demo-mode-stage-pre-meeting'),
  reset: t('demo-mode-stage-reset'),
};
const stageLabel = computed(() =>
  isDemoMode.value ? stageLabels[demoMode.stage] : '',
);
const virtualClock = ref('');
const updateVirtualClock = () => {
  virtualClock.value = isDemoMode.value
    ? new Date(demoMode.now).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
};
const { pause, resume } = useIntervalFn(updateVirtualClock, 1000, {
  immediate: false,
});

const updatesAreDisabled = ref(false);

const route = useRoute();

const congregationSettings = useCongregationSettingsStore();

const currentState = useCurrentStateStore();
const { currentCongregation } = storeToRefs(currentState);

const aboutModal = ref(false);
const dialogId = 'about-dialog';

const handleAutoUpdatesToggled = (event: Event) => {
  updatesAreDisabled.value = !(event as CustomEvent<boolean>).detail;
};

// Only tick the clock while demo mode is on (nothing to show otherwise).
watch(
  isDemoMode,
  (enabled) => {
    if (enabled) {
      updateVirtualClock();
      resume();
    } else {
      pause();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  updatesAreDisabled.value = await updatesDisabled();
  globalThis.addEventListener('autoUpdatesToggled', handleAutoUpdatesToggled);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener(
    'autoUpdatesToggled',
    handleAutoUpdatesToggled,
  );
});
</script>

<style lang="scss" scoped>
// A subtle gradient + shadow instead of a flat fill and a hard bottom
// border, so the bar reads as sitting above the content rather than just
// being a different-colored block next to it.
.header-elevated {
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, white 8%, transparent),
    transparent
  ) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
</style>
