import type {
  Announcement,
  JwLangCode,
  JwLanguageResult,
  Release,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

export const fetchRaw = async (url: string, init?: RequestInit) => {
  console.debug('fetchRaw', { init, url });
  try {
    return fetch(url, init);
  } catch (e) {
    errorCatcher(e, {
      contexts: {
        fn: {
          name: 'src/helpers/api fetchRaw',
          params: init,
          url,
        },
      },
    });
    return {
      ok: false,
      status: 400,
    } as Response;
  }
};

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
      errorCatcher(response, {
        contexts: {
          fn: {
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            url,
          },
        },
      });
    }
  } catch (e) {
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
  return null;
};

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

export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  if (!process.env.repository) return [];
  const result = await fetchJson<Announcement[]>(
    `${process.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/announcements.json`,
  );
  return result?.filter((a) => !!a.id && !!a.message) || [];
};

export const fetchLatestVersion = async () => {
  if (!process.env.repository) return;
  const url = `${process.env.repository.replace('github.com', 'api.github.com/repos')}/releases`;
  const result = await fetchJson<Release[]>(
    url,
    new URLSearchParams({ per_page: '1' }),
  );
  return result?.[0]?.tag_name.slice(1);
};
