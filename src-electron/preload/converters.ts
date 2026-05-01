import type { ConversionOptions } from 'src/types';

import { capturePreloadError } from 'src-electron/preload/log';

export const convertHeic = async (image: ConversionOptions) => {
  try {
    const { default: convert } = await import('heic-convert');
    return convert(image);
  } catch (e) {
    capturePreloadError(e);
    return new ArrayBuffer(0);
  }
};
