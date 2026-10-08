<template>
  <div class="q-px-md q-pt-md">
    <p class="card-section-title text-dark-grey row q-mb-xs">
      {{ t('zoom-self-test-title') }}
    </p>
    <div class="text-caption text-grey q-mb-sm">
      {{ t('zoom-self-test-explain') }}
    </div>
    <div class="row items-center no-wrap q-gutter-x-sm q-mb-sm">
      <q-select
        v-model="participantCount"
        class="col"
        dense
        :disable="running"
        emit-value
        :label="t('zoom-self-test-participants')"
        map-options
        :options="participantOptions"
        outlined
      />
      <q-btn
        v-if="!running"
        color="primary"
        icon="mmm-play"
        :label="t('zoom-self-test-run')"
        no-caps
        unelevated
        @click="runTest"
      />
      <q-btn
        v-else
        color="negative"
        icon="mmm-stop"
        :label="t('zoom-self-test-stop')"
        no-caps
        outline
        @click="stopTest"
      />
    </div>
    <div v-if="testMeetingId" class="text-caption text-grey q-mb-sm">
      {{
        t('zoom-self-test-participants-meeting', { meetingId: testMeetingId })
      }}
    </div>
    <div v-if="steps.length" class="zoom-self-test__steps">
      <div
        v-for="step in steps"
        :key="step.id"
        class="row items-start no-wrap q-py-xs"
      >
        <q-spinner
          v-if="step.status === 'running'"
          class="q-mr-sm q-mt-xs"
          color="primary"
          size="14px"
        />
        <q-icon
          v-else
          class="q-mr-sm q-mt-xs"
          :color="STATUS_COLORS[step.status]"
          :name="STATUS_ICONS[step.status]"
          size="14px"
        />
        <div class="col">
          <div class="text-caption text-weight-medium">
            {{ t(ZOOM_SELF_TEST_STEP_LABELS[step.id]) }}
          </div>
          <div v-if="step.detail" class="text-caption text-grey">
            {{ step.detail }}
          </div>
        </div>
      </div>
      <div v-if="!running" class="text-caption text-weight-medium q-pt-xs">
        {{ t('zoom-self-test-summary', summary) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ZoomTestParticipantAction } from 'src/types';

import { storeToRefs } from 'pinia';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { getZoomTitlesFromSettings } from 'src/helpers/zoom';
import {
  runZoomSelfTest,
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStatus,
  type ZoomSelfTestStep,
  type ZoomTestParticipantsProbe,
} from 'src/helpers/zoom-self-test';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentState = useCurrentStateStore();
const { mediaWindowVisible } = storeToRefs(currentState);

const STATUS_ICONS: Record<ZoomSelfTestStatus, string> = {
  failed: 'mmm-error',
  passed: 'mmm-check',
  pending: 'mmm-radio-button-unchecked',
  running: 'mmm-radio-button-unchecked',
  skipped: 'mmm-minus',
};

const STATUS_COLORS: Record<ZoomSelfTestStatus, string> = {
  failed: 'negative',
  passed: 'positive',
  pending: 'grey',
  running: 'primary',
  skipped: 'grey',
};

const MEDIA_WINDOW_SETTLE_MS = 1500;

const participantOptions = [0, 1, 2, 3, 4, 5].map((count) => ({
  label: String(count),
  value: count,
}));
const participantCount = ref(3);
const running = ref(false);
const steps = ref<ZoomSelfTestStep[]>([]);
const testMeetingId = ref<string>();
let abortController: AbortController | undefined;

const summary = computed(() => ({
  failed: steps.value.filter((step) => step.status === 'failed').length,
  passed: steps.value.filter((step) => step.status === 'passed').length,
  skipped: steps.value.filter((step) => step.status === 'skipped').length,
}));

const { zoomTestParticipants } = globalThis.electronApi;

const participantsProbe: ZoomTestParticipantsProbe = {
  act: async (action: ZoomTestParticipantAction) => {
    await zoomTestParticipants({ action, type: 'action' });
  },
  list: async () =>
    (await zoomTestParticipants({ type: 'state' })).participants ?? [],
};

const prepareMediaWindow = async () => {
  const wasVisible = mediaWindowVisible.value;
  if (!wasVisible) {
    toggleMediaWindowVisibility(true);
    await new Promise((resolve) => {
      setTimeout(resolve, MEDIA_WINDOW_SETTLE_MS);
    });
  }
  return () => {
    if (!wasVisible) toggleMediaWindowVisibility(false);
  };
};

const runTest = async () => {
  running.value = true;
  abortController = new AbortController();
  testMeetingId.value = undefined;
  steps.value = [];
  try {
    let probe: undefined | ZoomTestParticipantsProbe;
    if (participantCount.value > 0) {
      const started = await zoomTestParticipants({
        count: participantCount.value,
        type: 'start',
      });
      testMeetingId.value = started.meetingId;
      if (started.ok) probe = participantsProbe;
    }
    await runZoomSelfTest({
      onProgress: (progress) => {
        steps.value = progress;
      },
      participants: probe,
      prepareMediaWindow,
      signal: abortController.signal,
      titles: getZoomTitlesFromSettings(),
    });
  } finally {
    if (participantCount.value > 0) {
      await zoomTestParticipants({ type: 'stop' });
    }
    running.value = false;
  }
};

const stopTest = () => {
  abortController?.abort();
};

onBeforeUnmount(() => {
  abortController?.abort();
});
</script>

<style scoped>
.zoom-self-test__steps {
  max-height: 260px;
  overflow: auto;
}
</style>
