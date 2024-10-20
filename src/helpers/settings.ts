import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { date, type ValidationRule } from 'quasar';
import { getSpecificWeekday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const requiredRule: ValidationRule = (val: string) =>
  (val && val.length > 0) || '';

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
      date.getDateDiff(lookupDate, getSpecificWeekday(new Date(), 0), 'days') >=
        0
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
    const filteredRules = rules
      ?.map((rule) => {
        if (rule === 'notEmpty') {
          return !rules.includes('regular') ||
            !currentSettings.value?.disableMediaFetching
            ? requiredRule
            : undefined;
        } else if (rule === 'portNumber') {
          return portNumberRule;
        } else {
          return undefined;
        }
      })
      .filter(Boolean);
    return filteredRules as ValidationRule[];
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

export { getActions, getDateOptions, getRules, getTimeOptions };
