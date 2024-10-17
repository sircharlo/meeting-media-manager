import type { SettingsValues } from 'src/types';

import { defineStore } from 'pinia';
import { extend, LocalStorage, uid } from 'quasar';
import { defaultSettings } from 'src/defaults/settings';

export const useCongregationSettingsStore = defineStore(
  'congregation-settings',
  {
    actions: {
      createCongregation() {
        const newId = uid();
        this.congregations[newId] = extend(true, {}, defaultSettings);
        return newId;
      },
      deleteCongregation(id: number | string) {
        if (!id) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.congregations[id];
      },
    },
    getters: {
      congregationCount(state) {
        return Object.keys(state.congregations)?.length;
      },
    },

    state: () => {
      return {
        congregations: (LocalStorage.getItem('congregations') || {}) as Record<
          string,
          SettingsValues
        >,
      };
    },
  },
);
