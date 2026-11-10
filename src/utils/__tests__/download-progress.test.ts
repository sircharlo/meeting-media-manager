import {
  downloadsByFilename,
  downloadsPercent,
  isPendingDownload,
} from 'src/utils/download-progress';
import { describe, expect, it } from 'vitest';

describe('isPendingDownload', () => {
  it.each([
    [{ filename: 'a.mp4', loaded: 10, total: 100 }, true],
    [{ filename: 'a.mp4', total: 100 }, true],
    [{ filename: 'a.mp4' }, false],
    [{ complete: true, filename: 'a.mp4', total: 100 }, false],
    [{ error: true, filename: 'a.mp4', total: 100 }, false],
  ])('%o is pending: %s', (item, pending) => {
    expect(isPendingDownload(item)).toBe(pending);
  });
});

describe('downloadsPercent', () => {
  it('weighs each download by its size', () => {
    expect(
      downloadsPercent([
        { filename: 'big.mp4', loaded: 50, total: 300 },
        { filename: 'small.jpg', loaded: 50, total: 100 },
      ]),
    ).toBe(25);
  });

  it('counts finished and failed files as all there', () => {
    expect(
      downloadsPercent([
        { complete: true, filename: 'done.mp4', total: 100 },
        { error: true, filename: 'failed.mp4', loaded: 10, total: 100 },
        { filename: 'queued.mp4', total: 200 },
      ]),
    ).toBe(50);
  });

  it('leaves out files of unknown size', () => {
    expect(
      downloadsPercent([
        { filename: 'unknown.mp4', loaded: 500 },
        { filename: 'known.mp4', loaded: 30, total: 60 },
      ]),
    ).toBe(50);
  });

  it('is 0 without any known size, and never passes 100', () => {
    expect(downloadsPercent([{ filename: 'a.mp4' }])).toBe(0);
    expect(
      downloadsPercent([{ filename: 'a.mp4', loaded: 150, total: 100 }]),
    ).toBe(100);
  });
});

describe('downloadsByFilename', () => {
  it('finds a download by the name of the file it saves', () => {
    const song = { filename: 'song.mp4', loaded: 1, total: 2 };

    expect(downloadsByFilename([song]).get('song.mp4')).toBe(song);
  });

  it('prefers the download still running when two share a name', () => {
    const finished = { complete: true, filename: 'song.mp4', total: 2 };
    const running = { filename: 'song.mp4', loaded: 1, total: 2 };

    expect(downloadsByFilename([finished, running]).get('song.mp4')).toBe(
      running,
    );
    expect(downloadsByFilename([running, finished]).get('song.mp4')).toBe(
      running,
    );
  });
});
