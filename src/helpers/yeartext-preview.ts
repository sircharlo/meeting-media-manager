import { isOutsideMeetingTime } from 'src/helpers/feature-nudges';

// The years whose yeartext preview was offered this session.
const offeredThisSession = new Set<number>();

/**
 * Whether to offer the preview of `year`'s yeartext now (in December, see
 * MainLayout's checkYeartextPreview), noting it if so. Once per session:
 * "Later", or leaving the question unanswered, waits for the next start,
 * although a change of profile, yeartext or connection checks again. And not
 * from shortly before a meeting until it ends, since the question stays up
 * until answered.
 */
export const takeYeartextPreviewOffer = (year: number, now = new Date()) => {
  if (offeredThisSession.has(year) || !isOutsideMeetingTime(now)) return false;
  offeredThisSession.add(year);
  return true;
};

export const __testables = {
  reset: () => {
    offeredThisSession.clear();
  },
};
