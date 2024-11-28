import type { MaxRes, MediaItemsMediatorFile, MediaLink } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

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

export function isMediaLink(
  item: MediaItemsMediatorFile | MediaLink | null,
): item is MediaLink {
  if (!item) return false;
  return !('progressiveDownloadURL' in item);
}
