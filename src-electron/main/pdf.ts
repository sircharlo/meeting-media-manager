import type { ExportPdfResult } from 'src/types';

import { BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { captureElectronError } from 'src-electron/main/utils';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';
import { log, sanitizeFilename } from 'src/shared/vanilla';

// Larger documents are not something M³ produces: a limit keeps a broken
// caller from handing Chromium an enormous data: URL.
const MAX_HTML_LENGTH = 4 * 1024 * 1024;

// The file the user chose can't be written: a PDF viewer has the previous
// copy open and locked (EBUSY, MMM-V2-3MB), or the file is read-only or in a
// folder Windows protects, such as the Desktop under Controlled Folder Access
// (EPERM/EACCES). Only the user can fix those, so they get told how instead
// of the failure being reported.
const UNWRITABLE_FILE_ERROR_CODES = new Set([
  'EACCES',
  'EBUSY',
  'EPERM',
  'EROFS',
]);

/**
 * Renders HTML to a PDF through a hidden Chromium window and saves it where
 * the user chooses. Unlike a PDF library with its own fonts, Chromium shapes
 * every script and writing direction with the system's fonts, so reports in
 * any of M³'s languages come out readable.
 */
export async function exportHtmlToPdf(
  html: unknown,
  defaultFileName: unknown,
): Promise<ExportPdfResult> {
  if (typeof html !== 'string' || html.length > MAX_HTML_LENGTH) {
    return { canceled: false, error: 'invalid-html' };
  }
  const mainWindow = mainWindowInfo.mainWindow;
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { canceled: true };
  }

  const safeName =
    sanitizeFilename(
      typeof defaultFileName === 'string' ? defaultFileName : 'report.pdf',
    ) || 'report.pdf';
  const saveResult = await dialog.showSaveDialog(mainWindow, {
    defaultPath: safeName.toLowerCase().endsWith('.pdf')
      ? safeName
      : `${safeName}.pdf`,
    filters: [{ extensions: ['pdf'], name: 'PDF' }],
  });
  if (saveResult.canceled || !saveResult.filePath) {
    return { canceled: true };
  }

  // The HTML is M³'s own, but it is rendered with scripts off and no access
  // to Node or the preload all the same: a report never needs either.
  const renderer = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      javascript: false,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    await renderer.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );
    const pdf = await renderer.webContents.printToPDF({
      margins: { bottom: 0.6, left: 0.6, right: 0.6, top: 0.6 },
      pageSize: 'A4',
      printBackground: true,
    });
    await writeFile(saveResult.filePath, pdf);
    return { canceled: false, filePath: saveResult.filePath };
  } catch (error) {
    if (UNWRITABLE_FILE_ERROR_CODES.has(getFilesystemErrorCode(error) ?? '')) {
      log('Could not write the PDF file', 'electron', 'warn', error);
      return { canceled: false, error: 'file-not-writable' };
    }
    captureElectronError(error, {
      contexts: { fn: { name: 'exportHtmlToPdf' } },
    });
    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (!renderer.isDestroyed()) renderer.destroy();
  }
}
