<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <q-card class="round-card" style="min-width: 300px">
      <q-card-section
        class="row items-center no-wrap text-bigger text-semibold text-primary"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon name="mmm-minus" size="xs" />
        </div>
        {{ t('add-divider') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          ref="dividerTitleInput"
          v-model="dividerTitle"
          class="bg-accent-100"
          dense
          :label="t('optional-title')"
          outlined
          @keyup.enter="handleAdd"
          @keyup.esc="handleCancel"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 q-mb-sm">{{ t('position') }}:</div>
        <q-btn-toggle
          v-model="addToTop"
          class="full-width"
          :options="[
            { label: t('top'), value: true },
            { label: t('bottom'), value: false },
          ]"
          spread
          toggle-color="primary"
          unelevated
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" @click="handleCancel" />
        <q-btn color="primary" :label="t('add')" @click="handleAdd" />
      </q-card-actions>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { log } from 'src/shared/vanilla';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  ok: [title?: string, addToTop?: boolean];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const dividerTitle = ref('');
const addToTop = ref(true);
const dividerTitleInput = ref<HTMLElement>();

const handleAdd = () => {
  const title = dividerTitle.value.trim();
  dividerTitle.value = '';
  emit('ok', title, addToTop.value);
  dialogValue.value = false;
};

const handleCancel = () => {
  dividerTitle.value = '';
  dialogValue.value = false;
};

// Focus the input when dialog opens
whenever(dialogValue, () => {
  if (dialogValue.value) {
    setTimeout(() => {
      log('🔍 Focusing input', 'dividers', 'log', dividerTitleInput.value);
      dividerTitleInput.value?.focus();
    }, 100);
  }
});
</script>
