import type { MediaItem, MediaSectionWithConfig } from 'src/types';

/**
 * A media item's name as its row shows it (see MediaItem.vue): its title,
 * or else its file's name, or else its caption.
 */
const getMediaItemName = (item: MediaItem): string => {
  if (item.title) return item.title;
  if (item.fileUrl) {
    const fileName = item.fileUrl.split(/[\\/]/).pop() ?? '';
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }
  return item.extractCaption ?? '';
};

/**
 * The names of a day's hidden media items, in the order of its sections and
 * of their items: a hidden item's own name or, in a group that isn't hidden
 * itself, those of its hidden items.
 */
export const getHiddenMediaNames = (
  sections: MediaSectionWithConfig[] | undefined,
): string[] => {
  const hiddenItems = (sections ?? []).flatMap((section) =>
    (section.items ?? []).flatMap((item) =>
      item.hidden
        ? [item]
        : (item.children ?? []).filter((child) => child.hidden),
    ),
  );

  return hiddenItems.map(getMediaItemName).filter(Boolean);
};
