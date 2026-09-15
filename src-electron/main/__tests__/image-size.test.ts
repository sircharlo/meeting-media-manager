import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const imageSizeFromFileMock = vi.fn();

// image-size.ts calls @carboneio/image-size in-process (see its top comment
// for why that's now safe: the fork's own security audit closed the
// infinite-loop DoS advisories that previously required isolating parsing
// in a disposable utilityProcess per call). Only the timeout wrapper around
// it needs covering here.
vi.mock('@carboneio/image-size/fromFile', () => ({
  imageSizeFromFile: imageSizeFromFileMock,
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

import { captureElectronError } from 'src-electron/main/utils';

describe('getImageDimensions', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('resolves with the reported dimensions on success', async () => {
    imageSizeFromFileMock.mockResolvedValue({
      height: 1080,
      orientation: 1,
      width: 1920,
    });
    const { getImageDimensions } = await import('../image-size');

    await expect(getImageDimensions('/tmp/photo.png')).resolves.toEqual({
      height: 1080,
      orientation: 1,
      width: 1920,
    });
  });

  it('rejects and reports when parsing fails', async () => {
    imageSizeFromFileMock.mockRejectedValue(new Error('unsupported format'));
    const { getImageDimensions } = await import('../image-size');

    await expect(getImageDimensions('/tmp/corrupt.png')).rejects.toThrow(
      'unsupported format',
    );
    expect(captureElectronError).toHaveBeenCalled();
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects on timeout instead of hanging forever', async () => {
      // Never resolves within the test's 8000ms timer advance, e.g. a
      // stalled network-drive read.
      imageSizeFromFileMock.mockReturnValue(
        new Promise<never>((resolve) => {
          setTimeout(resolve, 1e9);
        }),
      );
      const { getImageDimensions } = await import('../image-size');

      const promise = getImageDimensions('/tmp/slow-drive.png');

      await Promise.all([
        expect(promise).rejects.toThrow(/Timed out/),
        vi.advanceTimersByTimeAsync(8000),
      ]);

      expect(captureElectronError).toHaveBeenCalled();
    });

    it('does not report a timeout for a call that resolves in time', async () => {
      imageSizeFromFileMock.mockResolvedValue({ height: 10, width: 10 });
      const { getImageDimensions } = await import('../image-size');

      await expect(getImageDimensions('/tmp/ok.png')).resolves.toEqual({
        height: 10,
        width: 10,
      });
      expect(captureElectronError).not.toHaveBeenCalled();
    });
  });
});
