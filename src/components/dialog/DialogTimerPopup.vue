<template>
  <q-menu
    ref="timerPopup"
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div class="flex action-popup q-py-md" style="flex-flow: column">
      <div class="card-title row q-px-md q-mb-none">
        {{ t('timer') }}
      </div>

      <!-- Window Type Selection -->
      <div class="card-section-title row q-px-md">
        {{ t('window-type') }}
      </div>
      <div class="row q-px-md q-pb-sm q-col-gutter-sm">
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            :outline="screenList?.length < 2 || timerPreferences.preferWindowed"
            unelevated
            @click="
              () => {
                timerPreferences.preferWindowed = false;
                moveTimerWindow(timerPreferences.preferredScreenNumber, true);
              }
            "
          >
            <q-icon class="q-mr-sm" name="mmm-fullscreen" size="xs" />
            {{ t('full-screen') }}
          </q-btn>
        </div>
        <div class="col-6">
          <q-btn
            class="full-width full-height"
            color="primary"
            :disable="screenList?.length < 2"
            :outline="
              !(screenList?.length < 2 || timerPreferences.preferWindowed)
            "
            :text-color="
              screenList?.length < 2 || timerPreferences.preferWindowed
                ? ''
                : 'primary'
            "
            unelevated
            @click="
              () => {
                timerPreferences.preferWindowed = true;
                moveTimerWindow(timerPreferences.preferredScreenNumber, false);
              }
            "
          >
            <q-icon class="q-mr-sm" name="mmm-window" size="xs" />
            {{ t('windowed') }}
          </q-btn>
        </div>
      </div>
      <q-separator class="bg-accent-200 q-mb-md" />

      <template
        v-if="!timerPreferences.preferWindowed && screenList?.length > 2"
      >
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="card-section-title row q-px-md">
          {{ t('display') }}
        </div>
        <div class="q-px-md q-pb-sm">
          <div
            class="display-map"
            :style="{
              position: 'relative',
              width: '100%',
              aspectRatio: virtualBounds.width + ' / ' + virtualBounds.height,
              overflow: 'hidden',
              '--screen-gap': '1%',
            }"
          >
            <template v-for="(screen, index) in screenList" :key="screen.id">
              <q-btn
                class="screen-rect column items-center justify-center"
                :class="{
                  'border-dashed': screen.mainWindow,
                }"
                :color="!screen.mainWindow ? 'primary' : 'secondary'"
                :disable="screen.mainWindow"
                :outline="!isTimerScreenSelected(index, screen)"
                :style="{
                  position: 'absolute',
                  left:
                    'calc(' +
                    (screenRects[index]?.left ?? 0) +
                    '% + var(--screen-gap))',
                  top:
                    'calc(' +
                    (screenRects[index]?.top ?? 0) +
                    '% + var(--screen-gap))',
                  width:
                    'calc(' +
                    (screenRects[index]?.width ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                  height:
                    'calc(' +
                    (screenRects[index]?.height ?? 0) +
                    '% - (var(--screen-gap) * 2))',
                }"
              >
                <q-tooltip v-if="screen.mainWindow">
                  {{ t('main-window-is-on-this-screen') }}
                </q-tooltip>
                <q-icon
                  v-if="!screen.mainWindow"
                  class="q-mr-sm"
                  name="mmm-timer"
                  size="xs"
                />
                {{ !screen.mainWindow ? t('display') + ' ' + (index + 1) : '' }}
              </q-btn>
            </template>
          </div>
        </div>
        <q-separator class="bg-accent-200 q-mb-md" />
      </template>

      <!-- Meeting Detection and Mode Selection -->
      <div class="card-section-title row q-px-md">
        {{ t('timer-mode') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <q-btn-toggle
          v-model="timerMode"
          class="full-width"
          color="secondary"
          :disable="timerRunning"
          :options="[
            { label: t('count-up'), value: 'countup' },
            { label: t('count-down'), value: 'countdown' },
          ]"
          spread
          toggle-color="primary"
          unelevated
        />
      </div>

      <template v-if="timerMode === 'countdown'">
        <!-- Meeting Part Selection (only on meeting days) -->
        <template v-if="isMeetingDay(selectedDateObject?.date)">
          <template v-if="isMwMeetingDay(selectedDateObject?.date)">
            <template
              v-if="
                timerMode === 'countdown' &&
                isMwMeetingDay(selectedDateObject?.date)
              "
            >
              <q-separator class="bg-accent-200 q-mb-md" />
              <div class="card-section-title row q-px-md">
                {{ t('ayfm') }}
              </div>
              <div class="row q-px-md q-py-sm">
                {{ t('number-of-ayfm-parts') }}
              </div>
              <div class="row q-px-md q-pb-sm">
                <q-btn-toggle
                  v-model="ayfmPartsCount"
                  class="full-width"
                  :disable="timerRunning"
                  :options="[
                    { label: '1', value: 1 },
                    { label: '2', value: 2 },
                    { label: '3', value: 3 },
                    { label: '4', value: 4 },
                    { label: '5', value: 5 },
                  ]"
                  spread
                />
              </div>
              <q-separator class="bg-accent-200 q-mb-md" />
              <div class="card-section-title row q-px-md">
                {{ t('lac') }}
              </div>
              <div class="row q-px-md q-py-sm">
                {{ t('number-of-lac-parts') }}
              </div>
              <div class="row q-px-md q-pb-sm">
                <q-btn-toggle
                  v-model="lacPartsCount"
                  class="full-width"
                  :disable="timerRunning"
                  :options="[
                    { label: '1', value: 1 },
                    { label: '2', value: 2 },
                    { label: '3', value: 3 },
                  ]"
                  spread
                />
              </div>
              <template v-if="!isCoWeek(selectedDateObject?.date)">
                <div class="row q-px-md q-py-sm">
                  {{ t('adapt-cbs-duration-dynamically') }}
                </div>
                <div class="row q-px-md q-pb-sm">
                  <q-btn-toggle
                    v-model="cbsAdaptiveEnabled"
                    :disable="timerRunning"
                    :options="[
                      { label: t('adaptive'), value: true },
                      { label: t('fixed'), value: false },
                    ]"
                    toggle-color="primary"
                  />
                </div>
                <template v-if="cbsAdaptiveEnabled">
                  <div class="row q-px-md q-py-sm">
                    {{ t('cbs-adaptive-end-time') }}
                  </div>
                  <div class="row q-px-md q-pb-sm">
                    <q-input
                      v-model="cbsAdaptiveEndTime"
                      class="full-width"
                      :disable="timerRunning"
                      filled
                      :label="t('end-time')"
                      mask="##:##"
                      :rules="[
                        (val: string) => !!val || t('required'),
                        (val: string) => {
                          const parts = val.split(':');
                          const h = Number(parts[0]);
                          const m = Number(parts[1]);
                          const endTime = new Date(
                            meetingStartTime?.getTime() || 0,
                          );
                          endTime.setHours(h, m, 0, 0);
                          const minTime = new Date(
                            (meetingStartTime?.getTime() || 0) + 68 * 60 * 1000,
                          );
                          const maxTime = new Date(
                            (meetingStartTime?.getTime() || 0) + 97 * 60 * 1000,
                          );
                          return (
                            (endTime >= minTime && endTime <= maxTime) ||
                            t('time-must-be-between', {
                              minTime:
                                minTime.getHours() + ':' + minTime.getMinutes(),
                              maxTime:
                                maxTime.getHours() + ':' + maxTime.getMinutes(),
                            })
                          );
                        },
                      ]"
                    />
                  </div>
                </template>
              </template>
            </template>
            <template v-else-if="isWeMeetingDay(selectedDateObject?.date)">
              <div class="row q-px-md q-py-sm">
                {{ t('adapt-wt-duration-dynamically') }}
              </div>
              <div class="row q-px-md q-pb-sm">
                <q-btn-toggle
                  v-model="wtAdaptiveEnabled"
                  :disable="timerRunning"
                  :options="[
                    { label: t('adaptive'), value: true },
                    { label: t('fixed'), value: false },
                  ]"
                  toggle-color="primary"
                />
              </div>
              <template v-if="wtAdaptiveEnabled">
                <div class="row q-px-md q-py-sm">
                  {{ t('wt-adaptive-end-time') }}
                </div>
                <div class="row q-px-md q-pb-sm">
                  <q-input
                    v-model="wtAdaptiveEndTime"
                    class="full-width"
                    :disable="timerRunning"
                    filled
                    :label="t('end-time')"
                    mask="##:##"
                    :rules="[
                      (val: string) => !!val || t('required'),
                      (val: string) => {
                        const parts = val.split(':');
                        const h = Number(parts[0]);
                        const m = Number(parts[1]);
                        const endTime = new Date(
                          meetingStartTime?.getTime() || 0,
                        );
                        endTime.setHours(h, m, 0, 0);
                        const minTime = new Date(
                          (meetingStartTime?.getTime() || 0) + 36 * 60 * 1000,
                        );
                        const maxTime = new Date(
                          (meetingStartTime?.getTime() || 0) + 100 * 60 * 1000,
                        );
                        return (
                          (endTime >= minTime && endTime <= maxTime) ||
                          t('time-must-be-between', {
                            minTime:
                              minTime.getHours() + ':' + minTime.getMinutes(),
                            maxTime:
                              maxTime.getHours() + ':' + maxTime.getMinutes(),
                          })
                        );
                      },
                    ]"
                  />
                </div>
              </template>
            </template>
          </template>
        </template>
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="card-section-title row q-px-md">
          {{ t('meeting-part') }}
        </div>
        <div class="row q-px-md q-pb-sm">
          <q-list bordered class="full-width">
            <q-item
              v-for="part in meetingPartsOptions"
              :key="part.value"
              :class="{ 'text-warning': part.warning }"
              clickable
              :disable="timerRunning"
              @click="selectPart(part.value)"
              @contextmenu.prevent="openEditDialog(part)"
            >
              <q-item-section avatar class="jw-icon text-h6">
                {{ part.icon }}
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ part.label }}</q-item-label>
                <q-item-label v-if="part.caption" caption>
                  {{ part.caption }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  v-if="usedParts.has(part.value)"
                  color="grey-5"
                  name="check"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>

      <!-- Timer Controls -->
      <q-separator class="bg-accent-200 q-mb-md" />
      <div class="card-section-title row q-px-md">
        {{ t('timer-controls') }}
      </div>

      <div class="q-px-md q-pt-md">
        <template v-if="!timerRunning">
          <q-btn
            class="full-width q-mb-sm"
            color="primary"
            unelevated
            @click="startTimer()"
          >
            <q-icon class="q-mr-sm" name="play_arrow" />
            {{ t('start') }}
          </q-btn>
        </template>
        <template v-else>
          <div class="row q-gutter-sm q-mb-sm">
            <q-btn
              class="col"
              :color="timerPaused ? 'positive' : 'warning'"
              unelevated
              @click="timerPaused ? resumeTimer() : pauseTimer()"
            >
              <q-icon
                class="q-mr-sm"
                :name="timerPaused ? 'play_arrow' : 'pause'"
              />
              {{ timerPaused ? t('resume') : t('pause') }}
            </q-btn>
            <q-btn class="col" color="negative" unelevated @click="stopTimer()">
              <q-icon class="q-mr-sm" name="stop" />
              {{ t('stop') }}
            </q-btn>
          </div>
        </template>

        <!-- Timer Display -->
        <div v-if="timerRunning" class="text-center q-py-md">
          <div class="text-h4 text-weight-bold" :class="{ blink: timerPaused }">
            {{ formattedTime }}
          </div>
          <div class="text-caption text-grey-6">
            {{ timerMode === 'countup' ? t('elapsed') : t('remaining') }}
          </div>
        </div>
      </div>

      <!-- Show/Hide Section -->
      <q-separator class="bg-accent-200" />
      <div class="q-px-md q-pt-md row">
        <div class="col">
          <div class="row text-subtitle1 text-weight-medium">
            {{ timerWindowVisible ? t('projecting') : t('inactive') }}
          </div>
          <div class="row text-dark-grey">
            {{
              screenList?.length < 2 || timerPreferences.preferWindowed
                ? t('windowed')
                : t('external-screen')
            }}
          </div>
        </div>
        <div class="col-grow">
          <q-btn
            v-if="timerWindowVisible"
            class="full-width"
            color="primary"
            unelevated
            @click="handleTimerWindowVisibility(false)"
          >
            {{ t('hide-timer-display') }}
          </q-btn>
          <q-btn
            v-else
            class="full-width"
            color="primary"
            unelevated
            @click="handleTimerWindowVisibility(true)"
          >
            {{ t('show-timer-display') }}
          </q-btn>
        </div>
      </div>
    </div>
  </q-menu>

  <!-- Edit Dialog -->
  <q-dialog v-model="editDialogOpen">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ editPart?.label }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model.number="editDuration"
          label="Duration (minutes)"
          min="1"
          type="number"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" @click="cancelEdit" />
        <q-btn v-close-popup flat label="Save" @click="saveEdit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { TimerData } from 'src/pages/TimerPage.vue';
