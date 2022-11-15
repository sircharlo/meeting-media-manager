export interface ShortJWLang {
  isSignLanguage: boolean
  langcode: string
  name: string
  symbol: string
  vernacularName: string
  mwbAvailable?: boolean
  wAvailable?: boolean
}

export interface JWLang extends ShortJWLang {
  altSpellings: string[]
  direction: string
  hasWebContent: boolean
  isCounted: boolean
  script: string
}

export interface Choice {
  optionName: string
  optionValue: string | number | null
  altSpellings: string
  optionLang: string | null
  optionLangDir: string | null
  optionClasses: string | null
}

export interface Filter {
  title: string
  id: string
  choices: Choice[]
}
