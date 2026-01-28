import type { FileDialogFilter, UnzipOptions, UnzipResult } from 'src/types';

import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { app, dialog } from 'electron';
import { ensureDir, type Stats } from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import {
  captureElectronError,
  getSharedDataPath,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindow } from 'src-electron/main/window/window-main';
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/media';
import { uuid } from 'src/shared/vanilla';
import upath from 'upath';
import yauzl from 'yauzl';

const { basename, dirname, join, toUnix } = upath;

const ongoingDecompressions = new Map<string, Promise<UnzipResult[]>>();

let defaultAppDataPath: null | string = null;

/**
 * Gets the app data path (shared or user data)
 * @returns The app data path
 */
export async function getAppDataPath(): Promise<string> {
  if (defaultAppDataPath) {
    return defaultAppDataPath;
  }

  try {
    // Fallback candidates (in priority order)
    const candidates = [await getSharedDataPath(), app.getPath('userData')];

    for (const path of candidates) {
      if (path && (await isUsablePath(path))) {
        console.log('📁 Using new app data path:', path);
        defaultAppDataPath = path;
        return defaultAppDataPath;
      }
    }

    // This should not happen, but keeps typing safe
    throw new Error('No usable data path found');
  } catch (e) {
    captureElectronError(e, {
      contexts: {
        fn: {
          args: {},
          name: 'getAppDataPath',
        },
      },
    });
    defaultAppDataPath = app.getPath('userData');
    console.log('📁 Using fallback app data path:', defaultAppDataPath);
    return defaultAppDataPath;
  }
}

export async function isUsablePath(basePath?: string): Promise<boolean> {
  if (!basePath) return false;

  try {
    const testDir = join(basePath, '.cache-test-' + uuid());
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'test.txt'), 'ok');
    await rm(testDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export async function openFileDialog(
  single: boolean,
  filter: FileDialogFilter,
) {
  if (!mainWindow) return;

  const filters: Electron.FileFilter[] = [];

  if (!filter) {
    filters.push({ extensions: ['*'], name: 'All files' });
  }

  if (filter?.includes('jwpub+image+pdf')) {
    filters.push({
      extensions:
        JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS).concat(PDF_EXTENSIONS),
      name: 'JWPUB + Images + PDF',
    });
  }

  if (filter?.includes('jwpub+image')) {
    filters.push({
      extensions: JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS),
      name: 'JWPUB + Images',
    });
  }

  if (filter?.includes('jwpub')) {
    filters.push({ extensions: JWPUB_EXTENSIONS, name: 'JWPUB' });
  }
  if (filter?.includes('image')) {
    filters.push({ extensions: IMG_EXTENSIONS, name: 'Images' });
  }

  return dialog.showOpenDialog(mainWindow, {
    filters,
    properties: single ? ['openFile'] : ['openFile', 'multiSelections'],
  });
}

export async function openFolderDialog() {
  if (!mainWindow) return;
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
}

/**
 * Decompresses a file using yauzl for memory efficiency (avoids buffering entire zip)
 */
