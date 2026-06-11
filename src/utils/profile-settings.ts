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

const isProfileFilenameCharacter = (character: string) => {
  const codePoint = character.codePointAt(0);
  return (
    character === '-' ||
    character === '_' ||
    (codePoint !== undefined && codePoint >= 48 && codePoint <= 57) ||
    (codePoint !== undefined && codePoint >= 97 && codePoint <= 122)
  );
};

const sanitizeFilename = (value: null | string | undefined = 'profile') => {
  if (!value) return 'profile';

  const sanitizedCharacters: string[] = [];
  let pendingSeparator = false;

  for (const inputCharacter of value) {
    const character = inputCharacter.toLowerCase();

    if (isProfileFilenameCharacter(character)) {
      if (character === '-' && sanitizedCharacters.length === 0) continue;
      if (pendingSeparator && sanitizedCharacters.length > 0) {
        sanitizedCharacters.push('-');
      }
      sanitizedCharacters.push(character);
      pendingSeparator = false;
      continue;
    }

    pendingSeparator = sanitizedCharacters.length > 0;
  }

  let end = sanitizedCharacters.length;
  while (end > 0 && sanitizedCharacters[end - 1] === '-') end--;

  return sanitizedCharacters.slice(0, end).join('') || 'profile';
};

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
