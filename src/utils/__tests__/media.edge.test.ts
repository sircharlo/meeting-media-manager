import { describe, expect, it } from 'vitest';

import { isAudio, isImage, isPdf, isVideo } from '../media';

describe('media detection edge cases', () => {
  it('handles multi-dot names and odd casing', () => {
    expect(isVideo('movie.Final.CUT.MP4')).toBe(true);
    expect(isAudio('track.MiX.WAV')).toBe(true);
    expect(isImage('photo.JpEg')).toBe(true);
    expect(isPdf('report.FINAL.PDF')).toBe(true);
  });

  it('avoids false positives without extension', () => {
    expect(isImage('imagejpg')).toBe(false);
    expect(isPdf('pdf')).toBe(false);
    expect(isAudio('.mp3')).toBe(false);
  });
});