import type { Display } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  useIntervalFn,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import { jwIcons } from 'src/constants/jw-icons';
import {
  isCoWeek,
  isMeetingDay,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, type ComputedRef, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const timerPopup = useTemplateRef<QMenu>('timerPopup');

const { t } = useI18n();

const screenList = ref<Display[]>([]);

const currentState = useCurrentStateStore();
const { currentSettings, selectedDateObject, timerWindowVisible } =
  storeToRefs(currentState);

const appSettingsStore = useAppSettingsStore();
const { timerPreferences } = storeToRefs(appSettingsStore);

defineProps<{
  dialogId?: string;
}>();

const open = defineModel<boolean>({ required: true });

// Timer state
const timerRunning = ref(false);
const timerPaused = ref(false);
const timerStartTime = ref<null | number>(null);
const timerPausedTime = ref<null | number>(null);
const elapsedSeconds = ref(0);

// Timer configuration
const timerMode = ref<'countdown' | 'countup'>('countup');
type MeetingPart =
  | 'abbreviated-wt'
  | 'ayfm-1'
  | 'ayfm-2'
  | 'ayfm-3'
  | 'ayfm-4'
  | 'ayfm-5'
  | 'bible-reading'
  | 'cbs'
  | 'co-final-talk'
  | 'co-service-talk'
  | 'concluding-comments'
  | 'gems'
  | 'introduction'
  | 'lac-1'
  | 'lac-2'
  | 'lac-3'
  | 'public-talk'
  | 'song-and-optional-prayer'
  | 'treasures'
  | 'wt';

const currentPart = ref<MeetingPart>('public-talk');
const currentPartStartTime = ref<null | number>(null);
const countdownTarget = ref<number>(0); // Target time in seconds for countdown
const selectingPart = ref(false);
const ayfmPartsCount = ref<number>(1);
const lacPartsCount = ref<number>(1);
const cbsAdaptiveEnabled = ref(true);
const cbsAdaptiveEndTime = ref('');
const wtAdaptiveEnabled = ref(true);
const wtAdaptiveEndTime = ref<string>('');

const usedParts = ref<Set<MeetingPart>>(new Set());

// Edit dialog
const editDialogOpen = ref(false);
const editPart = ref<null | { label: string; value: MeetingPart }>(null);
const editDuration = ref(0);

// Part durations in minutes (reactive)
const partDurations = ref<Record<MeetingPart, number>>({
  'abbreviated-wt': 30,
  'ayfm-1': 14, // 15 minutes total, minus 1 minute for counsel
  'ayfm-2': 0,
  'ayfm-3': 0,
  'ayfm-4': 0,
  'ayfm-5': 0,
  'bible-reading': 4,
  cbs: 30,
  'co-final-talk': 30,
  'co-service-talk': 30,
  'concluding-comments': 3,
  gems: 10,
  introduction: 1,
  'lac-1': 15, // 15 minutes total
  'lac-2': 0,
  'lac-3': 0,
  'public-talk': 30,
  'song-and-optional-prayer': 5,
  treasures: 10,
  wt: 60,
});

// Open edit dialog for a part
const openEditDialog = (part: { label: string; value: MeetingPart }) => {
  editPart.value = part;
  editDuration.value = partDurations.value[part.value] || 0;
  editDialogOpen.value = true;
};

// Save edits
const saveEdit = () => {
  if (!editPart.value) return;
  partDurations.value[editPart.value.value] = editDuration.value;
  editDialogOpen.value = false;
};

// Cancel edit
const cancelEdit = () => {
  editDialogOpen.value = false;
};

// Calculate ahead/behind minutes
const calculateAheadBehindMinutes = (): null | number => {
  if (!currentSettings.value?.enableMeetingAheadBehind) {
    return null;
  }

  const date = selectedDateObject.value?.date;

  let sequence: MeetingPart[];
  let offset = 0;
  if (isWeMeetingDay(date)) {
    const isCo = isCoWeek(date);
    sequence = isCo
      ? [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'abbreviated-wt',
          'co-final-talk',
          'song-and-optional-prayer',
        ]
      : [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'wt',
          'song-and-optional-prayer',
        ];
  } else if (isMwMeetingDay(date)) {
    sequence = [
      'song-and-optional-prayer',
      'introduction',
      'treasures',
      'gems',
      'bible-reading',
      'ayfm-1',
      'ayfm-2',
      'ayfm-3',
      'ayfm-4',
      'ayfm-5',
      'song-and-optional-prayer',
      'lac-1',
      'lac-2',
      'lac-3',
      isCoWeek(date) ? 'co-service-talk' : 'cbs',
      'concluding-comments',
      'song-and-optional-prayer',
    ];
  } else {
    sequence = [];
  }

  const currentPartIndex = sequence.indexOf(currentPart.value);
  if (currentPartIndex === -1) return null;

  const currentPartInfo = sequence[currentPartIndex];
  if (!currentPartInfo) return null;

  if (!currentPartStartTime.value) return null;

  const plannedStartTime = getPlannedStartTime(currentPartInfo);
  if (!plannedStartTime) return null;

  // Detailed logging
  const meetingStart = meetingStartTime.value?.getTime();
  console.log(
    '🔍 [calculateAheadBehindMinutes] Meeting start time:',
    new Date(meetingStart || 0).toLocaleTimeString(),
  );

  console.log(
    '🔍 [calculateAheadBehindMinutes] Sequence up to',
    currentPartInfo,
    ':',
    sequence.slice(0, currentPartIndex),
  );
  for (let i = 0; i < currentPartIndex; i++) {
    const prevPart = sequence[i];
    if (!prevPart) continue;
    const dur = partDurations.value[prevPart];
    offset += dur;
    // Add 1 minute for counsel after each non-zero AYFM or LAC part
    if (
      (prevPart === 'bible-reading' ||
        prevPart.startsWith('ayfm-') ||
        prevPart.startsWith('lac-')) &&
      dur > 0
    ) {
      offset += 1;
    }
    console.log(
      `🔍 [calculateAheadBehindMinutes] Part ${prevPart}: ${dur} minutes, cumulative offset: ${offset} minutes`,
    );
  }
  console.log(
    '🔍 [calculateAheadBehindMinutes] Final calculated planned start time:',
    new Date(plannedStartTime).toLocaleTimeString(),
  );
  console.log(
    '🔍 [calculateAheadBehindMinutes] Actual start time:',
    new Date(currentPartStartTime.value).toLocaleTimeString(),
  );

  // Return difference in minutes (positive = behind, negative = ahead)
  const diffMinutes =
    (currentPartStartTime.value - plannedStartTime) / (1000 * 60);
  console.log(
    '🔍 [calculateAheadBehindMinutes] Ahead/Behind calculation:',
    diffMinutes > 0
      ? `${diffMinutes} minutes behind`
      : `${Math.abs(diffMinutes)} minutes ahead`,
  );
  return diffMinutes;
};

// Get planned start time for a meeting part
const getPlannedStartTime = (part: MeetingPart): null | number => {
  const date = selectedDateObject.value?.date;
  if (!date || (!isWeMeetingDay(date) && !isMwMeetingDay(date))) return null;

  const meetingStart = meetingStartTime.value?.getTime();
  if (!meetingStart) return null;

  let sequence: MeetingPart[];
  if (isWeMeetingDay(date)) {
    const isCo = isCoWeek(date);
    sequence = isCo
      ? [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'abbreviated-wt',
          'co-final-talk',
          'song-and-optional-prayer',
        ]
      : [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'wt',
          'song-and-optional-prayer',
        ];
  } else if (isMwMeetingDay(date)) {
    const isCo = isCoWeek(date);
    sequence = [
      'song-and-optional-prayer',
      'introduction',
      'treasures',
      'gems',
      'bible-reading',
      'ayfm-1',
      'ayfm-2',
      'ayfm-3',
      'ayfm-4',
      'ayfm-5',
      'song-and-optional-prayer',
      'lac-1',
      'lac-2',
      'lac-3',
      isCo ? 'co-service-talk' : 'cbs',
      'concluding-comments',
      'song-and-optional-prayer',
    ];
  } else {
    return null;
  }

  const index = sequence.indexOf(part);
  if (index === -1) return null;

  let offset = 0;
  for (let i = 0; i < index; i++) {
    const prevPart = sequence[i];
    if (!prevPart) continue;
    const dur = partDurations.value[prevPart] ?? 0;
    offset += dur;
    // Add 1 minute for counsel after each non-zero AYFM or LAC part
    if (
      (prevPart === 'bible-reading' ||
        prevPart.startsWith('ayfm-') ||
        prevPart.startsWith('lac-')) &&
      dur > 0
    ) {
      offset += 1;
    }
  }

  return meetingStart + offset * 60 * 1000;
};

const { getAllScreens, moveTimerWindow, toggleTimerWindow } =
  window.electronApi;

// Broadcast channel for timer data
const { post: postTimerData } = useBroadcastChannel<TimerData, TimerData>({
  name: 'timer-display-data',
});

// Listen for timer page ready
const { data: timerPageReady } = useBroadcastChannel<string, string>({
  name: 'timer-page-ready',
});

const fetchScreens = async () => {
  try {
    screenList.value = await getAllScreens();
  } catch (error) {
    console.error(error);
  }
};

whenever(
  () => open.value,
  async () => {
    fetchScreens();
  },
);

useEventListener(window, 'screen-trigger-update', fetchScreens, {
  passive: true,
});

// Virtual desktop extents across all displays (in physical pixels as provided by Electron)
const virtualBounds = computed(() => {
  const list = screenList.value;
  if (!list || list.length === 0) {
    return { height: 9, width: 16, x: 0, y: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const d of list) {
    const b = d.bounds;
    if (!b) continue;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { height, width, x: minX, y: minY };
});

// Percentage-based rectangles for each screen relative to the virtual desktop
const screenRects = computed(() => {
  const vb = virtualBounds.value;
  const list = screenList.value ?? [];
  return list.map((d) => {
    const b = d.bounds;
    const left = ((b.x - vb.x) / vb.width) * 100;
    const top = ((b.y - vb.y) / vb.height) * 100;
    const width = (b.width / vb.width) * 100;
    const height = (b.height / vb.height) * 100;
    return {
      height: Number.isFinite(height) ? height : 0,
      left: Number.isFinite(left) ? left : 0,
      top: Number.isFinite(top) ? top : 0,
      width: Number.isFinite(width) ? width : 0,
    };
  });
});

// Selected when timer window is on this screen and it's not the app's main window
const isTimerScreenSelected = (index: number, screen: Display) => {
  void index; // index kept for potential future preference logic
  return !!screen.timerWindow && !screen.mainWindow;
};

const meetingStartTime = computed(() => {
  const date = selectedDateObject.value?.date;
  if (!date || (!isWeMeetingDay(date) && !isMwMeetingDay(date))) return null;
  const startTimeStr = isMwMeetingDay(date)
    ? currentSettings.value?.mwStartTime
    : currentSettings.value?.weStartTime;
  if (!startTimeStr) return null;
  const parts = startTimeStr.split(':');
  const hour = Number(parts[0]);
  const min = Number(parts[1]);
  const start = new Date(date);
  start.setHours(hour, min, 0, 0);
  return start;
});

const cbsAdaptiveDefaultEndTime = computed(() => {
  if (!meetingStartTime.value) return '';
  const end = new Date(meetingStartTime.value.getTime() + 97 * 60 * 1000);
  return end.toTimeString().slice(0, 5); // hh:mm
});

const wtAdaptiveDefaultEndTime = computed(() => {
  if (!meetingStartTime.value) return '';
  const date = selectedDateObject.value?.date;
  const isCo = date ? isCoWeek(date) : false;
  const minutes = isCo ? 70 : 100;
  const end = new Date(meetingStartTime.value.getTime() + minutes * 60 * 1000);
  return end.toTimeString().slice(0, 5); // hh:mm
});

const meetingPartsOptions: ComputedRef<
  {
    caption?: string;
    icon?: string;
    label: string;
    value: MeetingPart;
    warning?: boolean;
  }[]
> = computed(() => {
  const date = selectedDateObject.value?.date;
  if (isWeMeetingDay(date)) {
    const options: {
      caption?: string;
      icon?: string;
      label: string;
      value: MeetingPart;
      warning?: boolean;
    }[] = [
      {
        caption: (() => {
          const startTime = getPlannedStartTime('public-talk');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['pt'],
        label: t('public-talk'),
        value: 'public-talk',
      },
      {
        caption: wtAdaptiveEnabled.value
          ? (() => {
              const startTime = getPlannedStartTime('wt');
              const startStr = startTime
                ? new Date(startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              const endStr = wtAdaptiveEndTime.value || t('adaptive');
              return (
                t('latest-ending', { endTime: endStr }) +
                (startStr ? ` (${t('start')}: ${startStr})` : '')
              );
            })()
          : (() => {
              const startTime = getPlannedStartTime('wt');
              return startTime
                ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '';
            })(),
        icon: jwIcons['wt'],
        label: t('wt'),
        value: 'wt',
      },
    ];

    if (isCoWeek(date)) {
      options.push({
        caption: (() => {
          const startTime = getPlannedStartTime('co-final-talk');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['circuit-overseer'],
        label: t('co-final-talk'),
        value: 'co-final-talk',
      });
    }

    return options;
  } else if (isMwMeetingDay(date)) {
    const isCo = isCoWeek(date);
    const options: {
      caption?: string;
      icon?: string;
      label: string;
      value: MeetingPart;
      warning?: boolean;
    }[] = [
      {
        caption: (() => {
          const startTime = getPlannedStartTime('introduction');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['introduction'],
        label: t('introduction'),
        value: 'introduction',
      },
      {
        caption: (() => {
          const startTime = getPlannedStartTime('treasures');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['tgw'],
        label: t('treasures-talk'),
        value: 'treasures',
      },
      {
        caption: (() => {
          const startTime = getPlannedStartTime('gems');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['gems'],
        label: t('gems'),
        value: 'gems',
      },
      {
        caption: (() => {
          const startTime = getPlannedStartTime('bible-reading');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['bible-reading'],
        label: t('bible-reading'),
        value: 'bible-reading',
      },
    ];
    // Add AYFM parts
    for (let i = 1; i <= ayfmPartsCount.value; i++) {
      const totalDuration = Array.from(
        { length: ayfmPartsCount.value },
        (_, idx) => partDurations.value[`ayfm-${idx + 1}` as MeetingPart] || 0,
      ).reduce((a, b) => a + b, 0);
      const warning = totalDuration !== 15 - ayfmPartsCount.value;
      const dur = partDurations.value[`ayfm-${i}` as MeetingPart] || 14;
      const startTime = getPlannedStartTime(`ayfm-${i}` as MeetingPart);
      const startStr = startTime
        ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
      options.push({
        caption: startStr,
        icon: jwIcons['ayfm-part'],
        label: t('ayfm-part', { duration: dur, part: i }),
        value: `ayfm-${i}` as MeetingPart,
        warning,
      });
    }
    // Add LAC parts
    for (let i = 1; i <= lacPartsCount.value; i++) {
      const totalDuration = Array.from(
        { length: lacPartsCount.value },
        (_, idx) => partDurations.value[`lac-${idx + 1}` as MeetingPart] || 0,
      ).reduce((a, b) => a + b, 0);
      const warning = totalDuration !== 15;
      const dur = partDurations.value[`lac-${i}` as MeetingPart] || 15;
      const startTime = getPlannedStartTime(`lac-${i}` as MeetingPart);
      const startStr = startTime
        ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
      options.push({
        caption: startStr,
        icon: jwIcons['lac-part'],
        label: t('lac-part', { duration: dur, part: i }),
        value: `lac-${i}` as MeetingPart,
        warning,
      });
    }
    if (isCo) {
      options.push({
        caption: (() => {
          const startTime = getPlannedStartTime('co-service-talk');
          return startTime
            ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : '';
        })(),
        icon: jwIcons['circuit-overseer'],
        label: t('co-service-talk'),
        value: 'co-service-talk',
      });
    } else {
      options.push({
        caption: cbsAdaptiveEnabled.value
          ? (() => {
              const startTime = getPlannedStartTime('cbs');
              const startStr = startTime
                ? new Date(startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              const endStr = cbsAdaptiveEndTime.value || t('adaptive');
              return (
                t('latest-ending', { endTime: endStr }) +
                (startStr ? ` (${t('start')}: ${startStr})` : '')
              );
            })()
          : (() => {
              const startTime = getPlannedStartTime('cbs');
              return startTime
                ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '';
            })(),
        icon: jwIcons['cbs'],
        label: t('cbs'),
        value: 'cbs',
      });
    }
    options.push({
      caption: (() => {
        const startTime = getPlannedStartTime('concluding-comments');
        return startTime
          ? `${t('start')}: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : '';
      })(),
      icon: jwIcons['concluding-comments'],
      label: t('concluding-comments'),
      value: 'concluding-comments',
    });
    return options;
  }
  return [];
});

// UI update handler
watch(
  () => [
    timerWindowVisible.value,
    timerRunning.value,
    timerMode.value,
    timerPreferences.value?.preferWindowed,
  ],
  () => {
    setTimeout(() => {
      if (timerPopup.value) {
        timerPopup.value.updatePosition();
      }
    }, 10);
  },
);

// Timer logic
const { pause: pauseInterval, resume: resumeInterval } = useIntervalFn(() => {
  if (timerRunning.value && !timerPaused.value) {
    const now = Date.now();
    const startTime = timerStartTime.value;
    if (startTime) {
      elapsedSeconds.value = Math.floor((now - startTime) / 1000);
      updateTimerWindow(); // Update the timer window with new time
    }
  }
}, 500);

const formattedTime = computed(() => {
  const totalSeconds =
    timerMode.value === 'countup'
      ? elapsedSeconds.value
      : Math.max(0, countdownTarget.value - elapsedSeconds.value);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const calculateCountdownTarget = () => {
  if (
    !selectedDateObject.value ||
    !isMeetingDay(selectedDateObject.value?.date) ||
    timerMode.value === 'countup'
  )
    return 0;

  if (isWeMeetingDay(selectedDateObject.value?.date)) {
    if (currentPart.value === 'public-talk') {
      return partDurations.value['public-talk'] * 60;
    } else if (currentPart.value === 'wt') {
      const isCo = isCoWeek(selectedDateObject.value?.date);
      const wtMaxDuration =
        (isCo
          ? partDurations.value['abbreviated-wt']
          : partDurations.value.wt) * 60;
      if (wtAdaptiveEnabled.value) {
        // Custom end time
        const configuredMeetingStartTime = currentSettings.value?.weStartTime;
        if (!configuredMeetingStartTime || !wtAdaptiveEndTime.value) return 0;
        const [startHour, startMinute] = configuredMeetingStartTime.split(':');
        const meetingStartTime = new Date(selectedDateObject.value.date);
        if (!startHour || !startMinute) return 0;
        meetingStartTime.setHours(
          parseInt(startHour),
          parseInt(startMinute),
          0,
          0,
        );
        const parts = wtAdaptiveEndTime.value.split(':');
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        const endTime = new Date(meetingStartTime.getTime());
        endTime.setHours(h, m, 0, 0);
        const now = new Date();
        const remaining = Math.max(0, endTime.getTime() - now.getTime()) / 1000;
        const remainingWholeSeconds = Math.floor(remaining);
        return Math.min(remainingWholeSeconds, wtMaxDuration);
      } else {
        return wtMaxDuration;
      }
    } else if (currentPart.value === 'co-final-talk') {
      return partDurations.value['co-final-talk'] * 60;
    } else if (currentPart.value === 'co-service-talk') {
      return partDurations.value['co-service-talk'] * 60;
    }
  } else if (isMwMeetingDay(selectedDateObject.value?.date)) {
    if (currentPart.value === 'treasures') {
      return partDurations.value.treasures * 60;
    } else if (currentPart.value === 'gems') {
      return partDurations.value.gems * 60;
    } else if (currentPart.value === 'bible-reading') {
      return partDurations.value['bible-reading'] * 60;
    } else if (currentPart.value.startsWith('ayfm-')) {
      return partDurations.value[currentPart.value] * 60;
    } else if (currentPart.value.startsWith('lac-')) {
      return partDurations.value[currentPart.value] * 60;
    } else if (currentPart.value === 'co-service-talk') {
      return partDurations.value['co-service-talk'] * 60;
    } else if (currentPart.value === 'cbs') {
      const cbsMaxDuration = partDurations.value.cbs * 60;
      if (cbsAdaptiveEnabled.value) {
        // Custom end time
        const configuredMeetingStartTime = currentSettings.value?.mwStartTime;
        if (!configuredMeetingStartTime || !cbsAdaptiveEndTime.value) return 0;
        const [startHour, startMinute] = configuredMeetingStartTime.split(':');
        const meetingStartTime = new Date(selectedDateObject.value.date);
        if (!startHour || !startMinute) return 0;
        meetingStartTime.setHours(
          parseInt(startHour),
          parseInt(startMinute),
          0,
          0,
        );
        const parts = cbsAdaptiveEndTime.value.split(':');
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        const endTime = new Date(meetingStartTime.getTime());
        endTime.setHours(h, m, 0, 0);
        const now = new Date();
        const remaining = Math.max(0, endTime.getTime() - now.getTime()) / 1000;
        const remainingWholeSeconds = Math.floor(remaining);
        return Math.min(remainingWholeSeconds, cbsMaxDuration);
      } else {
        return cbsMaxDuration;
      }
    }
  }

  return 0;
};

const startTimer = () => {
  if (timerMode.value === 'countdown') {
    countdownTarget.value = calculateCountdownTarget();
  }

  timerRunning.value = true;
  timerPaused.value = false;
  timerStartTime.value = Date.now() - elapsedSeconds.value * 1000;
  timerPausedTime.value = null;

  currentPartStartTime.value = Date.now();

  resumeInterval();
  updateTimerWindow();
};

const pauseTimer = () => {
  timerPaused.value = true;
  timerPausedTime.value = Date.now();
  pauseInterval();
  updateTimerWindow();
};

const resumeTimer = () => {
  const pauseDuration = Date.now() - (timerPausedTime.value || 0);
  if (timerStartTime.value !== null) {
    timerStartTime.value += pauseDuration;
  }
  timerPaused.value = false;
  timerPausedTime.value = null;
  resumeInterval();
  updateTimerWindow();
};

const stopTimer = () => {
  pauseInterval();
  // Immediately send cleared timer data to external window
  postTimerData({
    mode: timerMode.value,
    paused: false,
    running: false,
    time: '',
    timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
    timerTextColor: currentSettings.value?.timerTextColor,
    timerTextSize: currentSettings.value?.timerTextSize,
  });
  timerRunning.value = false;
  timerPaused.value = false;
  elapsedSeconds.value = 0;
  timerStartTime.value = null;
  timerPausedTime.value = null;
  countdownTarget.value = 0;
  updateTimerWindow();
};

const selectPart = (value: MeetingPart) => {
  selectingPart.value = true;
  currentPart.value = value;
  usedParts.value.add(value);
  startTimer();
  selectingPart.value = false;
};

const updateTimerWindow = () => {
  // Send timer data to the timer window via broadcast channel
  const timerData = {
    aheadBehindMinutes: calculateAheadBehindMinutes(),
    enableMeetingCountdown: currentSettings.value?.enableMeetingCountdown,
    meetingCountdownMinutes: currentSettings.value?.meetingCountdownMinutes,
    mode: timerMode.value,
    mwDay: currentSettings.value?.mwDay,
    mwStartTime: currentSettings.value?.mwStartTime,
    paused: timerPaused.value,
    running: timerRunning.value,
    time: timerRunning.value ? formattedTime.value : '',
    timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
    timerTextColor: currentSettings.value?.timerTextColor,
    timerTextSize: currentSettings.value?.timerTextSize,
    weDay: currentSettings.value?.weDay,
    weStartTime: currentSettings.value?.weStartTime,
  };

  postTimerData(timerData);
};

// Watch for timer mode changes
watch(
  [timerMode, currentPart],
  () => {
    if (!selectingPart.value && timerRunning.value) {
      stopTimer();
    }
  },
  { flush: 'sync' },
);

// Watch for timer settings changes and broadcast to timer window
watchImmediate(
  () => [
    currentSettings.value?.timerBackgroundColor,
    currentSettings.value?.timerTextColor,
    currentSettings.value?.timerTextSize,
    currentSettings.value?.enableMeetingAheadBehind,
    currentSettings.value?.enableMeetingCountdown,
    currentSettings.value?.meetingCountdownMinutes,
    currentSettings.value?.mwDay,
    currentSettings.value?.weDay,
    currentSettings.value?.mwStartTime,
    currentSettings.value?.weStartTime,
  ],
  () => {
    updateTimerWindow();
  },
);

// Watch AYFM parts count to adjust durations
watchImmediate(ayfmPartsCount, (newCount) => {
  const totalMinutes = 15 - newCount; // 15 minutes total, minus number of parts for 1 min of counsel each
  const base = Math.floor(totalMinutes / newCount);
  const remainder = totalMinutes % newCount;
  for (let i = 1; i <= 5; i++) {
    if (i <= newCount) {
      const dur = base + (i <= remainder ? 1 : 0);
      partDurations.value[`ayfm-${i}` as MeetingPart] = dur;
    } else {
      partDurations.value[`ayfm-${i}` as MeetingPart] = 0;
    }
  }
  console.log(
    'AYFM parts count changed to',
    newCount,
    'durations:',
    partDurations.value,
  );
});

// Watch LAC parts count to adjust durations
watchImmediate(lacPartsCount, (newCount) => {
  const totalMinutes = 15;
  const base = Math.floor(totalMinutes / newCount);
  const remainder = totalMinutes % newCount;
  for (let i = 1; i <= 3; i++) {
    if (i <= newCount) {
      const dur = base + (i <= remainder ? 1 : 0);
      partDurations.value[`lac-${i}` as MeetingPart] = dur;
    } else {
      partDurations.value[`lac-${i}` as MeetingPart] = 0;
    }
  }
});

// Watch for timer page ready
watch(timerPageReady, (timestamp) => {
  if (timestamp) {
    handleTimerWindowVisibility(true);
  }
});

// Watch selected date to set default adaptive end times
watchImmediate(selectedDateObject, () => {
  cbsAdaptiveEndTime.value = cbsAdaptiveDefaultEndTime.value;
  wtAdaptiveEndTime.value = wtAdaptiveDefaultEndTime.value;
});

const handleTimerWindowVisibility = (visible: boolean) => {
  toggleTimerWindow(visible);
  currentState.setTimerWindowVisible(visible);
  if (visible) {
    // Broadcast initial timer settings
    postTimerData({
      aheadBehindMinutes: calculateAheadBehindMinutes(),
      enableMeetingCountdown: currentSettings.value?.enableMeetingCountdown,
      meetingCountdownMinutes: currentSettings.value?.meetingCountdownMinutes,
      mode: 'countup',
      mwDay: currentSettings.value?.mwDay,
      mwStartTime: currentSettings.value?.mwStartTime,
      paused: false,
      running: false,
      time: '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerTextColor: currentSettings.value?.timerTextColor,
      timerTextSize: currentSettings.value?.timerTextSize,
      weDay: currentSettings.value?.weDay,
      weStartTime: currentSettings.value?.weStartTime,
    });
  }
};

// Initialize timer when window becomes visible
watch(timerWindowVisible, (visible) => {
  if (visible) {
    // Initialize timer with current settings
    updateTimerWindow();
  }
});
</script>

<style scoped>
.blink {
  animation: gentle-blink 2s infinite;
}

.border-dashed::before {
  border-style: dashed;
}

@keyframes gentle-blink {
  0%,
  60% {
    opacity: 1;
  }
  61%,
  100% {
    opacity: 0.7;
  }
}
</style>
