<template>
  <BaseDialog v-model="dialogValue" :dialog-id="dialogId" persistent>
    <q-card class="q-pa-md" style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">{{ t('add-divider') }}</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="dividerTitle"
          dense
          :label="t('optional-title')"
          outlined
          @keyup.enter="handleAdd"
          @keyup.esc="handleCancel"
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
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  dialogId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  ok: [title: string];
  'update:modelValue': [value: boolean];
}>();

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const dividerTitle = ref('');

const handleAdd = () => {
  const title = dividerTitle.value.trim();
  dividerTitle.value = '';
  emit('ok', title);
  dialogValue.value = false;
};

const handleCancel = () => {
  dividerTitle.value = '';
  dialogValue.value = false;
};
</script>
