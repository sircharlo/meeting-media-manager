import type { OldAppConfig } from 'src/types';

import { defaultSettings } from 'src/constants/settings';
import { describe, expect, it } from 'vitest';

import { buildNewPrefsObject } from '../migrations';

// FE-14 (full-audit-2026-09-05.md): buildNewPrefsObject only ever set the
// ~57 fields the old pre-M³ app had a concept of, and the result was
// written straight into the congregations map with no defaultSettings
// backfill - every setting M³ has added since (Meeting Quick Actions among
// them) stayed undefined for that congregation's entire first session,
// crashing the moment a component (e.g. SettingsMeetingChecklists.vue's
// addCategory/addItem) tried to .push() onto one of the missing arrays.
describe('buildNewPrefsObject', () => {
  it('backfills every current setting, not just the ones the old app knew about', () => {
    const oldPrefs = {
      app: { congregationName: 'Test Congregation' },
      media: { lang: 'E' },
      meeting: { mwDay: 2 },
    } as OldAppConfig;

    const result = buildNewPrefsObject(oldPrefs);

    for (const key of Object.keys(defaultSettings)) {
      expect(result).toHaveProperty(key);
      expect(result[key as keyof typeof result]).not.toBeUndefined();
    }
  });

  it('keeps the old app values that were actually migrated', () => {
    const oldPrefs = {
      app: { congregationName: 'Test Congregation' },
      media: { lang: 'E' },
      meeting: { mwDay: 2 },
    } as OldAppConfig;

    const result = buildNewPrefsObject(oldPrefs);

    expect(result.congregationName).toBe('Test Congregation');
    expect(result.lang).toBe('E');
    expect(result.mwDay).toBe('2');
  });

  it('gives each migrated congregation its own independent Meeting Quick Actions arrays', () => {
    const first = buildNewPrefsObject({} as OldAppConfig);
    const second = buildNewPrefsObject({} as OldAppConfig);

    first.meetingQuickActionsCategoriesBefore.push({
      enabled: true,
      id: 'test',
      isDefault: false,
      label: 'Test',
    });

    expect(second.meetingQuickActionsCategoriesBefore).toHaveLength(
      defaultSettings.meetingQuickActionsCategoriesBefore.length,
    );
    expect(defaultSettings.meetingQuickActionsCategoriesBefore).toHaveLength(
      defaultSettings.meetingQuickActionsCategoriesBefore.length,
    );
  });
});
