import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string, values?: unknown) =>
        typeof values === 'object' && values && Object.keys(values).length
          ? `${key}:${JSON.stringify(values)}`
          : key,
    },
  },
}));

const createTemporaryNotification = vi.fn();
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: (...args: unknown[]) =>
    createTemporaryNotification(...(args as [])),
}));

const COULD_NOT_OPEN =
  'PipelineStatus::DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed';

describe('noticeUnopenableMedia', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createTemporaryNotification.mockClear();
    // What it has told about lasts the session: a fresh session per test.
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // MMM-V2-3CF, MMM-V2-3N6: a file's thumbnail and its duration fail
  // together, and its thumbnail is asked for again whenever its list shows.
  it('tells about a file once, by its name', async () => {
    const { noticeUnopenableMedia } = await import('../unopenable-media');

    noticeUnopenableMedia('C:/media/20261118/1 - Intro.mp4', COULD_NOT_OPEN);
    noticeUnopenableMedia('C:/media/20261118/1 - Intro.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(2000);
    noticeUnopenableMedia('C:/media/20261118/1 - Intro.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(2000);

    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        caption: 'media-cannot-open-notice-caption',
        message: 'media-cannot-open-notice:{"name":"1 - Intro.mp4"}',
        timeout: 0,
        type: 'warning',
      }),
    );
  });

  it('names every file found at about the same time in one notice', async () => {
    const { noticeUnopenableMedia } = await import('../unopenable-media');

    noticeUnopenableMedia('C:/media/20261118/1 - Intro.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(500);
    noticeUnopenableMedia('C:/media/20261118/2 - Talk.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(2000);

    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        message:
          'media-cannot-open-notice-many:{"count":2,"names":"1 - Intro.mp4, 2 - Talk.mp4"}',
      }),
    );
  });

  it('tells about a file found later in a notice of its own', async () => {
    const { noticeUnopenableMedia } = await import('../unopenable-media');

    noticeUnopenableMedia('C:/media/20261118/1 - Intro.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(2000);
    noticeUnopenableMedia('C:/media/20261125/3 - Song.mp4', COULD_NOT_OPEN);
    await vi.advanceTimersByTimeAsync(2000);

    expect(createTemporaryNotification).toHaveBeenCalledTimes(2);
    expect(createTemporaryNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'media-cannot-open-notice:{"name":"3 - Song.mp4"}',
      }),
    );
  });
});
