import type { LanguageValue } from 'src/constants/locales';
import type { OldAppConfig, SettingsValues } from 'src/types';

import { defaultSettings } from 'src/constants/settings';
import { errorCatcher } from 'src/helpers/error-catcher';
import { kebabToCamelCase } from 'src/utils/general';

const { fs, path, readdir } = window.electronApi;
const { readJSON } = fs;
const { basename, join } = path;

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
    const newPrefsObject: SettingsValues = {
      autoStartAtLogin: oldPrefs.app?.autoRunAtBoot || false,
      autoStartMusic: oldPrefs.meeting?.autoStartMusic || true,
      baseUrl: 'jw.org',
      cacheFolder: oldPrefs.app?.customCachePath || null,
      congregationName: oldPrefs.app?.congregationName || '',
      convertFilesToMp4: oldPrefs.media?.enableMp4Conversion || false,
      // @ts-expect-error: coWeek is a string
      coWeek: oldPrefs.meeting?.coWeek || '',
      darkMode: 'auto',
      disableMediaFetching: oldPrefs.meeting?.specialCong || false,
      enableExtraCache: false,
      enableFolderWatcher: false,
      enableKeyboardShortcuts:
        oldPrefs.media?.mediaWinShortcut ||
        oldPrefs.media?.ppBackward ||
        oldPrefs.media?.ppForward ||
        // oldPrefs.media?.presentShortcut ||
        oldPrefs.meeting?.shuffleShortcut
          ? true
          : false,
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
    return newPrefsObject;
  } catch (error) {
    errorCatcher(error);
    return Object.assign({}, defaultSettings);
  }
};
