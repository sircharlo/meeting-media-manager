import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
} from 'src/types';

import { date, type ValidationRule } from 'quasar';
import { getSpecificWeekday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';

import { setUrlVariables } from './jw-media';

const { getDateDiff } = date;

const currentState = useCurrentStateStore();

const requiredRule: ValidationRule = (val: boolean | string) =>
  (val?.toString() && val?.toString().length > 0) || '';

export const portNumberValidator = (val: string) =>
  val &&
  Number.isInteger(Number(val)) &&
  Number(val) > 0 &&
  Number(val) < 65536;

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

const getDateOptions = (options: SettingsItemOption[] | undefined) => {
  try {
    const filteredOptions = options
      ?.map((option) => {
        if (option === 'coTuesdays') {
          return coTuesdays;
        } else {
          return undefined;
        }
      })
      .filter(Boolean);
    return filteredOptions && filteredOptions.length > 0
      ? filteredOptions[0]
      : undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const getRules = (rules: SettingsItemRule[] | undefined) => {
  try {
    const filteredRules: ValidationRule[] =
      rules
        ?.map((rule): undefined | ValidationRule => {
          if (rule === 'notEmpty') {
            return !rules.includes('regular') ||
              !currentState.currentSettings?.disableMediaFetching
              ? requiredRule
              : undefined;
          } else if (rule === 'portNumber') {
            return portNumberRule;
          } else {
            return undefined;
          }
        })
        .filter((r): r is ValidationRule => !!r) || [];
    return filteredRules;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const getActions = (actions: SettingsItemAction[] | undefined) => {
  try {
    return actions
      ?.map(async (action) => {
        if (action === 'obsConnect') {
          return window.dispatchEvent(
            new CustomEvent('obsConnectFromSettings'),
          );
        } else if (action === 'baseUrlUpdate') {
          return setUrlVariables();
        } else {
          return undefined;
        }
      })
      .filter(Boolean);
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const meetingTime = (hr: number, min: null | number) => {
  try {
    if (hr < 8 || hr > 22) {
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
const getTimeOptions = (options: SettingsItemOption[] | undefined) => {
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
      .filter(Boolean);
    if (!filteredOptions) return undefined;
    return filteredOptions && filteredOptions.length > 0
      ? filteredOptions[0]
      : undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

const parseJsonSafe = <T>(json: null | string | T, fallback: T): T => {
  if (!json) return fallback;
  try {
    return typeof json === 'string' ? (JSON.parse(json) as T) : json;
  } catch (e) {
    console.error(e);
    return fallback;
  }
};

export { getActions, getDateOptions, getRules, getTimeOptions, parseJsonSafe };
