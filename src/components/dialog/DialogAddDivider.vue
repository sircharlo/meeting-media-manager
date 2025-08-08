<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <q-card class="q-pa-md" style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">{{ t('add-divider') }}</div>
      </q-card-section>

      <q-card-section>
        <q-input
          ref="dividerTitleInput"
          v-model="dividerTitle"
          dense
          :label="t('optional-title')"
          outlined
          @keyup.enter="handleAdd"
          @keyup.esc="handleCancel"
        />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">{{ t('position') }}:</div>
        <q-btn-group spread>
          <q-btn
            :color="addToTop ? 'primary' : 'grey'"
            :label="t('top')"
            @click="addToTop = true"
          />
          <q-btn
            :color="!addToTop ? 'primary' : 'grey'"
            :label="t('bottom')"
            @click="addToTop = false"
          />
        </q-btn-group>
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

// Focus the input when dialog opens
whenever(dialogValue, () => {
  if (dialogValue.value) {
    setTimeout(() => {
      console.log('🔍 Focusing input', dividerTitleInput.value);
      dividerTitleInput.value?.focus();
    }, 100);
  }
});

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
</script>
