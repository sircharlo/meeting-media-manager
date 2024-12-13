import ffmpeg from 'fluent-ffmpeg';
import sizeOf from 'image-size';
import { FULL_HD } from 'src/constants/media';
import path from 'upath';

export const createVideoFromNonVideo = async (
  originalFile: string,
  ffmpegPath: string,
) => {
  const convertedFilePath = path.changeExt(originalFile, '.mp4');
  ffmpeg.setFfmpegPath(ffmpegPath);

  if (originalFile.toLowerCase().endsWith('.mp3')) {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(originalFile)
        .noVideo()
        .save(convertedFilePath)
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  } else {
    const { height, orientation, width } = sizeOf(originalFile);

    let adjustedWidth = width;
    let adjustedHeight = height;

    if (orientation && orientation >= 5) {
      [adjustedWidth, adjustedHeight] = [height, width];
    }

    if (adjustedWidth && adjustedHeight) {
      let max = [undefined, Math.min(FULL_HD.height, adjustedHeight)];
      if (FULL_HD.height / FULL_HD.width > adjustedHeight / adjustedWidth) {
        max = [Math.min(FULL_HD.width, adjustedWidth), undefined];
      }
      const convertedDimensions = resize(
        adjustedWidth,
        adjustedHeight,
        max[0],
        max[1],
      );

      if (!convertedDimensions) {
        throw new Error('Could not determine dimensions of image.');
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(originalFile)
          .inputOptions('-loop 1')
          .inputFormat('image2')
          .videoCodec('libx264')
          .size(`${convertedDimensions.width}x${convertedDimensions.height}`)
          // .outputOptions('format=yuv420p', '-r 30')
          .outputOptions('-t 5')
          .save(convertedFilePath)
          .on('start', (cmd) => console.log(cmd))
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    } else {
      throw new Error('Could not determine dimensions of image.');
    }
  }

  return convertedFilePath;
};
const resize = (
  x: number,
  y: number,
  xMax?: number,
  yMax?: number,
): { height: number; width: number } => {
  // Set default values for xMax and yMax if they are undefined
  const maxX = xMax ?? Infinity; // Use Infinity if no max value is provided
  const maxY = yMax ?? Infinity;

  if (maxX === Infinity && maxY === Infinity) {
    throw new Error('No maximum values given.');
  }

  if (maxX !== Infinity && (maxY === Infinity || x / y > maxX / maxY)) {
    // Width constrained or aspect ratio favors width.
    return {
      height: Math.round((maxX * y) / x),
      width: maxX,
    };
  }

  // Height constrained or aspect ratio favors height.
  return {
    height: maxY,
    width: Math.round((maxY * x) / y),
  };
};
