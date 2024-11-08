import type {
  Announcement,
  JwLangCode,
  JwLanguageResult,
  Release,
} from 'src/types';

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { errorCatcher } from 'src/helpers/error-catcher';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchRaw = async <T = any>(
  url: string,
  config?: AxiosRequestConfig,
) => {
  return axios<T>(url, config);
};

export const fetch = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<null | T> => {
  try {
    const response = await fetchRaw<T>(url, config);
    return response.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      if (![400, 404].includes(e.response?.status || 0)) {
        console.debug({ config, url });
        console.debug({ request: e.request, response: e.response });
        errorCatcher(e);
      }
    } else {
      errorCatcher(e);
    }
  }
  return null;
};

export const fetchJwLanguages = async (base?: string) => {
  if (!base) return;
  const url = `https://www.${base}/en/languages/`;
  const result = await fetch<JwLanguageResult>(url);
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
  const result = await fetch<YeartextResult>(url, {
    params: {
      docid: `110${new Date().getFullYear()}800`,
      format: 'json',
      snip: 'yes',
      wtlocale,
    },
  });

  return { wtlocale, yeartext: result?.content };
};

export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  if (!process.env.repository) return [];
  const result = await fetch<Announcement[]>(
    `${process.env.repository?.replace('github', 'raw.githubusercontent')}/refs/heads/master/announcements.json`,
  );
  return result?.filter((a) => !!a.id && !!a.message) || [];
};

export const fetchLatestVersion = async () => {
  if (!process.env.repository) return;
  const url = `${process.env.repository.replace('github.com', 'api.github.com/repos')}/releases`;
  const result = await fetch<Release[]>(url, { params: { per_page: 1 } });
  return result?.[0]?.tag_name.slice(1);
};
