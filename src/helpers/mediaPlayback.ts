import type {
  JwPlaylistItem,
  MultimediaItem,
  PlaylistTagItem,
} from 'src/types';

import { Buffer } from 'buffer';
import {
  AUDIO_EXTENSIONS,
  HEIC_EXTENSIONS,
  JWL_PLAYLIST_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
  PURE_IMG_EXTENSIONS,
  SVG_EXTENSIONS,
  VIDEO_EXTENSIONS,
  ZIP_EXTENSIONS,
} from 'src/constants/fs';
import { FULL_HD } from 'src/constants/media';
import { getFileUrl, getTempDirectory } from 'src/helpers/fs';
import {
  dynamicMediaMapper,
  processMissingMediaInfo,
} from 'src/helpers/jw-media';
import { useCurrentStateStore } from 'src/stores/current-state';

import { errorCatcher } from './error-catcher';

const formatTime = (time: number) => {
  try {
    if (!time) return '00:00';
    if (Number.isNaN(time)) return '..:..';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    errorCatcher(error);
    return '..:..';
  }
};

const isFileOfType = (filepath: string, validExtensions: string[]) => {
  try {
    if (!filepath) return false;
    const fileExtension = window.electronApi.path
      .parse(filepath)
      .ext.toLowerCase()
      .slice(1);
    return validExtensions.includes(fileExtension);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const isImage = (filepath: string) => {
  return isFileOfType(filepath, PURE_IMG_EXTENSIONS);
};

const isHeic = (filepath: string) => {
  return isFileOfType(filepath, HEIC_EXTENSIONS);
};

const isSvg = (filepath: string) => {
  return isFileOfType(filepath, SVG_EXTENSIONS);
};

const isVideo = (filepath: string) => {
  return isFileOfType(filepath, VIDEO_EXTENSIONS);
};

const isAudio = (filepath: string) => {
  return isFileOfType(filepath, AUDIO_EXTENSIONS);
};

const isPdf = (filepath: string) => {
  return isFileOfType(filepath, PDF_EXTENSIONS);
};

const isArchive = (filepath: string) => {
  return isFileOfType(filepath, ZIP_EXTENSIONS);
};

const isJwpub = (filepath: string) => {
  return isFileOfType(filepath, JWPUB_EXTENSIONS);
};

const isJwPlaylist = (filepath: string) => {
  return isFileOfType(filepath, JWL_PLAYLIST_EXTENSIONS);
};

const isSong = (multimediaItem: MultimediaItem) => {
  if (
    !multimediaItem.FilePath ||
    !isVideo(multimediaItem.FilePath) ||
    !multimediaItem.Track ||
    !multimediaItem.KeySymbol?.includes('sjj')
  )
    return '';
  return multimediaItem.Track.toString();
};

const isRemoteFile = (
  file: File | { filename?: string; filetype?: string; path: string },
): file is { filename?: string; filetype?: string; path: string } => {
  if (!file.path) return false;
  return file.path.startsWith('http://') || file.path.startsWith('https://');
};

const inferExtension = async (filename: string, filetype?: string) => {
  if (!filetype) return filename;
  const { default: mime } = await import('mime');
  const extractedExtension = mime.extension(filetype);
  if (!extractedExtension) {
    // warningCatcher(
    //   'Could not determine the file extension from the provided file type: ' +
    //     filetype,
    // );
    return filename;
  }
  const hasExtension = /\.[0-9a-z]+$/i.test(filename);
  if (hasExtension) {
    return filename;
  }
  return `${filename}.${extractedExtension}`;
};

const isImageString = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:image');
};

const jwpubDecompressor = async (jwpubPath: string, outputPath: string) => {
  try {
    await window.electronApi.decompress(jwpubPath, outputPath);
    await window.electronApi.decompress(
      window.electronApi.path.join(outputPath, 'contents'),
      outputPath,
    );
    return outputPath;
  } catch (error) {
    errorCatcher(error);
    return jwpubPath;
  }
};

const decompressJwpub = async (
  jwpubPath: string,
  outputPath?: string,
  force = false,
) => {
  try {
    const currentState = useCurrentStateStore();
    if (!isJwpub(jwpubPath)) return jwpubPath;
    if (!outputPath) {
      outputPath = window.electronApi.path.join(
        await getTempDirectory(),
        window.electronApi.path.basename(jwpubPath),
      );
    }

    // If force, clear the output directory before filling it
    if (force) {
      try {
        await window.electronApi.fs.remove(outputPath);
      } catch (e) {
        errorCatcher(e);
      }
    }
    if (!currentState.extractedFiles[outputPath] || force) {
      currentState.extractedFiles[outputPath] = await jwpubDecompressor(
        jwpubPath,
        outputPath,
      );
    }
    return currentState.extractedFiles[outputPath];
  } catch (error) {
    errorCatcher(error);
    return jwpubPath;
  }
};

const getMediaFromJwPlaylist = async (
  jwPlaylistPath: string,
  selectedDateValue: Date,
  destPath: string,
) => {
  try {
    if (!jwPlaylistPath) return [];
    const outputPath = window.electronApi.path.join(
      destPath,
      window.electronApi.path.basename(jwPlaylistPath),
    );
    await window.electronApi.decompress(jwPlaylistPath, outputPath);
    const dbFile = await findDb(outputPath);
    if (!dbFile) return [];
    let playlistName = '';
    try {
      const playlistNameQuery =
        window.electronApi.executeQuery<PlaylistTagItem>(
          dbFile,
          'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
        );
      if (playlistNameQuery.length) {
        playlistName = playlistNameQuery[0].Name + ' - ';
      }
    } catch (error) {
      errorCatcher(error);
    }
    const playlistItems = window.electronApi.executeQuery<JwPlaylistItem>(
      dbFile,
      `SELECT
        pi.PlaylistItemId,
        pi.Label,
        pi.StartTrimOffsetTicks,
        pi.EndTrimOffsetTicks,
        pi.Accuracy,
        pi.EndAction,
        pi.ThumbnailFilePath,
        plm.BaseDurationTicks,
        pim.DurationTicks,
        im.OriginalFilename,
        im.FilePath AS IndependentMediaFilePath,
        im.MimeType,
        im.Hash,
        l.LocationId,
        l.BookNumber,
        l.ChapterNumber,
        l.DocumentId,
        l.Track,
        l.IssueTagNumber,
        l.KeySymbol,
        l.MepsLanguage,
        l.Type,
        l.Title
      FROM
        PlaylistItem pi
      LEFT JOIN
        PlaylistItemIndependentMediaMap pim ON pi.PlaylistItemId = pim.PlaylistItemId
      LEFT JOIN
        IndependentMedia im ON pim.IndependentMediaId = im.IndependentMediaId
      LEFT JOIN
        PlaylistItemLocationMap plm ON pi.PlaylistItemId = plm.PlaylistItemId
      LEFT JOIN
        Location l ON plm.LocationId = l.LocationId`,
    );
    const playlistMediaItems: MultimediaItem[] = await Promise.all(
      playlistItems.map(async (item) => {
        item.ThumbnailFilePath = item.ThumbnailFilePath
          ? window.electronApi.path.join(outputPath, item.ThumbnailFilePath)
          : '';
        if (
          item.ThumbnailFilePath &&
          (await window.electronApi.fs.pathExists(item.ThumbnailFilePath)) &&
          !item.ThumbnailFilePath.includes('.jpg')
        ) {
          await window.electronApi.fs.rename(
            item.ThumbnailFilePath,
            item.ThumbnailFilePath + '.jpg',
          );
          item.ThumbnailFilePath += '.jpg';
        }
        const durationTicks =
          item?.BaseDurationTicks || item?.DurationTicks || 0;
        const EndTime =
          durationTicks &&
          item?.EndTrimOffsetTicks &&
          durationTicks >= item.EndTrimOffsetTicks
            ? (durationTicks - item.EndTrimOffsetTicks) / 10000 / 1000
            : null;

        const StartTime =
          item.StartTrimOffsetTicks && item.StartTrimOffsetTicks >= 0
            ? item.StartTrimOffsetTicks / 10000 / 1000
            : null;

        const returnItem: MultimediaItem = {
          BeginParagraphOrdinal: 0,
          Caption: '',
          CategoryType: 0,
          DocumentId: 0,
          EndTime: EndTime ?? undefined,
          FilePath: item.IndependentMediaFilePath
            ? window.electronApi.path.join(
                outputPath,
                item.IndependentMediaFilePath,
              )
            : '',
          IssueTagNumber: item.IssueTagNumber,
          KeySymbol: item.KeySymbol,
          Label: `${playlistName}${item.Label}`,
          MajorType: 0,
          MepsLanguageIndex: item.MepsLanguage,
          MimeType: item.MimeType,
          MultimediaId: 0,
          Repeat: item.EndAction === 3,
          StartTime: StartTime ?? undefined,
          TargetParagraphNumberLabel: 0,
          ThumbnailFilePath: item.ThumbnailFilePath || '',
          Track: item.Track,
        };
        return returnItem;
      }),
    );

    await processMissingMediaInfo(playlistMediaItems);
    const dynamicPlaylistMediaItems = await dynamicMediaMapper(
      playlistMediaItems,
      selectedDateValue,
      true,
    );
    return dynamicPlaylistMediaItems;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const findDb = async (publicationDirectory: string | undefined) => {
  if (!publicationDirectory) return undefined;
  try {
    if (!(await window.electronApi.fs.pathExists(publicationDirectory)))
      return undefined;
    const files = await window.electronApi.readdir(publicationDirectory);
    return files
      .map((file) =>
        window.electronApi.path.join(publicationDirectory, file.name),
      )
      .find((filename) => filename.includes('.db'));
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

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
    img.src = getFileUrl(filepath);

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

const convertImageIfNeeded = async (filepath: string) => {
  if (isHeic(filepath)) {
    return await convertHeicToJpg(filepath);
  } else if (isSvg(filepath)) {
    return await convertSvgToJpg(filepath);
  } else if (isPdf(filepath)) {
    const nrOfPages = await window.electronApi.getNrOfPdfPages(filepath);
    if (nrOfPages === 1) {
      const converted = await window.electronApi.convertPdfToImages(
        filepath,
        await getTempDirectory(),
      );
      return converted[0] || filepath;
    }
  }
  return filepath;
};

const showMediaWindow = (state?: boolean) => {
  try {
    const currentState = useCurrentStateStore();
    if (typeof state === 'undefined') {
      state = !currentState.mediaWindowVisible;
    }
    currentState.mediaWindowVisible = state;
    window.electronApi.toggleMediaWindow(state);
  } catch (error) {
    errorCatcher(error);
  }
};

export {
  convertHeicToJpg,
  convertImageIfNeeded,
  convertSvgToJpg,
  decompressJwpub,
  findDb,
  formatTime,
  getMediaFromJwPlaylist,
  inferExtension,
  isArchive,
  isAudio,
  isFileOfType,
  isHeic,
  isImage,
  isImageString,
  isJwPlaylist,
  isJwpub,
  isPdf,
  isRemoteFile,
  isSong,
  isSvg,
  isVideo,
  showMediaWindow,
};
