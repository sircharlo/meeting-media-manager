import { describe, expect, it, vi } from 'vitest';

import {
  getCaptureSizeBounds,
  getContainFitRect,
  getFileNameMaskFromPubMediaId,
  isAudio,
  isHeic,
  isImage,
  isJwPlaylist,
  isJwpub,
  isLikelyFile,
  isPdf,
  isSvg,
  isVideo,
} from '../media';

// Mock electron API
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

describe('Media Utilities', () => {
  describe('getFileNameMaskFromPubMediaId', () => {
    it('should replace the last underscore segment with a wildcard', () => {
      expect(getFileNameMaskFromPubMediaId('S-337-26v_F_2')).toBe(
        'S-337-26v_F_*',
      );
    });

    it('should append a wildcard when there is no underscore', () => {
      expect(getFileNameMaskFromPubMediaId('nwt')).toBe('nwt*');
    });

    it('should return undefined when no pubMediaId is given', () => {
      expect(getFileNameMaskFromPubMediaId(undefined)).toBeUndefined();
      expect(getFileNameMaskFromPubMediaId('')).toBeUndefined();
    });
  });

  describe('isLikelyFile', () => {
    it('should return true for files with extensions', () => {
      expect(isLikelyFile('image.jpg')).toBe(true);
      expect(isLikelyFile('video.mp4')).toBe(true);
      expect(isLikelyFile('document.pdf')).toBe(true);
    });

    it('should return false for files without extensions', () => {
      expect(isLikelyFile('filename')).toBe(false);
      expect(isLikelyFile('path/to/file')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isLikelyFile('')).toBe(false);
      expect(isLikelyFile(null as unknown as string)).toBe(false);
      expect(isLikelyFile(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isImage', () => {
    it('should recognize common image formats', () => {
      expect(isImage('image.jpg')).toBe(true);
      expect(isImage('image.jpeg')).toBe(true);
      expect(isImage('image.png')).toBe(true);
      expect(isImage('image.gif')).toBe(true);
      expect(isImage('image.webp')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isImage('image.JPG')).toBe(true);
      expect(isImage('image.PNG')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImage('video.mp4')).toBe(false);
      expect(isImage('document.pdf')).toBe(false);
      expect(isImage('audio.mp3')).toBe(false);
    });

    it('should return false for undefined or empty values', () => {
      expect(isImage()).toBe(false);
      expect(isImage('')).toBe(false);
    });
  });

  describe('isHeic', () => {
    it('should recognize HEIC formats', () => {
      expect(isHeic('image.heic')).toBe(true);
      expect(isHeic('image.HEIC')).toBe(true);
    });

    it('should return false for non-HEIC files', () => {
      expect(isHeic('image.jpg')).toBe(false);
      expect(isHeic('image.png')).toBe(false);
    });
  });

  describe('isSvg', () => {
    it('should recognize SVG files', () => {
      expect(isSvg('image.svg')).toBe(true);
      expect(isSvg('image.SVG')).toBe(true);
    });

    it('should return false for non-SVG files', () => {
      expect(isSvg('image.jpg')).toBe(false);
      expect(isSvg('image.png')).toBe(false);
    });
  });

  describe('isVideo', () => {
    it('should recognize common video formats', () => {
      expect(isVideo('video.mp4')).toBe(true);
      expect(isVideo('video.mov')).toBe(true);
      expect(isVideo('video.avi')).toBe(true);
      expect(isVideo('video.mkv')).toBe(true);
      expect(isVideo('video.webm')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isVideo('video.MP4')).toBe(true);
      expect(isVideo('video.MOV')).toBe(true);
    });

    it('should return false for non-video files', () => {
      expect(isVideo('image.jpg')).toBe(false);
      expect(isVideo('document.pdf')).toBe(false);
      expect(isVideo('audio.mp3')).toBe(false);
    });
  });

  describe('isAudio', () => {
    it('should recognize common audio formats', () => {
      expect(isAudio('audio.mp3')).toBe(true);
      expect(isAudio('audio.wav')).toBe(true);
      expect(isAudio('audio.flac')).toBe(true);
      expect(isAudio('audio.m4a')).toBe(true);
      expect(isAudio('audio.ogg')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isAudio('audio.MP3')).toBe(true);
      expect(isAudio('audio.WAV')).toBe(true);
    });

    it('should return false for non-audio files', () => {
      expect(isAudio('image.jpg')).toBe(false);
      expect(isAudio('video.mp4')).toBe(false);
      expect(isAudio('document.pdf')).toBe(false);
    });
  });

  describe('isPdf', () => {
    it('should recognize PDF files', () => {
      expect(isPdf('document.pdf')).toBe(true);
      expect(isPdf('document.PDF')).toBe(true);
    });

    it('should return false for non-PDF files', () => {
      expect(isPdf('document.docx')).toBe(false);
      expect(isPdf('image.jpg')).toBe(false);
    });
  });

  describe('isJwpub', () => {
    it('should recognize JWPUB files', () => {
      expect(isJwpub('publication.jwpub')).toBe(true);
      expect(isJwpub('publication.JWPUB')).toBe(true);
    });

    it('should return false for non-JWPUB files', () => {
      expect(isJwpub('publication.pdf')).toBe(false);
      expect(isJwpub('publication.zip')).toBe(false);
    });
  });

  describe('isJwlPlaylist', () => {
    it('should recognize JWL playlist files', () => {
      expect(isJwPlaylist('playlist.jwlplaylist')).toBe(true);
      expect(isJwPlaylist('playlist.JWLPLAYLIST')).toBe(true);
    });

    it('should return false for non-JWL files', () => {
      expect(isJwPlaylist('playlist.m3u')).toBe(false);
      expect(isJwPlaylist('playlist.txt')).toBe(false);
    });
  });

  describe('getContainFitRect', () => {
    it('fills the target box when the aspect ratios already match', () => {
      expect(getContainFitRect(1920, 1080, 320, 180)).toEqual({
        height: 180,
        width: 320,
        x: 0,
        y: 0,
      });
    });

    it('pillarboxes a source narrower than the target, centered', () => {
      // A 4:3 video frame drawn into a 16:9 preview box.
      expect(getContainFitRect(1440, 1080, 320, 180)).toEqual({
        height: 180,
        width: 240,
        x: 40,
        y: 0,
      });
    });

    it('letterboxes a source wider than the target, centered', () => {
      // A 21:9 capture frame drawn into a 16:9 preview box.
      expect(getContainFitRect(3440, 1440, 320, 180)).toEqual({
        height: 134,
        width: 320,
        x: 0,
        y: 23,
      });
    });

    it('never exceeds the target box after rounding', () => {
      const rect = getContainFitRect(1001, 999, 333, 187);
      expect(rect.x + rect.width).toBeLessThanOrEqual(333);
      expect(rect.y + rect.height).toBeLessThanOrEqual(187);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
    });

    it('falls back to the full target box when a size is unusable', () => {
      const full = { height: 180, width: 320, x: 0, y: 0 };
      expect(getContainFitRect(0, 0, 320, 180)).toEqual(full);
      expect(getContainFitRect(Number.NaN, 1080, 320, 180)).toEqual(full);
      expect(getContainFitRect(-1920, 1080, 320, 180)).toEqual(full);
    });
  });

  describe('getCaptureSizeBounds', () => {
    // Chromium's own integer aspect comparison for legacy size bounds.
    const approxAspect = (width: number, height: number) =>
      Math.floor((100 * width) / height);
    // What Chromium needs to see to follow the source size instead of
    // letterboxing into a fixed frame: every min > 1, min != max, and
    // min/max aspect ratios that differ by its comparison. Returns the
    // broken invariants so a failure says which one.
    const sizeFollowingViolations = (
      bounds: ReturnType<typeof getCaptureSizeBounds>,
    ) => {
      const violations: string[] = [];
      if (!(bounds.minWidth > 1)) violations.push('minWidth must be > 1');
      if (!(bounds.minHeight > 1)) violations.push('minHeight must be > 1');
      if (!(bounds.maxWidth > bounds.minWidth)) {
        violations.push('maxWidth must exceed minWidth');
      }
      if (!(bounds.maxHeight > bounds.minHeight)) {
        violations.push('maxHeight must exceed minHeight');
      }
      if (
        approxAspect(bounds.minWidth, bounds.minHeight) ===
        approxAspect(bounds.maxWidth, bounds.maxHeight)
      ) {
        violations.push('min and max aspect ratios must differ');
      }
      return violations;
    };

    it('caps at the viewport in device pixels', () => {
      const bounds = getCaptureSizeBounds(1200, 800, 1.5);
      expect(bounds).toMatchObject({ maxHeight: 1200, maxWidth: 1800 });
      expect(sizeFollowingViolations(bounds)).toEqual([]);
    });

    it('treats a missing or invalid device pixel ratio as 1', () => {
      expect(getCaptureSizeBounds(1200, 800)).toMatchObject({
        maxHeight: 800,
        maxWidth: 1200,
      });
      expect(getCaptureSizeBounds(1200, 800, 0)).toMatchObject({
        maxHeight: 800,
        maxWidth: 1200,
      });
    });

    it('never goes below the floor or above the ceiling', () => {
      expect(getCaptureSizeBounds(100, 50)).toMatchObject({
        maxHeight: 180,
        maxWidth: 320,
      });
      expect(getCaptureSizeBounds(0, 0)).toMatchObject({
        maxHeight: 180,
        maxWidth: 320,
      });
      expect(getCaptureSizeBounds(5120, 2880, 2)).toMatchObject({
        maxHeight: 2160,
        maxWidth: 3840,
      });
    });

    it('nudges a square viewport so the max aspect never matches the 2x2 min', () => {
      for (const [width, height] of [
        [1000, 1000],
        [1005, 1000],
        [720, 720],
      ] as const) {
        const bounds = getCaptureSizeBounds(width, height);
        expect(sizeFollowingViolations(bounds)).toEqual([]);
        expect(bounds.maxWidth).toBeGreaterThan(bounds.maxHeight);
        // A cap, so widening it slightly is harmless - but only slightly.
        expect(bounds.maxWidth).toBeLessThanOrEqual(
          Math.ceil(bounds.maxHeight * 1.01),
        );
      }
    });

    it('stays size-following for landscape and portrait viewports alike', () => {
      for (const [width, height] of [
        [3440, 1440],
        [1920, 1200],
        [600, 1000],
        [510, 540],
      ] as const) {
        expect(
          sizeFollowingViolations(getCaptureSizeBounds(width, height)),
        ).toEqual([]);
      }
    });
  });
});
