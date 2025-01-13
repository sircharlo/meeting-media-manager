import { validAnnouncements } from 'app/test/vitest/mocks/github';
import { jwYeartext } from 'app/test/vitest/mocks/jw';
import { describe, expect, it } from 'vitest';

import {
  fetchAnnouncements,
  fetchJwLanguages,
  fetchLatestVersion,
  fetchYeartext,
} from '../api';

describe('fetchJwLanguages', () => {
  it('should fetch the jw languages', async () => {
    const languages = await fetchJwLanguages('jw.org');
    expect(languages?.length).toBe(2);
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
