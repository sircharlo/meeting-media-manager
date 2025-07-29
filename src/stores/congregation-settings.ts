/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type { SettingsValues } from 'src/types';

import { defineStore } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { wasUpdateInstalled } from 'src/utils/fs';
import { uuid } from 'src/utils/general';

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
        wasUpdateInstalled(newId, true);
        this.congregations[newId] = Object.assign({}, defaultSettings);
        return newId;
      },
      deleteCongregation(id: number | string) {
        if (!id) return;

        delete this.congregations[id];
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
      updateCongregationsWithMissingSettings() {
        let updatedCount = 0;
        const updates: {
          after: Partial<Record<string, unknown>>;
          before: Partial<Record<string, unknown>>;
          congregationId: string;
          updatedKeys: (keyof SettingsValues)[];
        }[] = [];

        try {
          const congregationIds = Object.keys(this.congregations);

          if (congregationIds.length === 0) {
            console.log('No congregations found to update');
            return { updatedCount, updates };
          }

          congregationIds.forEach((congId) => {
            try {
              const congregation = this.congregations[congId];

              if (!congregation) {
                console.warn(`Congregation ${congId} not found, skipping`);
                return;
              }

              const updatedCongregation = Object.assign(
                {},
                defaultSettings,
                congregation,
              );

              // Find which keys were missing and thus updated
              const updatedKeys = Object.keys(defaultSettings).filter(
                (key) => !(key in congregation),
              ) as (keyof SettingsValues)[];

              if (updatedKeys.length > 0) {
                this.congregations[congId] = updatedCongregation;
                updatedCount++;

                const before: Partial<Record<string, unknown>> = {};
                const after: Partial<Record<string, unknown>> = {};

                updatedKeys.forEach((key) => {
                  before[key] = undefined;
                  after[key] = updatedCongregation[key];
                });

                updates.push({
                  after,
                  before,
                  congregationId: congId,
                  updatedKeys,
                });

                console.log(
                  `Updated congregation ${congId} with missing settings`,
                  'Before:',
                  before,
                  'After:',
                  after,
                );
              }
            } catch (error) {
              console.error(`Error updating congregation ${congId}:`, error);
            }
          });

          if (updatedCount > 0) {
            console.log(
              `Successfully updated ${updatedCount} congregations with missing settings`,
            );
          }
        } catch (error) {
          console.error(
            'Error updating congregations with missing settings:',
            error,
          );
        }

        return { updatedCount, updates };
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
