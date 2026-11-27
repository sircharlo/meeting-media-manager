import { defineStore } from 'pinia';
import { log } from 'src/shared/vanilla';
import { computed, ref } from 'vue';

export interface DialogState {
  component: string;
  id: string;
  isOpen: boolean;
  props?: Record<string, unknown>;
  /**
   * It covers the whole window (a maximized BaseDialog, e.g. today's song
   * check): notifications wait for it (see the attention store).
   */
  takeover?: boolean;
}

export const useDialogStateStore = defineStore('dialogState', () => {
  const openDialogs = ref<Map<string, DialogState>>(new Map());

  const isAnyDialogOpen = computed(() => openDialogs.value.size > 0);

  const openDialogCount = computed(() => openDialogs.value.size);

  const isTakeoverOpen = computed(() =>
    [...openDialogs.value.values()].some((dialog) => dialog.takeover),
  );

  const openDialog = (
    id: string,
    component: string,
    props?: Record<string, unknown>,
    { takeover = false } = {},
  ) => {
    log(
      '🔄 [openDialog] Opening dialog:',
      'dialog',
      'log',
      id,
      component,
      props,
    );
    openDialogs.value.set(id, {
      component,
      id,
      isOpen: true,
      props: props || {},
      takeover,
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
    isTakeoverOpen,
    openDialog,
    openDialogCount,
    openDialogs,
  };
});
