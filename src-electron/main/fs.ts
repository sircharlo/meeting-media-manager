import type { FileDialogFilter, UnzipOptions, UnzipResult } from 'src/types';

import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { app, dialog } from 'electron';
import { ensureDir, type Stats } from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import {
  addElectronBreadcrumb,
  captureElectronError,
  getSharedDataPath,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/media';
import { uuid } from 'src/shared/vanilla';
import upath from 'upath';
import yauzl from 'yauzl';

const { basename, dirname, join, resolve, toUnix } = upath;

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
    const resolvedBase = resolve(basePath);
    const testDir = join(resolvedBase, '.cache-test-' + uuid());
    await mkdir(testDir, { recursive: true });
    console.log('[isUsablePath] Test directory created successfully:', testDir);
    const testFile = join(testDir, 'test.txt');
    await writeFile(testFile, 'ok');
    console.log('[isUsablePath] Test file created successfully:', testFile);
    await rm(testFile);
    console.log('[isUsablePath] Test file removed successfully:', testFile);
    await rm(testDir, { recursive: true });
    console.log('[isUsablePath] Test directory removed successfully:', testDir);
    console.log('[isUsablePath] Specified path is available:', basePath);
    return true;
  } catch (e) {
    console.log('[isUsablePath] Specified path is not available:', basePath, e);
    return false;
  }
}

export async function openFileDialog(
  single: boolean,
  filter: FileDialogFilter,
) {
  if (!mainWindowInfo.mainWindow) return;

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

  return dialog.showOpenDialog(mainWindowInfo.mainWindow, {
    filters,
    properties: single ? ['openFile'] : ['openFile', 'multiSelections'],
  });
}

export async function openFolderDialog() {
  if (!mainWindowInfo.mainWindow) return;
  return dialog.showOpenDialog(mainWindowInfo.mainWindow, {
    properties: ['openDirectory'],
  });
}

const decompress = async (
  input: string,
  output: string,
  opts?: UnzipOptions,
): Promise<UnzipResult[]> => {
  const stats = await stat(input).catch(() => undefined);
  const fileSize = stats?.size ?? 0;

  addElectronBreadcrumb({
    category: 'unzip',
    data: { fileSize, input, output },
    message: 'Starting unzip',
  });

  return new Promise<UnzipResult[]>((resolve, reject) => {
    const extractedFiles: UnzipResult[] = [];

    // Track all ongoing file operations
    const pendingOperations: Promise<void>[] = [];
    let zipfileEnded = false;

    yauzl.open(input, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        captureElectronError(err, {
          contexts: {
            fn: {
              args: { fileSize, input, output },
              name: 'unzipFile yauzl.open',
            },
          },
        });

        return reject(new Error(String(err)));
      }
      if (!zipfile) return reject(new Error('Zipfile not found'));

      addElectronBreadcrumb({
        category: 'unzip',
        data: { entryCount: zipfile.entryCount },
        message: 'Zip opened',
      });

      zipfile.readEntry();
      zipfile.on('entry', async (entry: yauzl.Entry) => {
        const fullPath = join(output, entry.fileName);

        addElectronBreadcrumb({
          category: 'unzip',
          data: {
            compressedSize: entry.compressedSize,
            fileName: entry.fileName,
            isDirectory: entry.fileName.endsWith('/'),
            uncompressedSize: entry.uncompressedSize,
          },
          level: 'debug',
          message: 'Processing entry',
        });

        // Apply filter if provided
        if (opts?.includes?.length && !opts.includes.includes(entry.fileName)) {
          zipfile.readEntry();
          return;
        }

        if (entry.fileName.endsWith('/')) {
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
              return reject(new Error(String(err)));
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
                  captureElectronError(e, {
                    contexts: {
                      fn: {
                        args: { attempt, fullPath, input, output },
                        name: 'unzipFile writeStream error',
                      },
                    },
                  });
                });

                // Pipeline automatically handles stream completion
                // It only resolves when the write stream has finished AND flushed
                await pipeline(readStream, writeStream);

                // Add extracted file to results
                extractedFiles.push({ path: entry.fileName });

                // Continue to next entry
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
                reject(new Error(String(e)));
              }
            };

            // Track this operation and wait for it to complete
            const operationPromise = processFile();
            pendingOperations.push(operationPromise);

            // Clean up completed operations to prevent memory leaks
            operationPromise.finally(() => {
              const index = pendingOperations.indexOf(operationPromise);
              if (index > -1) {
                pendingOperations.splice(index, 1);
              }

              // Check if we can resolve now
              checkIfComplete();
            });
          });
        }
      });

      // Don't resolve immediately on 'end'
      // The 'end' event only means we've read all entries from the zip,
      // NOT that all files have been written to disk
      zipfile.on('end', () => {
        zipfileEnded = true;
        checkIfComplete();
      });

      zipfile.on('error', (err) => {
        captureElectronError(err, {
          contexts: {
            fn: { args: { input, output }, name: 'unzipFile zipfile error' },
          },
        });
        reject(new Error(String(err)));
      });

      // Helper function to check if we can resolve
      const checkIfComplete = async () => {
        // We can only resolve when:
        // 1. The zipfile has finished reading all entries (zipfileEnded = true)
        // 2. All file write operations have completed (pendingOperations.length = 0)
        if (zipfileEnded && pendingOperations.length === 0) {
          addElectronBreadcrumb({
            category: 'unzip',
            data: { extractedFilesCount: extractedFiles.length },
            message: 'Unzip complete',
          });

          // ADDITIONAL SAFETY: Small delay to ensure OS has flushed buffers
          // This is especially important on Windows and network drives
          setTimeout(() => {
            resolve(extractedFiles);
          }, 50); // 50ms should be enough for OS buffer flush
        }
      };
    });
  });
};
/**
 * Decompresses a file using yauzl for memory efficiency
 * Properly waits for all write streams to finish and flush to disk
 * before resolving the promise.
 */
export async function unzipFile(
  input: string,
  output: string,
  opts?: UnzipOptions,
): Promise<UnzipResult[]> {
  const cacheKey = `${input}->${output}`;
  const existing = ongoingDecompressions.get(cacheKey);
  if (existing) return existing;

  const decompressionPromise = decompress(input, output, opts).finally(() => {
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
          sendToWindow(mainWindowInfo.mainWindow, 'watchFolderUpdate', {
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
