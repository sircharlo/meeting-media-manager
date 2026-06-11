import { describe, expect, it } from 'vitest';

import {
  isExpectedNetworkPathAccessError,
  isPossiblyNetworkFolderPath,
  shouldIgnoreWatchFolderError,
} from './filesystem-errors';

describe('filesystem error helpers', () => {
  it('detects UNC, WebDAV, and mapped Windows network-like paths', () => {
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
  });

  it('classifies transient access errors only for likely network paths', () => {
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'UNKNOWN' },
        String.raw`\\server@SSL@2078\DavWWWRoot`,
      ),
    ).toBe(true);
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'UNKNOWN' },
        'C:/Users/test/cache',
      ),
    ).toBe(false);
    expect(
      isExpectedNetworkPathAccessError(
        { code: 'EACCES' },
        String.raw`\\server@SSL@2078\DavWWWRoot`,
      ),
    ).toBe(false);
  });

  it('keeps watch-folder ignore behavior centralized', () => {
    expect(
      shouldIgnoreWatchFolderError('C:/Users/test/cache', {
        code: 'UNKNOWN',
        syscall: 'stat',
      }),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError(String.raw`\\server\share`, {
        code: 'EISDIR',
        syscall: 'watch',
      }),
    ).toBe(true);
    expect(
      shouldIgnoreWatchFolderError('C:/Users/test/cache', {
        code: 'EACCES',
        syscall: 'watch',
      }),
    ).toBe(false);
  });
});
