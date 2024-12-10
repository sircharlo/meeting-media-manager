import type { Release } from './../../src/types';

import pkg from './../../package.json';
import { GH_AUTHOR, GH_REPO } from './constants';

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
