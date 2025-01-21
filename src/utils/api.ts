import type {
  Announcement,
  JwLangCode,
  JwLanguageResult,
  MediaItemsMediator,
  Publication,
  PublicationFetcher,
  Release,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { betaUpdatesDisabled } from 'src/utils/fs';

/**
 * Fetches data from the given url.
 * @param url The url to fetch data from.
 * @param init Initialization options for the fetch.
 * @returns The fetch response.
 */
export const fetchRaw = async (url: string, init?: RequestInit) => {
  if (!process.env.VITEST) console.debug('fetchRaw', { init, url });
  return fetch(url, init);
};

/**
 * Fetches json data from the given url.
 * @param url The url to fetch json data from.
 * @param params The url search params.
 * @param online Whether to catch errors or not.
 * @returns The json data.
 */
export const fetchJson = async <T>(
  url: string,
  params?: URLSearchParams,
  online = true,
): Promise<null | T> => {
  try {
    if (!url) return null;
    const response = await fetchRaw(
      `${url}?${params ? params.toString() : ''}`,
    );
    if (response.ok || response.status === 304) {
      return await response.json();
    } else if (
      ![403, 404].includes(response.status) &&
      !(response.status === 400 && params?.get('pub')?.startsWith('S-'))
    ) {
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
    if (online) {
      errorCatcher(e, {
        contexts: {
          fn: {
            message: e instanceof Error ? e.message : '',
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            responseUrl: `${url}?${params ? params.toString() : ''}`,
            url,
          },
        },
      });
    }
  }
  return null;
};

/**
 * Fetches the jw languages.
 * @param base The base domain to fetch the languages from.
 * @returns The jw languages.
 */
export const fetchJwLanguages = async (base: string) => {
  if (!base) return;
  const url = `https://www.${base}/en/languages/`;
  const result = await fetchJson<JwLanguageResult>(url);
  return result?.languages;
};

export interface YeartextResult {
  content: string;
  exists: boolean;
  jsonUrl: string;
  url: string;
}

/**
 * Fetches the yeartext.
 * @param wtlocale The yeartext locale.
 * @param base The base domain to fetch the yeartext from.
 * @returns The yeartext.
 */
export const fetchYeartext = async (wtlocale: JwLangCode, base: string) => {
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
 * Fetches the announcements from the repository.
 * @returns The announcements.
 */
export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  if (!process.env.repository) return [];
  const result = await fetchJson<Announcement[]>(
    `${process.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/announcements.json`,
  );
  return result?.filter((a) => !!a.id && !!a.message) || [];
};

/**
 * Fetches the latest version of the app.
 * @returns The latest version.
 */
export const fetchLatestVersion = async () => {
  if (!process.env.repository) return;
  const url = `${process.env.repository.replace('github.com', 'api.github.com/repos')}/releases`;
  const includeBeta = !(await betaUpdatesDisabled());
  const result = await fetchJson<Release[]>(url);
  return result?.find((r) => includeBeta || !r.prerelease)?.tag_name.slice(1);
};

/**
 * Fetches the media links for the given publication.
 * @param publication The publication to fetch the media links for.
 * @param base The base domain to fetch the media links from.
 * @param online Whether the application is online.
 * @returns The media links.
 */
export const fetchPubMediaLinks = async (
  publication: PublicationFetcher,
  base: string,
  online?: boolean,
) => {
  try {
    const params = {
      alllangs: '0',
      ...(publication.booknum
        ? { booknum: publication.booknum.toString() }
        : {}),
      docid: !publication.pub ? publication.docid?.toString() || '' : '',
      fileformat: publication.fileformat || '',
      issue: publication.issue?.toString() || '',
      langwritten: publication.langwritten || '',
      output: 'json',
      pub: publication.pub || '',
      track: publication.track?.toString() || '',
      txtCMSLang: 'E',
    };
    const response = await fetchJson<Publication>(
      base,
      new URLSearchParams(params),
      online,
    );
    return response;
  } catch (e) {
    errorCatcher(e);
    return null;
  }
};

/**
 * Fetches the media items for the given publication.
 * @param publication The publication to fetch the media items for.
 * @param base The base domain to fetch the media items from.
 * @param online Whether the application is online.
 * @returns The media items.
 */
export const fetchMediaItems = async (
  publication: PublicationFetcher,
  base: string,
  online?: boolean,
) => {
  try {
    const url = `${base}/v1/media-items/${publication.langwritten}`;

    const id = [
      publication.pub ? `pub-${publication.pub}` : `docid-${publication.docid}`,
      publication.pub
        ? publication.issue?.toString().replace(/(\d{6})00$/gm, '$1')
        : null,
      publication.track,
      publication.fileformat?.toLowerCase().includes('mp4')
        ? 'VIDEO'
        : publication.fileformat?.toLowerCase().includes('mp3')
          ? 'AUDIO'
          : null,
    ]
      .filter((v) => !!v && v !== '0')
      .join('_');

    const response = await fetchJson<MediaItemsMediator>(
      `${url}/${id}`,
      undefined,
      online,
    );
    return response;
  } catch (e) {
    errorCatcher(e);
    return null;
  }
};
