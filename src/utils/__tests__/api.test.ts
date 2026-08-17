import {
  announcements,
  releases,
  validAnnouncements,
} from 'app/test/vitest/mocks/github';
import { jwLangs, jwYeartext } from 'app/test/vitest/mocks/jw';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

installPinia();

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

import { errorCatcher } from 'src/helpers/error-catcher';

import {
  clearFetchCache,
  fetchAnnouncements,
  fetchJson,
  fetchJwLanguages,
  fetchLatestVersion,
  fetchMemorials,
  fetchPubMediaLinks,
  fetchRaw,
  fetchReleaseNotes,
  fetchYeartext,
} from '../api';
import * as dateUtils from '../date';

describe('fetchJwLanguages', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(jwLangs), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('should fetch the jw languages', async () => {
    const languages = await fetchJwLanguages('jw.org');
    expect(languages?.length).toBe(jwLangs.languages.length);
  });
});

describe('fetchYeartext', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(jwYeartext), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the yeartext', async () => {
    const yeartext = await fetchYeartext('E', 'jw.org');
    expect(yeartext.wtlocale).toBe('E');
    expect(yeartext.yeartext).toBe(jwYeartext.content);
  });
});

describe('fetchAnnouncements', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(announcements), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the announcements', async () => {
    const result = await fetchAnnouncements();
    expect(result).toHaveLength(validAnnouncements.length);
    expect(result).toEqual(expect.arrayContaining(validAnnouncements));
  });
});

describe('fetchLatestVersion', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(releases), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the latest version', async () => {
    const version = await fetchLatestVersion();
    expect(version).toBe('1.2.3');
  });
});

describe('fetchRaw caching', () => {
  const handledUrl = 'https://www.jw.org/en/languages/';

  beforeEach(() => {
    vi.clearAllMocks();
    clearFetchCache();
  });

  it('should fetch from network when cache is false', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(jwLangs), { status: 200 })),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res1 = await fetchRaw(handledUrl, undefined, false);
    const res2 = await fetchRaw(handledUrl, undefined, false);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('should cache GET requests when cache is true', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(jwLangs), { status: 200 })),
      );

    const res1 = await fetchRaw(handledUrl, { method: 'GET' }, true);
    const res2 = await fetchRaw(handledUrl, { method: 'GET' }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const data1 = await res1.json();
    const data2 = await res2.json();
    expect(data1).toEqual(data2);
    expect(data1.languages).toBeDefined();
  });

  it('should cache HEAD requests when cache is true', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await fetchRaw(handledUrl, { method: 'HEAD' }, true);
    await fetchRaw(handledUrl, { method: 'HEAD' }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should cache HEAD requests with large content lengths', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        headers: { 'content-length': `${100 * 1024 * 1024}` },
        status: 200,
      }),
    );

    await fetchRaw(handledUrl, { method: 'HEAD' }, true);
    await fetchRaw(handledUrl, { method: 'HEAD' }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should not cache POST requests even if cache is true', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await fetchRaw(handledUrl, { method: 'POST' }, true);
    await fetchRaw(handledUrl, { method: 'POST' }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should not cache failed requests (non-2xx)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 500 }));

    await fetchRaw('https://example.com/fail', undefined, true);
    await fetchRaw('https://example.com/fail', undefined, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should not cache responses that are too large', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response('large response', {
          headers: { 'content-length': `${1024 * 1024 + 1}` },
          status: 200,
        }),
      ),
    );

    await fetchRaw(handledUrl, undefined, true);
    await fetchRaw(handledUrl, undefined, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should use headers in cache key', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(jwLangs), { status: 200 })),
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await fetchRaw(handledUrl, { headers: { 'X-Test': '1' } }, true);
    await fetchRaw(handledUrl, { headers: { 'X-Test': '2' } }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('fetchJson network errors', () => {
  const handledUrl = 'https://ipinfo.io/';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchCache();
  });

  it('should not report wrapped DNS fetch failures', async () => {
    const cause = Object.assign(new Error('getaddrinfo ENOTFOUND ipinfo.io'), {
      code: 'ENOTFOUND',
    });
    const error = new TypeError('fetch failed', { cause });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    const result = await fetchJson(handledUrl);

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should not report direct DNS errors', async () => {
    const error = Object.assign(new Error('getaddrinfo ENOTFOUND ipinfo.io'), {
      code: 'ENOTFOUND',
    });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    const result = await fetchJson(handledUrl);

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should not report a 503 Service Unavailable status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    const result = await fetchJson(handledUrl);

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should not report a 504 Gateway Timeout status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 504 }),
    );

    const result = await fetchJson(handledUrl);

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should not report an empty/truncated JSON response body', async () => {
    // A 200 OK with an empty body throws a SyntaxError out of response.json()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 }),
    );

    const result = await fetchJson(handledUrl);

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('retries a transient network error and returns the eventual result', async () => {
    const error = Object.assign(new Error('connect ECONNRESET'), {
      code: 'ECONNRESET',
    });
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const result = await fetchJson(handledUrl);

    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('retries once the per-attempt timeout aborts a hung request', async () => {
    // AbortSignal.timeout()'s internal timer isn't controlled by
    // vi.useFakeTimers(), so drive the abort directly instead of waiting
    // out the real 15s timeout.
    const controllers: AbortController[] = [];
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const controller = new AbortController();
      controllers.push(controller);
      return controller.signal;
    });

    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((resolve, reject) => {
          callCount++;
          if (callCount === 1) {
            // Simulates a connection that's up but never completes - never
            // resolves on its own, only reacts to the abort signal fetchJson
            // passes in, same as a real fetch() would.
            (init as RequestInit | undefined)?.signal?.addEventListener(
              'abort',
              () => {
                reject(
                  new DOMException('The operation was aborted', 'AbortError'),
                );
              },
            );
          } else {
            resolve(
              new Response(JSON.stringify({ ok: true }), { status: 200 }),
            );
          }
        }),
    );

    const promise = fetchJson(handledUrl);
    await vi.waitFor(() => expect(controllers).toHaveLength(1));
    controllers[0]?.abort();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(callCount).toBe(2);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should not report a 400 for pub=ewt, confirmed to have no media', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 400 }),
    );

    const result = await fetchJson(
      handledUrl,
      new URLSearchParams({ pub: 'ewt' }),
    );

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });
});

