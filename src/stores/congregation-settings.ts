/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type { SettingsValues } from 'src/types';

import { defineStore } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log, uuid } from 'src/shared/vanilla';
import { wasUpdateInstalled } from 'src/utils/fs';

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
        this.congregations[newId] = { ...defaultSettings };
        return newId;
      },
      deleteCongregation(id: number | string) {
        if (!id) return;

        delete this.congregations[id];
      },
      dismissAnnouncement(congId: string, id: string) {
        if (!id || !congId) return;
        this.announcements[congId] ??= [];
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
            log('🏢 No congregations found to update', 'congregation', 'info');
            return { updatedCount, updates };
          }

          congregationIds.forEach((congId) => {
            log(`🏢 Processing Congregation ${congId}`, 'congregation', 'info');
            try {
              const congregation = this.congregations[congId];

              if (!congregation) {
                log(
                  `Congregation ${congId} not found, skipping`,
                  'congregation',
                  'warn',
                );
                return;
              }

              const updatedCongregation = {
                ...defaultSettings,
                ...congregation,
              };

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

                log(
                  `🏢 Updated congregation ${congId} with missing settings; Before: ${JSON.stringify(before)}, After: ${JSON.stringify(after)}`,
                  'congregation',
                  'info',
                );
              }
            } catch (error) {
              log(
                `❌ Error updating congregation ${congId}: ${error}`,
                'congregation',
                'error',
              );
            }
          });

          if (updatedCount > 0) {
            log(
              `✅ Successfully updated ${updatedCount} congregation${updatedCount > 1 ? 's' : ''} with missing settings`,
              'congregation',
              'info',
            );
          }
        } catch (error) {
          errorCatcher(error, {
            contexts: {
              fn: {
                name: 'updateCongregationsWithMissingSettings',
                store: 'congregation-settings',
              },
            },
          });
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
