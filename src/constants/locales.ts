import type { JwLangCode } from 'src/types';

// ! This file will be updated by the update-langs script.

export type LanguageValue =
  | 'cmnHans'
  | 'de'
  | 'en'
  | 'es'
  | 'et'
  | 'fi'
  | 'fr'
  | 'hu'
  | 'it'
  | 'ko'
  | 'nl'
  | 'pt'
  | 'ptPt'
  | 'ru'
  | 'sk'
  | 'sl'
  | 'sv'
  | 'sw'
  | 'tl'
  | 'uk';

// As a sort of rule, let's only enable a language once it's reached a threshold of 50% translated in Crowdin.
// Modify this file along with src/i18n/index.ts to enable a language both on the docs website and in the app.

export const enabled: LanguageValue[] = [
  'cmnHans',
  'de',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'it',
  'ko',
  'nl',
  'pt',
  'ptPt',
  'ru',
  'sl',
  'sv',
  'sw',
  'tl',
  'uk',
];

// This is the list of all languages that are configured in Crowdin.

export const locales: {
  englishName: string;
  label: string;
  langcode: JwLangCode;
  signLangCodes?: JwLangCode[];
  value: LanguageValue;
}[] = [
  {
    englishName: 'Chinese Mandarin (Simplified)',
    label: '中文简体（普通话）',
    langcode: 'CHS',
    signLangCodes: ['CSL'],
    value: 'cmnHans',
  },
  {
    englishName: 'German',
    label: 'Deutsch',
    langcode: 'X',
    signLangCodes: ['DGS', 'SGS', 'OGS'],
    value: 'de',
  },
  {
    englishName: 'English',
    label: 'English',
    langcode: 'E',
    signLangCodes: [
      'ASL',
      'INS',
      'BSL',
      'AUS',
      'JML',
      'KSI',
      'ISG',
      'ZSL',
      'SGL',
      'NZS',
      'FSL',
      'SAS',
      'ZAS',
      'GHS',
      'SLN',
      'USL',
      'NNS',
      'SWS',
      'WSL',
    ],
    value: 'en',
  },
  {
    englishName: 'Spanish',
    label: 'español',
    langcode: 'S',
    signLangCodes: [
      'LSE',
      'LSA',
      'SCH',
      'LSC',
      'SEC',
      'LSU',
      'LSS',
      'CBS',
      'LSG',
      'BVL',
      'LSM',
      'LSP',
      'SPE',
      'LSV',
      'SHO',
      'LSN',
      'PSL',
      'SCR',
    ],
    value: 'es',
  },
  {
    englishName: 'Estonian',
    label: 'eesti',
    langcode: 'ST',
    signLangCodes: ['STD'],
    value: 'et',
  },
  {
    englishName: 'Finnish',
    label: 'suomi',
    langcode: 'FI',
    signLangCodes: ['FID'],
    value: 'fi',
  },
  {
    englishName: 'French',
    label: 'Français',
    langcode: 'F',
    signLangCodes: ['LSF', 'LSQ', 'SBF', 'CGS', 'LSI', 'BRS'],
    value: 'fr',
  },
  {
    englishName: 'Hungarian',
    label: 'magyar',
    langcode: 'H',
    signLangCodes: ['HDF'],
    value: 'hu',
  },
  {
    englishName: 'Italian',
    label: 'Italiano',
    langcode: 'I',
    signLangCodes: ['ISL'],
    value: 'it',
  },
  {
    englishName: 'Korean',
    label: '한국어',
    langcode: 'KO',
    signLangCodes: ['KSL'],
    value: 'ko',
  },
  {
    englishName: 'Dutch',
    label: 'Nederlands',
    langcode: 'O',
    signLangCodes: ['NGT', 'SSU', 'VGT'],
    value: 'nl',
  },
  {
    englishName: 'Portuguese (Brazil)',
    label: 'Português (Brasil)',
    langcode: 'T',
    signLangCodes: ['LSB', 'LGP', 'LAS', 'SLM'],
    value: 'pt',
  },
  {
    englishName: 'Portuguese (Portugal)',
    label: 'Português (Portugal)',
    langcode: 'TPO',
    signLangCodes: ['LGP', 'LAS', 'SLM'],
    value: 'ptPt',
  },
  {
    englishName: 'Russian',
    label: 'русский',
    langcode: 'U',
    signLangCodes: ['RSL'],
    value: 'ru',
  },
  {
    englishName: 'Slovenian',
    label: 'slovenščina',
    langcode: 'SV',
    signLangCodes: ['SZJ'],
    value: 'sl',
  },
  {
    englishName: 'Swedish',
    label: 'Svenska',
    langcode: 'Z',
    signLangCodes: ['SSL'],
    value: 'sv',
  },
  {
    englishName: 'Swahili',
    label: 'Kiswahili',
    langcode: 'SW',
    signLangCodes: ['TZL'],
    value: 'sw',
  },
  {
    englishName: 'Tagalog',
    label: 'Tagalog',
    langcode: 'TG',
    value: 'tl',
  },
  {
    englishName: 'Ukrainian',
    label: 'українська',
    langcode: 'K',
    value: 'uk',
  },
];
