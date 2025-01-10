/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type { SettingsValues } from 'src/types';

import { defineStore } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { uuid } from 'src/utils/general';

import { useJwStore } from './jw';

interface Store {
  announcements: Partial<Record<string, string[]>>;
  congregations: Partial<Record<string, SettingsValues>>;
}

export const useCongregationSettingsStore = defineStore(
  'congregation-settings',
  {
    actions: {
      createCongregation() {
        const newId = uuid();
        this.congregations[newId] = Object.assign({}, defaultSettings);
        return newId;
      },
      deleteCongregation(id: number | string) {
        if (!id) return;

        delete this.congregations[id];

        const jwStore = useJwStore();
        delete jwStore.lookupPeriod[id];
      },
      dismissAnnouncement(congId: string, id: string) {
        if (!id || !congId) return;
        if (!this.announcements[congId]) {
          this.announcements[congId] = [];
        }
        if (!this.announcements[congId].includes(id)) {
          this.announcements[congId].push(id);
        }
      },
    },
    getters: {
      congregationCount: (state) => {
        return Object.keys(state.congregations)?.length;
      },
    },
    persist: true,
    state: (): Store => {
      return { announcements: {}, congregations: {} };
    },
  },
);
