import type {
  Announcement,
  JwLangCode,
  JwLanguageResult,
  Release,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';

/**
 * Fetches data from the given url
 * @param url The url to fetch data from
 * @param init Initialization options for the fetch
 * @returns The fetch response
 */
export const fetchRaw = async (url: string, init?: RequestInit) => {
  console.debug('fetchRaw', { init, url });
  return fetch(url, init);
};

/**
 * Fetches json data from the given url
 * @param url The url to fetch json data from
 * @param params The url search params
 * @returns The json data
 */
export const fetchJson = async <T>(
  url: string,
  params?: URLSearchParams,
): Promise<null | T> => {
  try {
    if (!url) return null;
    const response = await fetchRaw(
      `${url}?${params ? params.toString() : ''}`,
    );
    if (response.ok) {
      return await response.json();
    } else if (![400, 404].includes(response.status)) {
      errorCatcher(new Error('Failed to fetch json!'), {
        contexts: {
          fn: {
            headers: response.headers,
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            responseUrl: response.url,
            status: response.status,
            statusText: response.statusText,
            type: response.type,
            url,
          },
        },
      });
    }
  } catch (e) {
    if (useCurrentStateStore().online) {
      errorCatcher(e, {
        contexts: {
          fn: {
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            url,
          },
        },
      });
    }
  }
  return null;
};

/**
 * Fetches the jw languages
 * @param base The base domain to fetch the languages from
 * @returns The jw languages
 */
export const fetchJwLanguages = async (base?: string) => {
  if (!base) return;
  const url = `https://www.${base}/en/languages/`;
  const result = await fetchJson<JwLanguageResult>(url);
  return result?.languages;
};

interface YeartextResult {
  content: string;
  exists: boolean;
  jsonUrl: string;
  url: string;
}

/**
 * Fetches the yeartext
 * @param wtlocale The yeartext locale
 * @param base The base domain to fetch the yeartext from
 * @returns The yeartext
 */
export const fetchYeartext = async (wtlocale: JwLangCode, base?: string) => {
  if (!base) return { wtlocale };
  const url = `https://wol.${base}/wol/finder`;
  const result = await fetchJson<YeartextResult>(
    url,
    new URLSearchParams({
      docid: `110${new Date().getFullYear()}800`,
      format: 'json',
      snip: 'yes',
      wtlocale,
    }),
  );

  return { wtlocale, yeartext: result?.content };
};

/**
 * Fetches the announcements from the repository
 * @returns The announcements
 */
export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  if (!process.env.repository) return [];
  const result = await fetchJson<Announcement[]>(
    `${process.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/announcements.json`,
  );
  return result?.filter((a) => !!a.id && !!a.message) || [];
};

/**
 * Fetches the latest version of the app
 * @returns The latest version
 */
export const fetchLatestVersion = async () => {
  if (!process.env.repository) return;
  const url = `${process.env.repository.replace('github.com', 'api.github.com/repos')}/releases`;
  const result = await fetchJson<Release[]>(
    url,
    new URLSearchParams({ per_page: '1' }),
  );
  return result?.[0]?.tag_name.slice(1);
};
