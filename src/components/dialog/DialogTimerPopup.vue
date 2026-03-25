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
        v-if="!timerPreferences.preferWindowed && screenList?.length > 1"
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
                  borderRadius: '6px',
                }"
                unelevated
                @click="
                  () => {
                    if (screen.mainWindow) return;
                    timerPreferences.preferredScreenNumber = index;
                    moveTimerWindow(index, !timerPreferences.preferWindowed);
                  }
                "
              >
                <q-tooltip v-if="screen.mainWindow" :delay="1000">
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

      <q-separator class="bg-accent-200 q-mb-md" />

      <!-- Meeting Part Selection (only on meeting days) -->
      <template v-if="isMeetingDay(selectedDateObject?.date)">
        <template v-if="isMwMeetingDay(selectedDateObject?.date)">
          <template v-if="timerMode === 'countdown'">
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
                {{ t('cbs-custom-end-time') }}
              </div>
              <div class="row q-px-md q-pb-sm">
                <q-input
                  v-model="cbsCustomEndTime"
                  class="full-width"
                  :disable="timerRunning"
                  :label="t('end-time')"
                  mask="##:##"
                  outlined
                  :rules="cbsEndTimeRules"
                />
              </div>
            </template>
          </template>
        </template>
        <template
          v-else-if="
            timerMode === 'countdown' &&
            isWeMeetingDay(selectedDateObject?.date)
          "
        >
          <div class="row q-px-md q-py-sm">
            {{ t('adapt-wt-duration-dynamically') }}
          </div>
          <div class="row q-px-md q-py-sm">
            {{ t('wt-custom-end-time') }}
          </div>
          <div class="row q-px-md q-pb-sm">
            <q-input
              v-model="wtCustomEndTime"
              class="full-width"
              :disable="timerRunning"
              filled
              :label="t('end-time')"
              mask="##:##"
              :rules="wtEndTimeRules"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <q-separator class="bg-accent-200 q-mb-md" />
        <div class="card-section-title row q-px-md">
          {{ t('custom-timer-parts') }}
        </div>
        <div class="column q-px-md q-pb-sm q-gutter-sm">
          <div
            v-for="(part, index) in customTimerParts"
            :key="part.id"
            class="row items-center q-col-gutter-sm"
          >
            <div class="col">
              <q-input
                v-model="part.label"
                dense
                :disable="timerRunning"
                filled
                :label="t('meeting-part')"
              />
            </div>
            <div class="col-4">
              <q-input
                v-model.number="part.duration"
                dense
                :disable="timerRunning"
                filled
                :label="t('duration-minutes')"
                min="1"
                type="number"
              />
            </div>
            <div class="col-auto">
              <div class="row q-gutter-xs">
                <q-btn
                  dense
                  :disable="timerRunning || index === 0"
                  flat
                  icon="mmm-up"
                  round
                  @click="moveCustomTimerPart(index, index - 1)"
                >
                  <q-tooltip>{{ t('move-up') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  :disable="
                    timerRunning || index === customTimerParts.length - 1
                  "
                  flat
                  icon="mmm-down"
                  round
                  @click="moveCustomTimerPart(index, index + 1)"
                >
                  <q-tooltip>{{ t('move-down') }}</q-tooltip>
                </q-btn>
                <q-btn
                  color="negative"
                  dense
                  :disable="timerRunning || customTimerParts.length <= 1"
                  flat
                  icon="mmm-delete"
                  round
                  @click="removeCustomTimerPart(part.id)"
                >
                  <q-tooltip>{{ t('delete') }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
          <div class="row">
            <q-btn
              color="primary"
              :disable="timerRunning"
              flat
              icon="mmm-plus"
              :label="t('add')"
              @click="addCustomTimerPart"
            />
          </div>
        </div>
      </template>
      <q-separator class="bg-accent-200 q-mb-md" />
      <div class="card-section-title row q-px-md">
        {{ t('meeting-part') }}
      </div>
      <div class="row q-px-md q-pb-sm">
        <q-list class="full-width">
          <template
            v-for="(part, index) in meetingPartsOptions"
            :key="part.value"
          >
            <q-item-label
              v-if="
                part.section &&
                (index === 0 ||
                  meetingPartsOptions[index - 1]?.section !== part.section)
              "
              class="q-pa-sm bg-accent-100 text-weight-bold text-uppercase text-caption"
              header
            >
              {{ t(part.section) }}
            </q-item-label>
            <q-item
              :class="{ 'text-warning': part.warning }"
              clickable
              @click="openEditDialog(part)"
              @contextmenu.prevent="openEditDialog(part)"
            >
              <q-item-section avatar class="jw-icon text-h6">
                {{ part.icon }}
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ part.label }}</q-item-label>
                <q-item-label caption>
                  {{ getPartStatusText(part.value) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-if="
                      (partTimings[part.value]?.startTime ||
                        partTimings[part.value]?.endTime) &&
                      !timerRunning
                    "
                    color="warning"
                    dense
                    icon="mmm-reset"
                    outline
                    size="sm"
                    @click.stop="
                      () => {
                        partTimings[part.value] ??= {
                          endTime: null,
                          startTime: null,
                        };
                        partTimings[part.value]!.startTime = null;
                        partTimings[part.value]!.endTime = null;
                      }
                    "
                  >
                  </q-btn>
                  <q-btn
                    v-if="!timerRunning && !partTimings[part.value]?.startTime"
                    color="positive"
                    dense
                    icon="mmm-play"
                    outline
                    size="sm"
                    @click.stop="selectPart(part.value)"
                  >
                    <q-tooltip>{{ t('start-timer') }}</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="currentPart === part.value && timerRunning"
                    color="negative"
                    dense
                    icon="mmm-stop"
                    size="sm"
                    @click.stop="stopTimer()"
                  >
                    <q-tooltip>{{ t('stop-timer') }}</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </div>

      <!-- Timer Controls -->
      <q-separator class="bg-accent-200 q-mb-md" />
      <div class="card-section-title row q-px-md">
        {{ t('timer-controls') }}
      </div>

      <div class="q-px-md q-pt-md">
        <template v-if="!isMeetingDay(selectedDateObject?.date)">
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
              <q-btn
                class="col"
                color="negative"
                unelevated
                @click="stopTimer()"
              >
                <q-icon class="q-mr-sm" name="stop" />
                {{ t('stop') }}
              </q-btn>
            </div>
          </template>
        </template>
        <q-btn
          class="full-width q-mb-sm"
          color="info"
          unelevated
          @click="exportPdfReport"
        >
          <q-icon class="q-mr-sm" name="picture_as_pdf" />
          {{ t('export-pdf-report') }}
        </q-btn>

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
          :label="t('duration-minutes')"
          min="1"
          type="number"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('cancel')" @click="cancelEdit" />
        <q-btn v-close-popup flat :label="t('save')" @click="saveEdit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { Display, MeetingPart } from 'src/types';

import {
  useBroadcastChannel,
  useEventListener,
  watchImmediate,
  whenever,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { QMenu } from 'quasar';
import 'jspdf-autotable';
import useTimer from 'src/composables/useTimer';
import {
  isCoWeek,
  isMeetingDay,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useAppSettingsStore } from 'src/stores/app-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, useTemplateRef, watch } from 'vue';
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

const {
  addCustomTimerPart,
  ayfmPartsCount,
  cbsCustomEndTime,
  cbsEndTimeRules,
  currentPart,
  customTimerParts,
  formattedTime,
  getDuration,
  getPlannedStartTime,
  getTimeString,
  handleTimerWindowVisibility,
  lacPartsCount,
  meetingPartsOptions,
  moveCustomTimerPart,
  partDurations,
  partTimings,
  pauseTimer,
  removeCustomTimerPart,
  resumeTimer,
  startTimer,
  stopTimer,
  timerMode,
  timerPaused,
  timerRunning,
  updateTimerWindow,
  wtCustomEndTime,
  wtEndTimeRules,
} = useTimer();

const selectingPart = ref(false);

const usedParts = ref<Set<MeetingPart>>(new Set());

// Edit dialog
const editDialogOpen = ref(false);
const editPart = ref<null | { label: string; value: MeetingPart }>(null);
const editDuration = ref(0);

const rebalancePartDurations = (
  prefix: 'ayfm' | 'lac',
  editedPartValue: MeetingPart,
  totalMinutes: number,
  totalParts: number,
) => {
  const splitEditedPart = editedPartValue.split('-');
  const partIndexString = splitEditedPart[1];
  const partIndex = Number.parseInt(partIndexString || '0');

  let consumedMinutes = 0;
  for (let i = 1; i <= partIndex; i++) {
    consumedMinutes +=
      partDurations.value[`${prefix}-${i}` as MeetingPart] || 0;
  }

  const remainingMinutes = totalMinutes - consumedMinutes;
  const remainingParts = totalParts - partIndex;

  if (remainingParts > 0) {
    const baseDuration = Math.floor(remainingMinutes / remainingParts);
    let remainder = remainingMinutes % remainingParts;

    for (let i = partIndex + 1; i <= totalParts; i++) {
      partDurations.value[`${prefix}-${i}` as MeetingPart] =
        baseDuration + (remainder > 0 ? 1 : 0);
      if (remainder > 0) {
        remainder--;
      }
    }
  } else if (remainingParts === 0 && consumedMinutes !== totalMinutes) {
    partDurations.value[editedPartValue] += totalMinutes - consumedMinutes;
  }
};

// Open edit dialog for a part
const openEditDialog = (part: { label: string; value: MeetingPart }) => {
  editPart.value = part;
  editDuration.value = partDurations.value[part.value] || 0;
  editDialogOpen.value = true;
};

// Save edits
const saveEdit = () => {
  if (!editPart.value) return;

  const editedPartValue = editPart.value.value;
  const newDuration = editDuration.value;

  // Update the edited part's duration
  partDurations.value[editedPartValue] = newDuration;

  if (editedPartValue.startsWith('ayfm-')) {
    rebalancePartDurations(
      'ayfm',
      editedPartValue,
      15 - ayfmPartsCount.value,
      ayfmPartsCount.value,
    );
  } else if (editedPartValue.startsWith('lac-')) {
    rebalancePartDurations('lac', editedPartValue, 15, lacPartsCount.value);
  } else if (editedPartValue.startsWith('custom-')) {
    const customPart = customTimerParts.value.find(
      (part) => part.id === editedPartValue,
    );
    if (customPart) {
      customPart.duration = newDuration;
    }
  }

  editDialogOpen.value = false;
};

// Cancel edit
const cancelEdit = () => {
  editDialogOpen.value = false;
};

// PDF Report Generation
const exportPdfReport = async () => {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  const meetingDate = selectedDateObject.value?.date
    ? new Date(selectedDateObject.value.date).toLocaleDateString()
    : 'N/A';

  doc.setFontSize(18);
  doc.text(`Meeting Report - ${meetingDate}`, 14, 22);

  const tableColumn = [
    t('meeting-part'),
    `${t('start-time')} (hh:mm:ss)`,
    'End (hh:mm:ss)',
    'Duration (mm:ss)',
  ];
  const tableRows: (number | string)[][] = [];

  for (const partOption of meetingPartsOptions.value) {
    const partValue = partOption.value;
    const timings = partTimings.value[partValue];
    const duration = partDurations.value[partValue];

    const formattedStartTime = getTimeString(timings?.startTime ?? null, true);
    const formattedEndTime = getTimeString(timings?.endTime ?? null, true);
    const formattedDuration = getDuration(timings ?? null, duration);

    tableRows.push([
      partOption.label,
      formattedStartTime,
      formattedEndTime,
      formattedDuration,
    ]);
  }

  autoTable(doc, {
    body: tableRows,
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
    },
    head: [tableColumn],
    headStyles: { fillColor: '#42A5F5' }, // Quasar primary color
    startY: 30,
    styles: { cellPadding: 3, fontSize: 10 },
    theme: 'grid',
  });

  doc.save(`Meeting_Report_${meetingDate}.pdf`);
};

const { getAllScreens, moveTimerWindow } = globalThis.electronApi;

// Listen for timer page ready
const { data: timerPageReady } = useBroadcastChannel<string, string>({
  name: 'timer-page-ready',
});

const fetchScreens = async () => {
  try {
    screenList.value = await getAllScreens();
  } catch (error) {
    void errorCatcher(error, {
      contexts: { timer: { action: 'fetchScreens' } },
    });
  }
};

whenever(
  () => open.value,
  async () => {
    fetchScreens();
  },
);

useEventListener(globalThis, 'screen-trigger-update', fetchScreens, {
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
  return (
    (!!screen.timerWindow && !screen.mainWindow) ||
    (!timerWindowVisible.value &&
      timerPreferences.value.preferredScreenNumber === index &&
      !screen.mainWindow)
  );
};

// UI update handler
watch(
  () => [
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

const selectPart = (value: MeetingPart) => {
  selectingPart.value = true;
  currentPart.value = value;
  usedParts.value.add(value);
  startTimer();
  selectingPart.value = false;
};

const getPartStatusText = (part: MeetingPart) => {
  const timings = partTimings.value[part];
  const duration = partDurations.value[part];

  if (timings?.startTime) {
    if (timings?.endTime) {
      return getDuration(timings, duration);
    }

    return `${t('start-time')}: ${getTimeString(timings.startTime, true)}`;
  }

  const plannedStartTime = getPlannedStartTime(part);
  if (plannedStartTime) {
    return `${t('planned-start-time')}: ${getTimeString(plannedStartTime)}`;
  }

  return `${t('duration-minutes')}: ${duration || 0}`;
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

// Watch for timer page ready
watch(timerPageReady, (timestamp) => {
  if (timestamp) {
    handleTimerWindowVisibility(true);
  }
});

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
