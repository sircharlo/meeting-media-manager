import type { JwSite, SettingsValues } from 'src/types';

/**
 * Whether a Present Website site choice can be offered. JW Stream and the
 * conventions site are jw.org's own, so they're only offered when the
 * Website is jw.org - a different Website never falls back to them.
 * @param site The site choice (undefined = the main site)
 * @param settings The congregation's settings
 * @returns Whether it's available
 */
export const isSiteAvailable = (
  site: JwSite,
  settings: null | Partial<Pick<SettingsValues, 'baseUrl'>> | undefined,
) => !site || settings?.baseUrl === 'jw.org';
