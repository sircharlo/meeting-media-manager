<template>
  <q-dialog v-model="open" persistent>
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
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  add: [title: string];
  'update:modelValue': [value: boolean];
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const dividerTitle = ref('');

const handleAdd = () => {
  emit('add', dividerTitle.value.trim());
  dividerTitle.value = '';
  open.value = false;
};

const handleCancel = () => {
  dividerTitle.value = '';
  open.value = false;
};
</script>
