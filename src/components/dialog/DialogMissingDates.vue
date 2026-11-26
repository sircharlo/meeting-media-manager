<template>
  <!-- A reminder to add the special dates that aren't set (the circuit
       overseer's visit, the Memorial: see showDateReminder), over the whole
       window when there's time for it, all of a profile's together. Close to
       a meeting, the same reminder is a notification instead. -->
  <BaseDialog
    v-model="open"
    dialog-id="missing-dates"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
    persistent
    transition-hide="fade"
    transition-show="fade"
  >
    <q-card
      class="missing-dates column items-center justify-center text-center"
    >
      <q-icon color="warning" name="mmm-calendar-month" size="64px" />
      <template v-if="displayed.length === 1">
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ displayed[0]?.message }}
        </div>
        <p class="missing-dates__text q-mt-md">{{ displayed[0]?.caption }}</p>
        <div class="missing-dates__actions">
          <q-btn
            color="primary"
            :label="t('go-to-settings')"
            no-caps
            unelevated
            @click="goToSettings(displayed[0])"
          />
        </div>
      </template>
      <template v-else>
        <div class="text-h5 text-weight-medium q-mt-lg">
          {{ t('missing-dates-title') }}
        </div>
        <p class="missing-dates__text q-mt-md">
          {{ t('missing-dates-explain') }}
        </p>
        <div
          v-for="reminder in displayed"
          :key="reminder.id"
          class="missing-dates__row row no-wrap items-center q-mt-sm"
        >
          <span class="col text-left">{{ reminder.message }}</span>
          <q-btn
            class="q-ml-md"
            color="primary"
            :label="t('go-to-settings')"
            no-caps
            unelevated
            @click="goToSettings(reminder)"
          />
        </div>
      </template>
      <div class="missing-dates__actions">
        <q-btn
          :label="t('remind-me-in-a-month')"
          no-caps
          outline
          @click="snooze(1)"
        />
        <q-btn
          :label="t('dismiss-for-6-months')"
          no-caps
          outline
          @click="snooze(6)"
        />
        <q-btn :label="t('later')" no-caps outline @click="later" />
      </div>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import {
  canShowDateRemindersFullScreen,
  closeDateReminderForSession,
  type DateReminder,
  goToDateReminderSetting,
  notifyDateReminder,
  pendingDateReminders,
  snoozeDateReminderForMonths,
  takePendingDateReminders,
} from 'src/helpers/date-reminders';
import { SCREEN_PRIORITY, useAttentionStore } from 'stores/attention';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

// Its turn to show, in the attention store.
const SCREEN_REQUEST = 'missing-dates';

const { t } = useI18n();
const route = useRoute();
const attention = useAttentionStore();
const { currentCongregation } = storeToRefs(useCurrentStateStore());

// The reminders showing: only its buttons close it.
const shown = ref<DateReminder[]>([]);
// What it shows, kept while it fades out once closed.
const displayed = ref<DateReminder[]>([]);

const open = computed({
  get: () => shown.value.length > 0,
  set: () => undefined,
});

const close = () => {
  shown.value = [];
};

// Opens that date's setting. The others are in the same place: they stay
// quiet for the session too.
const goToSettings = (reminder: DateReminder | undefined) => {
  shown.value.forEach(closeDateReminderForSession);
  close();
  if (reminder) goToDateReminderSetting(reminder);
};

const snooze = (months: number) => {
  for (const reminder of shown.value) {
    snoozeDateReminderForMonths(reminder, months);
  }
  close();
};

const later = () => {
  shown.value.forEach(closeDateReminderForSession);
  close();
};

// Once it's its turn: the current profile's reminders, over the whole
// window if the moment is still right then, else as notifications.
const askForTurn = () => {
  attention.request(SCREEN_REQUEST, {
    open: () => {
      const congId = currentCongregation.value;
      const reminders = takePendingDateReminders(congId);
      if (!reminders.length) return false;
      if (
        route.name !== 'media-calendar' ||
        !canShowDateRemindersFullScreen(congId)
      ) {
        reminders.forEach(notifyDateReminder);
        return false;
      }
      shown.value = reminders;
    },
    priority: SCREEN_PRIORITY.missingDates,
  });
};

// One arriving while it shows the same profile's joins it (the Memorial's
// is only known once its dates are fetched, after the circuit overseer's).
const addToShown = () => {
  const congId = shown.value[0]?.congId ?? '';
  const more = takePendingDateReminders(congId).filter(
    ({ id }) => !shown.value.some((reminder) => reminder.id === id),
  );
  shown.value = [...shown.value, ...more];
};

onBeforeUnmount(() => {
  attention.withdraw(SCREEN_REQUEST);
});

watch(
  () => pendingDateReminders.value.length,
  (count) => {
    if (!count) return;
    if (open.value) addToShown();
    else askForTurn();
  },
  { immediate: true },
);

watch(shown, (reminders) => {
  if (reminders.length) displayed.value = reminders;
});
</script>

<style lang="scss" scoped>
.missing-dates {
  background: rgba(10, 10, 14, 0.92);
  color: #fff;
  height: 100%;
  padding: 24px;
  width: 100%;
}

.missing-dates__text {
  max-width: 560px;
  opacity: 0.9;
}

.missing-dates__row {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  max-width: 560px;
  padding: 10px 14px;
  width: 100%;
}

.missing-dates__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}
</style>
