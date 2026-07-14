export const SORTER = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

// Shared by the downloads popup's row-collapse animation and the
// meeting-check-status prune timer so the two can't drift apart.
export const DOWNLOAD_ROW_AUTO_COLLAPSE_MS = 4000;
