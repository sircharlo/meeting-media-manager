<template>
  <ConfirmDialog
    v-model="open"
    :confirm-label="t('start')"
    dialog-id="timer-part-counts"
    icon="mmm-time"
    icon-color="primary"
    :message="t('timer-part-counts-message')"
    persistent
    :title="t('timer-part-counts-title')"
    @cancel="cancelPendingPartStart"
    @confirm="confirmPartCounts({ ayfm, lac })"
  >
    <q-card-section class="q-pt-none">
      <div class="q-pb-sm">{{ t('number-of-ayfm-parts') }}</div>
      <q-btn-toggle
        v-model="ayfm"
        class="full-width q-mb-md"
        :options="ayfmOptions"
        spread
      />
      <div class="q-pb-sm">{{ t('number-of-lac-parts') }}</div>
      <q-btn-toggle
        v-model="lac"
        class="full-width"
        :options="lacOptions"
        spread
      />
    </q-card-section>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import useTimer from 'src/composables/useTimer';
import { MAX_AYFM_PARTS, MAX_LAC_PARTS } from 'src/helpers/meeting-parts';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// One question for every way of starting the timer (the popup, its hover
// controls, the docked panel): on a midweek meeting day whose number of
// parts wasn't chosen yet, starting a part asks for it first.
const { t } = useI18n();

const {
  ayfmPartsCount,
  cancelPendingPartStart,
  confirmPartCounts,
  lacPartsCount,
  pendingPartStart,
} = useTimer();

const countOptions = (max: number) =>
  Array.from({ length: max }, (_, index) => ({
    label: String(index + 1),
    value: index + 1,
  }));

const ayfmOptions = countOptions(MAX_AYFM_PARTS);
const lacOptions = countOptions(MAX_LAC_PARTS);

const ayfm = ref(ayfmPartsCount.value);
const lac = ref(lacPartsCount.value);

const open = computed({
  get: () => pendingPartStart.value !== null,
  set: (value) => {
    if (!value) cancelPendingPartStart();
  },
});

// Each time it asks, it starts from the day's current counts.
whenever(open, () => {
  ayfm.value = ayfmPartsCount.value;
  lac.value = lacPartsCount.value;
});
</script>
