import { join } from 'upath';
import { describe, expect, it, vi } from 'vitest';

import {
  getParentDirectory,
  getPublicationDirectory,
  getPublicationDirectoryContents,
  getPublicationsPath,
  isFileUrl,
  removeEmptyDirs,
  trimFilepathAsNeeded,
} from '../fs';

const { fs } = window.electronApi;
const { emptyDir, ensureDir, ensureFile, exists, remove } = fs;

describe('fs edge cases', () => {
  describe('isFileUrl - tricky inputs', () => {
    it('detects various file:// forms', () => {
      expect(isFileUrl('file:///C:/Users/test/file.txt')).toBe(true);
      expect(isFileUrl('file://C:/Users/test/file.txt')).toBe(true);
    });

    it('rejects non-file URLs and paths', () => {
      expect(isFileUrl('https://example.com/file.txt')).toBe(false);
      expect(isFileUrl('C:/Users/test/file.txt')).toBe(false);
      expect(isFileUrl('\\\\server\\share\\file.txt')).toBe(false);
    });
  });

  describe('getParentDirectory - Windows and file URLs', () => {
    it('handles Windows path', () => {
      expect(getParentDirectory('C:/Users/Test/file.txt')).toMatch(
        /C:\/Users\/Test|C:\\Users\\Test/,
      );
    });

    it('handles file URL Windows path', () => {
      const parent = getParentDirectory('file:///C:/Users/Test/file.txt');
      expect(parent.replace(/\\/g, '/')).toMatch(/^\/?C:\/Users\/Test$/);
    });
  });

  describe('getPublicationDirectoryContents - ignores directories and filters correctly', () => {
    it('filters by extension and excludes directories', async () => {
      const root = await getPublicationsPath();
      const pubDir = await getPublicationDirectory({
        issue: '0',
        langwritten: 'E',
        pub: 'bt',
      });
      try {
        await ensureDir(pubDir);
        await Promise.all([
          ensureFile(join(pubDir, 'a.JPG')),
          ensureFile(join(pubDir, 'b.jpg')),
          ensureFile(join(pubDir, 'c.txt')),
          ensureDir(join(pubDir, 'subdir')),
        ]);

        const all = await getPublicationDirectoryContents({
          issue: '0',
          langwritten: 'E',
          pub: 'bt',
        });
        console.log(root, all);
        expect(all.some((p) => p.path.endsWith('subdir'))).toBe(false);
        expect(all.length).toBe(3);

        const jpgsUpper = await getPublicationDirectoryContents(
          { issue: '0', langwritten: 'E', pub: 'bt' },
          'JPG',
        );
        console.log(jpgsUpper);
        expect(jpgsUpper.length).toBe(2);
      } finally {
        await remove(pubDir);
      }
    });
  });

  describe('removeEmptyDirs - resilient to partial failures', () => {
    it('removes empty and leaves non-empty; continues after errors', async () => {
      const root = join(
        join(__dirname, '..'),
        'fs-edge-remove',
        String(Date.now()),
      );
      const empty1 = join(root, 'empty1');
      const empty2 = join(root, 'empty2');
      const filled = join(root, 'filled');
      const file = join(filled, 'f.txt');
      await emptyDir(empty1);
      await emptyDir(empty2);
      await ensureFile(file);

      // Spy on fs.remove to throw on one directory
      const removeSpy = vi.spyOn(fs, 'remove');
      removeSpy.mockImplementation(async (p: string) => {
        if (p === empty2) throw new Error('simulated remove failure');
        return (await import('fs-extra')).remove(p);
      });

      await removeEmptyDirs(root);

      expect(await exists(empty1)).toBe(false);
      // empty2 might still exist due to simulated failure
      expect(await exists(file)).toBe(true);

      removeSpy.mockRestore();
      await remove(root);
    });
  });

  describe('trimFilepathAsNeeded - collision resistance', () => {
    it('produces unique, <=230 char paths, preserving extension', () => {
      const base = join('/very/long', 'Media');
      const names = Array.from(
        { length: 5 },
        (_, i) => `${'x'.repeat(210)}_${i}.jpg`,
      );
      const trimmed = names.map((n) => trimFilepathAsNeeded(join(base, n)));
      const set = new Set(trimmed);
      expect(set.size).toBe(names.length);
      trimmed.forEach((p) => {
        expect(p.endsWith('.jpg')).toBe(true);
        expect(p.length).toBeLessThanOrEqual(230);
      });
    });
  });
});
