<template>
  <!-- Asks before converting files this computer can't play (see
       helpers/media-conversion): it takes a lot of processing power, so it's
       never started without the user, and they're told when the meeting is
       close enough for it not to finish in time. -->
  <ConfirmDialog
    confirm-color="primary"
    :confirm-label="t('convert-media')"
    dialog-id="media-conversion-confirm"
    icon="mmm-movie"
    icon-color="primary"
    :message="t('convert-media-confirm-message')"
    :model-value="!!pendingConfirmation"
    :title="t('convert-media-confirm-title', count)"
    @cancel="close"
    @confirm="confirm"
    @update:model-value="(open: boolean) => !open && close()"
  >
    <q-card-section
      v-if="meetingSoonMinutes !== null"
      class="row items-center no-wrap text-warning q-pt-none"
    >
      <q-icon class="q-mr-sm" name="mmm-warning" size="sm" />
      {{ t('convert-media-meeting-soon', meetingSoonMinutes) }}
    </q-card-section>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import {
  getMeetingSoonMinutes,
  startMediaConversion,
} from 'src/helpers/media-conversion';
import { useMediaConversionStore } from 'stores/media-conversion';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const store = useMediaConversionStore();
const { pendingConfirmation } = storeToRefs(store);

const count = computed(() => pendingConfirmation.value?.length ?? 0);

// Read as the dialog opens: it's about when the conversion would start.
const meetingSoonMinutes = ref<null | number>(null);

const close = () => {
  pendingConfirmation.value = null;
};

const confirm = () => {
  const items = pendingConfirmation.value;
  close();
  if (items) startMediaConversion(items);
};

watch(pendingConfirmation, (items) => {
  if (items) meetingSoonMinutes.value = getMeetingSoonMinutes();
});
</script>
