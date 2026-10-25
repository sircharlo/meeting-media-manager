<template>
  <ConfirmDialog
    v-model="open"
    :confirm-label="t('quick-actions-play-music')"
    dialog-id="quick-actions-start-music-confirm"
    icon="mmm-music-note"
    icon-color="primary"
    :message="t('quick-actions-start-music-confirm-message')"
    persistent
    :title="t('quick-actions-start-music-confirm-title')"
    @cancel="cancelPendingMusicStart"
    @confirm="confirmPendingMusicStart"
  />
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { storeToRefs } from 'pinia';
import { useMusicStore } from 'stores/music';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// One confirmation for every way of starting background music during the
// meeting (buttons, the shortcut, notifications) - see requestMusicStart.
const { t } = useI18n();

const music = useMusicStore();
const { pendingMusicStart } = storeToRefs(music);
const { cancelPendingMusicStart, confirmPendingMusicStart } = music;

const open = computed({
  get: () => pendingMusicStart.value !== null,
  set: (value) => {
    if (!value) cancelPendingMusicStart();
  },
});
</script>
