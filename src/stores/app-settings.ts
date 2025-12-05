import type {
  ScreenPreferences,
  TimerPreferences,
} from 'src/types';

import { defineStore } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { MIGRATION_REGISTRY } from 'src/migrations';

interface Store {
  displayCameraId: null | string;
  migrations: string[];
  screenPreferences: ScreenPreferences;
  timerPreferences: TimerPreferences;
  yeartextPreviewDismissed: Record<number, boolean>;
}

export const useAppSettingsStore = defineStore('app-settings', {
  actions: {
    async ensureMigrations() {
      const executedMigrations: string[] = [];
      for (const migration of Object.keys(MIGRATION_REGISTRY)) {
        if (!this.migrations.includes(migration)) {
          const success = await this.runMigration(migration);
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
        console.warn(`🔍 [migration] Unknown migration type: ${type}`);
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
  }),
});
