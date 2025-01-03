import type {
  JwPlaylistItem,
  MultimediaItem,
  PlaylistTagItem,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import {
  dynamicMediaMapper,
  processMissingMediaInfo,
} from 'src/helpers/jw-media';
import { getTempPath } from 'src/utils/fs';
import { isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';

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

export const decompressJwpub = async (
  jwpubPath: string,
  outputPath?: string,
  force = false,
) => {
  try {
    const currentState = useCurrentStateStore();
    if (!isJwpub(jwpubPath)) return jwpubPath;
    if (!outputPath) {
      outputPath = window.electronApi.path.join(
        await getTempPath(),
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

export const getMediaFromJwPlaylist = async (
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
      if (playlistNameQuery[0]) {
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
      'additional',
    );
    return dynamicPlaylistMediaItems;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const showMediaWindow = (state?: boolean) => {
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
