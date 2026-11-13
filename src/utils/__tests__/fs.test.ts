import type { PublicationFetcher } from 'src/types';

import { basePath } from 'app/test/vitest/mocks/electronApi';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { join } from 'upath';
import { describe, expect, it, vi } from 'vitest';

import {
  betaUpdatesDisabled,
  getAdditionalMediaPath,
  getFileSizeIfExists,
  getFontsPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationDirectoryContents,
  getPublicationsPath,
  getTempPath,
  isFileUrl,
  registerCachePathProvider,
  removeEmptyDirs,
  toggleAutoUpdates,
  toggleBetaUpdates,
  trimFilepathAsNeeded,
  updatesDisabled,
} from '../fs';

// Before ../fs takes it from electronApi.
const checkForUpdatesSpy = vi.hoisted(() =>
  vi.spyOn(globalThis.electronApi, 'checkForUpdates'),
);

const { fs } = globalThis.electronApi;
const { emptyDir, ensureFile, pathExists, remove } = fs;

installPinia();

registerCachePathProvider(
  () => useCurrentStateStore().currentSettings?.cacheFolder ?? undefined,
);

describe('isFileUrl', () => {
  it('should correctly recognize file urls', () => {
    expect(isFileUrl('file:///path/to/file')).toBe(true);
    expect(isFileUrl('https://example.com')).toBe(false);
    expect(isFileUrl('/root/some-path')).toBe(false);
    expect(isFileUrl(String.raw`C:\Users/User/some-path`)).toBe(false);
  });
});

describe('getFileSizeIfExists', () => {
  it('gives the size of a file that is there', async () => {
    const file = join(basePath, 'size-check', 'present.bin');
    await ensureFile(file);
    await fs.writeFile(file, 'four');
    expect(await getFileSizeIfExists(file)).toBe(4);
    await remove(join(basePath, 'size-check'));
  });

  it('gives null when nothing is there', async () => {
    expect(
      await getFileSizeIfExists(join(basePath, 'size-check', 'missing.bin')),
    ).toBeNull();
  });

  // MMM-V2-3NT: an error crossing contextBridge keeps only its message.
  it('gives null for ENOENT known only from the message', async () => {
    const stat = vi
      .spyOn(fs, 'stat')
      .mockRejectedValueOnce(
        new Error("ENOENT: no such file or directory, stat 'C:/x.png'"),
      );
    expect(await getFileSizeIfExists('C:/x.png')).toBeNull();
    stat.mockRestore();
  });

  it('throws any other error', async () => {
    const stat = vi
      .spyOn(fs, 'stat')
      .mockRejectedValueOnce(
        new Error("EPERM: operation not permitted, stat 'C:/x.png'"),
      );
    await expect(getFileSizeIfExists('C:/x.png')).rejects.toThrow('EPERM');
    stat.mockRestore();
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
    const cacheFolder = join(basePath, 'CustomCacheDir');
    const store = useCongregationSettingsStore();
    store.congregations = {
      'test-cong': {
        ...defaultSettings,
        cacheFolder,
      },
    };
    useCurrentStateStore().currentCongregation = 'test-cong';
    const paths = [
      await getPublicationsPath(),
      await getAdditionalMediaPath(),
      await getPublicationDirectory({ langwritten: 'E', pub: 'w' }),
    ];

    paths.forEach((path) => {
      expect(path).toContain(cacheFolder);
    });
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

    expect(await pathExists(emptyDirectory)).toBe(true);
    expect(await pathExists(file)).toBe(true);

    await removeEmptyDirs(root);

    expect(await pathExists(emptyDirectory)).toBe(false);
    expect(await pathExists(file)).toBe(true);

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
    expect(all).toHaveLength(4);

    const filtered = await getPublicationDirectoryContents(pub, 'jpg');
    expect(filtered).toHaveLength(2);

    await remove(root);
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
    await toggleAutoUpdates(true);
    expect(await updatesDisabled()).toBe(false); // default value
    await toggleAutoUpdates(false);
    expect(await updatesDisabled()).toBe(true);
    await toggleAutoUpdates(true);
    expect(await updatesDisabled()).toBe(false);
  });

  it('tells the updater when they are turned off, not only on', async () => {
    checkForUpdatesSpy.mockClear();
    await toggleAutoUpdates(false);
    expect(checkForUpdatesSpy).toHaveBeenCalledOnce();
    await toggleAutoUpdates(true);
    expect(checkForUpdatesSpy).toHaveBeenCalledTimes(2);
  });
});

describe('beta updates', () => {
  it('should be toggleable', async () => {
    await toggleBetaUpdates(false);
    expect(await betaUpdatesDisabled()).toBe(true); // default value
    await toggleBetaUpdates(true);
    expect(await betaUpdatesDisabled()).toBe(false);
    await toggleBetaUpdates(false);
    expect(await betaUpdatesDisabled()).toBe(true);
  });
});
