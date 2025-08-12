import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface DialogState {
  component: string;
  id: string;
  isOpen: boolean;
  props?: Record<string, unknown>;
}

export const useDialogStateStore = defineStore('dialogState', () => {
  const openDialogs = ref<Map<string, DialogState>>(new Map());

  const isAnyDialogOpen = computed(() => openDialogs.value.size > 0);

  const openDialogCount = computed(() => openDialogs.value.size);

  const openDialog = (
    id: string,
    component: string,
    props?: Record<string, unknown>,
  ) => {
    console.log('🔄 [openDialog] Opening dialog:', id, component, props);
    openDialogs.value.set(id, {
      component,
      id,
      isOpen: true,
      props: props || {},
    });
  };

  const closeDialog = (id: string) => {
    openDialogs.value.delete(id);
  };

  const isDialogOpen = (id: string) => {
    return openDialogs.value.has(id);
  };

  const getDialogState = (id: string) => {
    return openDialogs.value.get(id);
  };

  const closeAllDialogs = () => {
    openDialogs.value.clear();
  };

  return {
    closeAllDialogs,
    closeDialog,
    getDialogState,
    isAnyDialogOpen,
    isDialogOpen,
    openDialog,
    openDialogCount,
    openDialogs,
  };
});
