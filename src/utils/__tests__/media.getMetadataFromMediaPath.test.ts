import type { ElectronApi } from 'src/types';

import { electronApi } from 'app/test/vitest/mocks/electronApi';
import { parseBuffer } from 'music-metadata';
import { errorCatcher } from 'src/helpers/error-catcher';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const ascii = (text: string) => new TextEncoder().encode(text);

const concatBytes = (...parts: Uint8Array[]) => {
  const bytes = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
};

const uint32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
};

const mp4Atom = (type: string, payload: Uint8Array, declaredSize?: number) =>
  concatBytes(uint32(declaredSize ?? 8 + payload.length), ascii(type), payload);

// ID3v2 tag sizes are 28-bit "synchsafe" integers (7 bits per byte).
const synchsafe = (value: number) =>
  new Uint8Array([
    (value >> 21) & 0x7f,
    (value >> 14) & 0x7f,
    (value >> 7) & 0x7f,
    value & 0x7f,
  ]);

// Files cut off partway through, as when one is read before it has finished
// downloading or copying: the MP4's mdat atom and the MP3's ID3v2 tag (large
// when it holds cover art) both declare more bytes than the file holds.
const truncatedMp4 = concatBytes(
  mp4Atom('ftyp', concatBytes(ascii('isom'), uint32(512), ascii('isomiso2'))),
  mp4Atom('mdat', new Uint8Array(16), 100_000),
);
const truncatedMp3 = concatBytes(
  ascii('ID3'),
  new Uint8Array([3, 0, 0]),
  synchsafe(5000),
  new Uint8Array(100),
);

const makeParseErrorMock = (parseError: Error | { message: string }) => {
  const overrides = {
    fileUrlToPath: (fileurl: string) => fileurl,
    fs: { ...electronApi.fs, pathExists: vi.fn(async () => true) },
    parseMediaFile: vi.fn(async () => {
      throw parseError;
    }),
    pathToFileURL: (path: string) => path,
  };
  vi.stubGlobal('electronApi', {
    ...electronApi,
    ...overrides,
  } as unknown as ElectronApi);
};

describe('getMetadataFromMediaPath', () => {
  beforeEach(() => {
    vi.mocked(errorCatcher).mockClear();
  });

  it('silently returns default metadata on a partial-file End-Of-Stream parse failure', async () => {
    makeParseErrorMock({ message: 'End-Of-Stream' });
    vi.resetModules();
    const { getMetadataFromMediaPath } = await import('../media');

    const metadata = await getMetadataFromMediaPath(
      'C:/Users/test/Additional Media/sjjm_S_140_r720P.mp4',
    );

    expect(metadata.format.duration).toBe(0);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it.each([
    ['MP4', 'video.mp4', truncatedMp4],
    ['MP3', 'song.mp3', truncatedMp3],
  ])(
    'silently returns default metadata when a cut-short %s fails to parse',
    async (_format, fileName, bytes) => {
      // Parse with the real music-metadata, so a future version that words
      // its truncation errors differently fails this test.
      const parseError = await parseBuffer(bytes).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(parseError).toBeInstanceOf(Error);
      // Only the message survives the contextBridge crossing, not the class.
      makeParseErrorMock({ message: (parseError as Error).message });
      vi.resetModules();
      const { getMetadataFromMediaPath } = await import('../media');

      const metadata = await getMetadataFromMediaPath(
        `C:/Users/test/Additional Media/${fileName}`,
      );

      expect(metadata.format.duration).toBe(0);
      expect(errorCatcher).not.toHaveBeenCalled();
    },
  );

  it('still reports genuine metadata-parse failures', async () => {
    makeParseErrorMock(new Error('boom'));
    vi.resetModules();
    const { getMetadataFromMediaPath } = await import('../media');

    const metadata = await getMetadataFromMediaPath(
      'C:/Users/test/Additional Media/sjjm_S_140_r720P.mp4',
    );

    expect(metadata.format.duration).toBe(0);
    expect(errorCatcher).toHaveBeenCalledTimes(1);
  });
});
