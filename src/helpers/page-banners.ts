import type { NoticeType } from 'src/types';

/** A banner over the media list (see MediaCalendarPage.vue). */
export interface PageBanner {
  actions?: { labelKey: string; onClick: () => void }[];
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
  /** OBS Studio is to be used today, but M³ isn't connected to it. */
  obsDisconnected: boolean;
  /** M³ is connected to OBS Studio, but couldn't get its scenes. */
  obsSceneListError: boolean;
  /** Shows the selected day's hidden media items again. */
  showAllMedia: () => void;
  /** Some of the selected day's media items are hidden. */
  someItemsHidden: boolean;
}

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
