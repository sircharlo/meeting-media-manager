import type {
  SettingsItemAction,
  SettingsItemOption,
  SettingsItemRule,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { date, type ValidationRule } from 'quasar';
import { getSpecificWeekday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { configuredScenesAreAllUUIDs } from 'src/helpers/obs';
import { localeOptions } from 'src/i18n';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { useObsStateStore } from 'src/stores/obs-state';
import { ref } from 'vue';

const jwStore = useJwStore();
const { jwLanguages } = storeToRefs(jwStore);
const filteredJwLanguages = ref(jwLanguages.value?.list || []);

const obsState = useObsStateStore();
const { scenes } = storeToRefs(obsState);

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const filteredLocaleAppLang = ref(localeOptions);

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

const filterFn = (
  val: string,
  update: (arg0: { (): void; (): void }) => void,
) => {
  const noFilter = () => {
    update(() => {
      filteredJwLanguages.value = jwLanguages.value?.list || [];
      filteredLocaleAppLang.value = localeOptions;
    });
  };
  try {
    if (!val) {
      noFilter();
    } else {
      update(() => {
        const needle = val.toLowerCase();
        filteredJwLanguages.value = (jwLanguages.value?.list || []).filter(
          (v) =>
            v.name.toLowerCase().indexOf(needle) > -1 ||
            v.vernacularName.toLowerCase().indexOf(needle) > -1,
        );
        filteredLocaleAppLang.value = localeOptions.filter(
          (v) =>
            v.englishName.toLowerCase().indexOf(needle) > -1 ||
            v.label.toLowerCase().indexOf(needle) > -1,
        );
      });
    }
  } catch (error) {
    noFilter();
    errorCatcher(error);
  }
};

const getListOptions = (list: string | undefined) => {
  try {
    if (list === 'jwLanguages') {
      return filteredJwLanguages.value.map((language) => {
        return {
          label: `${language.vernacularName} (${language.name})`,
          value: language.langcode,
        };
      });
    } else if (list === 'appLanguages') {
      return filteredLocaleAppLang.value
        .sort((a, b) => a.englishName.localeCompare(b.englishName))
        .map((language) => {
          return {
            label:
              language.label +
              (language.englishName !== language.label
                ? ` (${language.englishName})`
                : ''),
            value: language.value,
          };
        });
    } else if (list === 'darkModes') {
      return [
        { label: 'automatic', value: 'auto' },
        { label: 'dark', value: true },
        { label: 'light', value: false },
      ];
    } else if (list === 'resolutions') {
      return [
        { label: '240p', value: '240p' },
        { label: '360p', value: '360p' },
        { label: '480p', value: '480p' },
        { label: '720p', value: '720p' },
      ];
    } else if (list === 'days') {
      const array = [];
      for (let i = 0; i <= 6; i++) {
        array.push({ label: String(i), value: String(i) });
      }
      return array;
    } else if (list?.startsWith('obs')) {
      return scenes.value?.map((scene) => {
        return {
          label: scene.sceneName,
          value:
            configuredScenesAreAllUUIDs() && scene.sceneUuid
              ? scene.sceneUuid
              : scene.sceneName,
        };
      });
    } else {
      throw new Error('List not found: ' + list);
    }
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

export {
  filterFn,
  getActions,
  getDateOptions,
  getListOptions,
  getRules,
  getTimeOptions,
};
