import { defineStore, storeToRefs } from 'pinia';
import { formatDate } from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, reactive } from 'vue';

interface ScopeState {
  checkedItemIds: Record<string, boolean>;
  dismissedAfterPanel: boolean;
  dismissedBeforePanel: boolean;
  lastSongEndedAt: null | number;
}

const createScopeState = (): ScopeState => ({
  checkedItemIds: {},
  dismissedAfterPanel: false,
  dismissedBeforePanel: false,
  lastSongEndedAt: null,
});

export const useMeetingQuickActionsStore = defineStore(
  'meeting-quick-actions',
  () => {
    const currentState = useCurrentStateStore();
    const { currentCongregation, selectedDate, selectedDateObject } =
      storeToRefs(currentState);
    const scopes = reactive<Record<string, ScopeState>>({});

    const getScopeKey = (congregationId?: string, date?: Date | string) => {
      const congregation = congregationId ?? currentCongregation.value;
      const selectedDateValue =
        date ?? selectedDate.value ?? selectedDateObject.value?.date;
      if (!congregation || !selectedDateValue) return '';
      return `${congregation}:${formatDate(selectedDateValue, 'YYYY/MM/DD')}`;
    };

    const getScope = (congregationId?: string, date?: Date | string) => {
      const key = getScopeKey(congregationId, date);
      if (!key) return null;
      scopes[key] ??= createScopeState();
      return scopes[key];
    };

    // Cached for the common case (no explicit congregation/date) so every
    // getter/action call - including the several per-item template
    // bindings in MeetingQuickActionsChecklist.vue - doesn't redundantly
    // re-run getScopeKey()'s formatDate call on every access; only
    // recomputes when the congregation or selected date actually changes.
    const currentScope = computed(() => getScope());

    const checkedItemIds = computed(
      () => currentScope.value?.checkedItemIds ?? {},
    );
    const dismissedAfterPanel = computed(
      () => currentScope.value?.dismissedAfterPanel ?? false,
    );
    const dismissedBeforePanel = computed(
      () => currentScope.value?.dismissedBeforePanel ?? false,
    );
    const lastSongEndedAt = computed(
      () => currentScope.value?.lastSongEndedAt ?? null,
    );

    const isItemChecked = (itemId: string) =>
      !!currentScope.value?.checkedItemIds[itemId];

    const setItemChecked = (itemId: string, checked: boolean) => {
      const scope = currentScope.value;
      if (!scope || !itemId) return;
      scope.checkedItemIds[itemId] = checked;
    };

    const toggleItemChecked = (itemId: string) => {
      setItemChecked(itemId, !isItemChecked(itemId));
    };

    const dismissAfter = () => {
      const scope = currentScope.value;
      if (scope) scope.dismissedAfterPanel = true;
    };

    const dismissBefore = () => {
      const scope = currentScope.value;
      if (scope) scope.dismissedBeforePanel = true;
    };

    const resetCurrentScope = () => {
      const scope = currentScope.value;
      if (scope) Object.assign(scope, createScopeState());
    };

    const recordLastSongEnded = (endedAt = Date.now()) => {
      // Always scoped to today, not whatever date is currently browsed in
      // the calendar - this event fires off the actual media player state,
      // so if the operator navigates away from today while the last song
      // is still finishing, it must still land in today's scope rather
      // than wherever the calendar happens to be pointed at that instant.
      const scope = getScope(undefined, new Date());
      if (scope) scope.lastSongEndedAt = endedAt;
    };

    return {
      checkedItemIds,
      dismissAfter,
      dismissBefore,
      dismissedAfterPanel,
      dismissedBeforePanel,
      isItemChecked,
      lastSongEndedAt,
      recordLastSongEnded,
      resetCurrentScope,
      setItemChecked,
      toggleItemChecked,
    };
  },
);
