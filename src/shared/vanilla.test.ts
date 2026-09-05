import { describe, expect, it } from 'vitest';

import { scrubUserPaths, scrubUserPathsDeep } from './vanilla';

describe('scrubUserPaths', () => {
  it('redacts the username in Windows home-directory paths', () => {
    expect(
      scrubUserPaths(
        String.raw`ENOENT: no such file or directory, open 'C:\Users\Olivier\AppData\Roaming\Meeting Media Manager\cache\foo.json'`,
      ),
    ).toBe(
      String.raw`ENOENT: no such file or directory, open 'C:\Users\<user>\AppData\Roaming\Meeting Media Manager\cache\foo.json'`,
    );
  });

  it('redacts the username in Windows file:// URLs (forward slashes)', () => {
    expect(
      scrubUserPaths(
        'file:///C:/Users/Olivier/Desktop/MMM-Portable/resources/app.asar/index.html',
      ),
    ).toBe(
      'file:///C:/Users/<user>/Desktop/MMM-Portable/resources/app.asar/index.html',
    );
  });

  it('redacts the username in macOS home-directory paths', () => {
    expect(
      scrubUserPaths('/Users/olivier/Library/Application Support/mmm/cache'),
    ).toBe('/Users/<user>/Library/Application Support/mmm/cache');
  });

  it('redacts the username in Linux home-directory paths', () => {
    expect(scrubUserPaths('/home/olivier/.config/mmm/cache')).toBe(
      '/home/<user>/.config/mmm/cache',
    );
  });

  it('leaves strings without a home-directory path untouched', () => {
    expect(scrubUserPaths('Unknown error')).toBe('Unknown error');
    expect(scrubUserPaths('C:/Program Files/Meeting Media Manager')).toBe(
      'C:/Program Files/Meeting Media Manager',
    );
  });

  it('redacts every occurrence in a string with multiple paths', () => {
    expect(
      scrubUserPaths(
        String.raw`rename 'C:\Users\Olivier\a\x.tmp' -> 'C:\Users\Olivier\a\x.exe'`,
      ),
    ).toBe(
      String.raw`rename 'C:\Users\<user>\a\x.tmp' -> 'C:\Users\<user>\a\x.exe'`,
    );
  });
});

describe('scrubUserPathsDeep', () => {
  it('scrubs strings nested in objects and arrays', () => {
    expect(
      scrubUserPathsDeep({
        breadcrumbs: [
          { message: String.raw`C:\Users\Olivier\log.txt` },
          { message: 'unrelated' },
        ],
        exception: {
          values: [{ value: '/home/olivier/cache/foo.json' }],
        },
      }),
    ).toEqual({
      breadcrumbs: [
        { message: String.raw`C:\Users\<user>\log.txt` },
        { message: 'unrelated' },
      ],
      exception: {
        values: [{ value: '/home/<user>/cache/foo.json' }],
      },
    });
  });

  it('leaves non-string values (numbers, booleans, null) untouched', () => {
    expect(
      scrubUserPathsDeep({ count: 3, enabled: true, missing: null }),
    ).toEqual({ count: 3, enabled: true, missing: null });
  });

  // SEC-8 (full-audit-2026-09-04.md): a deny-list on the key name, not an
  // exact field list, so a future password/secret/token-shaped field is
  // redacted without this test (or the pattern) needing to know its name.
  it('redacts values whose key looks like a secret, regardless of nesting depth', () => {
    expect(
      scrubUserPathsDeep({
        contexts: {
          settings: {
            apiKey: 'sk-abc123',
            congregationName: 'Kingdom Hall',
            obsPassword: 'hunter2',
            userToken: 'xyz',
          },
        },
      }),
    ).toEqual({
      contexts: {
        settings: {
          apiKey: '<redacted>',
          congregationName: 'Kingdom Hall',
          obsPassword: '<redacted>',
          userToken: '<redacted>',
        },
      },
    });
  });

  it('leaves genuinely unrelated keys untouched (only redacts a password/secret/token/apiKey substring match)', () => {
    expect(
      scrubUserPathsDeep({
        congregationName: 'Kingdom Hall',
        // Over-matches "password" as a substring - an accepted trade-off:
        // a false positive here just redacts a non-sensitive value, while
        // the alternative (an exact field-name list) is what let a real
        // secret slip through undetected in the first place.
        password_hint: 'wrong on purpose',
      }),
    ).toEqual({
      congregationName: 'Kingdom Hall',
      password_hint: '<redacted>',
    });
  });
});
