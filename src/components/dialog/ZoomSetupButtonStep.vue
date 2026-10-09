<template>
  <div>
    <div class="text-h6 q-mb-sm">{{ title }}</div>
    <p>{{ intro }}</p>
    <template v-if="status === 'passed'">
      <StatusRow status="passed" :text="doneText" />
      <q-btn
        class="q-mt-sm"
        color="primary"
        dense
        flat
        :label="t('zoom-setup-learn-again')"
        no-caps
        @click="emit('relearn')"
      />
    </template>
    <template v-else>
      <template v-if="!waiting">
        <div class="text-subtitle2 q-mb-sm">{{ question }}</div>
        <div class="row q-col-gutter-sm">
          <div v-for="choice in choices" :key="choice.label" class="col-6">
            <q-btn
              class="zoom-setup-button-step__choice btn-tonal full-width"
              color="primary"
              :disable="status === 'running'"
              flat
              no-caps
              @click="emit('learn', choice.isOn)"
            >
              <div class="column items-center q-py-sm">
                <q-icon :name="choice.icon" size="md" />
                <div class="q-mt-xs">{{ choice.label }}</div>
              </div>
            </q-btn>
          </div>
        </div>
      </template>
      <StatusRow
        v-if="status === 'running' || status === 'failed'"
        class="q-mt-md"
        :status="status"
        :text="statusText"
      >
        <slot />
      </StatusRow>
    </template>
  </div>
</template>

<script setup lang="ts">
import StatusRow from 'components/dialog/ZoomSetupStatusRow.vue';
import { useI18n } from 'vue-i18n';

// A setup assistant step learning what one of Zoom's two-state buttons (the
// microphone, the camera) says in each state: the user says which state it's
// in, and M³ switches it once and back to read both names.

defineProps<{
  choices: { icon: string; isOn: boolean; label: string }[];
  doneText: string;
  intro: string;
  question: string;
  status: 'failed' | 'passed' | 'pending' | 'running';
  /** What's going on while running, or what went wrong. */
  statusText: string;
  title: string;
  /** Whether the question has to wait, e.g. for computer audio. */
  waiting?: boolean;
}>();

const emit = defineEmits<{
  learn: [isOn: boolean];
  relearn: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.zoom-setup-button-step__choice {
  border-radius: 12px;
  min-height: 96px;
}
</style>
