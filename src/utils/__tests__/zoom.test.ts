import { describe, expect, it } from 'vitest';

import {
  areZoomButtonsLearned,
  isOlderZoomVersion,
  parseZoomMeetingId,
  zoomReleaseOf,
} from '../zoom';

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

describe('areZoomButtonsLearned', () => {
  const learned = {
    zoomMicOffTitle: 'Unmute',
    zoomMicOnTitle: 'Mute',
    zoomVideoOffTitle: 'Start Video',
    zoomVideoOnTitle: 'Stop Video',
  };

  it('needs both names of both the microphone and the camera button', () => {
    expect(areZoomButtonsLearned(learned)).toBe(true);
    expect(areZoomButtonsLearned({ ...learned, zoomMicOnTitle: null })).toBe(
      false,
    );
    expect(areZoomButtonsLearned({ ...learned, zoomVideoOffTitle: null })).toBe(
      false,
    );
    expect(areZoomButtonsLearned(undefined)).toBe(false);
  });
});

describe('isOlderZoomVersion', () => {
  it.each([
    ['6.5.12.14128', '7.2.1', true],
    ['7.1.9.48550', '7.2.1', true],
    ['7.2.0.40000', '7.2.1', true],
    ['7.2.1.48556', '7.2.1', false],
    ['7.2.10.1', '7.2.1', false],
    ['7.3.0.100', '7.2.1', false],
    ['8.0.0.1', '7.2.1', false],
    ['10.0.0.1', '9.9.9', false],
  ])('%s older than %s: %s', (version, than, older) => {
    expect(isOlderZoomVersion(version, than)).toBe(older);
  });

  it("isn't sure, so says no, about something that isn't a version", () => {
    expect(isOlderZoomVersion('', '7.2.1')).toBe(false);
    expect(isOlderZoomVersion('Zoom', '7.2.1')).toBe(false);
    expect(isOlderZoomVersion('6.5', '7.2.1')).toBe(false);
  });
});

describe('zoomReleaseOf', () => {
  it('drops the build number', () => {
    expect(zoomReleaseOf('6.5.12.14128')).toBe('6.5.12');
    expect(zoomReleaseOf('7.2.1')).toBe('7.2.1');
  });

  it("keeps what doesn't read as a version", () => {
    expect(zoomReleaseOf('6.5')).toBe('6.5');
  });
});
