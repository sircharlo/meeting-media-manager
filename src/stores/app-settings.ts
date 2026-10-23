import type { ScreenPreferences, ZoomLayoutPreferences } from 'src/types';

import { defineStore } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { MIGRATION_REGISTRY } from 'src/migrations';
import { DEFAULT_ZOOM_LAYOUT } from 'src/shared/zoom-layout';

interface Store {
  displayCameraId: null | string;
  migrations: string[];
  screenPreferences: ScreenPreferences;
  timerPreferences: ScreenPreferences;
  yeartextPreviewDismissed: Record<number, boolean>;
  /** How the Zoom Meeting Manager arranges M³ and Zoom on this computer's screens. */
  zoomLayout: ZoomLayoutPreferences;
}

export const useAppSettingsStore = defineStore('app-settings', {
  actions: {
    async ensureMigrations() {
      const executedMigrations: string[] = [];
      for (const migration of Object.keys(MIGRATION_REGISTRY)) {
        if (!this.migrations.includes(migration)) {
          const success = await this.runMigration(migration); // NOSONAR: sequential - migrations run in registry order
          if (success) {
            executedMigrations.push(migration);
          }
        }
      }
      return executedMigrations;
    },

    async runMigration(type: string) {
      const migrationFn = MIGRATION_REGISTRY[type];
      if (!migrationFn) {
        errorCatcher(new Error(`Unknown migration type: ${type}`), {
          contexts: {
            fn: {
              name: 'runMigration',
            },
          },
        });
        return false;
      }

      try {
        const success = await migrationFn(this);
        if (success !== false) {
          this.migrations.push(type);
          return true;
        }
        return false;
      } catch (error) {
        errorCatcher(error);
        return false;
      }
    },
  },
  getters: {},
  persist: true,
  state: (): Store => ({
    displayCameraId: null,
    migrations: [],
    screenPreferences: { preferredScreenNumber: 0, preferWindowed: false },
    timerPreferences: { preferredScreenNumber: 0, preferWindowed: true },
    yeartextPreviewDismissed: {},
    zoomLayout: { ...DEFAULT_ZOOM_LAYOUT },
  }),
});
