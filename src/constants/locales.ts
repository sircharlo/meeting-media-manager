import type { JwLangCode } from 'src/types';

// ! This type should include all languages that are configured in Crowdin.
export type LanguageValue =
  | 'am'
  | 'cmnHans'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'et'
  | 'fi'
  | 'fr'
  | 'ht'
  | 'hu'
  | 'it'
  | 'mg'
  | 'nl'
  | 'pt'
  | 'ptPt'
  | 'ro'
  | 'ru'
  | 'sk'
  | 'sl'
  | 'sv'
  | 'sw'
  | 'uk';

// As a sort of rule, let's only enable a language once it's reached a threshold of 50% translated in Crowdin.
// Modify this file along with src/i18n/index.ts to enable a language both on the docs website and in the app.

export const enabled: LanguageValue[] = [
  'cmnHans',
  'de',
  'en',
  'es',
  'et',
  'fr',
  'hu',
  'it',
  'nl',
  'pt',
  'ptPt',
  'ru',
  'sl',
  'sv',
  'sw',
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
    englishName: 'Amharic',
    label: 'አማርኛ',
    langcode: 'AM',
    value: 'am',
  },
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
    signLangCodes: ['DGS'],
    value: 'de',
  },
  {
    englishName: 'Greek',
    label: 'Ελληνική',
    langcode: 'G',
    signLangCodes: ['GSL'],
    value: 'el',
  },
  {
    englishName: 'English',
    label: 'English',
    langcode: 'E',
    signLangCodes: ['ASL', 'BSL'],
    value: 'en',
  },
  {
    englishName: 'Spanish',
    label: 'español',
    langcode: 'S',
    signLangCodes: ['LSE'],
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
    signLangCodes: ['LSF'],
    value: 'fr',
  },
  {
    englishName: 'Haitian Creole',
    label: 'Kreyòl ayisyen',
    langcode: 'CR',
    value: 'ht',
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
    englishName: 'Malagasy',
    label: 'Malagasy',
    langcode: 'MG',
    value: 'mg',
  },
  {
    englishName: 'Dutch',
    label: 'Nederlands',
    langcode: 'O',
    signLangCodes: ['NGT'],
    value: 'nl',
  },
  {
    englishName: 'Portuguese (Portugal)',
    label: 'Português (Portugal)',
    langcode: 'TPO',
    signLangCodes: ['LGP'],
    value: 'ptPt',
  },
  {
    englishName: 'Portuguese (Brazil)',
    label: 'Português (Brasil)',
    langcode: 'T',
    signLangCodes: ['LSB'],
    value: 'pt',
  },
  {
    englishName: 'Romanian',
    label: 'Română',
    langcode: 'M',
    signLangCodes: ['LMG'],
    value: 'ro',
  },
  {
    englishName: 'Russian',
    label: 'русский',
    langcode: 'U',
    signLangCodes: ['RSL'],
    value: 'ru',
  },
  {
    englishName: 'Slovak',
    label: 'slovenčina',
    langcode: 'V',
    signLangCodes: ['VSL'],
    value: 'sk',
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
    value: 'sw',
  },
  {
    englishName: 'Ukrainian',
    label: 'українська',
    langcode: 'K',
    value: 'uk',
  },
];
