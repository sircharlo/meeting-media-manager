<template>
  <div v-if="demoMode.enabled || isMeetingToday" class="meeting-quick-actions">
    <div
      v-if="isDev && demoMode.enabled && location === 'before'"
      class="meeting-quick-actions__demo-controls"
    >
      <q-btn
        color="secondary"
        dense
        :label="t('quick-actions-demo-reset')"
        outline
        @click="handleResetDemo"
      />
      <q-btn
        v-if="demoMode.stage === 'reset' || demoMode.stage === 'pre-meeting'"
        color="secondary"
        dense
        :label="t('quick-actions-demo-jump-pre-meeting')"
        outline
        @click="handleJumpToPreMeeting"
      />
      <q-btn
        v-if="demoMode.stage === 'pre-meeting'"
        color="secondary"
        dense
        :label="t('quick-actions-demo-jump-last-song')"
        outline
        @click="handleJumpToLastSong"
      />
      <q-btn
        v-if="demoMode.stage === 'last-song'"
        color="secondary"
        dense
        :label="t('quick-actions-demo-finish-song')"
        outline
        @click="handleFinishLastSong"
      />
    </div>
    <q-slide-transition @after-leave="handleBeforePanelHidden">
      <div v-if="location === 'before' && showBefore">
        <MeetingQuickActionsBeforePanel :now="now" />
      </div>
    </q-slide-transition>
    <q-slide-transition>
      <div v-if="location === 'after' && showAfter" ref="afterPanel">
        <MeetingQuickActionsAfterPanel :now="now" />
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import MeetingQuickActionsAfterPanel from 'components/media/MeetingQuickActionsAfterPanel.vue';
import MeetingQuickActionsBeforePanel from 'components/media/MeetingQuickActionsBeforePanel.vue';
import { storeToRefs } from 'pinia';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import {
  finishLastSong,
  jumpToLastSong,
  jumpToPreMeeting,
  resetDemo,
} from 'src/helpers/demo-mode';
import {
  getTodaysScheduledMeetingEndDateTime,
  getVisibleChecklistItemIds,
  predictLastSongEndDateTime,
} from 'src/helpers/meeting-quick-actions';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { AUTO_START_WINDOW_HOURS } from 'stores/music';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// How long the before-panel stays visible past the meeting's start time
// before auto-dismissing, giving the operator a few minutes where unchecked
// items still act as a visual reminder even after the meeting has begun.
const BEFORE_PANEL_GRACE_MS = 5 * 60 * 1000;

const props = defineProps<{ location: 'after' | 'before' }>();

const { t } = useI18n();
// The demo-stage buttons are developer tooling - keep them out of production
// builds (e.g. the M3_DEMO_MODE README screenshot, which must look like the
// real app).
const isDev = import.meta.env.DEV;
const demoMode = useDemoModeStore();
const currentState = useCurrentStateStore();
const {
  currentSettings,
  isSelectedDayToday,
  mediaPlaying,
  selectedDateObject,
  selectedDayMeetingType,
} = storeToRefs(currentState);

const quickActions = useMeetingQuickActionsStore();
const {
  checkedItemIds,
  dismissedAfterPanel,
  dismissedBeforePanel,
  lastSongEndedAt,
} = storeToRefs(quickActions);
const { dismissBefore } = quickActions;

const now = ref(Date.now());
const updateNow = () => {
  now.value = demoMode.enabled ? demoMode.now : Date.now();
};
const afterPanel = ref<HTMLElement | null>(null);
const hasScrolledToAfterPanel = ref(false);
const lastScrollScope = ref('');
useIntervalFn(updateNow, 1000);

