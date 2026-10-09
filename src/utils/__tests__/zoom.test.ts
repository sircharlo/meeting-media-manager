import { describe, expect, it } from 'vitest';

import { parseZoomMeetingId } from '../zoom';

describe('parseZoomMeetingId', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['987 654 3210', '9876543210'],
    ['987-654-3210', '9876543210'],
    ['  123 4567 8901  ', '12345678901'],
    ['123456789', '123456789'],
    ['https://us02web.zoom.us/j/12345678901?pwd=abc123', '12345678901'],
    ['https://zoom.us/j/9876543210', '9876543210'],
    ['https://app.zoom.us/wc/join/9876543210', '9876543210'],
    ['zoom.us/s/987654321', '987654321'],
  ])('reads %j as %j', (input, expected) => {
    expect(parseZoomMeetingId(input)).toBe(expected);
  });

  it.each([
    [''],
    [null],
    [undefined],
    ['12345678'],
    ['123456789012'],
    ['meeting 9876543210'],
    ['https://zoom.us/my/personal-room'],
    ['514618515a'],
  ])('finds no meeting ID in %j', (input) => {
    expect(parseZoomMeetingId(input)).toBeNull();
  });
});
