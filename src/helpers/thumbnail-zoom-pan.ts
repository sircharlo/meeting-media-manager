export interface ThumbnailZoomPan {
  pan: { x: number; y: number };
  zoom: number;
}

// Each image thumbnail's zoom and pan, by media uniqueId, for the session.
// This can't live in MediaItem itself: a row is rebuilt from scratch whenever
// it moves into another section (a different MediaList renders it) or the day
// is switched away and back, which used to drop its zoom - even while the
// image was still showing, zoomed in, in the media window, so the rebuilt row
// showed it unzoomed and without its reset button.
const thumbnailZoomPans = new Map<string, ThumbnailZoomPan>();

export const getThumbnailZoomPan = (
  uniqueId: string,
): ThumbnailZoomPan | undefined => {
  const saved = thumbnailZoomPans.get(uniqueId);
  return saved && { pan: { ...saved.pan }, zoom: saved.zoom };
};

export const saveThumbnailZoomPan = (
  uniqueId: string,
  { pan, zoom }: ThumbnailZoomPan,
) => {
  if (zoom > 1) {
    thumbnailZoomPans.set(uniqueId, { pan: { x: pan.x, y: pan.y }, zoom });
  } else {
    thumbnailZoomPans.delete(uniqueId);
  }
};