export async function unzipFile(
  input: string,
  output: string,
  opts?: UnzipOptions,
): Promise<UnzipResult[]> {
  const cacheKey = `${input}->${output}`;
  const existing = ongoingDecompressions.get(cacheKey);
  if (existing) return existing;

  const decompress = async (): Promise<UnzipResult[]> => {
    const stats = await stat(input).catch(() => undefined);

    return new Promise<UnzipResult[]>((resolve, reject) => {
      const extractedFiles: UnzipResult[] = [];
      yauzl.open(input, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          captureElectronError(err, {
            contexts: {
              fn: {
                args: { input, output, stats },
                name: 'unzipFile yauzl.open',
              },
            },
          });

          return reject(err);
        }
        if (!zipfile) return reject(new Error('Zipfile not found'));

        zipfile.readEntry();
        zipfile.on('entry', async (entry: yauzl.Entry) => {
          const fullPath = join(output, entry.fileName);

          // Apply filter if provided
          if (
            opts?.includes?.length &&
            !opts.includes.includes(entry.fileName)
          ) {
            zipfile.readEntry();
            return;
          }

          if (/\/$/.test(entry.fileName)) {
            // Directory
            const createDir = async (attempt = 1): Promise<void> => {
              try {
                await ensureDir(fullPath);
                zipfile.readEntry();
              } catch (e) {
                if (attempt < 3) {
                  console.warn(
                    `[unzipFile] Failed to create directory, retrying (${attempt}/3): ${fullPath}`,
                  );
                  await new Promise((r) => {
                    setTimeout(r, 100 * attempt);
                  });
                  return createDir(attempt + 1);
                }
                captureElectronError(e, {
                  contexts: {
                    fn: {
                      args: { attempt, fullPath, input, output },
                      name: 'unzipFile ensureDir (dir entry)',
                    },
                  },
                });
                zipfile.close();
                reject(e);
              }
            };
            await createDir();
          } else {
            // File
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) {
                captureElectronError(err, {
                  contexts: {
                    fn: {
                      args: { entry: entry.fileName, input, output },
                      name: 'unzipFile openReadStream',
                    },
                  },
                });
                zipfile.close();
                return reject(err);
              }
              if (!readStream) {
                zipfile.close();
                return reject(new Error('Read stream not found'));
              }

              const processFile = async (attempt = 1): Promise<void> => {
                try {
                  await ensureDir(dirname(fullPath));
                  const writeStream = createWriteStream(fullPath);

                  // Handle write stream errors
                  writeStream.on('error', (e) => {
                    // This is handled by pipeline, but good to have a backup
                    captureElectronError(e, {
                      contexts: {
                        fn: {
                          args: { attempt, fullPath, input, output },
                          name: 'unzipFile ensureDir (dir entry)',
                        },
                      },
                    });
                  });

                  await pipeline(readStream, writeStream);
                  extractedFiles.push({ path: entry.fileName });
                  zipfile.readEntry();
                } catch (e) {
                  if (
                    attempt < 3 &&
                    e instanceof Error &&
                    (e as { code?: string }).code === 'ENOENT'
                  ) {
                    console.warn(
                      `[unzipFile] ENOENT during pipeline, retrying (${attempt}/3): ${fullPath}`,
                    );
                    await new Promise((r) => {
                      setTimeout(r, 100 * attempt);
                    });
                    return processFile(attempt + 1);
                  }

                  captureElectronError(e, {
                    contexts: {
                      fn: {
                        args: { attempt, fullPath, input, output },
                        name: 'unzipFile pipeline',
                      },
                    },
                  });
                  zipfile.close();
                  reject(e);
                }
              };

              await processFile();
            });
          }
        });

        zipfile.on('end', () => {
          resolve(extractedFiles);
        });

        zipfile.on('error', (err) => {
          captureElectronError(err, {
            contexts: {
              fn: { args: { input, output }, name: 'unzipFile zipfile error' },
            },
          });
          reject(err);
        });
      });
    });
  };

  const decompressionPromise = decompress().finally(() => {
    ongoingDecompressions.delete(cacheKey);
  });

  ongoingDecompressions.set(cacheKey, decompressionPromise);
  return decompressionPromise;
}

const watchers = new Set<FSWatcher>();
const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export async function unwatchFolders() {
  for (const watcher of watchers) {
    try {
      if (!watcher?.closed) await watcher?.close();
      watchers.delete(watcher);
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { name: 'unwatchFolders' } },
      });
    }
  }
}

export async function watchFolder(folderPath: string) {
  watchers.add(
    filesystemWatch(folderPath, {
      atomic: false,
      awaitWriteFinish: true,
      ignored: (fp: string, stats?: Stats) => {
        try {
          if (toUnix(folderPath) === fp) return false; // Don't ignore the root folder itself
          if (!stats) return false; // Don't ignore anything if no stats are available
          const dirPath = toUnix(stats.isDirectory() ? fp : dirname(fp)); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          return !datePattern.test(dirOfNote); // Ignore files in a directory whose name doesn't match YYYY-MM-DD
        } catch (error) {
          captureElectronError(error, {
            contexts: {
              fn: { folderPath, fp, name: 'watchFolder.ignored', stats },
            },
          });
          return true;
        }
      },
      ignorePermissionErrors: true,
    })
      .on('error', (error: unknown) => {
        const context = {
          contexts: { fn: { folderPath, name: 'watchFolder.error' } },
        };

        try {
          const e = error as Error & { code?: string; syscall?: string };
          // Ignore harmless "stat" EINVAL errors
          if (e.code === 'EINVAL' && e.syscall === 'stat') return;
          // Ignore "UNKNOWN" watch errors (common with network drives)
          if (e.code === 'UNKNOWN' && e.syscall === 'watch') return;
          captureElectronError(error, context);
        } catch (err) {
          // Log the failure of the original try
          captureElectronError(err, {
            contexts: { fn: { folderPath, name: 'watchFolder.error catch' } },
          });
          // Still log the original error as well
          captureElectronError(error, context);
        }
      })
      .on('all', (event, changedPath, stats) => {
        try {
          if (!changedPath || (!stats && !event.includes('unlink'))) return; // Don't do anything if no stats are available or if no path is available
          const dirPath = toUnix(
            stats?.isDirectory() || event === 'unlinkDir'
              ? changedPath
              : dirname(changedPath),
          ); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          sendToWindow(mainWindow, 'watchFolderUpdate', {
            changedPath,
            day: dirOfNote,
            event,
          });
        } catch (error) {
          captureElectronError(error, {
            contexts: {
              fn: { changedPath, event, name: 'watchFolder.all', stats },
            },
          });
          return true;
        }
      }),
  );
}
