import type {
  Announcement,
  JwLangCode,
  JwLanguageResult,
  Release,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchRaw = async (url: string, init?: RequestInit) => {
  return fetch(url, init);
};

export const fetchJson = async <T>(
  url: string,
  params?: URLSearchParams,
): Promise<null | T> => {
  try {
    const response = await fetchRaw(
      `${url}?${params ? params.toString() : ''}`,
    );
    if (response.ok) {
      return response.json();
    } else if (![400, 404].includes(response.status)) {
      errorCatcher(response, {
        contexts: { fn: { name: 'fetchJson', params, url } },
      });
    }
  } catch (e) {
    errorCatcher(e, { contexts: { fn: { name: 'fetchJson', params, url } } });
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
