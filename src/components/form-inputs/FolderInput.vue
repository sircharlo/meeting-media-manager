<template>
  <q-btn
    :label="model || t('choose-a-folder')"
    :no-caps="!!model"
    color="primary"
    hide-bottom-space
    icon="mmm-folder-multiple-image"
    outline
    style="max-width: 240px"
    @click="showFolderPicker"
  />
</template>

<script setup lang="ts">
import { errorCatcher } from 'src/helpers/error-catcher';
import { useI18n } from 'vue-i18n';

const { openFolderDialog } = window.electronApi;

const { t } = useI18n();
const model = defineModel<null | string>({ required: true });

const showFolderPicker = async () => {
  try {
    const result = await openFolderDialog().catch((error) => {
      errorCatcher(error);
    });
    if (!result || !result.filePaths || result.canceled) {
      model.value = null;
    } else if (result.filePaths.length > 0) {
      model.value = result.filePaths[0];
    }
  } catch (error) {
    errorCatcher(error);
    model.value = null;
  }
};
</script>
