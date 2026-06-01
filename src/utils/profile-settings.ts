import type { SettingsValues } from 'src/types';

import { defaultSettings } from 'src/constants/settings';

const PROFILE_SETTINGS_EXPORT_VERSION = 1;

interface ProfileSettingsExport {
  app: 'Meeting Media Manager';
  exportedAt: string;
  profileSettingsExportVersion: typeof PROFILE_SETTINGS_EXPORT_VERSION;
  settings: Partial<SettingsValues>;
}

const settingsKeys = Object.keys(defaultSettings) as (keyof SettingsValues)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeFilename = (value: null | string | undefined) =>
  (value || 'profile')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'profile';

export const normalizeProfileSettings = (value: unknown): SettingsValues => {
  const candidate =
    isRecord(value) && isRecord(value.settings) ? value.settings : value;

  if (!isRecord(candidate)) {
    throw new Error('Selected file does not contain profile settings.');
  }

  const importedSettings: Partial<SettingsValues> = {};

  for (const key of settingsKeys) {
    if (key in candidate) {
      importedSettings[key] = candidate[key] as never;
    }
  }

  if (Object.keys(importedSettings).length === 0) {
    throw new Error(
      'Selected file does not contain any recognized profile settings.',
    );
  }

  return {
    ...defaultSettings,
    ...importedSettings,
  };
};

export const exportProfileSettingsToFile = async (
  settings: SettingsValues,
): Promise<boolean> => {
  const exportData: ProfileSettingsExport = {
    app: 'Meeting Media Manager',
    exportedAt: new Date().toISOString(),
    profileSettingsExportVersion: PROFILE_SETTINGS_EXPORT_VERSION,
    settings: normalizeProfileSettings(settings),
  };
  const filename = `${sanitizeFilename(settings.congregationName)}-profile-settings.json`;
  const result = await globalThis.electronApi.saveFileDialog(filename, 'json');

  if (result?.canceled || !result?.filePath) return false;

  const filePath = result.filePath.toLowerCase().endsWith('.json')
    ? result.filePath
    : `${result.filePath}.json`;

  await globalThis.electronApi.fs.writeFile(
    filePath,
    JSON.stringify(exportData, null, 2),
    'utf-8',
  );

  return true;
};

export const importProfileSettingsFromFile =
  async (): Promise<null | SettingsValues> => {
    const result = await globalThis.electronApi.openFileDialog(true, 'json');
    const filePath = result?.filePaths[0];

    if (result?.canceled || !filePath) return null;

    const content = await globalThis.electronApi.fs.readFile(filePath, 'utf-8');
    return normalizeProfileSettings(JSON.parse(content) as unknown);
  };
