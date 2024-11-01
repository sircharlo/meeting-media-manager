import type { SettingsValues } from 'src/types';

import { defineStore } from 'pinia';
import { uid } from 'quasar';
import { defaultSettings } from 'src/constants/settings';

interface Store {
  congregations: Record<string, SettingsValues>;
}

export const useCongregationSettingsStore = defineStore(
  'congregation-settings',
  {
    actions: {
      createCongregation() {
        const newId = uid();
        this.congregations[newId] = Object.assign({}, defaultSettings);
        return newId;
      },
      deleteCongregation(id: number | string) {
        if (!id) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.congregations[id];
      },
    },
    getters: {
      congregationCount: (state) => {
        return Object.keys(state.congregations)?.length;
      },
    },
    persist: true,
    state: (): Store => {
      return { congregations: {} };
    },
  },
);
