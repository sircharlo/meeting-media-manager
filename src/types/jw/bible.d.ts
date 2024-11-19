import type { ImageSizes, ImageTypeSizes } from './publications';

export interface BibleBook {
  additionalPages: BibleBookAdditionalPage[];
  bookDisplayTitle: string;
  chapterCount: string;
  chapterDisplayTitle: string;
  hasAudio: boolean;
  hasMultimedia: boolean;
  hasStudyNotes: boolean;
  images: BibleBookImage[];
  officialAbbreviation: string;
  officialPluralAbbreviation: string;
  officialSingularAbbreviation: string;
  standardAbbreviation: string;
  standardName: string;
  standardPluralAbbreviation: string;
  standardPluralBookName: string;
  standardSingularAbbreviation: string;
  standardSingularBookName: string;
  url: string;
  urlSegment: string;
}

export interface BibleBookAdditionalPage {
  abbreviatedTitle: string;
  articleCSSCLassNames: string;
  children?: BibleBookAdditionalPage[];
  docClass: string;
  mepsTitle: string;
  pageCSSCLassNames: string;
  pageID: string;
  title: string;
  type?: string;
  url: string;
}

export interface BibleBookCopyrightPage extends BibleBookAdditionalPage {
  galleryDisclaimer: string;
}

export interface BibleBookImage {
  altText: string;
  caption: null | string;
  sizes: ImageSizes;
  type: keyof ImageTypeSizes;
}

export interface BibleBookMedia {
  caption: null | string;
  docID: string;
  id: number;
  keyframe: null | {
    sizes: ImageSizes;
    src: string;
    zoom: string;
  };
  label: string;
  pictureCredit: null | string;
  resource: BibleBookResource;
  source: string;
  sourceStandardCitations: {
    abbreviatedCitation: string;
    standardCitation: string;
    vs: string;
  }[];
  thumbnail: {
    sizes: ImageSizes;
    src: string;
    zoom: string;
  };
  type: 'image' | 'video';
}

export interface BibleBookResource {
  sizes?: ImageSizes;
  src:
    | (
        | string
        | { docid?: string; pub?: string; style: string; track: string }
      )[]
    | string;
  zoom?: string;
}

export interface BibleBooksRange {
  citation: string;
  citationVerseRange: string;
  link: string;
  multimedia: BibleBookMedia[];
  validRange: string;
}

export interface BibleBooksResult {
  additionalPages: BibleBookAdditionalPage[];
  copyrightPage: BibleBookCopyrightPage;
  currentLocale: string;
  editionData: {
    articleCSSClassNames: string;
    bookCount: string;
    books: Record<number, BibleBook>;
    locale: string;
    pageCSSClassNames: string;
    titleFormat: string;
    url: string;
    vernacularAbbreviation: string;
    vernacularFullName: string;
    vernacularShortName: null | string;
  };
  ranges: Record<string, BibleBooksRange>;
  status: number;
}
