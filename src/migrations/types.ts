import type { useAppSettingsStore } from 'stores/app-settings';

export type MigrationFunction = (
  store: ReturnType<typeof useAppSettingsStore>,
) => boolean | Promise<boolean | undefined> | undefined;
