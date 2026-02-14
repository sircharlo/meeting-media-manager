import type { MediaLink, PublicationFetcher } from 'src/types';

import { describe, expect, it, vi } from 'vitest';

import {
  findBestResolution,
  findBestResolutions,
  getPubId,
  isMediaLink,
} from '../jw';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

describe('jw utils', () => {
  describe('getPubId', () => {
    it('should generate a pub id for simple publication', () => {
      const pub: PublicationFetcher = {
        issue: '2024',
        langwritten: 'E',
        pub: 'nwt',
      };
      expect(getPubId(pub)).toBe('nwt_E_2024');
    });

    it('should handle wp special case', () => {
      const pub: PublicationFetcher = {
        issue: '20240101',
        langwritten: 'E',
        pub: 'w',
      };
      expect(getPubId(pub)).toBe('wp_E_20240101');
    });

    it('should include docid if full is true', () => {
      const pub: PublicationFetcher = {
        docid: 123,
        fileformat: 'PDF',
        issue: '2024',
        langwritten: 'E',
        pub: 'nwt',
        track: 1,
      };
      expect(getPubId(pub, true)).toBe('123_nwt_E_2024_1_PDF');
    });
  });

  describe('findBestResolution', () => {
    const mockLinks: MediaLink[] = [
      {
        frameHeight: 240,
        label: '240p',
        subtitled: true,
        track: 1,
      } as unknown as MediaLink,
      {
        frameHeight: 480,
        label: '480p',
        subtitled: false,
        track: 1,
      } as unknown as MediaLink,
      {
        frameHeight: 720,
        label: '720p',
        subtitled: false,
        track: 1,
      } as unknown as MediaLink,
      {
        frameHeight: 1080,
        label: '1080p',
        subtitled: false,
        track: 1,
      } as unknown as MediaLink,
    ];

    it('should return null for empty links', () => {
      expect(findBestResolution([], '720p')).toBeNull();
    });

    it('should prefer non-subtitled links', () => {
      const result = findBestResolution(mockLinks, '1080p');
      expect(result?.subtitled).toBe(false);
    });

    it('should find exact resolution match', () => {
      const result = findBestResolution(mockLinks, '480p');
      expect(result?.label).toBe('480p');
    });

    it('should find best resolution below maxRes', () => {
      const result = findBestResolution(mockLinks, '500p');
      expect(result?.label).toBe('480p');
    });

    it('should return highest available if maxRes is very high', () => {
      const result = findBestResolution(mockLinks, '2000p');
      expect(result?.label).toBe('1080p');
    });
  });

  describe('findBestResolutions', () => {
    const mockLinks: MediaLink[] = [
      { label: '480p', subtitled: false, track: 1 } as unknown as MediaLink,
      { label: '720p', subtitled: false, track: 1 } as unknown as MediaLink,
      { label: '480p', subtitled: false, track: 2 } as unknown as MediaLink,
      { label: '1080p', subtitled: false, track: 2 } as unknown as MediaLink,
    ];

    it('should return best for each track', () => {
      const result = findBestResolutions(mockLinks, '720p');
      expect(result).toHaveLength(2);
      expect(result[0]?.label).toBe('720p');
      expect(result[0]?.track).toBe(1);
      expect(result[1]?.label).toBe('480p');
      expect(result[1]?.track).toBe(2);
    });

    it('should sort by track number', () => {
      const reversedLinks = [...mockLinks].reverse();
      const result = findBestResolutions(reversedLinks, '1080p');
      expect(result[0]?.track).toBe(1);
      expect(result[1]?.track).toBe(2);
    });
  });

  describe('isMediaLink', () => {
    it('should identify MediaLink', () => {
      expect(isMediaLink({ label: 'test' } as unknown as MediaLink)).toBe(true);
    });

    it('should identify non-MediaLink', () => {
      expect(
        isMediaLink({ progressiveDownloadURL: 'test' } as unknown as MediaLink),
      ).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isMediaLink(null)).toBe(false);
      expect(isMediaLink(undefined)).toBe(false);
    });
  });
});
