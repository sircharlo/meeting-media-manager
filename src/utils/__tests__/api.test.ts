import { validAnnouncements } from 'app/test/vitest/mocks/github';
import { jwLangs, jwYeartext } from 'app/test/vitest/mocks/jw';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { http, HttpResponse } from 'msw';
import { fetchRaw } from 'src/utils/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

installPinia();

import { setupServer } from 'msw/node';

import {
  clearFetchCache,
  fetchAnnouncements,
  fetchJwLanguages,
  fetchLatestVersion,
  fetchYeartext,
} from '../api';

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

// fetchRaw caching tests
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
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      await fetchRaw(handledUrl, { method: 'HEAD' }, true);
      await fetchRaw(handledUrl, { method: 'HEAD' }, true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } catch (e) {
      console.error(e);
    }
  });

  it('should not cache POST requests even if cache is true', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      await fetchRaw(handledUrl, { method: 'POST' }, true);
      await fetchRaw(handledUrl, { method: 'POST' }, true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    } catch (e) {
      console.error(e);
    }
  });

  const server = setupServer(
    http.get('https://example.com/fail', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  server.listen();

  it('should not cache failed requests (non-2xx)', async () => {
    const url = 'https://example.com/fail';
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await fetchRaw(url, undefined, true);
    await fetchRaw(url, undefined, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should use headers in cache key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await fetchRaw(handledUrl, { headers: { 'X-Test': '1' } }, true);
    await fetchRaw(handledUrl, { headers: { 'X-Test': '2' } }, true);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
