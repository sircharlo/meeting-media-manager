<template>
  <q-input
    class="bg-accent-100 cursor-pointer"
    dense
    hide-bottom-space
    :label="displayFolderName || t('browse')"
    :model-value="null"
    outlined
    readonly
    style="max-width: 240px"
    @click="showFolderPicker"
    @keyup.enter="showFolderPicker"
  >
    <template #prepend>
      <q-icon name="mmm-folder-multiple-image" />
    </template>
    <template #append>
      <q-btn
        v-if="model"
        :aria-label="t('clear')"
        dense
        flat
        icon="mmm-clear"
        round
        size="sm"
        @click.stop.prevent="clearFolder"
      >
        <q-tooltip :delay="1000">{{ t('clear') }}</q-tooltip>
      </q-btn>
    </template>
    <q-tooltip v-if="!!model" :delay="1000">{{ model }}</q-tooltip>
  </q-input>
</template>

<script setup lang="ts">
import { errorCatcher } from 'src/helpers/error-catcher';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { basename } = globalThis.electronApi;

const displayFolderName = computed(() => {
  return model.value ? basename(model.value) : '';
});

const { t } = useI18n();
const model = defineModel<null | string>({ required: true });

const showFolderPicker = async () => {
  try {
    const result = await globalThis.electronApi
      .openFolderDialog()
      .catch((error) => {
        errorCatcher(error);
      });
    // Canceling the native picker (or it failing to return anything) should
    // leave an already-configured folder untouched - clearing it is now an
    // explicit, separate action (the "clear" icon below) rather than a
    // side effect of backing out of the picker.
    if (result && !result.canceled && result.filePaths.length > 0) {
      model.value = result.filePaths[0] ?? null;
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const clearFolder = () => {
  model.value = null;
};
</script>
