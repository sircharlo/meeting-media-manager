<template>
  <q-btn
    color="primary"
    hide-bottom-space
    icon="mmm-folder-multiple-image"
    :no-caps="!!model"
    outline
    style="max-width: 240px"
    @click="showFolderPicker"
    ><div class="ellipsis q-ml-sm">
      {{ displayFolderName || t('choose-a-folder') }}
    </div>
    <q-tooltip v-if="!!model" :delay="1000">{{ model }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { errorCatcher } from 'src/helpers/error-catcher';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { openFolderDialog, path } = window.electronApi;

const displayFolderName = computed(() => {
  return model.value ? path.basename(model.value) : '';
});

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
      model.value = result.filePaths[0]!;
    }
  } catch (error) {
    errorCatcher(error);
    model.value = null;
  }
};
</script>
