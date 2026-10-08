<template>
  <BaseDialog v-model="model" :dialog-id="dialogId" :persistent="persistent">
    <q-card class="modal-confirm round-card" :class="cardClass">
      <q-card-section
        class="row items-center no-wrap text-bigger text-semibold q-pb-none"
        :class="'text-' + iconColor"
      >
        <div class="icon-chip q-mr-sm">
          <q-icon :name="icon" size="xs" />
        </div>
        {{ title }}
      </q-card-section>
      <q-card-section v-if="message" class="row items-center">
        {{ message }}
      </q-card-section>
      <slot />
      <q-card-actions align="right" class="text-primary">
        <q-btn
          flat
          :label="cancelLabel ?? t('cancel')"
          @click="emit('cancel')"
        />
        <q-btn
          :color="confirmColor ?? iconColor"
          flat
          :label="confirmLabel ?? t('confirm')"
          :loading="loading"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from 'components/dialog/BaseDialog.vue';
import { useI18n } from 'vue-i18n';

interface Props {
  cancelLabel?: string;
  cardClass?: string;
  confirmColor?: string;
  confirmLabel?: string;
  dialogId: string;
  icon: string;
  iconColor?: string;
  loading?: boolean;
  message?: string;
  persistent?: boolean;
  title: string;
}

withDefaults(defineProps<Props>(), {
  cancelLabel: undefined,
  cardClass: undefined,
  confirmColor: undefined,
  confirmLabel: undefined,
  iconColor: 'negative',
  message: undefined,
});

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const model = defineModel<boolean>({ required: true });

const { t } = useI18n();
</script>
