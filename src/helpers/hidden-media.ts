import type { MediaItem, MediaSectionWithConfig } from 'src/types';

import { decodeEntities } from 'src/utils/general';

/**
 * Plain text from a title that may hold HTML: a publication's media can be
 * named with its markup, e.g. `<span class="eloc">wcg p. 90-93</span>
 * <span class="etitle">…</span>`, which its row renders but a tooltip shows
 * as is.
 */
const toPlainText = (text: string) =>
  decodeEntities(text).replaceAll(/\s+/g, ' ').trim();

/**
 * A media item's name as its row shows it (see MediaItem.vue): its title,
 * or else its file's name, or else its caption, as plain text.
 */
const getMediaItemName = (item: MediaItem): string => {
  if (item.title) return toPlainText(item.title);
  if (item.fileUrl) {
    const fileName = item.fileUrl.split(/[\\/]/).pop() ?? '';
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }
  return toPlainText(item.extractCaption ?? '');
};

/**
 * A song's name with its number, from its tag (the number on its row's
 * badge), unless its name already has it.
 */
const withSongNumber = (
  item: MediaItem,
  name: string,
  formatSong?: (songNumber: string, name: string) => string,
) => {
  const songNumber = item.tag?.type === 'song' ? item.tag.value : undefined;
  if (!formatSong || songNumber === undefined || songNumber === '') {
    return name;
  }
  if (name.includes(String(songNumber))) return name;
  return formatSong(String(songNumber), name);
};

/**
 * The names of a day's hidden media items, in the order of its sections and
 * of their items: a hidden item's own name or, in a group that isn't hidden
 * itself, those of its hidden items.
 * @param sections The day's media sections.
 * @param formatSong Names a song with its number, e.g. "Song 151: …".
 */
export const getHiddenMediaNames = (
  sections: MediaSectionWithConfig[] | undefined,
  formatSong?: (songNumber: string, name: string) => string,
): string[] => {
  const hiddenItems = (sections ?? []).flatMap((section) =>
    (section.items ?? []).flatMap((item) =>
      item.hidden
        ? [item]
        : (item.children ?? []).filter((child) => child.hidden),
    ),
  );

  return hiddenItems
    .map((item) => withSongNumber(item, getMediaItemName(item), formatSong))
    .filter(Boolean);
};
