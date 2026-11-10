import type { DownloadProgressItem } from 'src/types';

/** A download with a known size that is still on its way. */
export const isPendingDownload = (item: DownloadProgressItem) =>
  !!item.total && !item.complete && !item.error;

/**
 * How far some downloads have come, by bytes, from 0 to 100. Files without a
 * known size don't count; finished and failed ones count as all there, since
 * nothing more of them is coming.
 */
export const downloadsPercent = (items: DownloadProgressItem[]) => {
  let total = 0;
  let loaded = 0;

  for (const item of items) {
    if (!item.total) continue;
    total += item.total;
    loaded += isPendingDownload(item)
      ? Math.min(item.loaded ?? 0, item.total)
      : item.total;
  }

  return total ? (loaded / total) * 100 : 0;
};

/**
 * Downloads by the name of the file they save, the one thing a media item
 * shares with its download (which is keyed by URL and folder). When two
 * share a name, the one still running wins.
 */
export const downloadsByFilename = (items: DownloadProgressItem[]) => {
  const isRunning = (item: DownloadProgressItem) =>
    !item.complete && !item.error;
  const byFilename = new Map<string, DownloadProgressItem>();

  for (const item of items) {
    const known = byFilename.get(item.filename);
    if (!known || (isRunning(item) && !isRunning(known))) {
      byFilename.set(item.filename, item);
    }
  }

  return byFilename;
};
