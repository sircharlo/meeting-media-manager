<template>
  <q-dialog
    v-model="isOpen"
    :auto-close="autoClose"
    :full-height="fullHeight"
    :full-width="fullWidth"
    :maximized="maximized"
    :no-backdrop-dismiss="noBackdropDismiss"
    :no-esc-dismiss="noEscDismiss"
    :persistent="persistent"
    :seamless="seamless"
    :transition-hide="transitionHide"
    :transition-show="transitionShow"
    @before-hide="handleBeforeHide"
    @before-show="handleBeforeShow"
    @hide="handleHide"
    @show="handleShow"
  >
    <slot />
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogStateStore } from 'stores/dialog-state';
import { computed, watch } from 'vue';

interface Props {
  autoClose?: boolean;
  dialogId: string;
  fullHeight?: boolean;
  fullWidth?: boolean;
  maximized?: boolean;
  modelValue: boolean;
  noBackdropDismiss?: boolean;
  noEscDismiss?: boolean;
  persistent?: boolean;
  seamless?: boolean;
  transitionHide?: string;
  transitionShow?: string;
}

const props = withDefaults(defineProps<Props>(), {
  transitionHide: 'scale',
  transitionShow: 'scale',
});

const emit = defineEmits<{
  'before-hide': [];
  'before-show': [];
  hide: [];
  show: [];
  'update:modelValue': [value: boolean];
}>();

const dialogStore = useDialogStateStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

// Watch for changes in the dialog state and update the store
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      dialogStore.openDialog(props.dialogId, 'BaseDialog');
    } else {
      dialogStore.closeDialog(props.dialogId);
    }
  },
  { immediate: true },
);

// Clean up when component is unmounted
const handleBeforeShow = () => {
  emit('before-show');
};

const handleShow = () => {
  emit('show');
};

const handleBeforeHide = () => {
  emit('before-hide');
};

const handleHide = () => {
  dialogStore.closeDialog(props.dialogId);
  emit('hide');
};
</script>
