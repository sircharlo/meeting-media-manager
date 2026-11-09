import type { ElectronApi } from 'src/types';

import { electronApi } from 'app/test/vitest/mocks/electronApi';
import { errorCatcher } from 'src/helpers/error-catcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const audio = (codecName: string) => ({ audio: {}, codecName, type: 2 });
const video = (codecName: string) => ({ codecName, type: 1, video: {} });

const SECRET_FILE = 'C:/media/private-family-video';

describe('reportUnplayableMediaTracks', () => {
  let videos: HTMLVideoElement[];

  const stubTracks = (trackInfo: unknown[]) => {
    vi.stubGlobal('electronApi', {
      ...electronApi,
      parseMediaFile: vi.fn(async () => ({ format: { trackInfo } })),
      pathToFileURL: (path: string) => path,
    } as unknown as ElectronApi);
  };

  const importReporter = async () => {
    vi.resetModules();
    return (await import('../media')).reportUnplayableMediaTracks;
  };

  // happy-dom's <video> never loads anything, so the test plays Chromium's
  // part: the element reports its size once the file's metadata is read.
  const finishLoading = async (videoWidth: number) => {
    await vi.waitFor(() => expect(videos).toHaveLength(1));
    Object.defineProperty(videos[0], 'videoWidth', { value: videoWidth });
    videos[0]?.onloadedmetadata?.(new Event('loadedmetadata'));
  };

  const reports = () => vi.mocked(errorCatcher).mock.calls;

  beforeEach(() => {
    vi.mocked(errorCatcher).mockClear();
    videos = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      const element = createElement(tagName, options);
      if (element instanceof HTMLVideoElement) videos.push(element);
      return element;
    }) as typeof document.createElement);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // The names music-metadata gave real samples of each codec.
  it.each([['ADPCM'], ['AC-3'], ['AC3'], ['ALAC'], ['DTS'], ['EAC3']])(
    'reports audio in %s as having no sound',
    async (codec) => {
      stubTracks([audio(codec)]);
      const report = await importReporter();

      await report(`${SECRET_FILE}.m4a`);

      expect(reports()).toHaveLength(1);
      expect(reports()[0]?.[1]).toMatchObject({
        fingerprint: ['media-unplayable-track', 'sound', 'm4a', codec],
        level: 'warning',
        tags: { 'media.codec': codec, 'media.missing': 'sound' },
      });
    },
  );

  it.each([
    ['<Opus>'],
    ['<sowt>'],
    ['AAC'],
    ['FLAC'],
    ['IEEE_FLOAT'],
    ['MPEG 1 Layer 3'],
    ['MPEG-4/AAC'],
    ['MPEG/L3'],
    ['MULAW'],
    ['non-PCM (65534)'],
    ['OPUS'],
    ['PCM'],
    ['Vorbis I'],
    ['VORBIS'],
  ])('does not report audio in %s, which Chromium plays', async (codec) => {
    stubTracks([audio(codec)]);
    const report = await importReporter();

    await report(`${SECRET_FILE}.m4a`);

    expect(reports()).toHaveLength(0);
  });

  it('leaves a file with one playable language alone', async () => {
    stubTracks([audio('AC3'), audio('AAC')]);
    const report = await importReporter();

    await report(`${SECRET_FILE}.mkv`);

    expect(reports()).toHaveLength(0);
  });

  it('reports a video whose picture Chromium dropped, naming its codec', async () => {
    stubTracks([video('<apch>'), audio('<sowt>')]);
    const report = await importReporter();

    const pending = report(`${SECRET_FILE}.MOV`);
    await finishLoading(0);
    await pending;

    expect(reports()).toHaveLength(1);
    expect(reports()[0]?.[1]).toMatchObject({
      fingerprint: ['media-unplayable-track', 'picture', 'mov', '<apch>'],
      tags: { 'media.codec': '<apch>', 'media.extension': 'mov' },
    });
  });

  it('never sends the file name', async () => {
    stubTracks([video('<apch>'), audio('AC3')]);
    const report = await importReporter();

    const pending = report(`${SECRET_FILE}.mov`);
    await finishLoading(0);
    await pending;

    expect(reports()).toHaveLength(2);
    for (const [error, context] of reports()) {
      expect(String(error)).not.toContain('private-family-video');
      expect(JSON.stringify(context)).not.toContain('private-family-video');
    }
  });

  it('stays quiet about a video with a picture, and releases the file', async () => {
    stubTracks([video('<avc1>'), audio('MPEG-4/AAC')]);
    const report = await importReporter();

    const pending = report(`${SECRET_FILE}.mp4`);
    await finishLoading(320);
    await pending;

    expect(reports()).toHaveLength(0);
    expect(videos[0]?.getAttribute('src')).toBeNull();
  });

  it('does not load a file with no video track', async () => {
    stubTracks([audio('MPEG-4/AAC')]);
    const report = await importReporter();

    await report(`${SECRET_FILE}.mp4`);

    expect(videos).toHaveLength(0);
  });

  it('leaves a file that will not load to the thumbnail report', async () => {
    stubTracks([video('<avc1>')]);
    const report = await importReporter();

    const pending = report(`${SECRET_FILE}.mp4`);
    await vi.waitFor(() => expect(videos).toHaveLength(1));
    videos[0]?.onerror?.(new Event('error'));
    await pending;

    expect(reports()).toHaveLength(0);
  });

  it('gives up without a report on a file that never loads', async () => {
    vi.useFakeTimers();
    stubTracks([video('<avc1>')]);
    vi.resetModules();
    const { MEDIA_ELEMENT_TIMEOUT_MS, reportUnplayableMediaTracks } =
      await import('../media');

    const pending = reportUnplayableMediaTracks(`${SECRET_FILE}.mp4`);
    await vi.advanceTimersByTimeAsync(MEDIA_ELEMENT_TIMEOUT_MS);

    await expect(pending).resolves.toBeUndefined();
    expect(reports()).toHaveLength(0);
  });

  it('never rejects when the file cannot be parsed', async () => {
    vi.stubGlobal('electronApi', {
      ...electronApi,
      parseMediaFile: vi.fn(async () => {
        throw new Error('Guessed MIME-type not supported: video/vnd.avi');
      }),
    } as unknown as ElectronApi);
    const report = await importReporter();

    await expect(report(`${SECRET_FILE}.avi`)).resolves.toBeUndefined();
    expect(reports()).toHaveLength(0);
  });
});
