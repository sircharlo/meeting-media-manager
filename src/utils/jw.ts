import type { PublicationFetcher } from 'src/types';

import { isEmpty } from './general';

/**
 * Gets a unique identifier for a publication.
 * @param param0 The publication to get the identifier for.
 * @param full Weather to include all parts of the identifier.
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
