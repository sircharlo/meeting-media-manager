<template>
  <!-- Asked before an automatic check touches Zoom (see askForCheck): the
       check brings Zoom forward and presses a few of its buttons, so the
       user says when it may run. Choosing not to turns the Zoom automations
       off for this meeting, behind a second confirmation. -->
  <ConfirmDialog
    v-model="open"
    :cancel-label="t('zoom-check-ask-skip')"
    :confirm-label="t('zoom-check-ask-run')"
    dialog-id="zoom-check-prompt"
    icon="mmm-video-meeting"
    icon-color="primary"
    :message="t('zoom-check-ask-explain')"
    persistent
    :title="t('zoom-check-ask-title')"
    @cancel="askAboutSkipping = true"
    @confirm="answer('run')"
  />
  <ConfirmDialog
    v-model="askAboutSkipping"
    :cancel-label="t('zoom-check-skip-confirm-cancel')"
    confirm-color="negative"
    :confirm-label="t('zoom-check-skip-confirm-action')"
    dialog-id="zoom-check-skip-confirm"
    icon="mmm-warning"
    icon-color="warning"
    :message="t('zoom-check-skip-confirm-message')"
    persistent
    :title="t('zoom-check-skip-confirm-title')"
    @cancel="askAboutSkipping = false"
    @confirm="answer('skip')"
  />
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { answerZoomCheckPrompt } from 'src/helpers/zoom-check-prompt';
import { useZoomStateStore } from 'stores/zoom-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { checkPrompt } = storeToRefs(useZoomStateStore());

// Only the answer (or a new check) closes it: see answerZoomCheckPrompt.
const open = computed({
  get: () => checkPrompt.value,
  set: () => undefined,
});

// Skipping is confirmed first: it turns the automations off for the meeting.
const askAboutSkipping = ref(false);

const answer = (choice: 'run' | 'skip') => {
  askAboutSkipping.value = false;
  answerZoomCheckPrompt(choice);
};

// A check asked for elsewhere (Test again) settles this one without an answer.
watch(open, (isOpen) => {
  if (!isOpen) askAboutSkipping.value = false;
});
</script>
