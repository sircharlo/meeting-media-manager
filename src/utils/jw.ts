import type {
  MediaItemsMediatorFile,
  MediaLink,
  PublicationFetcher,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

import { isEmpty } from './general';

/**
 * Gets a unique identifier for a publication.
 * @param param0 The publication to get the identifier for.
 * @param full Whether to include all parts of the identifier.
 * @returns The publication identifier.
 */
export const getPubId = (
  { docid, fileformat, issue, langwritten, pub, track }: PublicationFetcher,
  full?: boolean,
) => {
  // Special handling for wp
  if (
    pub === 'w' &&
    issue &&
    Number.parseInt(issue.toString()) >= 20080101 &&
    issue.toString().endsWith('01')
  ) {
    pub = 'wp';
  }

  return [
    ...(full ? [docid, pub] : [pub || docid]),
    langwritten,
    issue,
    ...(full ? [track, fileformat] : []),
  ]
    .filter((p) => !isEmpty(p))
    .join('_');
};

/**
 * Gets the resolution of a media item.
 * @param m The media item to get the resolution for.
 * @returns The resolution of the media item.
 */
const getMediaResolution = (m: MediaItemsMediatorFile | MediaLink) => {
  if (/\d+p/.test(m.label)) {
    return Number.parseInt(m.label.replaceAll(/\D/g, ''));
  } else {
    return m.frameHeight;
  }
};

/**
 * Find the best resolution for a media item
 * @param mediaLinks The media items to choose from
 * @param maxRes The maximum resolution to choose
 * @returns The best resolution media item
 */
export function findBestResolution(
  mediaLinks: MediaItemsMediatorFile[] | MediaLink[] | undefined,
  maxRes: string | undefined,
) {
  try {
    if (!mediaLinks?.length) return null;
    if (mediaLinks.length === 1) return mediaLinks[0];

    if (mediaLinks.some((m) => !m.subtitled)) {
      mediaLinks = mediaLinks.filter((m) => !m.subtitled) as
        | MediaItemsMediatorFile[]
        | MediaLink[];
    }

    // Sort by resolution in ascending order
    mediaLinks = mediaLinks.sort((a, b) => {
      const aRes = getMediaResolution(a);
      const bRes = getMediaResolution(b);
      return aRes - bRes;
    });

    let bestItem = mediaLinks[0];
    const parsedMaxRes = Number.parseInt(
      maxRes?.replaceAll(/\D/g, '') || '720',
    );
    mediaLinks.forEach((m) => {
      if (parsedMaxRes && getMediaResolution(m) <= parsedMaxRes) {
        bestItem = m;
      }
    });
    return bestItem;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks?.length ? mediaLinks.at(-1) : null;
  }
}

/**
 * Find the best resolutions for a media item list
 * @param mediaLinks The media items to choose from
 * @param maxRes The maximum resolution to choose
 * @returns Array of best resolution media items for each track, sorted by track number
 */
export function findBestResolutions(
  mediaLinks: MediaLink[] | undefined,
  maxRes: string | undefined,
): MediaLink[] {
  try {
    if (!mediaLinks?.length) return [];

    // Filter out subtitled if there are non-subtitled versions available
    let filteredLinks = mediaLinks;
    if (mediaLinks.some((m) => !m.subtitled)) {
      filteredLinks = mediaLinks.filter((m) => !m.subtitled);
    }

    // Group items by track number
    const trackGroups = new Map<number, MediaLink[]>();
    filteredLinks.forEach((item) => {
      const track = item.track;
      if (!trackGroups.has(track)) {
        trackGroups.set(track, []);
      }
      trackGroups.get(track)?.push(item);
    });

    // Find best item for each track
    const bestItems: MediaLink[] = [];
    const sortedTracks = Array.from(trackGroups.keys()).sort((a, b) => a - b);

    for (const track of sortedTracks) {
      const trackItems = trackGroups.get(track);
      const bestItem = findBestResolution(trackItems, maxRes);
      if (bestItem) {
        bestItems.push(bestItem as MediaLink);
      }
    }

    return bestItems;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks || [];
  }
}

/**
 * Check if the item is a MediaLink
 * @param item The item to check
 * @returns Whether the item is a MediaLink
 */
export function isMediaLink(
  item?: MediaItemsMediatorFile | MediaLink | null,
): item is MediaLink {
  if (!item) return false;
  return !('progressiveDownloadURL' in item);
}
