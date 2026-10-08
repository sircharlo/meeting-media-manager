import type { LanguageValue } from 'src/constants/locales';
import type { OldAppConfig, SettingsValues } from 'src/types';

import { defaultSettings } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { cloneMeetingQuickActionSettings } from 'src/utils/clone-settings';
import { kebabToCamelCase } from 'src/utils/general';

const { basename, fs, join, readdir } = globalThis.electronApi;
const { readJSON } = fs;

export const getOldPrefsPaths = async (oldPath: string) => {
  try {
    if (!oldPath) return [];
    const filePaths: string[] = [];
    const items = await readdir(oldPath);
    for (const item of items) {
      const filePath = join(oldPath, item.name);
      if (
        item.isFile &&
        basename(filePath).startsWith('prefs') &&
        basename(filePath).endsWith('.json')
      ) {
        filePaths.push(filePath);
      }
    }
    return filePaths;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const parsePrefsFile: (path: string) => Promise<OldAppConfig> = async (
  path: string,
) => {
  try {
    return (
      (await readJSON(path, {
        encoding: 'utf8',
        throws: false,
      })) || {}
    );
  } catch (error) {
    errorCatcher(error);
    return {};
  }
};

export const buildNewPrefsObject = (oldPrefs: OldAppConfig) => {
  try {
    // Partial, not SettingsValues: this only ever carries fields the old
    // pre-M³ app actually had a concept of - every setting M³ has since
    // added (Meeting Quick Actions among them) is intentionally absent here
    // and comes from defaultSettings below instead. Typing this as the full
    // SettingsValues previously masked a real bug (FE-14,
    // full-audit-2026-09-05.md): ~58 fields were silently missing from the
    // object actually written to the congregations map, which vue-tsc never
    // flagged only because 3 unrelated, correctly `@ts-expect-error`'d
    // per-property mismatches below (coWeek/mwStartTime/weStartTime are
    // branded template-literal types, assigned plain strings) suppressed
    // TypeScript's separate "object literal is missing the following
    // properties" diagnostic for the object as a whole.
    const migratedPrefs: Partial<SettingsValues> = {
      autoStartAtLogin: oldPrefs.app?.autoRunAtBoot || false,
      autoStartMusic: oldPrefs.meeting?.autoStartMusic || true,
      baseUrl: 'jw.org',
      cacheFolder: oldPrefs.app?.customCachePath || null,
      congregationName: oldPrefs.app?.congregationName || '',
      convertFilesToMp4: oldPrefs.media?.enableMp4Conversion || false,
      // @ts-expect-error: coWeek is a string
      coWeek: oldPrefs.meeting?.coWeek || '',
      darkMode: 'auto',
      disableHardwareAcceleration:
        oldPrefs.app?.disableHardwareAcceleration || false,
      disableMediaFetching: oldPrefs.meeting?.specialCong || false,
      enableExtraCache: false,
      enableFolderWatcher: false,
      enableKeyboardShortcuts: !!(
        oldPrefs.media?.mediaWinShortcut ||
        oldPrefs.media?.ppBackward ||
        oldPrefs.media?.ppForward ||
        oldPrefs.meeting?.shuffleShortcut
      ),
      enableMediaAutoExport: oldPrefs.media?.enableMp4Conversion || false,
      enableMediaDisplayButton:
        oldPrefs.media?.enableMediaDisplayButton || true,
      enableMusicButton: oldPrefs.meeting?.enableMusicButton || true,
      // enableMusicFadeOut: oldPrefs.meeting?.enableMusicFadeOut || true,
      enableSubtitles: oldPrefs.media?.enableSubtitles || false,
      excludeFootnotes: oldPrefs.media?.excludeFootnotes || false,
      excludeTh: oldPrefs.media?.excludeTh || true,
      firstDayOfWeek: 0,
      folderToWatch: '',
      hideMediaLogo: oldPrefs.media?.hideMediaLogo || false,
      includePrinted: oldPrefs.media?.includePrinted || true,
      lang: oldPrefs.media?.lang || '',
      langFallback: oldPrefs.media?.langFallback || null,
      langSubtitles: oldPrefs.media?.langSubs || null,
      localAppLang:
        ((oldPrefs.app?.localAppLang?.includes('-')
          ? kebabToCamelCase(oldPrefs.app?.localAppLang)
          : oldPrefs.app?.localAppLang) as LanguageValue) || 'en',
      maxRes: oldPrefs.media?.maxRes || '720p',
      mediaAutoExportFolder: oldPrefs.app?.localOutputPath || '',
      meetingScheduleChangeDate: null,
      meetingScheduleChangeMwDay: null,
      meetingScheduleChangeMwStartTime: null,
      meetingScheduleChangeOnce: false,
      meetingScheduleChangeWeDay: null,
      meetingScheduleChangeWeStartTime: null,
      memorialDate: null,
      musicVolume: oldPrefs.meeting?.musicVolume || 100,
      mwDay: oldPrefs.meeting?.mwDay ? `${oldPrefs.meeting.mwDay}` : null,
      // @ts-expect-error: mwStartTime is a string
      mwStartTime: oldPrefs.meeting?.mwStartTime?.toString() || null,
      obsCameraScene: oldPrefs.app?.obs?.cameraScene || '',
      obsEnable: oldPrefs.app?.obs?.enable || false,
      obsHideIcons: false,
      obsImageScene: oldPrefs.app?.obs?.imageScene || '',
      obsMediaScene: oldPrefs.app?.obs?.mediaScene || '',
      obsPassword: oldPrefs.app?.obs?.password || '',
      obsPort: oldPrefs.app?.obs?.port?.toString() || '',
      obsPostponeImages: false,
      obsQuickToggle: false,
      obsSwitchSceneAfterMedia: false,
      shortcutMediaNext: oldPrefs.media?.ppForward || '',
      shortcutMediaPauseResume: '',
      shortcutMediaPrevious: oldPrefs.media?.ppBackward || '',
      shortcutMediaStop: '',
      shortcutMediaWindow: oldPrefs.media?.mediaWinShortcut || '',
      shortcutMusic: oldPrefs.meeting?.shuffleShortcut || '',
      weDay: oldPrefs.meeting?.weDay ? `${oldPrefs.meeting.weDay}` : null,
      // @ts-expect-error: weStartTime is a string
      weStartTime: oldPrefs.meeting?.weStartTime?.toString() || '',
    };
    return cloneMeetingQuickActionSettings({
      ...defaultSettings,
      ...migratedPrefs,
    });
  } catch (error) {
    errorCatcher(error);
    return cloneMeetingQuickActionSettings({ ...defaultSettings });
  }
};
