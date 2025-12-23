import type { FileDialogFilter, UnzipOptions, UnzipResult } from 'src/types';

import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { dialog } from 'electron';
import { createWriteStream } from 'fs';
import { ensureDir, type Stats } from 'fs-extra';
import { captureElectronError } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindow } from 'src-electron/main/window/window-main';
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/media';
import { pipeline } from 'stream/promises';
import upath from 'upath';
import yauzl from 'yauzl';

const { basename, dirname, join, toUnix } = upath;

const ongoingDecompressions = new Map<string, Promise<UnzipResult[]>>();

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
  const existing = ongoingDecompressions.get(output);
  if (existing) return existing;

  const decompressionPromise = new Promise<UnzipResult[]>((resolve, reject) => {
    const extractedFiles: UnzipResult[] = [];
    yauzl.open(input, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        captureElectronError(err, {
          contexts: {
            fn: { args: { input, output }, name: 'unzipFile yauzl.open' },
          },
        });
        return reject(err);
      }
      if (!zipfile) return reject(new Error('Zipfile not found'));

      zipfile.readEntry();
      zipfile.on('entry', async (entry: yauzl.Entry) => {
        const fullPath = join(output, entry.fileName);

        // Apply filter if provided
        if (opts?.includes?.length && !opts.includes.includes(entry.fileName)) {
          zipfile.readEntry();
          return;
        }

        if (/\/$/.test(entry.fileName)) {
          // Directory
          try {
            await ensureDir(fullPath);
            zipfile.readEntry();
          } catch (e) {
            zipfile.close();
            reject(e);
          }
        } else {
          // File
          try {
            await ensureDir(dirname(fullPath));
            zipfile.openReadStream(entry, async (err, readStream) => {
              if (err) {
                zipfile.close();
                return reject(err);
              }
              if (!readStream) {
                zipfile.close();
                return reject(new Error('Read stream not found'));
              }

              const writeStream = createWriteStream(fullPath);
              try {
                await pipeline(readStream, writeStream);
                extractedFiles.push({ path: entry.fileName });
                zipfile.readEntry();
              } catch (e) {
                captureElectronError(e, {
                  contexts: {
                    fn: { args: { input, output }, name: 'unzipFile pipeline' },
                  },
                });
                zipfile.close();
                reject(e);
              }
            });
          } catch (e) {
            zipfile.close();
            reject(e);
          }
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
  }).finally(() => {
    ongoingDecompressions.delete(output);
  });

  ongoingDecompressions.set(output, decompressionPromise);
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
