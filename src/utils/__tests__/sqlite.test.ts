import type { MultimediaItem } from 'src/types';

import { describe, expect, it } from 'vitest';

import { dedupeLinkedMultimedia } from '../sqlite';

const makeItem = (overrides: Partial<MultimediaItem>): MultimediaItem => ({
  BeginParagraphOrdinal: 1,
  Caption: '',
  CategoryType: 8,
  DocumentId: 1,
  FilePath: '',
  Label: '',
  MajorType: 0,
  MimeType: 'image/jpeg',
  MultimediaId: 0,
  TargetParagraphNumberLabel: 1,
  ...overrides,
});

describe('dedupeLinkedMultimedia', () => {
  it('merges picture crop variants and drops the linked duplicate', () => {
    const main = makeItem({
      FilePath: '',
      LinkMultimediaId: 2,
      MultimediaId: 1,
    });
    const linked = makeItem({
      FilePath: 'widescreen.jpg',
      MultimediaId: 2,
    });

    const result = dedupeLinkedMultimedia([main, linked]);

    expect(result).toHaveLength(1);
    expect(result[0]?.MultimediaId).toBe(1);
    expect(result[0]?.FilePath).toBe('widescreen.jpg');
  });

  it('does not merge a video with its cover thumbnail picture (CategoryType -1)', () => {
    const video = makeItem({
      CategoryType: -1,
      FilePath: '',
      LinkMultimediaId: 2,
      MimeType: 'video/mp4',
      MultimediaId: 1,
    });
    const cover = makeItem({
      CategoryType: 8,
      FilePath: 'cover.jpg',
      MimeType: 'image/jpeg',
      MultimediaId: 2,
    });

    const result = dedupeLinkedMultimedia([video, cover]);

    expect(result).toHaveLength(2);

    const dedupedVideo = result.find((i) => i.MultimediaId === 1);
    const dedupedCover = result.find((i) => i.MultimediaId === 2);

    // The video keeps its own (empty, to be resolved elsewhere) FilePath,
    // it must not adopt the cover picture's file.
    expect(dedupedVideo?.FilePath).toBe('');
    expect(dedupedVideo?.LinkMultimediaId).toBe(2);

    // The cover picture survives as its own, separate media item.
    expect(dedupedCover?.FilePath).toBe('cover.jpg');
  });

  it('leaves items without a LinkMultimediaId untouched', () => {
    const item = makeItem({ FilePath: 'standalone.jpg', MultimediaId: 1 });

    const result = dedupeLinkedMultimedia([item]);

    expect(result).toEqual([item]);
  });
});
