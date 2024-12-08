import { defineLoader } from 'vitepress';

import { fetchLatestVersion } from './../utils/api';

export interface Data {
  linux: string;
  macArm: string;
  macIntel: string;
  win32: string;
  win64: string;
  winPortable: string;
}

declare const data: Data;
export { data };

export default defineLoader({
  async load(): Promise<Data> {
    const latestVersion = await fetchLatestVersion();
    const downloadUrl = (arch: string, ext: string) =>
      `https://github.com/sircharlo/meeting-media-manager/releases/download/${latestVersion}/meeting-media-manager-${latestVersion.slice(1)}-${arch}.${ext}`;
    return {
      linux: downloadUrl('x86_64', 'AppImage'),
      macArm: downloadUrl('arm64', 'dmg'),
      macIntel: downloadUrl('x64', 'dmg'),
      win32: downloadUrl('ia32', 'exe'),
      win64: downloadUrl('x64', 'exe'),
      winPortable: downloadUrl('portable', 'exe'),
    };
  },
});
