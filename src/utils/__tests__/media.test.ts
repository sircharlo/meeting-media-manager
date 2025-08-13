import { describe, expect, it, vi } from 'vitest';

import {
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
      expect(isImage(undefined)).toBe(false);
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
});
