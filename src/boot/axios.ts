import type { JwLanguage } from 'src/types';

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { errorCatcher } from 'src/helpers/error-catcher';

const get = async <T>(
  url: string,
  params?: AxiosRequestConfig,
): Promise<null | T> => {
  try {
    const res = await axios.get<T>(url, { params });
    return res.data;
  } catch (e) {
    if (!(e instanceof AxiosError) || ![400, 404].includes(e.status ?? 0)) {
      errorCatcher(e);
    }
  }
  return null;
};

const getLanguages = async (baseUrl?: string): Promise<JwLanguage[]> => {
  if (!baseUrl) return [];
  const req = await get<{ languages: JwLanguage[] }>(
    `https://www.${baseUrl}/en/languages/`,
  );
  return req?.languages || [];
};

const urlWithParamsToString = (url: string, params: object) => {
  if (!url) return '';
  if (!params) return url;
  const urlWithParams = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      urlWithParams.searchParams.append(key, value);
    }
  }
  return urlWithParams.toString();
};

const getYeartext = async (lang: string, baseUrl: string, year?: number) => {
  if (!baseUrl) return { content: '' };
  const url = `https://wol.${baseUrl}/wol/finder`;
  const params = {
    docid: `110${year || new Date().getFullYear()}800`,
    format: 'json',
    snip: 'yes',
    wtlocale: lang,
  };
  return await get<{ content: string }>(urlWithParamsToString(url, params));
};

export { get, getLanguages, getYeartext, urlWithParamsToString };
