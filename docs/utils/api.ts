import type { Release } from './../../src/types/github.d.ts';

import pkg from './../../package.json' with { type: 'json' };
import { GH_AUTHOR, GH_REPO } from './constants.ts';

const fallbackVersion = 'v' + pkg.version;

export const fetchLatestVersion = async (): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GH_AUTHOR}/${GH_REPO}/releases`,
    );
    const result: Release[] = await response.json();
    if (!result?.length) return fallbackVersion;
    return result.find((r) => !r.prerelease)?.tag_name || fallbackVersion;
  } catch (e) {
    console.error(e);
    return fallbackVersion;
  }
};

interface GithubRelease {
  assets?: { name: string }[];
  prerelease: boolean;
  published_at: string;
  tag_name: string;
}

export const fetchLatestRelease = async (): Promise<{
  /** The names of the release's files. */
  assetNames: string[];
  publishedAt: string;
  tag: string;
}> => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GH_AUTHOR}/${GH_REPO}/releases`,
    );
    const result: GithubRelease[] = await response.json();
    if (!Array.isArray(result) || !result.length)
      return { assetNames: [], publishedAt: '', tag: fallbackVersion };
    const latest = result.find((r) => !r.prerelease);
    return {
      assetNames: latest?.assets?.map((asset) => asset.name) ?? [],
      publishedAt: latest?.published_at || '',
      tag: latest?.tag_name || fallbackVersion,
    };
  } catch (e) {
    console.error(e);
    return { assetNames: [], publishedAt: '', tag: fallbackVersion };
  }
};
