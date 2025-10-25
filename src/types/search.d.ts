export interface SearchResultItem {
  context: string;
  image: {
    type: string;
    url: string;
  };
  insight: {
    lank: string;
    rank: number;
  };
  lank: string;
  links: {
    [key: string]: string | undefined;
    'jw.org'?: string;
    wol?: string;
  };
  snippet: string;
  subtype: string;
  title: string;
  type: string;
}

export interface SearchResults {
  layout: string[];
  results: SearchResultItem[];
}
