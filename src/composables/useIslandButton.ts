import { computed, type MaybeRefOrGetter, toValue } from 'vue';

/**
 * What an action island button shows, the same way on every button:
 * - normal: on, nothing to report;
 * - off: turned off on purpose (faded, with its "off" icon, still clickable);
 * - busy: working on something (a spinner in place of its icon);
 * - attention: worth a look, though nothing failed (orange);
 * - error: something failed (red);
 * - live: recording (its icon red on a white dot, pulsing; give the icon
 *   the island-btn__icon class).
 * A red button never means anything but an error.
 */
export type IslandButtonStatus =
  'attention' | 'busy' | 'error' | 'live' | 'normal' | 'off';

const BUTTON_COLORS: Partial<Record<IslandButtonStatus, string>> = {
  attention: 'warning',
  error: 'negative',
};

// On the white button of an open popup, the icon carries the status.
const ICON_COLORS: Partial<Record<IslandButtonStatus, string>> = {
  ...BUTTON_COLORS,
  live: 'negative',
};

/**
 * The q-btn color, text color and classes for a button's status. While its
 * popup is open, the button turns white and its icon takes the status color.
 */
export const useIslandButton = (
  status: MaybeRefOrGetter<IslandButtonStatus>,
  popupOpen: MaybeRefOrGetter<boolean | undefined> = false,
) => {
  const color = computed(() => {
    if (toValue(popupOpen)) return 'white';
    return BUTTON_COLORS[toValue(status)] ?? 'white-transparent';
  });

  const textColor = computed(() => {
    if (!toValue(popupOpen)) return '';
    return ICON_COLORS[toValue(status)] ?? 'primary';
  });

  const classes = computed(() => {
    const closed = !toValue(popupOpen);
    return {
      'island-btn--live': closed && toValue(status) === 'live',
      'island-btn--off': closed && toValue(status) === 'off',
    };
  });

  const busy = computed(() => toValue(status) === 'busy');

  return { busy, classes, color, textColor };
};
