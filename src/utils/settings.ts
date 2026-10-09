import type { ValidationRule } from 'quasar';
import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
  SettingsValues,
} from 'src/types';

import { settingsDefinitions } from 'src/constants/settings';
import { syncMeetingScheduleManually } from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  captureZoomMicTitle,
  captureZoomShareButtonTitle,
  captureZoomVideoTitle,
  isZoomSetupNeeded,
} from 'src/helpers/zoom';
import { getDateDiff, getSpecificWeekday, isInPast } from 'src/utils/date';

const requiredRule: ValidationRule = (val: boolean | string) =>
  (val?.toString() && val?.toString().length > 0) || '';

export const portNumberValidator = (val: string): boolean => {
  if (typeof val !== 'string' || val.trim() === '') return false;
  const num = Number(val);
  return Number.isInteger(num) && num > 0 && num < 65536;
};

const portNumberRule: ValidationRule = (val: string) =>
  portNumberValidator(val) || '';

const coTuesdays = (lookupDate: string) => {
  try {
    if (!lookupDate) return false;
    return (
      new Date(lookupDate).getDay() === 2 &&
      getDateDiff(lookupDate, getSpecificWeekday(new Date(), 0), 'days') >= 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const getDateOptions = (options: SettingsItemOption[] | undefined) => {
  try {
    const filteredOptions =
      options
        ?.map((option) => {
          if (option === 'coTuesdays') {
            return coTuesdays;
          } else if (option === 'futureDate') {
            return (lookupDate: string) => !isInPast(lookupDate);
          } else {
            return undefined;
          }
        })
        .filter((fn): fn is (d: string) => boolean => !!fn) || [];
    return filteredOptions.length > 0 ? filteredOptions[0] : undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

// Whether a setting is on, with the settings it depends on on too.
const isSettingInEffect = (
  settings: Partial<SettingsValues>,
  settingId: keyof SettingsValues,
): boolean => {
  if (!settings[settingId]) return false;
  const depends = settingsDefinitions[settingId]?.depends;
  if (!depends) return true;
  const dependencies = Array.isArray(depends) ? depends : [depends];
  return dependencies.every((dependency) => !!settings[dependency]);
};

/**
 * The settings (see `disableWhen`) that make this one unavailable right now,
 * e.g. the other Zoom integration, as both would drive Zoom's screen sharing.
 */
export const getBlockingSettings = (
  settings: null | Partial<SettingsValues> | undefined,
  settingId: keyof SettingsValues,
): (keyof SettingsValues)[] => {
  const { disableWhen, type } = settingsDefinitions[settingId] ?? {};
  if (!settings || !disableWhen) return [];
  // A toggle that is on can always be turned off, even if both ended up on.
  if (type === 'toggle' && settings[settingId]) return [];
  const blockers = Array.isArray(disableWhen) ? disableWhen : [disableWhen];
  return blockers.filter((blocker) => isSettingInEffect(settings, blocker));
};

export const getRules = (
  rules: SettingsItemRule[] | undefined,
  disableMediaFetching: boolean | undefined,
) => {
  try {
    const filteredRules: ValidationRule[] =
      rules
        ?.map((rule): undefined | ValidationRule => {
          if (rule === 'notEmpty') {
            return !rules.includes('regular') || !disableMediaFetching
              ? requiredRule
              : undefined;
          } else if (rule === 'portNumber') {
            return portNumberRule;
          } else {
            return undefined;
          }
        })
        .filter((r): r is ValidationRule => !!r) || [];
    return filteredRules.length ? filteredRules : undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

export const performActions = (actions: SettingsItemAction[] | undefined) => {
  actions?.forEach((action) => {
    try {
      if (action === 'obsConnect') {
        globalThis.dispatchEvent(
          new CustomEvent<undefined>('obsConnectFromSettings'),
        );
      } else if (action === 'syncMeetingSchedule') {
        syncMeetingScheduleManually();
      } else if (action === 'openCongregationLookup') {
        globalThis.dispatchEvent(
          new CustomEvent<undefined>('openCongregationLookup'),
        );
      } else if (action === 'openZoomSetupAssistant') {
        globalThis.dispatchEvent(new CustomEvent('openZoomSetupAssistant'));
      } else if (action === 'openZoomSetupAssistantIfNeeded') {
        // Turning the Zoom Meeting Manager on opens the assistant, unless
        // it was already set up (so finishing the assistant, which turns
        // it on, doesn't open it again).
        if (isZoomSetupNeeded()) {
          globalThis.dispatchEvent(new CustomEvent('openZoomSetupAssistant'));
        }
      } else if (action === 'zoomCaptureVideoOffTitle') {
        captureZoomVideoTitle('zoomVideoOffTitle');
      } else if (action === 'zoomCaptureVideoOnTitle') {
        captureZoomVideoTitle('zoomVideoOnTitle');
      } else if (action === 'zoomCaptureMicOffTitle') {
        captureZoomMicTitle('zoomMicOffTitle');
      } else if (action === 'zoomCaptureMicOnTitle') {
        captureZoomMicTitle('zoomMicOnTitle');
      } else if (action === 'zoomCaptureShareButtonTitle') {
        captureZoomShareButtonTitle();
      }
    } catch (error) {
      errorCatcher(error);
    }
  });
};

export const meetingTime = (hr: number, min: null | number) => {
  try {
    if (hr < 8 || hr > 22 || (hr === 22 && min && min > 30)) {
      return false;
    }
    if (min !== null && min % 5 !== 0) {
      return false;
    }
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const getTimeOptions = (options: SettingsItemOption[] | undefined) => {
  try {
    if (!options) return undefined;
    const filteredOptions = options
      ?.map((option) => {
        if (option === 'meetingTime') {
          return meetingTime;
        } else {
          return undefined;
        }
      })
      .filter((fn): fn is (hr: number, min: null | number) => boolean => !!fn);
    if (!filteredOptions) return undefined;
    return filteredOptions && filteredOptions.length > 0
      ? filteredOptions[0]
      : undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};
