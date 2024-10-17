import pkg from './../../package.json';

export const CANONICAL_URL = pkg.homepage;
export const GH_REPO_URL = pkg.repository.url.replace('.git', '');
export const GH_REPO = GH_REPO_URL.replace('https://github.com/', '').split(
  '/',
)[1];
