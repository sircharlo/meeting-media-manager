import { storeToRefs } from 'pinia';
import { useDialogStateStore } from 'stores/dialog-state';
import { computed } from 'vue';

/**
 * Composable for accessing dialog state from anywhere in the app
 * Provides reactive access to dialog state information
 */
export function useDialogState() {
  const dialogStore = useDialogStateStore();

  // Use storeToRefs to maintain reactivity
  const { isAnyDialogOpen, openDialogCount, openDialogs } =
    storeToRefs(dialogStore);

  // Computed properties for easy access
  const hasOpenDialogs = computed(() => isAnyDialogOpen.value);
  const dialogCount = computed(() => openDialogCount.value);
  const openDialogList = computed(() => Array.from(openDialogs.value.values()));

  // Methods
  const closeAllDialogs = () => {
    dialogStore.closeAllDialogs();
  };

  const isDialogOpen = (dialogId: string) => {
    return dialogStore.isDialogOpen(dialogId);
  };

  const getDialogState = (dialogId: string) => {
    return dialogStore.getDialogState(dialogId);
  };

  return {
    // Methods
    closeAllDialogs,
    // Direct store access for advanced usage
    dialogStore,
    getDialogState,

    // Reactive state
    isAnyDialogOpen: hasOpenDialogs,
    isDialogOpen,
    openDialogCount: dialogCount,

    openDialogs: openDialogList,
  };
}
