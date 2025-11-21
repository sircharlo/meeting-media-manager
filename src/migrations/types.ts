import type { useAppSettingsStore } from 'stores/app-settings';

export type MigrationFunction = (
  store: ReturnType<typeof useAppSettingsStore>,
) => Promise<boolean | undefined>;
