import type {
  JwPlaylistItem,
  MultimediaItem,
  PlaylistTagItem,
} from 'src/types';

import { JPG_EXTENSIONS } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  dynamicMediaMapper,
  processMissingMediaInfo,
} from 'src/helpers/jw-media';
import { getTempPath } from 'src/utils/fs';
import { isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';

const { decompress, executeQuery, fs, path, toggleMediaWindow } =
  window.electronApi;
const { pathExists, remove, rename } = fs;
const { basename, extname, join } = path;

const jwpubDecompressor = async (jwpubPath: string, outputPath: string) => {
  try {
    await decompress(jwpubPath, outputPath);
    await decompress(join(outputPath, 'contents'), outputPath);
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
      outputPath = join(await getTempPath(), basename(jwpubPath));
    }

    // If force, clear the output directory before filling it
    if (force) {
      try {
        await remove(outputPath);
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
    const outputPath = join(destPath, basename(jwPlaylistPath));
    await decompress(jwPlaylistPath, outputPath);
    const dbFile = await findDb(outputPath);
    if (!dbFile) return [];
    let playlistName = '';
    try {
      const playlistNameQuery = executeQuery<PlaylistTagItem>(
        dbFile,
        'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
      );
      if (playlistNameQuery[0]) {
        playlistName = playlistNameQuery[0].Name + ' - ';
      }
    } catch (error) {
      errorCatcher(error);
    }
    const playlistItems = executeQuery<JwPlaylistItem>(
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
      playlistItems.map(async (item, i) => {
        item.ThumbnailFilePath = item.ThumbnailFilePath
          ? join(outputPath, item.ThumbnailFilePath)
          : '';
        if (
          item.ThumbnailFilePath &&
          !JPG_EXTENSIONS.includes(
            extname(item.ThumbnailFilePath).toLowerCase().replace('.', ''),
          ) &&
          (await pathExists(item.ThumbnailFilePath))
        ) {
          try {
            await rename(
              item.ThumbnailFilePath,
              item.ThumbnailFilePath + '.jpg',
            );
            item.ThumbnailFilePath += '.jpg';
          } catch (error) {
            errorCatcher(error);
          }
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

        const VerseNumbers = window.electronApi
          .executeQuery<{
            Label: string;
          }>(
            dbFile,
            `SELECT
            Label
          FROM
            PlaylistItemMarker
          WHERE
            PlaylistItemId = ${item.PlaylistItemId}`,
          )
          .map((v) =>
            parseInt(
              Array.from(
                v.Label.matchAll(/\w+ (?:\d+:)?(\d+)/g),
                (m) => m[1],
              )[0] ?? '0',
            ),
          );

        const playlistItemName = `${i + 1} - ${item.Label}`;

        const returnItem: MultimediaItem = {
          BeginParagraphOrdinal: 0,
          BookNumber: item.BookNumber,
          Caption: '',
          CategoryType: 0,
          ChapterNumber: item.ChapterNumber,
          DocumentId: 0,
          EndTime: EndTime ?? undefined,
          FilePath: item.IndependentMediaFilePath
            ? join(outputPath, item.IndependentMediaFilePath)
            : '',
          IssueTagNumber: item.IssueTagNumber,
          KeySymbol: item.KeySymbol,
          Label: `${playlistName}${playlistItemName}`,
          MajorType: 0,
          MepsLanguageIndex: item.MepsLanguage,
          MimeType: item.MimeType,
          MultimediaId: 0,
          Repeat: item.EndAction === 3,
          StartTime: StartTime ?? undefined,
          TargetParagraphNumberLabel: 0,
          ThumbnailFilePath: item.ThumbnailFilePath || '',
          Track: item.Track,
          VerseNumbers,
        };
        return returnItem;
      }),
    );

    await processMissingMediaInfo(playlistMediaItems, true);
    const mappedPlaylistMediaItems = await dynamicMediaMapper(
      playlistMediaItems.filter((m) => m.KeySymbol !== 'nwt'),
      selectedDateValue,
      'playlist',
    );
    return mappedPlaylistMediaItems;
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
    toggleMediaWindow(state);
  } catch (error) {
    errorCatcher(error);
  }
};
