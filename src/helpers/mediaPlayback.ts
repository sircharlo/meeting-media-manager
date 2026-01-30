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
import { formatDate } from 'src/utils/date';
import { getTempPath } from 'src/utils/fs';
import { isJwpub } from 'src/utils/media';
import { findDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';

const { executeQuery, fs, path, toggleMediaWindow, unzip } =
  globalThis.electronApi;
const { pathExists, remove, rename } = fs;
const { basename, extname, join } = path;

const ongoingUnzips = new Map<string, Promise<string | undefined>>();

const jwpubExtractor = async (jwpubPath: string, outputPath: string) => {
  try {
    const contentsPath = join(outputPath, 'contents');
    // First, only extract 'contents' from the JWPUB zip if it doesn't exist
    if (!(await pathExists(contentsPath))) {
      try {
        await unzip(jwpubPath, outputPath, {
          includes: ['contents'],
        });
      } catch (error) {
        // If unzipping the JWPUB fails, it's likely corrupted.
        // Remove it to force a re-download on next attempt.
        await remove(jwpubPath).catch((removeError) =>
          errorCatcher(removeError, {
            contexts: {
              fn: {
                args: {
                  jwpubPath,
                  outputPath,
                },
                name: 'jwpubExtractor remove corrupt jwpub',
              },
            },
          }),
        );
        throw error;
      }
    }

    // Then, extract 'contents' into the output directory if needed
    // We check if the database exists to determine if we need to unzip
    const dbFile = await findDb(outputPath);
    if (!dbFile) {
      try {
        await unzip(contentsPath, outputPath);
      } catch (error) {
        // If unzipping contents fails, it might be corrupted.
        // Remove it so it can be re-extracted next time.
        await remove(contentsPath).catch((removeError) =>
          errorCatcher(removeError, {
            contexts: {
              fn: {
                args: {
                  jwpubPath,
                  outputPath,
                },
                name: 'jwpubExtractor remove contents',
              },
            },
          }),
        );
        // Also remove the source JWPUB as it's the progenitor of the corrupt contents
        await remove(jwpubPath);
        throw error;
      }
    }
    return outputPath;
  } catch (error) {
    // If anything fails, clean up the output directory to avoid partial extractions
    try {
      await remove(outputPath);
    } catch (removeError) {
      await errorCatcher(removeError, {
        contexts: {
          fn: {
            args: {
              jwpubPath,
              outputPath,
            },
            name: 'jwpubExtractor cleanup output error',
          },
        },
      });
    }

    await errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            jwpubPath,
            outputPath,
          },
          name: 'jwpubExtractor',
        },
      },
    });

    // We MUST throw the error so the caller knows extraction failed.
    throw error;
  }
};

export const unzipJwpub = async (
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

    const cacheKey = `${jwpubPath}->${outputPath}`;

    // If force, clear the output directory before filling it
    if (force) {
      try {
        await remove(outputPath);
      } catch (e) {
        await errorCatcher(e, {
          contexts: {
            fn: {
              args: {
                jwpubPath,
                outputPath,
              },
              name: 'unzipJwpub remove',
            },
          },
        });
      }
    }

    let unzipPromise = ongoingUnzips.get(cacheKey);

    if (!unzipPromise || force) {
      unzipPromise = (async () => {
        if (!currentState.extractedFiles[outputPath] || force) {
          // jwpubExtractor now throws on failure
          currentState.extractedFiles[outputPath] = await jwpubExtractor(
            jwpubPath,
            outputPath,
          );
        }
        return currentState.extractedFiles[outputPath];
      })();
      ongoingUnzips.set(cacheKey, unzipPromise);
    }

    try {
      return await unzipPromise;
    } finally {
      ongoingUnzips.delete(cacheKey);
    }
  } catch (error) {
    await errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            jwpubPath,
            outputPath,
          },
          name: 'unzipJwpub',
        },
      },
    });
    // Re-throw so consumers (like UI) can handle the failure
    throw error;
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
    await unzip(jwPlaylistPath, outputPath);
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
      await errorCatcher(error, {
        contexts: {
          fn: {
            args: {
              destPath,
              jwPlaylistPath,
              selectedDateValue,
            },
            name: 'getMediaFromJwPlaylist playlistNameQuery',
          },
        },
      });
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
            await errorCatcher(error, {
              contexts: {
                fn: {
                  args: {
                    item,
                    outputPath,
                  },
                  name: 'getMediaFromJwPlaylist rename thumbnail',
                },
              },
            });
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

        const VerseNumbers = globalThis.electronApi
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
            Number.parseInt(
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

    await processMissingMediaInfo({
      allMedia: playlistMediaItems,
      keepMediaLabels: true,
      meetingDate: formatDate(selectedDateValue, 'YYYYMMDD'),
    });
    const mappedPlaylistMediaItems = await dynamicMediaMapper(
      playlistMediaItems.filter((m) => m.KeySymbol !== 'nwt'),
      selectedDateValue,
      'playlist',
    );
    return mappedPlaylistMediaItems;
  } catch (error) {
    await errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            destPath,
            jwPlaylistPath,
            selectedDateValue,
          },
          name: 'getMediaFromJwPlaylist',
        },
      },
    });
    return [];
  }
};

export const showMediaWindow = async (state?: boolean) => {
  try {
    const currentState = useCurrentStateStore();
    state ??= !currentState.mediaWindowVisible;
    currentState.mediaWindowVisible = state;
    toggleMediaWindow(
      state,
      currentState.currentSettings?.enableMediaWindowFadeTransitions,
    );
  } catch (error) {
    await errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            state,
          },
          name: 'showMediaWindow',
        },
      },
    });
  }
};
