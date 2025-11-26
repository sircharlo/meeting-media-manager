import type {
  MaxRes,
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
    parseInt(issue.toString()) >= 20080101 &&
    issue.toString().slice(-2) === '01'
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
    return parseInt(m.label.replace(/\D/g, ''));
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
  maxRes: MaxRes | undefined,
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
    const parsedMaxRes = parseInt(maxRes?.replace(/\D/g, '') || '720');
    mediaLinks.forEach((m) => {
      if (parsedMaxRes && getMediaResolution(m) <= parsedMaxRes) {
        bestItem = m;
      }
    });
    return bestItem;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks?.length ? mediaLinks[mediaLinks.length - 1] : null;
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
  maxRes: MaxRes | undefined,
): MediaLink[] {
  try {
    if (!mediaLinks?.length) return [];
    if (mediaLinks.length === 1 && mediaLinks[0]) return mediaLinks;

    if (mediaLinks.some((m) => !m.subtitled)) {
      mediaLinks = mediaLinks.filter((m) => !m.subtitled) as MediaLink[];
    }

    // Group items by track number
    const trackGroups = new Map<number, MediaLink[]>();
    mediaLinks?.forEach((item) => {
      const track = item.track;
      if (!trackGroups.has(track)) {
        trackGroups.set(track, []);
      }
      const trackArray = trackGroups.get(track);
      if (trackArray) {
        trackArray.push(item);
      }
    });

    // If all items have the same track, return the best single item
    if (trackGroups.size === 1) {
      const trackKeys = Array.from(trackGroups.keys());
      if (trackKeys.length > 0) {
        const trackKey = trackKeys[0];
        if (trackKey === undefined) return [];
        const singleTrackItems = trackGroups.get(trackKey);
        if (singleTrackItems && singleTrackItems.length > 0) {
          // Sort by resolution in ascending order
          singleTrackItems.sort((a, b) => {
            const aRes = getMediaResolution(a);
            const bRes = getMediaResolution(b);
            return aRes - bRes;
          });

          if (!singleTrackItems[0]) return [];
          let bestItem: MediaLink = singleTrackItems[0];
          const parsedMaxRes = parseInt(maxRes?.replace(/\D/g, '') || '720');
          singleTrackItems.forEach((m) => {
            if (parsedMaxRes && getMediaResolution(m) <= parsedMaxRes) {
              bestItem = m;
            }
          });
          return [bestItem] as MediaLink[];
        }
      }
    }

    // Multiple tracks: find best item for each track
    const bestItems: MediaLink[] = [];
    const sortedTracks = Array.from(trackGroups.keys()).sort((a, b) => a - b);

    sortedTracks.forEach((track) => {
      const trackItems = trackGroups.get(track);
      if (trackItems && trackItems.length > 0) {
        // Sort by resolution in ascending order
        trackItems.sort((a, b) => {
          const aRes = getMediaResolution(a);
          const bRes = getMediaResolution(b);
          return aRes - bRes;
        });

        if (!trackItems[0]) return null;
        let bestItem = trackItems[0] as MediaLink;
        const parsedMaxRes = parseInt(maxRes?.replace(/\D/g, '') || '720');
        trackItems.forEach((m) => {
          if (parsedMaxRes && getMediaResolution(m) <= parsedMaxRes) {
            bestItem = m as MediaLink;
          }
        });
        bestItems.push(bestItem);
      }
    });

    return bestItems.length > 0 ? (bestItems as MediaLink[]) : [];
  } catch (e) {
    errorCatcher(e);
    if (!mediaLinks) return [];
    return mediaLinks?.length ? mediaLinks : [];
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
