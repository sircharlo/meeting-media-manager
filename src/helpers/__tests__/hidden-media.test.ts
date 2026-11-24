import type { MediaItem, MediaSectionWithConfig } from 'src/types';

import { describe, expect, it } from 'vitest';

import { getHiddenMediaNames } from '../hidden-media';

const item = (changes: Partial<MediaItem>): MediaItem =>
  ({
    title: '',
    type: 'media',
    uniqueId: crypto.randomUUID(),
    ...changes,
  }) as MediaItem;

const section = (items: MediaItem[]) =>
  ({ config: {}, items }) as unknown as MediaSectionWithConfig;

describe('getHiddenMediaNames', () => {
  it('has nothing to list without sections or hidden items', () => {
    expect(getHiddenMediaNames(undefined)).toEqual([]);
    expect(getHiddenMediaNames([section([item({ title: 'Song 1' })])])).toEqual(
      [],
    );
  });

  it('lists the hidden items in the order of their sections and items', () => {
    expect(
      getHiddenMediaNames([
        section([
          item({ hidden: true, title: 'Song 12' }),
          item({ title: 'Shown' }),
        ]),
        section([
          item({ hidden: true, title: 'Picture 1' }),
          item({ hidden: true, title: 'Song 151' }),
        ]),
      ]),
    ).toEqual(['Song 12', 'Picture 1', 'Song 151']);
  });

  it("lists a hidden group once, and a shown group's hidden items one by one", () => {
    expect(
      getHiddenMediaNames([
        section([
          item({
            children: [item({ hidden: true, title: 'Inside a hidden group' })],
            hidden: true,
            title: 'Hidden group',
          }),
          item({
            children: [
              item({ hidden: true, title: 'Hidden picture' }),
              item({ title: 'Shown picture' }),
            ],
            title: 'Shown group',
          }),
        ]),
      ]),
    ).toEqual(['Hidden group', 'Hidden picture']);
  });

  it('names an untitled item after its file, or else its caption', () => {
    expect(
      getHiddenMediaNames([
        section([
          item({
            fileUrl: 'file:///C:/Media/My%20talk%20picture.jpg',
            hidden: true,
          }),
          item({ fileUrl: 'file:///C:/Media/100%25.jpg', hidden: true }),
          item({ fileUrl: 'file:///C:/Media/bad%E0.jpg', hidden: true }),
          item({ extractCaption: 'Picture from the article', hidden: true }),
          item({ hidden: true }),
        ]),
      ]),
    ).toEqual([
      'My talk picture.jpg',
      '100%.jpg',
      'bad%E0.jpg',
      'Picture from the article',
    ]);
  });
});
