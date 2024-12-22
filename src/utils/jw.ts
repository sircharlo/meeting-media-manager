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
) =>
  [
    ...(full ? [docid, pub] : [pub || docid]),
    langwritten,
    issue,
    ...(full ? [track, fileformat] : []),
  ]
    .filter((p) => !isEmpty(p))
    .join('_');

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

    mediaLinks = mediaLinks.sort((a, b) => {
      const aRes = getMediaResolution(a);
      const bRes = getMediaResolution(b);
      return aRes - bRes;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let bestItem: MediaItemsMediatorFile | MediaLink = mediaLinks[0]!;
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
