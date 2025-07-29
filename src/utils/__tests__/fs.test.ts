import type { PublicationFetcher } from 'src/types';

import { basePath } from 'app/test/vitest/mocks/electronApi';
import { join } from 'upath';
import { describe, expect, it } from 'vitest';

import {
  betaUpdatesDisabled,
  getAdditionalMediaPath,
  getFontsPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationDirectoryContents,
  getPublicationsPath,
  getTempPath,
  isFileUrl,
  removeEmptyDirs,
  toggleAutoUpdates,
  toggleBetaUpdates,
  trimFilepathAsNeeded,
  updatesDisabled,
} from '../fs';

const { fs } = window.electronApi;
const { emptyDir, ensureFile, exists, remove } = fs;

describe('isFileUrl', () => {
  it('should correctly recognize file urls', () => {
    expect(isFileUrl('file:///path/to/file')).toBe(true);
    expect(isFileUrl('https://example.com')).toBe(false);
    expect(isFileUrl('/root/some-path')).toBe(false);
    expect(isFileUrl('C:\\Users/User/some-path')).toBe(false);
  });
});

describe('Paths', () => {
  it('should start with base path', async () => {
    const paths = await Promise.all([
      getFontsPath(),
      getTempPath(),
      getPublicationsPath(),
      getAdditionalMediaPath(),
      getPublicationDirectory({ langwritten: 'E', pub: 'w' }),
    ]);

    paths.forEach((path) => {
      expect(path).toContain(basePath);
    });

    await Promise.all(paths.map((path) => remove(path)));
  });

  it('should overwrite default cache location', async () => {
    const cacheDir = join(basePath, 'CustomCacheDir');
    const paths = await Promise.all([
      getPublicationsPath(cacheDir),
      getAdditionalMediaPath(cacheDir),
      getPublicationDirectory({ langwritten: 'E', pub: 'w' }, cacheDir),
    ]);

    paths.forEach((path) => {
      expect(path).toContain(cacheDir);
    });

    await remove(cacheDir);
  });
});

describe('getParentDirectory', () => {
  it('should return the parent directory of a file path', () => {
    expect(getParentDirectory('/root/to/file')).toBe('/root/to');
    expect(getParentDirectory('file://' + basePath)).toBe(
      basePath.replace('/fs', ''),
    );
  });
});

describe('getPublicationDirectory', () => {
  it('should return the cache directory of a publication', async () => {
    const path = await getPublicationDirectory({
      issue: '2025010100',
      langwritten: 'E',
      pub: 'w',
    });
    expect(path).toContain('/w_E_2025010100');

    await remove(path);
  });
});

describe('removeEmptyDirs', () => {
  it('should remove empty directories only', async () => {
    const root = join(basePath, 'empty-dir-root');
    const emptyDirectory = join(root, 'empty-dir');
    const filledDir = join(root, 'filled-dir');
    const file = join(filledDir, 'file.txt');
    await emptyDir(emptyDirectory);
    await ensureFile(file);

    expect(await exists(emptyDirectory)).toBe(true);
    expect(await exists(file)).toBe(true);

    await removeEmptyDirs(root);

    expect(await exists(emptyDirectory)).toBe(false);
    expect(await exists(file)).toBe(true);

    await remove(root);
  });
});

describe('getPublicationDirectoryContents', () => {
  it('should return the contents of the cache directory of a publication', async () => {
    const pub: PublicationFetcher = {
      issue: '0',
      langwritten: 'E',
      pub: 'bt',
    };

    const root = await getPublicationDirectory(pub);
    await Promise.all([
      ensureFile(join(root, 'img1.jpg')),
      ensureFile(join(root, 'img2.jpg')),
      ensureFile(join(root, 'pub.jwpub')),
      ensureFile(join(root, 'pub.db')),
    ]);

    const all = await getPublicationDirectoryContents(pub);
    expect(all.length).toBe(4);

    const filtered = await getPublicationDirectoryContents(pub, 'jpg');
    expect(filtered.length).toBe(2);

    const customRoot = await getPublicationDirectory(
      pub,
      join(basePath, 'customCacheDir'),
    );
    const withCustomRoot = await getPublicationDirectoryContents(
      pub,
      undefined,
      customRoot,
    );
    expect(withCustomRoot.length).toBe(0);

    await Promise.all([root, customRoot].map((filepath) => remove(filepath)));
  });
});

describe('trimFilepathAsNeeded', () => {
  it('should trim file paths to a certain length', () => {
    const testPath = join(
      basePath,
      'Media',
      'some-very-long-file-name'.repeat(15) + '.jpg',
    );
    expect(testPath.length).toBeGreaterThan(230);

    const trimmed = trimFilepathAsNeeded(testPath);
    expect(trimmed).toContain(join(basePath, 'Media'));
    expect(trimmed).toContain('.jpg');
    expect(trimmed.length).toBeLessThanOrEqual(230);
  });

  it('should return unique paths', () => {
    const path = join(
      basePath,
      'Media',
      'some-very-long-file-name'.repeat(15) + '.jpg',
    );
    expect(path.length).toBeGreaterThan(230);

    const path2 = join(
      basePath,
      'Media',
      'some-very-long-file-name'.repeat(15) + '2.jpg',
    );
    expect(path2.length).toBeGreaterThan(230);

    const trimmed = trimFilepathAsNeeded(path);
    const trimmed2 = trimFilepathAsNeeded(path2);
    expect(trimmed).not.toEqual(trimmed2);
  });
});

describe('auto updates', () => {
  it('should be toggleable', async () => {
    expect(await updatesDisabled()).toBe(false); // default value
    await toggleAutoUpdates(false);
    expect(await updatesDisabled()).toBe(true);
    await toggleAutoUpdates(true);
    expect(await updatesDisabled()).toBe(false);
  });
});

describe('beta updates', () => {
  it('should be toggleable', async () => {
    expect(await betaUpdatesDisabled()).toBe(true); // default value
    await toggleBetaUpdates(true);
    expect(await betaUpdatesDisabled()).toBe(false);
    await toggleBetaUpdates(false);
    expect(await betaUpdatesDisabled()).toBe(true);
  });
});
