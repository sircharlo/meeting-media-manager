import { describe, expect, it } from 'vitest';

import { mmmIconMapFn } from '../icon-map';

describe('mmmIconMapFn', () => {
  it.each([
    ['chevron_left', 'mmm-left'],
    ['keyboard_arrow_down', 'mmm-down'],
    ['arrow_drop_down', 'mmm-dropdown-arrow'],
    ['cancel', 'mmm-clear'],
    ['close', 'mmm-clear'],
    ['check', 'mmm-check'],
    ['mmm-play', 'mmm-play'],
  ])('maps %s to the %s icon class', (iconName, cls) => {
    expect(mmmIconMapFn(iconName)).toEqual({ cls });
  });
});
