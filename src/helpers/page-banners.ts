import type { NoticeType } from 'src/types';

/** A banner over the media list (see MediaCalendarPage.vue). */
export interface PageBanner {
  actions?: { labelKey: string; onClick: () => void }[];
  /** A second sentence, after textKey's, that says why. */
  captionKey?: string;
  /** Listed under the banner's ⓘ (see NoticeBanner.vue). */
  details?: string[];
  icon: string;
  key: string;
  textKey: string;
  type: NoticeType;
}

/** What the media calendar page has to say something about. */
export interface PageBannerState {
  /** The selected day is in the circuit overseer's week. */
  coWeek: boolean;
  /** Some songs appear more than once on the selected weekend day. */
  duplicateSongs: boolean;
  /** The names of the selected day's hidden media items. */
  hiddenMediaNames: string[];
  /** The selected day's meeting, if it has one. */
  meetingType?: 'mw' | 'we' | null;
  /** OBS Studio is to be used today, but M³ isn't connected to it. */
  obsDisconnected: boolean;
  /** M³ is connected to OBS Studio, but couldn't get its scenes. */
  obsSceneListError: boolean;
  /** Shows the selected day's hidden media items again. */
  showAllMedia: () => void;
  /** Some of the selected day's media items are hidden. */
  someItemsHidden: boolean;
}

/**
 * Why media is hidden on a meeting day of the circuit overseer's visit: M³
 * itself hides the closing song of both meetings, and the Congregation Bible
 * Study's media at the midweek meeting (see jw-media.ts).
 */
const getCoWeekHiddenMediaReason = (state: PageBannerState) => {
  if (!state.coWeek) return undefined;
  if (state.meetingType === 'mw') return 'hidden-media-co-week-mw';
  if (state.meetingType === 'we') return 'hidden-media-co-week-we';
  return undefined;
};

/** The banners the media calendar page shows, in order. */
export const getPageBanners = (state: PageBannerState): PageBanner[] => {
  const banners: PageBanner[] = [];

  if (state.obsDisconnected) {
    banners.push({
      icon: 'mmm-obs-studio',
      key: 'obs',
      textKey: 'obs-studio-disconnected-banner',
      type: 'negative',
    });
  }

  if (state.obsSceneListError) {
    banners.push({
      icon: 'mmm-obs-studio',
      key: 'obs-scene-list-error',
      textKey: 'obs-studio-scene-list-error-banner',
      type: 'warning',
    });
  }

  if (state.someItemsHidden) {
    banners.push({
      actions: [{ labelKey: 'show-all-media', onClick: state.showAllMedia }],
      captionKey: getCoWeekHiddenMediaReason(state),
      details: state.hiddenMediaNames,
      icon: 'mmm-file-hidden',
      key: 'hidden-items',
      textKey: 'some-media-items-are-hidden',
      // During the circuit overseer's visit, M³ itself hides the closing
      // song and the Congregation Bible Study's media (see jw-media.ts), so
      // hidden media is expected then: information, not a warning.
      type: state.coWeek ? 'info' : 'warning',
    });
  }

  if (state.duplicateSongs) {
    banners.push({
      icon: 'mmm-music-note',
      key: 'duplicate-songs',
      textKey: 'some-songs-are-duplicated',
      type: 'warning',
    });
  }

  return banners;
};
