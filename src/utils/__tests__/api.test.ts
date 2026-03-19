import { validAnnouncements } from 'app/test/vitest/mocks/github';
import { jwLangs, jwYeartext } from 'app/test/vitest/mocks/jw';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

installPinia();

import {
  clearFetchCache,
  fetchAnnouncements,
  fetchJwLanguages,
  fetchLatestVersion,
  fetchMemorials,
  fetchRaw,
  fetchYeartext,
} from '../api';
import * as dateUtils from '../date';

describe('fetchJwLanguages', () => {
  it('should fetch the jw languages', async () => {
    const languages = await fetchJwLanguages('jw.org');
    expect(languages?.length).toBe(jwLangs.languages.length);
  });
});

describe('fetchYeartext', () => {
  it('should fetch the yeartext', async () => {
    const yeartext = await fetchYeartext('E', 'jw.org');
    expect(yeartext.wtlocale).toBe('E');
    expect(yeartext.yeartext).toBe(jwYeartext.content);
  });
});

describe('fetchAnnouncements', () => {
  it('should fetch the announcements', async () => {
    const announcements = await fetchAnnouncements();
    expect(announcements.length).toBe(validAnnouncements.length);
  });
});

describe('fetchLatestVersion', () => {
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
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res1 = await fetchRaw(handledUrl, undefined, false);
    const res2 = await fetchRaw(handledUrl, undefined, false);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('should cache GET requests when cache is true', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

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

  it('should use headers in cache key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await fetchRaw(handledUrl, { headers: { 'X-Test': '1' } }, true);
    await fetchRaw(handledUrl, { headers: { 'X-Test': '2' } }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('fetchMemorials', () => {
  const memorialsUrl = `${process.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/memorials.json`;

  afterEach(() => {
    vi.restoreAllMocks();
    clearFetchCache();
  });

  it('filters out past, malformed, and non-numeric memorial entries', async () => {
    vi.spyOn(dateUtils, 'isInPast').mockImplementation(
      (value) => value === '2024/03/24',
    );
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

    expect(globalThis.fetch).toHaveBeenCalledWith(memorialsUrl, undefined);
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
