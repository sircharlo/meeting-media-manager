import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
} from 'src/types';

import { date, type ValidationRule } from 'quasar';
import { getSpecificWeekday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';

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

export const getDateOptions = (options: SettingsItemOption[] | undefined) => {
  try {
    const filteredOptions =
      options
        ?.map((option) => {
          if (option === 'coTuesdays') {
            return coTuesdays;
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

export const getRules = (rules: SettingsItemRule[] | undefined) => {
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
        window.dispatchEvent(
          new CustomEvent<undefined>('obsConnectFromSettings'),
        );
      }
    } catch (error) {
      errorCatcher(error);
    }
  });
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

export const parseJsonSafe = <T>(json: null | string | T, fallback: T): T => {
  if (!json) return fallback;
  try {
    return typeof json === 'string' ? (JSON.parse(json) as T) : json;
  } catch (e) {
    errorCatcher(e);
    return fallback;
  }
};
