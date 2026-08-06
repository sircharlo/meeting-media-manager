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
  quickStartTourSeen: Partial<Record<string, boolean>>;
}

/**
 * Runs every congregation's `obsPassword` through `transform` (encrypting on
 * save, decrypting on load), so the OBS websocket password is never written
 * to disk as plain text. Returns a new object; does not mutate `state`.
 * @param state The store state to transform
 * @param transform The function to apply to each non-empty obsPassword
 */
export const transformObsPasswords = (
  state: Store,
  transform: (value: string) => string,
): Store => ({
  ...state,
  congregations: Object.fromEntries(
    Object.entries(state.congregations).map(([id, congregation]) => [
      id,
      congregation?.obsPassword
        ? { ...congregation, obsPassword: transform(congregation.obsPassword) }
        : congregation,
    ]),
  ),
});

/**
 * Marks every congregation that already existed at hydrate time as having
 * seen the post-setup quick-start tour, without touching one created later
 * in the same session (so the tour still shows for genuinely new profiles)
 * or overwriting an entry that's already present either way. Mutates (and
 * returns, for convenience at the call site) the same quickStartTourSeen
 * map that was passed in.
 * @param congregations The store's congregations map at hydrate time
 * @param quickStartTourSeen The store's quickStartTourSeen map to backfill
 */
export const backfillQuickStartTourSeen = (
  congregations: Store['congregations'],
  quickStartTourSeen: Store['quickStartTourSeen'],
): Store['quickStartTourSeen'] => {
  Object.keys(congregations).forEach((congId) => {
    if (!(congId in quickStartTourSeen)) {
      quickStartTourSeen[congId] = true;
    }
  });
  return quickStartTourSeen;
};

/**
 * Values used instead of `defaultSettings` when backfilling a setting that's
 * missing from a pre-existing congregation (see
 * `updateCongregationsWithMissingSettings`) - for a setting introduced after
 * that congregation was created, backfilling the normal default can silently
 * change behavior a user never opted into. `createCongregation` isn't
 * affected: a genuinely new congregation still gets the real default from
 * `defaultSettings` for every key, including these.
 */
export const missingSettingsBackfillOverrides: Partial<SettingsValues> = {
  // Existing installs already relied on the whole row being draggable, with
  // no handle at all - keep that exact behavior instead of introducing new
  // UI chrome unasked for. New congregations get the real default (true).
  showMediaDragHandle: false,
};

export const deserializeCongregationSettings = (data: string): Store =>
  transformObsPasswords(JSON.parse(data) as Store, (value) =>
    globalThis.electronApi.decryptSecretSync(value),
  );

export const serializeCongregationSettings = (state: Store): string =>
  JSON.stringify(
    transformObsPasswords(state, (value) =>
      globalThis.electronApi.encryptSecretSync(value),
    ),
  );

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
      markQuickStartTourSeen(congId: string) {
        if (!congId) return;
        this.quickStartTourSeen[congId] = true;
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
                ...missingSettingsBackfillOverrides,
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
    persist: {
      // Upgrades any legacy plain-text obsPassword to encrypted form, and
      // marks every congregation that already existed on disk at load time
      // as having seen the post-setup quick-start tour - otherwise every
      // profile that predates that feature would show it on next launch,
      // spamming users who've long since found the footer buttons on their
      // own. A congregation created later in the same session (via
      // createCongregation()) isn't touched by this, so the tour still
      // shows for genuinely new profiles going forward.
      afterHydrate: (ctx) => {
        backfillQuickStartTourSeen(
          ctx.store.congregations,
          ctx.store.quickStartTourSeen,
        );
        ctx.store.$persist();
      },
      serializer: {
        deserialize: deserializeCongregationSettings,
        serialize: (state) =>
          serializeCongregationSettings(state as unknown as Store),
      },
    },
    state: (): Store => {
      return { announcements: {}, congregations: {}, quickStartTourSeen: {} };
    },
  },
);
