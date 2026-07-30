import { Buffer } from 'buffer'; // NOSONAR: this is not nodejs Buffer, it's the browser one
import { FULL_HD } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getTempPath } from 'src/utils/fs';
import { isHeic, isPdf, isSvg } from 'src/utils/media';

const { convertHeic, fs, parse, pathToFileURL } = globalThis.electronApi;
const { readFile, writeFile } = fs;

import { PDFParse } from 'pdf-parse';

PDFParse.setWorker(
  'https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs',
);

export const getNrOfPdfPages = async (pdfPath: string): Promise<number> => {
  try {
    const buffer = await readFile(pdfPath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getInfo({ parsePageInfo: false });
    await parser.destroy();
    return result.total;
  } catch (e) {
    errorCatcher(e);
    return 0;
  }
};

// Small enough to render quickly and stay light in memory for a PDF with
// hundreds of pages, but still legible enough to recognize a page's content
// in a thumbnail grid.
const PDF_THUMBNAIL_WIDTH = 220;

export interface PdfThumbnailSession {
  destroy: () => Promise<void>;
  getThumbnail: (pageNumber: number) => Promise<null | string>;
}

/**
 * Loads a PDF once and returns a handle for rendering individual page
 * thumbnails on demand, so a caller (e.g. a paginated thumbnail grid) can
 * request only the pages currently in view - one at a time or in small
 * batches - instead of rendering the entire document up front. Reuses the
 * same parsed document across calls; only `destroy()` re-reads/re-parses.
 */
export const openPdfThumbnailSession = async (
  pdfPath: string,
): Promise<PdfThumbnailSession> => {
  const buffer = await readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  // Cancelling mid-render (dialog closed/cancelled while a getScreenshot()
  // call is still in flight) makes that call reject once destroy() tears
  // down the parser - expected during a normal cancel, not a real failure,
  // so it shouldn't get reported to errorCatcher.
  let destroyed = false;

  return {
    destroy: () => {
      destroyed = true;
      return parser.destroy();
    },
    getThumbnail: async (pageNumber: number) => {
      try {
        const result = await parser.getScreenshot({
          desiredWidth: PDF_THUMBNAIL_WIDTH,
          imageBuffer: false,
          imageDataUrl: true,
          partial: [pageNumber],
        });
        return result.pages[0]?.dataUrl || null;
      } catch (e) {
        if (!destroyed) errorCatcher(e);
        return null;
      }
    },
  };
};

export const convertPdfToImages = async (
  pdfPath: string,
  outputFolder: string,
  pages?: Set<number>,
): Promise<string[]> => {
  try {
    const buffer = await readFile(pdfPath);
    const parser = new PDFParse({ data: buffer });

    // `pages` is 0-indexed; `partial` expects 1-indexed page numbers, and
    // restricts rendering to just those pages instead of the whole document.
    const pageNumbers = pages?.size
      ? [...pages].sort((a, b) => a - b).map((page) => page + 1)
      : undefined;

    const result = await parser.getScreenshot({
      desiredWidth: FULL_HD.width * 2,
      imageBuffer: false,
      partial: pageNumbers,
    });

    const parsedPath = parse(pdfPath);

    const writeResults = await Promise.allSettled(
      result.pages.map(async (page) => {
        const pageDataUrl = page.dataUrl;
        if (!pageDataUrl) return null;

        // Paired directly from the same getScreenshot() response rather
        // than re-derived from its array index - safe even if a requested
        // page were ever out of range and silently dropped from the
        // result, which would otherwise shift every later index and
        // mislabel the remaining pages.
        const pageNumber = page.pageNumber;
        const outputPath = `${outputFolder}/${parsedPath.name}_${pageNumber}.png`;
        await writeFile(
          outputPath,
          Buffer.from(pageDataUrl.split(',')[1] ?? '', 'base64'),
        );
        return outputPath;
      }),
    );

    await parser.destroy();

    const outputImages: string[] = [];
    for (const writeResult of writeResults) {
      if (writeResult.status === 'fulfilled') {
        if (writeResult.value) outputImages.push(writeResult.value);
      } else {
        errorCatcher(writeResult.reason);
      }
    }
    return outputImages;
  } catch (e) {
    errorCatcher(e);
    return [];
  }
};

const convertHeicToJpg = async (filepath: string) => {
  if (!isHeic(filepath)) return filepath;
  try {
    const buffer = await readFile(filepath);
    const output = await convertHeic({
      buffer,
      format: 'JPEG',
    });
    const existingPath = parse(filepath);
    const newPath = `${existingPath.dir}/${existingPath.name}.jpg`;
    await writeFile(newPath, Buffer.from(output));
    return newPath;
  } catch (error) {
    errorCatcher(error);
    return filepath;
  }
};

const convertSvgToJpg = async (filepath: string): Promise<string> => {
  try {
    if (!isSvg(filepath)) return filepath;

    const canvas = document.createElement('canvas');
    canvas.width = FULL_HD.width * 2;
    canvas.height = FULL_HD.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return filepath;

    const img = new Image();
    img.src = pathToFileURL(filepath);

    return new Promise((resolve, reject) => {
      img.onload = async function () {
        const canvasH = canvas.height,
          canvasW = canvas.width;
        const imgH = img.naturalHeight || canvasH,
          imgW = img.naturalWidth || canvasW;
        const hRatio = canvasH / imgH,
          wRatio = canvasW / imgW;
        if (wRatio < hRatio) {
          canvas.height = canvasW * (imgH / imgW);
        } else {
          canvas.width = canvasH * (imgW / imgH);
        }
        const ratio = Math.min(wRatio, hRatio);
        ctx.drawImage(img, 0, 0, imgW * ratio, imgH * ratio);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const outputImg = canvas.toDataURL('image/png');
        const existingPath = parse(filepath);
        const newPath = `${existingPath.dir}/${existingPath.name}.png`;
        try {
          await writeFile(
            newPath,
            Buffer.from(outputImg.split(',')[1] ?? '', 'base64'),
          );
          canvas.remove();
          resolve(newPath);
        } catch (error) {
          canvas.remove();
          reject(error);
        }
      };

      img.onerror = function (event) {
        const rejectionError = new Error(`Failed to load SVG: ${filepath}`);
        canvas.remove();
        errorCatcher(rejectionError, {
          contexts: {
            fn: {
              event: JSON.stringify(event, Object.getOwnPropertyNames(event)),
              filepath,
              name: 'convertSvgToJpg',
            },
          },
        });
        reject(rejectionError);
      };
    });
  } catch (error) {
    errorCatcher(error);
    return filepath;
  }
};

export const convertImageIfNeeded = async (filepath: string) => {
  if (isHeic(filepath)) {
    return await convertHeicToJpg(filepath);
  } else if (isSvg(filepath)) {
    return await convertSvgToJpg(filepath);
  } else if (isPdf(filepath)) {
    const nrOfPages = await getNrOfPdfPages(filepath);
    if (nrOfPages === 1) {
      const converted = await convertPdfToImages(filepath, await getTempPath());
      return converted[0] || filepath;
    }
  }
  return filepath;
};
