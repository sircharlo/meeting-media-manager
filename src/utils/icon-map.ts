import type { GlobalQuasarIconMapFn } from 'quasar';

/**
 * Maps the Material icon names Quasar components use internally (chevrons,
 * dropdown arrows, close buttons...) onto the app's own `mmm-*` icon font,
 * and prefixes any other bare icon name with `mmm-`. Installed as
 * `$q.iconMapFn` by every window that renders Quasar components with
 * built-in icons (MainLayout, MediaPlayerPage).
 */
export const mmmIconMapFn: GlobalQuasarIconMapFn = (iconName) => {
  if (iconName.startsWith('chevron_')) {
    iconName = iconName.replace('chevron_', 'mmm-');
  } else if (iconName.startsWith('keyboard_arrow_')) {
    iconName = iconName.replace('keyboard_arrow_', 'mmm-');
  } else if (iconName.startsWith('arrow_drop_')) {
    iconName = 'mmm-dropdown-arrow';
  } else if (iconName === 'cancel' || iconName === 'close') {
    iconName = 'clear';
  }
  if (!iconName.startsWith('mmm-')) {
    iconName = 'mmm-' + iconName;
  }
  return {
    cls: iconName,
  };
};
