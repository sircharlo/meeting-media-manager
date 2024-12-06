import type Decompress from 'decompress';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';

import { ensureDir, writeFile } from 'fs-extra';
import { FULL_HD } from 'src/constants/media';
import { basename, join } from 'upath';

import { capturePreloadError } from './log';

export interface ConversionOptions {
  /**
   * the HEIC file buffer
   */
  buffer: ArrayBufferLike;
  /**
   * output format
   */
  format: 'JPEG' | 'PNG';
  /**
   * the JPEG compression quality, between 0 and 1
   * @default 0.92
   */
  quality?: number;
}

export const decompress: typeof Decompress = async (input, output, opts) => {
  const { default: decompressPackage } = await import('decompress');
  return decompressPackage(input, output, opts);
};

export const convertHeic = async (image: ConversionOptions) => {
  const { default: convert } = await import('heic-convert');
  return convert(image);
};

export const getNrOfPdfPages = async (pdfPath: string): Promise<number> => {
  try {
    const { getDocument } = await import('pdfjs-dist/webpack.mjs');

    const loadingTask = getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    return pdfDocument.numPages;
  } catch (e) {
    capturePreloadError(e);
    return 0;
  }
};

export const convertPdfToImages = async (
  pdfPath: string,
  outputFolder: string,
): Promise<string[]> => {
  const outputImages: string[] = [];
  try {
    const { getDocument } = await import('pdfjs-dist/webpack.mjs');

    const loadingTask = getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    const promises: Promise<PDFPageProxy>[] = [];

    for (let i = 1; i <= numPages; i++) {
      promises.push(pdfDocument.getPage(i));
    }

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return [];

        const scale = Math.min(
          (2 * FULL_HD.width) / viewport.width,
          (2 * FULL_HD.height) / viewport.height,
        );
        const scaledViewport = page.getViewport({ scale: scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext: RenderParameters = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;

        const pngData = canvas.toDataURL('image/png');

        const base64Data = pngData.replace(/^data:image\/png;base64,/, '');
        await ensureDir(outputFolder);
        const outputPath = join(outputFolder, `${basename(pdfPath)}_${i}.png`);
        await writeFile(outputPath, base64Data, 'base64');
        outputImages.push(outputPath);
      } catch (e) {
        capturePreloadError(e);
      }
    }
    return outputImages;
  } catch (e) {
    capturePreloadError(e);
    return outputImages;
  }
};
