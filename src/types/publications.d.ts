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
  label: string;
  markers: {
    documentId: number;
    hash: string;
    introduction: {
      duration: string;
      startTime: string;
    };
    markers: {
      duration: string;
      mepsParagraphId: number;
      startTime: string;
    }[];
    mepsLanguageSpoken: string;
    mepsLanguageWritten: string;
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

export interface MediaItemsMediatorFile {
  bitRate: number;
  checksum: string;
  duration: number;
  filesize: number;
  frameHeight: number;
  frameRate: number;
  frameWidth: number;
  label: string;
  mimetype: string;
  modifiedDatetime: string;
  progressiveDownloadURL: string;
  subtitled: boolean;
  subtitles: {
    checksum: string;
    modifiedDatetime: string;
    url: string;
  };
}

export interface MediaItemsMediatorItem {
  availableLanguages: string[];
  description: string;
  duration: number;
  durationFormattedHHMM: string;
  durationFormattedMinSec: string;
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
export interface MediaItemsMediator {
  media: MediaItemsMediatorItem[];
}

export interface Publication {
  booknum: null | number;
  fileformat: string[];
  files: Record<string, Record<string, MediaItemsMediatorFile[] | MediaLink[]>>;
  formattedDate: string;
  issue: string;
  languages: Record<
    string,
    {
      direction: string;
      locale: string;
      name: string;
      script: string;
    }
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
  fileformat?: string;
  issue?: number | string;
  langwritten: string;
  maxTrack?: number;
  pub: string;
  track?: number;
}

export interface ImageSizes {
  lg: string;
  md: string;
  sm: string;
  xl: string;
}

export interface ImageTypeSizes {
  lsr: ImageSizes;
  pnr: ImageSizes;
  sqr: ImageSizes;
  wss: ImageSizes;
}

export interface JwVideoCategoryListings {
  categories: JwVideoCategoryListing[];
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

export interface JwVideoCategory {
  category: JwVideoCategoryListing;
}
