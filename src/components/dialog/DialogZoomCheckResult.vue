<template>
  <!-- A failed Zoom check's result (see showFailedCheck in
       zoom-startup-check.ts), over the whole window like the "M³ is
       operating Zoom" overlay it follows: before the meeting, the user has
       to decide what to do, test again (or let the setup assistant learn
       Zoom's buttons again) or run Zoom by hand. -->
  <BaseDialog
    v-model="open"
    dialog-id="zoom-check-result"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
    persistent
    transition-hide="fade"
    transition-show="fade"
  >
    <q-card
      class="zoom-check-result column items-center justify-center text-center"
    >
      <q-icon color="warning" name="mmm-warning" size="64px" />
      <div class="text-h5 text-weight-medium q-mt-lg">
        {{ t('zoom-automations-paused') }}
      </div>
      <p class="zoom-check-result__text q-mt-md">{{ shown?.caption }}</p>
      <p class="zoom-check-result__tip text-caption">
        {{ t('zoom-check-result-later') }}
      </p>
      <div class="zoom-check-result__actions">
        <q-btn
          color="primary"
          :label="
            t(shown?.relearn ? 'zoom-setup-open' : 'zoom-check-test-again')
          "
          no-caps
          unelevated
          @click="tryAgain"
        />
        <q-btn
          :label="t('zoom-check-result-by-hand')"
          no-caps
          outline
          @click="confirmGoingOn = true"
        />
      </div>
    </q-card>
  </BaseDialog>
  <!-- Going on without the automations changes today's meeting: whoever
       runs Zoom does it all by hand. Confirmed first, as when skipping the
       check (DialogZoomCheckPrompt), with the same words. -->
  <ConfirmDialog
    v-model="confirmGoingOn"
    :cancel-label="t('zoom-check-skip-confirm-cancel')"
    confirm-color="negative"
    :confirm-label="t('zoom-check-skip-confirm-action')"
    dialog-id="zoom-check-result-confirm"
    icon="mmm-warning"
    icon-color="warning"
    :message="t('zoom-check-skip-confirm-message')"
    persistent
    :title="t('zoom-check-skip-confirm-title')"
    @cancel="confirmGoingOn = false"
    @confirm="goOnWithout"
  />
</template>

<script setup lang="ts">
import BaseDialog from 'components/dialog/BaseDialog.vue';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { useZoomStateStore, type ZoomFailedCheck } from 'stores/zoom-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const zoomState = useZoomStateStore();
const { failedCheck } = storeToRefs(zoomState);

// Only its buttons (or a newer check) close it.
const open = computed({
  get: () => failedCheck.value !== null,
  set: () => undefined,
});

// What it shows, kept while it fades out once closed.
const shown = ref<null | ZoomFailedCheck>(null);

const close = () => {
  zoomState.closeFailedCheck();
};

// Going on without the automations, once confirmed: they stay paused
// until a check passes.
const confirmGoingOn = ref(false);

const goOnWithout = () => {
  confirmGoingOn.value = false;
  close();
};

const tryAgain = () => {
  const relearn = !!shown.value?.relearn;
  close();
  if (relearn) {
    globalThis.dispatchEvent(new CustomEvent('openZoomSetupAssistant'));
  } else {
    void runZoomStartupCheck({ manual: true });
  }
};

watch(
  failedCheck,
  (result) => {
    if (result) shown.value = result;
    // Closed otherwise (a newer check, the setup assistant opening): so is
    // the confirmation.
    else confirmGoingOn.value = false;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.zoom-check-result {
  background: rgba(10, 10, 14, 0.92);
  color: #fff;
  height: 100%;
  padding: 24px;
  width: 100%;
}

.zoom-check-result__text {
  max-width: 560px;
  opacity: 0.9;
}

.zoom-check-result__tip {
  max-width: 520px;
  opacity: 0.7;
}

.zoom-check-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}
</style>
