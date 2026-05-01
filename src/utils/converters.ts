import { Buffer } from 'buffer/';
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

export const convertPdfToImages = async (
  pdfPath: string,
  outputFolder: string,
  pages?: Set<number>,
): Promise<string[]> => {
  const outputImages: string[] = [];
  try {
    const buffer = await readFile(pdfPath);
    const parser = new PDFParse({ data: buffer });

    const result = await parser.getScreenshot({
      desiredWidth: FULL_HD.width * 2,
      imageBuffer: false,
    });

    const parsedPath = parse(pdfPath);

    for (let i = 0; i < result.pages.length; i++) {
      if (pages && !pages.has(i)) continue;

      const pageDataUrl = result.pages[i]?.dataUrl;
      if (pageDataUrl) {
        const outputPath = `${outputFolder}/${parsedPath.name}_${i + 1}.png`;
        await writeFile(
          outputPath,
          Buffer.from(pageDataUrl.split(',')[1] ?? '', 'base64'),
        );
        outputImages.push(outputPath);
      }
    }

    await parser.destroy();
    return outputImages;
  } catch (e) {
    errorCatcher(e);
    return outputImages;
  }
};

const convertHeicToJpg = async (filepath: string) => {
  if (!isHeic(filepath)) return filepath;
  try {
    const buffer = await readFile(filepath);
    const output = await convertHeic({
      buffer: buffer as unknown as ArrayBufferLike,
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
