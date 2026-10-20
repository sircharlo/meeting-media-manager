import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserWindows, captureElectronError, showSaveDialog, writeFile } =
  vi.hoisted(() => ({
    browserWindows: [] as {
      destroy: ReturnType<typeof vi.fn>;
      destroyed: boolean;
      loadURL: ReturnType<typeof vi.fn>;
      printToPDF: ReturnType<typeof vi.fn>;
    }[],
    captureElectronError: vi.fn(),
    showSaveDialog: vi.fn(),
    writeFile: vi.fn(),
  }));

vi.mock('electron', () => ({
  BrowserWindow: class {
    destroyed = false;
    destroy = vi.fn(() => {
      this.destroyed = true;
    });
    loadURL = vi.fn(async () => undefined);
    printToPDF = vi.fn(async () => Buffer.from('%PDF-1.7'));
    webContents = { printToPDF: this.printToPDF };
    constructor() {
      browserWindows.push(this);
    }
    isDestroyed = () => this.destroyed;
  },
  dialog: { showSaveDialog },
}));

vi.mock('node:fs/promises', () => ({ writeFile }));

vi.mock('src-electron/main/utils', () => ({ captureElectronError }));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: { isDestroyed: () => false } },
}));

describe('exportHtmlToPdf', () => {
  beforeEach(() => {
    browserWindows.length = 0;
    showSaveDialog.mockReset();
    writeFile.mockReset();
    captureElectronError.mockReset();
  });

  it('renders the HTML in a hidden window and saves the PDF where the user chose', async () => {
    showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: 'C:/reports/out.pdf',
    });
    const { exportHtmlToPdf } = await import('../pdf');

    const result = await exportHtmlToPdf('<p>Hello</p>', 'Report 2026-10-11');

    expect(result).toEqual({ canceled: false, filePath: 'C:/reports/out.pdf' });
    expect(showSaveDialog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ defaultPath: 'Report 2026-10-11.pdf' }),
    );
    const renderer = browserWindows[0];
    expect(renderer?.loadURL).toHaveBeenCalledWith(
      `data:text/html;charset=utf-8,${encodeURIComponent('<p>Hello</p>')}`,
    );
    expect(writeFile).toHaveBeenCalledWith(
      'C:/reports/out.pdf',
      expect.any(Buffer),
    );
    expect(renderer?.destroy).toHaveBeenCalled();
  });

  it('does nothing when the user cancels the save dialog', async () => {
    showSaveDialog.mockResolvedValue({ canceled: true });
    const { exportHtmlToPdf } = await import('../pdf');

    expect(await exportHtmlToPdf('<p>x</p>', 'r.pdf')).toEqual({
      canceled: true,
    });
    expect(browserWindows).toHaveLength(0);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('refuses anything but a reasonably sized HTML string', async () => {
    const { exportHtmlToPdf } = await import('../pdf');

    expect(await exportHtmlToPdf(42, 'r.pdf')).toEqual({
      canceled: false,
      error: 'invalid-html',
    });
    expect(showSaveDialog).not.toHaveBeenCalled();
  });

  it('reports a rendering failure and still closes the hidden window', async () => {
    showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: 'C:/reports/out.pdf',
    });
    writeFile.mockRejectedValue(new Error('disk full'));
    const { exportHtmlToPdf } = await import('../pdf');

    const result = await exportHtmlToPdf('<p>x</p>', 'r.pdf');

    expect(result).toEqual({ canceled: false, error: 'disk full' });
    expect(captureElectronError).toHaveBeenCalled();
    expect(browserWindows[0]?.destroy).toHaveBeenCalled();
  });
});
