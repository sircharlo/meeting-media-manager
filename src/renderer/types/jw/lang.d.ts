export interface ShortJWLang {
  isSignLanguage: boolean
  langcode: string
  name: string
  symbol: string
  vernacularName: string
}

export interface JWLang extends ShortJWLang {
  altSpellings: string[]
  direction: string
  hasWebContent: boolean
  isCounted: boolean
  script: string
}
