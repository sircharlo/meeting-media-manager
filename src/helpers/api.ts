import type { JwLangCode, JwLanguageResult } from 'src/types';

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
      errorCatcher(response);
    }
  } catch (e) {
    errorCatcher(e);
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
