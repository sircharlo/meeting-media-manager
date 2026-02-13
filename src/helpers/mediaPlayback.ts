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
import { uuid } from 'src/shared/vanilla';
import { formatDate } from 'src/utils/date';
import { getTempPath } from 'src/utils/fs';
import { isJwpub } from 'src/utils/media';
import { findDb, getPublicationInfoFromDb } from 'src/utils/sqlite';
import { useCurrentStateStore } from 'stores/current-state';

const { executeQuery, fs, getZipEntries, path, toggleMediaWindow, unzip } =
  globalThis.electronApi;
const { ensureDir, pathExists, remove, rename, stat } = fs;
const { basename, extname, join } = path;

/**
 * Efficiently identifies a JWPUB file by peeking into its metadata
 * without full extraction.
 */
export async function identifyJwpub(jwpubPath: string) {
  const tempDir = await getTempPath();
  if (!tempDir) return;

  const extractionId = uuid();
  const tempExplodePath = join(tempDir, `identify-${extractionId}`);

  try {
    // 1. Peek at JWPUB to find 'contents'
    const jwpubEntries = await getZipEntries(jwpubPath);
    if (!jwpubEntries['contents']) return;

    // 2. Extract ONLY 'contents' to temp
    await ensureDir(tempExplodePath);
    await unzip(jwpubPath, tempExplodePath, { includes: ['contents'] });
    const contentsPath = join(tempExplodePath, 'contents');

    // 3. Peek at 'contents' to find the .db file
    const contentsEntries = await getZipEntries(contentsPath);
    const dbName = Object.keys(contentsEntries).find((n) => n.endsWith('.db'));
    if (!dbName) return;

    // 4. Extract ONLY the .db file to temp
    await unzip(contentsPath, tempExplodePath, { includes: [dbName] });
    const dbPath = join(tempExplodePath, dbName);

    // 5. Get publication info
    return getPublicationInfoFromDb(dbPath);
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: { jwpubPath },
          name: 'identifyJwpub',
        },
      },
    });
    return undefined;
  } finally {
    // Cleanup
    await remove(tempExplodePath).catch(() => undefined);
  }
}

const ongoingUnzips = new Map<string, Promise<string | undefined>>();

const jwpubExtractor = async (jwpubPath: string, outputPath: string) => {
  try {
    const contentsPath = join(outputPath, 'contents');
    const jwpubEntries = await getZipEntries(jwpubPath);
    const expectedContentsSize = jwpubEntries['contents'];

    // First, only extract 'contents' from the JWPUB zip if it doesn't exist or is the wrong size
    const contentsStats = await stat(contentsPath).catch(() => undefined);
    console.log(
      `[jwpubExtractor] contents size: path ${contentsPath}, expected ${expectedContentsSize}, got ${contentsStats?.size}.`,
    );
    if (!contentsStats || contentsStats.size !== expectedContentsSize) {
      if (contentsStats) {
        console.warn(
          `[jwpubExtractor] contents size mismatch: path ${contentsPath}, expected ${expectedContentsSize}, got ${contentsStats.size}. Re-extracting.`,
        );
      }
      try {
        await unzip(jwpubPath, outputPath, {
          includes: ['contents'],
        });
        const contentsStats = await stat(contentsPath).catch(() => undefined);
        console.log(
          `[jwpubExtractor] contents after unzip: path ${contentsPath}, expected ${expectedContentsSize}, got ${contentsStats?.size}.`,
        );
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
    // We check if the database exists and has the correct size to determine if we need to unzip
    const dbFile = await findDb(outputPath);
    const contentsEntries = await getZipEntries(contentsPath);
    let expectedDbSize = 0;
    let expectedDbName = '';

    for (const [name, size] of Object.entries(contentsEntries)) {
      if (name.endsWith('.db')) {
        expectedDbSize = size;
        expectedDbName = name;
        break;
      }
    }

    const dbStats = dbFile
      ? await stat(dbFile).catch(() => undefined)
      : undefined;
    console.log(
      `[jwpubExtractor] DB size: path ${dbFile}, expected ${expectedDbSize} (${expectedDbName}), got ${dbStats?.size}.`,
    );
    if (dbStats?.size !== expectedDbSize) {
      if (dbStats) {
        console.warn(
          `[jwpubExtractor] DB size mismatch: path ${dbFile}, expected ${expectedDbSize} (${expectedDbName}), got ${dbStats.size}. Re-extracting contents.`,
        );
      }
      try {
        await unzip(contentsPath, outputPath);
        const dbFile = await findDb(outputPath);
        if (!dbFile) throw new Error('DB still not found after unzip');
        const dbStats = await stat(dbFile).catch(() => undefined);
        console.log(
          `[jwpubExtractor] DB size after unzip: path ${dbFile}, expected ${expectedDbSize} (${expectedDbName}), got ${dbStats?.size}.`,
        );
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
            PlaylistItemId = ?`,
            [item.PlaylistItemId],
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

export const toggleMediaWindowVisibility = (state?: boolean) => {
  try {
    const currentState = useCurrentStateStore();

    // Use provided state, or toggle current state if not provided
    const newState = state ?? !currentState.mediaWindowVisible;

    currentState.mediaWindowVisible = newState;

    toggleMediaWindow(
      newState,
      currentState.currentSettings?.enableMediaWindowFadeTransitions,
    );
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            state,
          },
          name: 'toggleMediaWindowVisibility',
        },
      },
    });
  }
};
