<template>
  <q-dialog v-model="open" persistent>
    <div
      class="bg-secondary-contrast flex medium-overlay q-px-none"
      style="flex-flow: column"
    >
      <div class="text-h6 row q-px-md q-pt-lg q-pb-md">
        {{ t('custom-sections') }}
      </div>
      <div class="row q-px-md overflow-auto">
        {{ selectedDateObject?.customSections }}
        <q-btn
          color="primary"
          label="Add section"
          @click="
            if (selectedDateObject && !selectedDateObject?.customSections)
              selectedDateObject.customSections = [];
            selectedDateObject?.customSections?.push({
              alwaysShow: true,
              label: 'Custom section',
              type: 'custom',
              items: [],
              bgColor: '#003399',
              textColor: '#ffffff',
            });
          "
        />
      </div>
      <!-- <div class="row q-px-md"></div>
      <div class="row q-px-md q-pt-md"></div> -->
      <div class="row q-px-md q-py-md justify-end">
        <q-btn v-close-popup color="primary" flat :label="t('close')" />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentState = useCurrentStateStore();
const { selectedDateObject } = storeToRefs(currentState);

const open = defineModel<boolean>({ required: true });
</script>
