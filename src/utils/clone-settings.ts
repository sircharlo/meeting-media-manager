import type { SettingsValues } from 'src/types';

/**
 * Deep-clones the meeting-quick-actions checklist/category array fields on
 * a SettingsValues object. Any caller that builds a congregation's settings
 * from `{ ...defaultSettings, ... }` (or omits these fields entirely, e.g.
 * an older profile-settings export) must run the result through this - a
 * plain object spread only copies the array *references*, and
 * SettingsMeetingChecklists.vue mutates these arrays in place
 * (push/splice/reorder), so without cloning, editing one congregation's
 * checklist would corrupt the shared `defaultSettings` module singleton
 * (and every other congregation that still points at the same arrays) for
 * the rest of the running process.
 *
 * Deliberately has no non-type imports (not even from other `src/utils`
 * modules) - it's called from settings/migration code paths that must stay
 * safe to import from anywhere without pulling in unrelated dependency
 * chains (see the module-init-order failure this caused when the same
 * logic briefly lived in src/utils/settings.ts, which transitively imports
 * the sqlite/jw-media chain via src/helpers/congregation-schedule.ts).
 */
export const cloneMeetingQuickActionSettings = (
  settings: SettingsValues,
): SettingsValues => ({
  ...settings,
  meetingQuickActionsCategoriesAfter:
    settings.meetingQuickActionsCategoriesAfter.map((category) => ({
      ...category,
    })),
  meetingQuickActionsCategoriesBefore:
    settings.meetingQuickActionsCategoriesBefore.map((category) => ({
      ...category,
    })),
  meetingQuickActionsChecklistAfter:
    settings.meetingQuickActionsChecklistAfter.map((item) => ({ ...item })),
  meetingQuickActionsChecklistBefore:
    settings.meetingQuickActionsChecklistBefore.map((item) => ({ ...item })),
});
