export type JwSite = 'jwevent' | undefined;

export interface JwSiteParams {
  langCode: string | undefined;
  langSymbol: string | undefined;
  site: JwSite;
}
