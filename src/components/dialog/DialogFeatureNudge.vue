<template>
  <BaseDialog v-model="open" dialog-id="feature-nudge" @hide="handleHide">
    <q-card v-if="nudge" class="round-card feature-nudge">
      <q-card-section class="row items-center no-wrap q-pb-none">
        <div
          class="col row items-center no-wrap text-primary text-semibold feature-nudge__overline"
        >
          <q-icon class="q-mr-xs" name="mmm-shimmer" size="14px" />
          {{ t('feature-nudge-overline') }}
        </div>
        <q-btn
          :aria-label="t('close')"
          dense
          flat
          icon="mmm-clear"
          round
          size="sm"
          @click="open = false"
        />
      </q-card-section>

      <q-card-section class="row no-wrap items-start">
        <div class="icon-chip feature-nudge__icon text-primary q-mr-md">
          <q-icon :name="nudge.icon" />
        </div>
        <div class="col">
          <div class="text-h6 feature-nudge__title">
            {{ t(nudge.title) }}
            <q-badge v-if="nudge.beta" align="top" class="q-ml-xs">
              {{ t('beta') }}
            </q-badge>
          </div>
          <p class="text-dark-grey q-mb-none feature-nudge__body">
            {{ t(body) }}
          </p>
        </div>
      </q-card-section>

      <q-card-section class="column q-gutter-y-sm q-pt-none">
        <q-btn
          color="primary"
          :label="t(nudge.acceptLabel)"
          no-caps
          unelevated
          @click="accept"
        />
        <div class="row no-wrap q-gutter-x-sm">
          <q-btn
            class="col btn-tonal"
            color="primary"
            flat
            :label="t('remind-me-later')"
            no-caps
            @click="remindLater"
          />
          <q-btn
            class="col"
            flat
            :label="t('feature-nudge-no-thanks')"
            no-caps
            @click="decline"
          />
        </div>
      </q-card-section>

      <q-card-section class="row justify-center q-pt-none">
        <q-btn
          class="text-dark-grey feature-nudge__stop"
          dense
          flat
          :label="t('feature-nudge-stop')"
          no-caps
          size="sm"
          @click="stopSuggesting"
        />
      </q-card-section>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { FeatureNudge, FeatureNudgeResponse } from 'src/types';

import { watchImmediate } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import {
  getFeatureNudgeContext,
  isOutsideMeetingTime,
  markFeatureNudgeShown,
  pickFeatureNudge,
  wasFeatureNudgeShownThisSession,
  wasSetUpThisSession,
} from 'src/helpers/feature-nudges';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { isDemoModeActive } from 'stores/demo-mode';
import { useDialogStateStore } from 'stores/dialog-state';
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const congregationSettingsStore = useCongregationSettingsStore();
const currentStateStore = useCurrentStateStore();
const { congregationSwitcherOpen, currentCongregation, currentSettings } =
  storeToRefs(currentStateStore);
const dialogStateStore = useDialogStateStore();

// Let startup settle first (its notifications last up to 30 s, the Zoom
// startup check, OBS connecting), then retry while the moment isn't right,
// up to half an hour.
const FIRST_TRY_DELAY_MS = 45 * 1000;
const RETRY_DELAY_MS = 60 * 1000;
const MAX_TRIES = 30;

const open = ref(false);
const nudge = ref<FeatureNudge | null>(null);
const body = ref('');
// The profile the shown suggestion is for, even if the user switches away.
const shownFor = ref('');
let answered = false;

const respond = (response: FeatureNudgeResponse) => {
  if (!nudge.value || !shownFor.value) return;
  answered = true;
  congregationSettingsStore.recordFeatureNudgeResponse(
    shownFor.value,
    nudge.value.id,
    response,
  );
  open.value = false;
};

const accept = () => {
  const action = nudge.value?.action;
  respond('accepted');
  if (action?.type === 'settings') {
    void router.push(`/settings/${action.setting}`);
  } else if (action?.type === 'event') {
    globalThis.dispatchEvent(new CustomEvent(action.event));
  }
};

const remindLater = () => {
  respond('snoozed');
  createTemporaryNotification({ message: t('feature-nudge-snoozed') });
};

const decline = () => {
  respond('declined');
  createTemporaryNotification({ message: t('feature-nudge-declined') });
};

const stopSuggesting = () => {
  if (!shownFor.value) return;
  answered = true;
  congregationSettingsStore.stopFeatureNudges(shownFor.value);
  open.value = false;
  createTemporaryNotification({ message: t('feature-nudge-stopped') });
};

// Closing it without an answer (Esc, the close button) is "remind me later".
const handleHide = () => {
  if (!answered) respond('snoozed');
};

// --- When to suggest ---------------------------------------------------------

let retryTimer: ReturnType<typeof setTimeout> | undefined;

const stopTrying = () => {
  clearTimeout(retryTimer);
  retryTimer = undefined;
};

// Never for a profile the setup wizard just went through (it asked about
// these features), before its quick-start tour, or in demo mode.
const isProfileReady = (congId: string) =>
  !wasFeatureNudgeShownThisSession(congId) &&
  !wasSetUpThisSession(congId) &&
  !!congregationSettingsStore.quickStartTourSeen[congId] &&
  !isDemoModeActive();

// Notifications sit above dialogs, so one still showing (like a startup
// warning) would cover the suggestion's header. New ones wait for the
// dialog to close (deferWhileDialogOpen), so only those already up matter.
const isNotificationShowing = () => !!document.querySelector('.q-notification');

// Only on the media calendar, over nothing else, while no media is shown and
// not from shortly before the meeting until it ends.
const isGoodMoment = (congId: string) =>
  currentCongregation.value === congId &&
  route.name === 'media-calendar' &&
  !congregationSwitcherOpen.value &&
  !dialogStateStore.isAnyDialogOpen &&
  !isNotificationShowing() &&
  !currentStateStore.mediaPlaying.url &&
  isOutsideMeetingTime();

const tryToSuggest = async (congId: string, tries: number) => {
  if (currentCongregation.value !== congId || !isProfileReady(congId)) return;
  if (!isGoodMoment(congId)) {
    if (tries < MAX_TRIES) scheduleTry(congId, tries + 1, RETRY_DELAY_MS);
    return;
  }

  const settings = currentSettings.value;
  if (!settings) return;
  const context = await getFeatureNudgeContext(settings);
  // One go per profile per session, even with nothing to suggest.
  markFeatureNudgeShown(congId);
  const next = pickFeatureNudge(
    context,
    congregationSettingsStore.featureNudges[congId],
  );
  if (!next || !isGoodMoment(congId)) return;

  nudge.value = next;
  body.value = next.getBody(context);
  shownFor.value = congId;
  answered = false;
  open.value = true;
};

const scheduleTry = (congId: string, tries: number, delay: number) => {
  stopTrying();
  retryTimer = setTimeout(() => void tryToSuggest(congId, tries), delay);
};

onBeforeUnmount(stopTrying);

watchImmediate(currentCongregation, (congId) => {
  stopTrying();
  if (congId) scheduleTry(congId, 1, FIRST_TRY_DELAY_MS);
});
</script>

<style scoped lang="scss">
.feature-nudge {
  max-width: 450px;
  width: 90vw;
}

.feature-nudge__overline {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.feature-nudge__icon {
  font-size: 24px;
  height: 2em;
  width: 2em;
}

.feature-nudge__title {
  line-height: 1.3;
  margin-bottom: 6px;
}

.feature-nudge__body {
  line-height: 1.55;
}

.feature-nudge__stop {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
