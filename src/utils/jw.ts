import type { PublicationFetcher } from 'src/types';

import { isEmpty } from './general';

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
