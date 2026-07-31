import { describe, expect, it } from 'vitest';

import {
  getCloudStorageProvider,
  getFilesystemErrorCode,
  isCloudStoragePath,
  isExpectedNetworkPathAccessError,
  isPossiblyNetworkFolderPath,
  shouldIgnoreWatchFolderError,
} from './filesystem-errors';

describe('filesystem error helpers', () => {
  it('detects UNC, WebDAV, mapped Windows, and cloud-sync network-like paths', () => {
    expect(
      isPossiblyNetworkFolderPath(String.raw`\\server\share`, 'win32'),
    ).toBe(true);
    expect(
      isPossiblyNetworkFolderPath(
        String.raw`\\server@SSL@2078\DavWWWRoot`,
        'win32',
      ),
    ).toBe(true);
    expect(isPossiblyNetworkFolderPath('G:/Meeting Media', 'win32')).toBe(true);
    expect(isPossiblyNetworkFolderPath('C:/Users/test/cache', 'win32')).toBe(
      false,
    );
    expect(
      isPossiblyNetworkFolderPath(
        String.raw`C:\Users\PC\Nextcloud\Hall\MediaSyncer`,
        'win32',
      ),
    ).toBe(true);
  });

  it('treats anything under /Volumes as removable/network on macOS only', () => {
    expect(
      isPossiblyNetworkFolderPath(
        '/Volumes/Meeting Media Manager 26.7.5-universal',
        'darwin',
      ),
    ).toBe(true);
    expect(
      isPossiblyNetworkFolderPath('/Volumes/External Drive/Media', 'darwin'),
    ).toBe(true);
    expect(
      isPossiblyNetworkFolderPath('/Users/test/Library/Caches', 'darwin'),
    ).toBe(false);
    // /Volumes is only meaningful as a macOS mount point - don't treat a
    // same-named folder as network-like on other platforms.
    expect(isPossiblyNetworkFolderPath('/Volumes/Media', 'linux')).toBe(false);
  });

  it('recognizes known cloud-sync providers from a path, including Nextcloud', () => {
    expect(
      getCloudStorageProvider(
        String.raw`C:\Users\PC\Nextcloud\Hall\MediaSyncer`,
      ),
    ).toBe('Nextcloud');
    expect(isCloudStoragePath('C:/Users/test/OneDrive/Media')).toBe(true);
    expect(isCloudStoragePath('C:/Users/test/cache')).toBe(false);
  });

  it('recognizes a Google Drive desktop "Mirror files" account folder by its "(email)" suffix, regardless of locale', () => {
    expect(
      getCloudStorageProvider(
        String.raw`C:\Users\PC\Meu Drive (suporteavjw@gmail.com)\Outras midias`,
      ),
    ).toBe('Google Drive');
    expect(
      isPossiblyNetworkFolderPath(
        String.raw`C:\Users\PC\Meu Drive (suporteavjw@gmail.com)\Outras midias`,
        'win32',
      ),
    ).toBe(true);
    // A parenthesized suffix that isn't email-shaped shouldn't match.
    expect(isCloudStoragePath(String.raw`C:\Users\PC\Documents (backup)`)).toBe(
      false,
    );
  });

  it('normalizes unmapped raw OS error codes to UNKNOWN', () => {
    // Node falls back to `Unknown system error <errno>` (via
    // util.getSystemErrorName) as both `code` and `message` when libuv can't
    // translate a raw OS error - this isn't the generic 'UNKNOWN' code.
    expect(
      getFilesystemErrorCode({ code: 'Unknown system error -214545202' }),
    ).toBe('UNKNOWN');
    expect(getFilesystemErrorCode({ code: 'EACCES' })).toBe('EACCES');
  });

  it('classifies transient access errors only for likely network paths', () => {
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'UNKNOWN' },
        String.raw`\\server@SSL@2078\DavWWWRoot`,
        'win32',
      ),
    ).toBe(true);
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'UNKNOWN' },
        'C:/Users/test/cache',
        'win32',
      ),
    ).toBe(false);
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'EACCES' },
        String.raw`\\server@SSL@2078\DavWWWRoot`,
        'win32',
      ),
    ).toBe(false);
    // Real-world Nextcloud VFS probe failure: raw untranslated OS error on a
    // local, cloud-synced folder should be treated as transient, not a bug.
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'Unknown system error -214545202' },
        String.raw`C:\Users\PC\Nextcloud\Hall\MediaSyncer`,
        'win32',
      ),
    ).toBe(true);
  });

  it('keeps watch-folder ignore behavior centralized', () => {
    expect(
      shouldIgnoreWatchFolderError(
        'C:/Users/test/cache',
        { code: 'UNKNOWN', syscall: 'stat' },
        'win32',
      ),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError(
        String.raw`\\server\share`,
        { code: 'EISDIR', syscall: 'watch' },
        'win32',
      ),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError(
        'C:/Users/test/cache',
        { code: 'EACCES', syscall: 'watch' },
        'win32',
      ),
    ).toBe(false);
    // Real-world case: chokidar's fs.watch() hitting a file a Google Drive
    // desktop "Mirror files" folder (localized "My Drive (email)" naming,
    // not the /google drive/ marker) is transiently locking mid-sync.
    expect(
      shouldIgnoreWatchFolderError(
        String.raw`C:\Users\PC\Meu Drive (suporteavjw@gmail.com)\Outras midias`,
        { code: 'EBUSY', syscall: 'watch' },
        'win32',
      ),
    ).toBe(true);
  });

  it('ignores transient scandir errors on cloud-sync/network paths', () => {
    expect(
      shouldIgnoreWatchFolderError(
        String.raw`G:\.shortcut-targets-by-id\1uhAUmZUpn-NK8Ccr27CZmB9qoh30K4cw\AV Zoom Duty Documents\Meeting Media\2026-07-04`,
        { code: 'UNKNOWN', syscall: 'scandir' },
        'win32',
      ),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError(
        'G:/Meeting Media/2026-07-04',
        { code: 'ENOENT', syscall: 'scandir' },
        'win32',
      ),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError(
        'C:/Users/test/cache',
        { code: 'UNKNOWN', syscall: 'scandir' },
        'win32',
      ),
    ).toBe(false);
    expect(
      shouldIgnoreWatchFolderError(
        'G:/Meeting Media/2026-07-04',
        { code: 'EACCES', syscall: 'scandir' },
        'win32',
      ),
    ).toBe(false);
  });
});
