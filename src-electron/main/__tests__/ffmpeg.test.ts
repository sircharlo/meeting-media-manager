import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createVideoFromNonVideo } from '../ffmpeg';

vi.mock('fs-extra', () => ({
  exists: vi.fn(async () => false),
}));

const ffmpegOnMap: Record<string, (...args: unknown[]) => void> = {};
const ffmpegChain = {
  noVideo: vi.fn().mockReturnThis(),
  on: vi
    .fn()
    .mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      ffmpegOnMap[event] = cb;
      return ffmpegChain;
    }),
  save: vi.fn().mockReturnThis(),
};

vi.mock('fluent-ffmpeg', () => ({
  default: Object.assign(
    function ffmpeg() {
      return ffmpegChain;
    },
    {
      setFfmpegPath: vi.fn(),
    },
  ),
}));

vi.mock('image-size/fromFile', () => ({
  imageSizeFromFile: vi.fn(async () => ({ height: 3000, width: 4000 })),
}));

describe('ffmpeg.createVideoFromNonVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('short-circuits if output already exists', async () => {
    const { exists } = await import('fs-extra');
    const existsMock = exists as unknown as Mock<
      (p: string) => Promise<boolean>
    >;
    existsMock.mockResolvedValue(true);
    const out = await createVideoFromNonVideo('/tmp/a.mp3', '/bin/ffmpeg');
    expect(out.endsWith('.mp4')).toBe(true);
  });

  it('converts image to mp4 - missing dimensions throws', async () => {
    const { exists } = await import('fs-extra');
    const existsMock = exists as unknown as Mock<
      (p: string) => Promise<boolean>
    >;
    existsMock.mockResolvedValue(false);
    const size = await import('image-size/fromFile');
    const imageSizeFromFileMock = size.imageSizeFromFile as unknown as Mock<
      (p: string) => Promise<{
        height?: number;
        orientation?: number;
        width?: number;
      }>
    >;
    imageSizeFromFileMock.mockResolvedValue({
      height: undefined,
      orientation: undefined,
      width: undefined,
    });
    await expect(
      createVideoFromNonVideo('/tmp/a.jpg', '/bin/ffmpeg'),
    ).rejects.toThrow('Could not determine dimensions of image.');
  });
});
