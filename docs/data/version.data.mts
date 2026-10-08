import { defineLoader } from 'vitepress';

import { fetchLatestRelease } from './../utils/api.ts';

export interface Data {
  /** The last release for 32-bit Windows and macOS 12 (see LEGACY_VERSION). */
  legacyVersion: string;
  linux: string;
  /** macOS 12 (Monterey) installer from LEGACY_VERSION. */
  macLegacy: string;
  macUniversal: string;
  publishedAt: string;
  version: string;
  /** 32-bit Windows installer from LEGACY_VERSION, not the latest release. */
  win32: string;
  win64: string;
  winPortable: string;
}

declare const data: Data;
export { data };

// The last release that runs on 32-bit Windows and macOS 12 (Electron 43).
// Newer releases can't run there, so these links stay pinned to it - and its
// GitHub release must never be deleted.
const LEGACY_VERSION = 'v26.10.0';

const releaseAssetUrl = (version: string, arch: string, ext: string) =>
  `https://github.com/sircharlo/meeting-media-manager/releases/download/${version}/meeting-media-manager-${version.slice(1)}-${arch}.${ext}`;

export default defineLoader({
  async load(): Promise<Data> {
    const { publishedAt, tag: latestVersion } = await fetchLatestRelease();
    const downloadUrl = (arch: string, ext: string) =>
      releaseAssetUrl(latestVersion, arch, ext);
    return {
      legacyVersion: LEGACY_VERSION,
      linux: downloadUrl('x86_64', 'AppImage'),
      macLegacy: releaseAssetUrl(LEGACY_VERSION, 'universal', 'dmg'),
      macUniversal: downloadUrl('universal', 'dmg'),
      publishedAt,
      version: latestVersion,
      win32: releaseAssetUrl(LEGACY_VERSION, 'ia32', 'exe'),
      win64: downloadUrl('x64', 'exe'),
      winPortable: downloadUrl('portable', 'exe'),
    };
  },
});
