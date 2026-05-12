import type { JwLangCode } from 'src/types';

// ! This file will be updated by the update-langs script.

export type LanguageValue =
  | 'bzs'
  | 'de'
  | 'en'
  | 'es'
  | 'et'
  | 'fr'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'sl'
  | 'uk';

// As a sort of rule, let's only enable a language once it's reached a threshold of 50% translated in Crowdin.
// Modify this file along with src/i18n/index.ts to enable a language both on the docs website and in the app.

export const enabled: LanguageValue[] = [
  'de',
  'en',
  'es',
  'et',
  'fr',
  'nl',
  'pt',
  'ru',
  'sl',
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
      signLangCodes: ['ASL', 'INS', 'BSL', 'AUS', 'JML', 'KSI', 'ISG', 'ZSL', 'SGL', 'NZS', 'FSL', 'SAS', 'ZAS', 'GHS', 'SLN', 'USL', 'NNS', 'SWS', 'WSL'],
      value: 'en',
    },
  {
      englishName: 'Spanish',
      label: 'español',
      langcode: 'S',
      signLangCodes: ['LSE', 'LSA', 'SCH', 'LSC', 'SEC', 'LSU', 'LSS', 'CBS', 'LSG', 'BVL', 'LSM', 'LSP', 'SPE', 'LSV', 'SHO', 'LSN', 'PSL', 'SCR'],
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
      englishName: 'French',
      label: 'Français',
      langcode: 'F',
      signLangCodes: ['LSF', 'LSQ', 'SBF', 'CGS', 'LSI', 'BRS'],
      value: 'fr',
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
      englishName: 'Ukrainian',
      label: 'українська',
      langcode: 'K',
      value: 'uk',
    },
];