const isMeetingToday = computed(
  () =>
    !!currentSettings.value?.enableMeetingQuickActions &&
    isSelectedDayToday.value &&
    !!selectedDayMeetingType.value &&
    !!selectedDateObject.value,
);
const meetingStart = computed(() =>
  getTodaysMeetingStartDateTime(new Date(now.value)),
);
const scheduledEnd = computed(() =>
  getTodaysScheduledMeetingEndDateTime(new Date(now.value)),
);
const predictedEnd = computed(() => {
  // `now` is the only tracked dependency here - the prediction itself reads
  // Date.now() internally, which Vue can't see, so this read is what forces
  // the after-panel's fade-in trigger to actually re-check every second.
  // Looks like a no-op guard; isn't one - don't "simplify" it away.
  const currentNow = now.value;
  const prediction = predictLastSongEndDateTime(
    mediaPlaying.value,
    selectedDateObject.value,
    now.value,
  );
  return currentNow >= 0 ? prediction : null;
});
const afterTrigger = computed(() => {
  const triggerTimes: number[] = [];
  if (scheduledEnd.value) {
    triggerTimes.push(scheduledEnd.value.getTime() - 5 * 60 * 1000);
  }
  if (predictedEnd.value) {
    triggerTimes.push(predictedEnd.value.getTime() - 30 * 1000);
  }
  return triggerTimes.length ? Math.min(...triggerTimes) : null;
});
const lastSongScrollThreshold = computed(() =>
  predictedEnd.value ? predictedEnd.value.getTime() - 30 * 1000 : null,
);
const showAfter = computed(
  () =>
    isMeetingToday.value &&
    !dismissedAfterPanel.value &&
    (lastSongEndedAt.value !== null ||
      (afterTrigger.value !== null && now.value >= afterTrigger.value)),
);
const showBefore = computed(() => {
  const start = meetingStart.value;
  if (
    !isMeetingToday.value ||
    !start ||
    showAfter.value ||
    dismissedBeforePanel.value
  ) {
    return false;
  }
  const startTime = start.getTime();
  // Same window background music is allowed to auto-start in, regardless of
  // whether autoStartMusic itself is enabled - the panel's other controls
  // (recording, checklist, manual music) are useful over that same runway
  // even for congregations that don't use music auto-start at all. The
  // window now extends BEFORE_PANEL_GRACE_MS past the start time too, so
  // unchecked items stay visible as a reminder for a few minutes after the
  // meeting has begun (auto-dismissed by the watcher below once that grace
  // period elapses).
  return (
    now.value >= startTime - AUTO_START_WINDOW_HOURS * 3600 * 1000 &&
    now.value < startTime + BEFORE_PANEL_GRACE_MS
  );
});
const allBeforeChecklistItemsChecked = computed(() => {
  const settings = currentSettings.value;
  if (!settings) return false;
  const ids = getVisibleChecklistItemIds(settings, 'before');
  // An empty (or entirely disabled) checklist must not trivially count as
  // "all checked" - that would auto-dismiss the panel immediately, before
  // it ever had a chance to be useful.
  if (!ids.length) return false;
  return ids.every((id) => !!checkedItemIds.value[id]);
});

// The demo-stage transitions live in src/helpers/demo-mode.ts (shared with
// the dev-only Demo menu); these wrappers just refresh this component's
// local clock ref immediately so the UI updates without waiting for the
// next interval tick.
const handleResetDemo = () => {
  resetDemo();
  updateNow();
};

const handleJumpToPreMeeting = () => {
  jumpToPreMeeting();
  updateNow();
};

const handleJumpToLastSong = () => {
  jumpToLastSong();
  updateNow();
};

const handleFinishLastSong = () => {
  finishLastSong();
  updateNow();
};

const handleBeforePanelHidden = () => {
  if (props.location !== 'before' || !dismissedBeforePanel.value) return;
  document.querySelector<HTMLElement>('.app-main-scroll')?.scrollTo({
    behavior: 'smooth',
    top: 0,
  });
};

watch(
  [meetingStart, () => now.value, allBeforeChecklistItemsChecked],
  ([start, currentNow, allChecked]) => {
    // This component is mounted twice (location 'before' and 'after') -
    // only one instance should drive the auto-dismiss to avoid redundant
    // duplicate dismissBefore() calls every tick.
    if (
      props.location !== 'before' ||
      !isMeetingToday.value ||
      !start ||
      dismissedBeforePanel.value
    ) {
      return;
    }
    const startTime = start.getTime();
    // Before the meeting starts, the panel only ever goes away via the
    // manual Dismiss button - checking every item early must not hide it,
    // since new checklist items can still come up in the run-up to the
    // meeting. Once the meeting has actually started, auto-dismiss as soon
    // as everything is checked, or after BEFORE_PANEL_GRACE_MS regardless,
    // so unchecked items only linger as a reminder for a few minutes.
    if (currentNow < startTime) return;
    if (allChecked || currentNow >= startTime + BEFORE_PANEL_GRACE_MS) {
      dismissBefore();
    }
  },
  { immediate: true },
);

watch(
  [
    () => props.location,
    () => now.value,
    lastSongScrollThreshold,
    () => currentState.currentCongregation,
    () => currentState.selectedDate,
  ],
  async ([location, currentNow, threshold, congregation, selectedDate]) => {
    const scope = `${congregation}:${selectedDate}`;
    if (scope !== lastScrollScope.value) {
      lastScrollScope.value = scope;
      hasScrolledToAfterPanel.value = false;
    }
    if (
      location !== 'after' ||
      hasScrolledToAfterPanel.value ||
      threshold === null ||
      currentNow < threshold ||
      !showAfter.value
    ) {
      return;
    }
    // Wait for the q-slide-transition to finish expanding the panel
    // before scrolling, otherwise scrollIntoView targets the collapsed height.
    await new Promise<void>((resolve) => {
      void setTimeout(resolve, 350);
    });
    afterPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    hasScrolledToAfterPanel.value = true;
  },
  { immediate: true },
);
</script>

<style scoped>
.meeting-quick-actions {
  margin: 0 auto 1rem;
  max-width: 900px;
}
</style>
