<template>
  <q-list class="full-width timer-parts-list" :dense="dense">
    <template v-for="(part, index) in meetingPartsOptions" :key="part.value">
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
      <!-- Counsel sits under the part it follows, and can't be edited. -->
      <q-item
        :class="{
          'text-notice-warning': part.warning,
          'timer-parts-list__item--active':
            currentPart === part.value && timerRunning,
        }"
        :clickable="!isCounselPart(part.value)"
        :inset-level="isCounselPart(part.value) ? 1 : undefined"
        @click="openEditDialog(part)"
        @contextmenu.prevent="openEditDialog(part)"
      >
        <q-item-section v-if="part.icon" avatar class="jw-icon text-h6">
          {{ part.icon }}
        </q-item-section>
        <q-item-section>
          <q-item-label>
            {{ part.name ?? part.label }}
            <q-icon
              v-if="part.warning"
              color="notice-warning"
              name="mmm-warning"
              size="xs"
            >
              <q-tooltip>{{ t('part-duration-mismatch-warning') }}</q-tooltip>
            </q-icon>
          </q-item-label>
          <q-item-label v-if="getPartStatusText(part.value)" caption>
            {{ getPartStatusText(part.value) }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row no-wrap items-center q-gutter-xs">
            <!-- A running part can be given more or less time in one click. -->
            <template
              v-if="
                timerRunning &&
                currentPart === part.value &&
                !isCounselPart(part.value)
              "
            >
              <q-btn
                :aria-label="t('decrease-duration')"
                class="btn-tonal"
                color="primary"
                dense
                flat
                icon="mmm-minus"
                size="sm"
                @click.stop="adjustPartDuration(part.value, -1)"
              >
                <q-tooltip>{{ t('decrease-duration') }}</q-tooltip>
              </q-btn>
              <q-btn
                :aria-label="t('increase-duration')"
                class="btn-tonal"
                color="primary"
                dense
                flat
                icon="mmm-plus"
                size="sm"
                @click.stop="adjustPartDuration(part.value, 1)"
              >
                <q-tooltip>{{ t('increase-duration') }}</q-tooltip>
              </q-btn>
            </template>
            <span
              v-if="isCounselPart(part.value)"
              class="timer-parts-list__duration text-caption q-px-sm"
            >
              {{
                t('minutes-short', { minutes: partDurations[part.value] ?? 0 })
              }}
            </span>
            <q-btn
              v-else
              class="timer-parts-list__duration"
              dense
              flat
              :label="
                t('minutes-short', { minutes: partDurations[part.value] ?? 0 })
              "
              no-caps
              size="sm"
              @click.stop="openEditDialog(part)"
            />
            <q-btn
              v-if="
                (partTimings[part.value]?.startTime ||
                  partTimings[part.value]?.endTime) &&
                !(timerRunning && currentPart === part.value)
              "
              :aria-label="t('reset')"
              class="btn-tonal"
              color="warning"
              dense
              flat
              icon="mmm-reset"
              size="sm"
              @click.stop="openResetConfirm(part.value)"
            >
              <q-tooltip>{{ t('reset') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="
                !partTimings[part.value]?.startTime &&
                !(timerRunning && currentPart === part.value)
              "
              :aria-label="t('start-timer')"
              class="btn-tonal"
              color="positive"
              dense
              flat
              icon="mmm-play"
              size="sm"
              @click.stop="selectPart(part.value)"
            >
              <q-tooltip>{{ t('start-timer') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="currentPart === part.value && timerRunning"
              :aria-label="t('stop-timer')"
              color="negative"
              dense
              icon="mmm-stop"
              size="sm"
              @click.stop="stopTimer()"
            >
              <q-tooltip>{{ t('stop-timer') }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="canRemovePart(part.value)"
              :aria-label="t('delete')"
              class="btn-tonal"
              color="negative"
              dense
              flat
              icon="mmm-delete"
              size="sm"
              @click.stop="removeCustomTimerPart(part.value)"
            >
              <q-tooltip>{{ t('delete') }}</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </template>
  </q-list>

  <!-- Edit Dialog -->
  <ConfirmDialog
    v-model="editDialogOpen"
    :confirm-label="t('save')"
    :dialog-id="`${dialogId}-edit-part`"
    icon="mmm-time"
    icon-color="primary"
    :title="editPart?.label ?? ''"
    @cancel="cancelEdit"
    @confirm="saveEdit"
  >
    <q-card-section>
      <q-input
        v-if="editPart && editPart.value.startsWith('custom-')"
        v-model="editLabel"
        class="bg-accent-100 q-mb-sm"
        dense
        :label="t('meeting-part')"
        outlined
      />
      <q-input
        v-model.number="editDuration"
        bg-color="accent-100"
        dense
        :hint="editDuration === 0 ? t('part-skipped') : undefined"
        :label="t('duration-minutes')"
        min="0"
        outlined
        type="number"
        @keyup.enter="saveEdit"
      >
        <template #prepend>
          <q-btn
            :aria-label="t('decrease-duration')"
            color="primary"
            dense
            :disable="editDuration <= 0"
            flat
            icon="mmm-minus"
            round
            size="sm"
            @click="editDuration = Math.max(0, editDuration - 1)"
          >
            <q-tooltip>{{ t('decrease-duration') }}</q-tooltip>
          </q-btn>
        </template>
        <template #append>
          <q-btn
            :aria-label="t('increase-duration')"
            color="primary"
            dense
            flat
            icon="mmm-plus"
            round
            size="sm"
            @click="editDuration += 1"
          >
            <q-tooltip>{{ t('increase-duration') }}</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </q-card-section>
  </ConfirmDialog>

  <!-- Reset Part Timing Confirmation (UX-3, full-audit-2026-09-04.md):
       clearing a part's recorded start/end time fed into the exported
       timing report asks first, like every other destructive action. -->
  <ConfirmDialog
    v-model="resetConfirmOpen"
    confirm-color="warning"
    :confirm-label="t('reset')"
    :dialog-id="`${dialogId}-reset-part`"
    icon="mmm-reset"
    icon-color="warning"
    :message="t('reset-part-timing-confirmation')"
    persistent
    :title="t('reset')"
    @cancel="cancelResetPart"
    @confirm="confirmResetPart"
  />
</template>

<script setup lang="ts">
import type { MeetingPart, MeetingPartOption } from 'src/types';

import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import useTimer from 'src/composables/useTimer';
import { isMeetingDay } from 'src/helpers/date';
import { isCounselPart } from 'src/helpers/meeting-parts';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    dense?: boolean;
    dialogId?: string;
    /** Delete buttons on custom parts, where no setup section is beside the list. */
    removableCustomParts?: boolean;
  }>(),
  { dialogId: 'timer-parts' },
);

const { t } = useI18n();

const {
  adjustPartDuration,
  currentPart,
  customTimerParts,
  getDuration,
  getPlannedStartTime,
  getTimeString,
  meetingPartsOptions,
  partDurations,
  partTimings,
  removeCustomTimerPart,
  resetPartTiming,
  selectPart,
  setPartDuration,
  stopTimer,
  timerRunning,
  updateCustomTimerPart,
} = useTimer();

const { currentSettings, selectedDateObject } = storeToRefs(
  useCurrentStateStore(),
);

// The same rules as the timer popup's custom parts: the part being timed
// stays, and so does the last part of a day without a meeting, which needs
// one to time.
const canRemovePart = (part: MeetingPart) => {
  if (!props.removableCustomParts || !part.startsWith('custom-')) return false;
  if (timerRunning.value && currentPart.value === part) return false;
  return (
    isMeetingDay(selectedDateObject.value?.date) ||
    customTimerParts.value.length > 1
  );
};

// Custom part labels are shown as "Label (N min.)"; strip that suffix (and
// the whitespace before it) to edit the bare label. Trimming with string ops
// instead of a leading \s* keeps the match linear on long whitespace runs.
const DURATION_SUFFIX_PATTERN = /\(\d+ min\.\)$/;
const stripDurationSuffix = (label: string) => {
  const match = DURATION_SUFFIX_PATTERN.exec(label);
  return match ? label.slice(0, match.index).trimEnd() : label;
};

// Edit dialog
const editDialogOpen = ref(false);
const editPart = ref<MeetingPartOption | null>(null);
const editDuration = ref(0);
const editLabel = ref('');

const openEditDialog = (part: MeetingPartOption) => {
  if (isCounselPart(part.value)) return;
  editPart.value = part;
  editDuration.value = partDurations.value[part.value] ?? 0;
  editLabel.value = part.value.startsWith('custom-')
    ? stripDurationSuffix(part.label)
    : '';
  editDialogOpen.value = true;
};

const saveEdit = () => {
  if (!editPart.value) return;
  const partValue = editPart.value.value;
  setPartDuration(partValue, editDuration.value);
  if (partValue.startsWith('custom-') && editLabel.value.trim()) {
    updateCustomTimerPart(partValue, { label: editLabel.value.trim() });
  }
  editDialogOpen.value = false;
};

const cancelEdit = () => {
  editDialogOpen.value = false;
};

const resetConfirmOpen = ref(false);
const resetPartValue = ref<MeetingPart | null>(null);

const openResetConfirm = (partValue: MeetingPart) => {
  resetPartValue.value = partValue;
  resetConfirmOpen.value = true;
};

const confirmResetPart = () => {
  const partValue = resetPartValue.value;
  if (!partValue) return;
  resetPartTiming(partValue);
  resetConfirmOpen.value = false;
};

const cancelResetPart = () => {
  resetConfirmOpen.value = false;
};

const getPartStatusText = (part: MeetingPart) => {
  const timings = partTimings.value[part];
  const duration = partDurations.value[part] ?? 0;

  if (timings?.startTime) {
    if (timings?.endTime) {
      return getDuration(timings, duration);
    }

    return `${t('start-time')}: ${getTimeString(timings.startTime, true)}`;
  }

  const plannedStartTime =
    currentSettings.value?.timerShowPlannedStartTimes === false
      ? null
      : getPlannedStartTime(part);
  if (plannedStartTime) {
    return `${t('planned-start-time')}: ${getTimeString(plannedStartTime)}`;
  }

  return duration ? '' : t('part-skipped');
};
</script>

<style scoped>
.timer-parts-list__item--active {
  background: color-mix(in srgb, var(--q-positive) 14%, transparent);
  box-shadow: inset 3px 0 0 var(--q-positive);
}

.timer-parts-list__duration {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
