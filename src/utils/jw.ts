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
 * @param full Wether to include all parts of the identifier.
 * @returns The publication identifier.
 */
export const getPubId = (
  { docid, fileformat, issue, langwritten, pub, track }: PublicationFetcher,
  full?: boolean,
) =>
  [
    ...(full ? [docid, pub] : [pub || docid]),
    langwritten,
    issue,
    ...(full ? [track, fileformat] : []),
  ]
    .filter((p) => !isEmpty(p))
    .join('_');

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

    let bestItem = null;
    let bestHeight = 0;
    const parsedMaxRes = parseInt(maxRes?.replace(/\D/g, '') || '0');

    if (mediaLinks.some((m) => !m.subtitled)) {
      mediaLinks = mediaLinks.filter((m) => !m.subtitled) as
        | MediaItemsMediatorFile[]
        | MediaLink[];
    }

    for (const mediaLink of mediaLinks) {
      if (
        mediaLink.frameHeight <= parsedMaxRes &&
        mediaLink.frameHeight >= bestHeight
      ) {
        bestItem = mediaLink;
        bestHeight = mediaLink.frameHeight;
      }
    }
    return bestItem;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks?.length ? mediaLinks[mediaLinks.length - 1] : null;
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
