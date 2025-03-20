import type { JwLangCode } from './lang';

export interface ImageSizes {
  lg?: string;
  md?: string;
  sm?: string;
  xl?: string;
  xs?: string;
}

export interface ImageTypeSizes {
  lsr?: ImageSizes;
  lss?: ImageSizes;
  pnr?: ImageSizes;
  sqr?: ImageSizes;
  sqs?: ImageSizes;
  wsr?: ImageSizes;
  wss?: ImageSizes;
}

export interface JwVideoCategory {
  category: JwVideoCategoryListing;
}
export interface JwVideoCategoryListing {
  description: string;
  images: ImageTypeSizes;
  key: string;
  media: MediaItemsMediatorItem[];
  name: string;
  parentCategory: JwVideoCategoryListing;
  subcategories: JwVideoCategoryListing[];
  tags: string[];
  type: string;
}

export interface JwVideoCategoryListings {
  categories: JwVideoCategoryListing[];
}

export interface MediaItemsMediator {
  media: MediaItemsMediatorItem[];
}

export interface MediaItemsMediatorFile {
  bitRate: number;
  checksum: string;
  duration: number;
  filesize: number;
  frameHeight: number;
  frameRate: number;
  frameWidth: number;
  label: `${number}p`;
  mimetype: string;
  modifiedDatetime: string;
  progressiveDownloadURL: string;
  subtitled: boolean;
  subtitles: {
    checksum: string;
    modifiedDatetime: string;
    url: string;
  };
  track: number;
}

export interface MediaItemsMediatorItem {
  availableLanguages: JwLangCode[];
  description: string;
  duration: number;
  durationFormattedHHMM: `${number}:${number}`;
  durationFormattedMinSec: `${number}m ${number}s`;
  files: MediaItemsMediatorFile[];
  firstPublished: string;
  guid: string;
  images: ImageTypeSizes;
  key: string;
  languageAgnosticNaturalKey: string;
  name: string;
  naturalKey: string;
  primaryCategory: string;
  printReferences: string[];
  tags: string[];
  title: string;
  type: string;
}

export interface MediaLink {
  bitRate: number;
  booknum: number;
  docid: number;
  duration: number;
  edition: string;
  editionDescr: string;
  file: {
    checksum: string;
    modifiedDatetime: string;
    stream: string;
    url: string;
  };
  filesize: number;
  format: string;
  formatDescr: string;
  frameHeight: number;
  frameRate: number;
  frameWidth: number;
  hasTrack: boolean;
  label: `${number}p`;
  markers: {
    documentId: number;
    hash: string;
    introduction: {
      duration: string;
      startTime: string;
    };
    markers: {
      duration: string;
      mepsParagraphId?: number;
      startTime: string;
      verseNumber?: number;
    }[];
    mepsLanguageSpoken: JwLangCode;
    mepsLanguageWritten: JwLangCode;
    type: string;
  };
  mimetype: string;
  pub: string;
  specialty: string;
  specialtyDescr: string;
  subtitled: boolean;
  title: string;
  track: number;
  trackImage: {
    checksum: string;
    modifiedDatetime: string;
    url: string;
  };
}

export interface Publication {
  booknum: null | number;
  fileformat: string[];
  files: Partial<Record<JwLangCode, PublicationFiles>>;
  formattedDate: string;
  issue: `${number}`;
  languages: Partial<
    Record<
      JwLangCode,
      {
        direction: 'ltr' | 'rtl';
        locale: string;
        name: string;
        script: string;
      }
    >
  >;
  parentPubName: string;
  pub: string;
  pubImage: {
    checksum: string;
    modifiedDatetime: string;
    url: string;
  };
  pubName: string;
  specialty: string;
  track: null | number;
}

export interface PublicationFetcher {
  booknum?: number;
  docid?: null | number | undefined;
  fileformat?: keyof PublicationFiles;
  issue?: number | string;
  langwritten: '' | JwLangCode;
  maxTrack?: number;
  pub?: null | string | undefined;
  track?: number;
}

export interface PublicationFiles {
  '3GP'?: MediaItemsMediatorFile[] | MediaLink[];
  BRL?: MediaItemsMediatorFile[] | MediaLink[];
  DAISY?: MediaItemsMediatorFile[] | MediaLink[];
  EPUB?: MediaItemsMediatorFile[] | MediaLink[];
  JWPUB?: MediaItemsMediatorFile[] | MediaLink[];
  M4V?: MediaItemsMediatorFile[] | MediaLink[];
  MP3?: MediaItemsMediatorFile[] | MediaLink[];
  MP4?: MediaItemsMediatorFile[] | MediaLink[];
  PDF?: MediaItemsMediatorFile[] | MediaLink[];
  RTF?: MediaItemsMediatorFile[] | MediaLink[];
  ZIP?: MediaItemsMediatorFile[] | MediaLink[];
}
