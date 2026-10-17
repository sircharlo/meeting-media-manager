export const SORTER = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

// Shared by the downloads popup's row-collapse animation and the
// meeting-check-status prune timer so the two can't drift apart.
export const DOWNLOAD_ROW_AUTO_COLLAPSE_MS = 4000;

// Below this window width, media-list rows collapse further than Quasar's
// own `xs` (600px) breakpoint already handles - see EmptyState.vue and
// MediaItem.vue.
export const TINY_SCREEN_WIDTH = 550;

// v-ripple options for a native <button>. The browser already turns Enter
// and Space into a click, so v-ripple's own key handling (Enter by default)
// would show a second ripple on top of the click's; and a keyboard click has
// no pointer position, so the ripple starts from the center.
export const NATIVE_BUTTON_RIPPLE = { center: true, keyCodes: [] as number[] };
