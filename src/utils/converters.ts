import { FULL_HD } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getTempPath } from 'src/utils/fs';
import { isHeic, isPdf, isSvg } from 'src/utils/media';

const convertHeicToJpg = async (filepath: string) => {
  if (!isHeic(filepath)) return filepath;
  try {
    const buffer = await window.electronApi.fs.readFile(filepath);
    const output = await window.electronApi.convertHeic({
      buffer,
      format: 'JPEG',
    });
    const existingPath = window.electronApi.path.parse(filepath);
    const newPath = `${existingPath.dir}/${existingPath.name}.jpg`;
    await window.electronApi.fs.writeFile(newPath, Buffer.from(output));
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
    img.src = window.electronApi.pathToFileURL(filepath);

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
        const existingPath = window.electronApi.path.parse(filepath);
        const newPath = `${existingPath.dir}/${existingPath.name}.png`;
        try {
          await window.electronApi.fs.writeFile(
            newPath,
            Buffer.from(outputImg.split(',')[1], 'base64'),
          );
          resolve(newPath);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = function (error) {
        reject(error);
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
    const nrOfPages = await window.electronApi.getNrOfPdfPages(filepath);
    if (nrOfPages === 1) {
      const converted = await window.electronApi.convertPdfToImages(
        filepath,
        await getTempPath(),
      );
      return converted[0] || filepath;
    }
  }
  return filepath;
};
