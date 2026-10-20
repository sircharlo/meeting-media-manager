<template>
  <div class="zoom-self-test-steps">
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
  </div>
</template>

<script setup lang="ts">
import {
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStatus,
  type ZoomSelfTestStep,
} from 'src/helpers/zoom-self-test';
import { useI18n } from 'vue-i18n';

defineProps<{ steps: ZoomSelfTestStep[] }>();

const { t } = useI18n();

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
</script>
