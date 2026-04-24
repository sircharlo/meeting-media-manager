export type JwSite = 'jwevent' | 'stream' | undefined;

export interface JwSiteParams {
  langCode: string | undefined;
  langSymbol: string | undefined;
  site: JwSite;
}