describe('fetchMemorials', () => {
  const memorialsUrl = `${import.meta.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/memorials.json`;

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchCache();
  });

  it('filters out memorials that are more than one month old, malformed, and non-numeric entries', async () => {
    vi.spyOn(dateUtils, 'isInPast').mockImplementation((value) => {
      const dateValue = new Date(value);
      if (Number.isNaN(dateValue.getTime())) return false;
      return dateValue.toISOString().startsWith('2024-04-24');
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          2024: '2024/03/24',
          2025: '2025/04/12',
          2026: '2026/APR/01',
          2028: '',
          nope: '2027/04/01',
        }),
        { status: 200 },
      ),
    );

    const memorials = await fetchMemorials();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      memorialsUrl,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(memorials).toEqual({ 2025: '2025/04/12' });
  });

  it('returns null when the memorial API response is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    const memorials = await fetchMemorials();

    expect(memorials).toBeNull();
  });

  it('returns null when the memorial fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const memorials = await fetchMemorials();

    expect(memorials).toBeNull();
  });
});

describe('fetchReleaseNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchCache();
  });

  it('should not report a plain network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch'),
    );

    const result = await fetchReleaseNotes('en');

    expect(result).toBeNull();
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('should still report a non-network failure', async () => {
    const error = new Error('boom');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);

    const result = await fetchReleaseNotes('en');

    expect(result).toBeNull();
    expect(errorCatcher).toHaveBeenCalledWith(error);
  });
});

describe('fetchPubMediaLinks docid/pub fallback', () => {
  const pubMediaUrl = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS';
  const okBody = JSON.stringify({ files: { LSQ: { MP4: [] } } });

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchCache();
  });

  it('sends docid (and omits pub) when docid is present', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(okBody, { status: 200 }));

    await fetchPubMediaLinks(
      {
        docid: 2026403,
        fileformat: 'MP4',
        issue: 20260500,
        langwritten: 'LSQ',
        pub: 'w',
        track: 4,
      },
      pubMediaUrl,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(fetchSpy.mock.calls[0]?.[0] as string);
    expect(requestedUrl.searchParams.get('docid')).toBe('2026403');
    expect(requestedUrl.searchParams.get('pub')).toBe('');
  });

  it('falls back to pub/issue/track when the docid lookup 404s', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(okBody, { status: 200 }));

    const response = await fetchPubMediaLinks(
      {
        docid: 2026403,
        fileformat: 'MP4',
        issue: 20260500,
        langwritten: 'LSQ',
        pub: 'w',
        track: 4,
      },
      pubMediaUrl,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(fetchSpy.mock.calls[0]?.[0] as string);
    expect(firstUrl.searchParams.get('docid')).toBe('2026403');
    expect(firstUrl.searchParams.get('pub')).toBe('');

    const secondUrl = new URL(fetchSpy.mock.calls[1]?.[0] as string);
    expect(secondUrl.searchParams.get('docid')).toBe('');
    expect(secondUrl.searchParams.get('pub')).toBe('w');
    expect(secondUrl.searchParams.get('issue')).toBe('20260500');
    expect(secondUrl.searchParams.get('track')).toBe('4');

    expect(response).not.toBeNull();
  });

  it('does not retry when there is no pub to fall back to', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));

    const response = await fetchPubMediaLinks(
      { docid: 2026403, fileformat: 'MP4', langwritten: 'LSQ' },
      pubMediaUrl,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(response).toBeNull();
  });

  it('does not retry when the docid lookup succeeds', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(okBody, { status: 200 }));

    await fetchPubMediaLinks(
      {
        docid: 2026403,
        fileformat: 'MP4',
        issue: 20260500,
        langwritten: 'LSQ',
        pub: 'w',
        track: 4,
      },
      pubMediaUrl,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
