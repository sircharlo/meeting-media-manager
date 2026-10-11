<template>
  <!-- Shown over the whole main window while M³ drives the Zoom app: its
       actions move the mouse and focus for a moment, and this says so, names
       what is going on, and offers a way out (a button here, and a global
       shortcut that works even while Zoom has the focus). -->
  <BaseDialog
    v-model="open"
    dialog-id="zoom-automation-overlay"
    maximized
    no-backdrop-dismiss
    no-esc-dismiss
    persistent
    transition-hide="fade"
    transition-show="fade"
  >
    <q-card class="zoom-run column items-center justify-center text-center">
      <q-spinner color="primary" size="64px" :thickness="3" />
      <div class="text-h5 text-weight-medium q-mt-lg">
        {{ t('zoom-run-title') }}
      </div>
      <div v-if="runLabel" class="text-subtitle1 q-mt-sm">
        {{ t(runLabel) }}
      </div>
      <div v-if="runStep" class="text-caption text-grey q-mt-xs">
        {{ t(runStep) }}
      </div>
      <p class="zoom-run__explain q-mt-lg">
        {{ t('zoom-run-explain') }}
      </p>
      <q-btn
        class="q-mt-md"
        color="negative"
        icon="mmm-clear"
        :label="t('zoom-run-cancel')"
        no-caps
        unelevated
        @click="cancel"
      />
      <p v-if="cancelShortcut" class="text-caption text-grey q-mt-md">
        {{ t('zoom-run-cancel-hint', { shortcut: cancelShortcut }) }}
      </p>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { cancelZoomRun } from 'src/helpers/zoom';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const zoomState = useZoomStateStore();
const { cancelRequested, runActive, runLabel, runStep } =
  storeToRefs(zoomState);
const { currentSettings } = storeToRefs(useCurrentStateStore());

// One press on Cancel frees the window at once; the run unwinds behind.
const open = computed({
  get: () => runActive.value && !cancelRequested.value,
  set: () => undefined, // only the run's end (or a cancel) closes it
});

const cancelShortcut = computed(
  () => currentSettings.value?.zoomCancelAutomationShortcut ?? '',
);

const cancel = () => {
  void cancelZoomRun();
};

// Esc cancels too while M³ itself has the focus (the global shortcut covers
// the rest of the time, when Zoom has it).
useEventListener(globalThis, 'keydown', (event: KeyboardEvent) => {
  if (!runActive.value || event.key !== 'Escape') return;
  event.preventDefault();
  cancel();
});

// The cancel shortcut is only registered while a run is going, so the key
// combination stays free the rest of the time.
watch(
  () => [runActive.value, cancelShortcut.value] as const,
  ([active, shortcut], previous) => {
    const previousShortcut = previous?.[1];
    try {
      if (previousShortcut && (!active || previousShortcut !== shortcut)) {
        globalThis.electronApi.unregisterShortcut(previousShortcut);
      }
      if (active && shortcut) {
        globalThis.electronApi.registerShortcut(
          'zoomCancelAutomationShortcut',
          shortcut,
        );
      }
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { name: 'zoomRunCancelShortcut' } },
      });
    }
  },
);
</script>

<style scoped>
.zoom-run {
  background: rgba(10, 10, 14, 0.92);
  color: #fff;
  height: 100%;
  padding: 24px;
  width: 100%;
}

.zoom-run__explain {
  max-width: 520px;
  opacity: 0.85;
}
</style>
