import { settingsDefinitions } from 'src/constants/settings';
import en from 'src/i18n/en.json';
import { describe, expect, it } from 'vitest';

// SettingsPage renders every non-hidden setting with t(settingId) and
// t(`${settingId}-explain`). A missing key shows the raw identifier instead
// (obsEnableRecordingControls did, in every language, for almost a year).
describe('settings i18n', () => {
  const keys = new Set(Object.keys(en));
  const visibleSettings = Object.entries(settingsDefinitions)
    .filter(([, definition]) => !definition.hidden)
    .map(([settingId]) => settingId);

  it.each(visibleSettings)('%s has an English label and explanation', (id) => {
    expect(keys.has(id), `missing "${id}" in en.json`).toBe(true);
    expect(keys.has(`${id}-explain`), `missing "${id}-explain"`).toBe(true);
  });
});
