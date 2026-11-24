import { describe, expect, it, vi } from 'vitest';

import { getPageBanners, type PageBannerState } from '../page-banners';

const state = (changes: Partial<PageBannerState> = {}): PageBannerState => ({
  coWeek: false,
  duplicateSongs: false,
  hiddenMediaNames: [],
  obsDisconnected: false,
  obsSceneListError: false,
  showAllMedia: vi.fn(),
  someItemsHidden: false,
  ...changes,
});

const find = (banners: ReturnType<typeof getPageBanners>, key: string) =>
  banners.find((banner) => banner.key === key);

describe('getPageBanners', () => {
  it('shows nothing when there is nothing to say', () => {
    expect(getPageBanners(state())).toEqual([]);
  });

  it('warns that some media items are hidden, outside the circuit overseer week', () => {
    const banner = find(
      getPageBanners(state({ someItemsHidden: true })),
      'hidden-items',
    );

    expect(banner).toMatchObject({
      icon: 'mmm-file-hidden',
      textKey: 'some-media-items-are-hidden',
      type: 'warning',
    });
  });

  // That week, M³ itself hides the closing song and the Congregation Bible
  // Study's media.
  it('only informs that media items are hidden during the circuit overseer week', () => {
    const banner = find(
      getPageBanners(state({ coWeek: true, someItemsHidden: true })),
      'hidden-items',
    );

    expect(banner?.type).toBe('info');
  });

  it('lists the hidden media items under its ⓘ', () => {
    const banner = find(
      getPageBanners(
        state({
          hiddenMediaNames: ['Song 12', 'Picture 1'],
          someItemsHidden: true,
        }),
      ),
      'hidden-items',
    );

    expect(banner?.details).toEqual(['Song 12', 'Picture 1']);
  });

  it('shows all the hidden media items again from its button', () => {
    const showAllMedia = vi.fn();
    const banner = find(
      getPageBanners(state({ showAllMedia, someItemsHidden: true })),
      'hidden-items',
    );

    expect(banner?.actions).toHaveLength(1);
    expect(banner?.actions?.[0]?.labelKey).toBe('show-all-media');
    banner?.actions?.[0]?.onClick();
    expect(showAllMedia).toHaveBeenCalledOnce();
  });

  it('gives every banner the type of what it says, in order', () => {
    const banners = getPageBanners(
      state({
        coWeek: true,
        duplicateSongs: true,
        obsDisconnected: true,
        obsSceneListError: true,
        someItemsHidden: true,
      }),
    );

    expect(banners.map(({ key, type }) => [key, type])).toEqual([
      ['obs', 'negative'],
      ['obs-scene-list-error', 'warning'],
      ['hidden-items', 'info'],
      ['duplicate-songs', 'warning'],
    ]);
  });
});
