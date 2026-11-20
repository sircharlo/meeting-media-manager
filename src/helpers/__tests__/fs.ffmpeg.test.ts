import { beforeEach, describe, expect, it, vi } from 'vitest';

const { currentState, errorCatcherMock, fetchJsonMock } = vi.hoisted(() => ({
  currentState: { ffmpegPath: '', online: true },
  errorCatcherMock: vi.fn(),
  fetchJsonMock: vi.fn(),
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/utils/api', () => ({
  fetchJson: fetchJsonMock,
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentState,
}));

describe('setupFFmpeg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    currentState.ffmpegPath = '';
    currentState.online = true;
  });

  // MMM-V2-3GS/3JC: GitHub unreachable from the user's network made the
  // release fetch return null, which was reported as "No FFmpeg releases
  // found" and then again as "Could not determine FFmpeg version." - once
  // per concurrent export.
  it('does not report when the release info could not be fetched, and fetches once for concurrent callers', async () => {
    fetchJsonMock.mockResolvedValue(null);
    const { setupFFmpeg } = await import('../fs');

    const results = await Promise.all([setupFFmpeg(), setupFFmpeg()]);

    expect(results).toEqual(['', '']);
    expect(fetchJsonMock).toHaveBeenCalledTimes(1);
    expect(fetchJsonMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/ffbinaries/ffbinaries-prebuilt/releases/latest',
      undefined,
      true,
    );
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('uses the FFmpeg that ships with M³ without fetching anything, and deletes the one an earlier version downloaded', async () => {
    const api = globalThis.electronApi;
    const bundled = vi
      .spyOn(api, 'getBundledFfmpegPath')
      .mockResolvedValue('/resources/ffmpeg/bin/ffmpeg');
    // Its callback overload returns void, which mockResolvedValue would take.
    const pathExists = vi
      .spyOn(api.fs, 'pathExists')
      .mockImplementation((async () => true) as typeof api.fs.pathExists);
    const remove = vi.spyOn(api.fs, 'remove').mockResolvedValue(undefined);
    try {
      const { setupFFmpeg } = await import('../fs');

      const results = await Promise.all([setupFFmpeg(), setupFFmpeg()]);

      expect(results).toEqual([
        '/resources/ffmpeg/bin/ffmpeg',
        '/resources/ffmpeg/bin/ffmpeg',
      ]);
      expect(currentState.ffmpegPath).toBe('/resources/ffmpeg/bin/ffmpeg');
      expect(bundled).toHaveBeenCalledTimes(1);
      expect(fetchJsonMock).not.toHaveBeenCalled();
      await vi.waitFor(() => {
        expect(remove).toHaveBeenCalledWith(
          expect.stringMatching(/[/\\]ffmpeg$/),
        );
      });
    } finally {
      bundled.mockRestore();
      pathExists.mockRestore();
      remove.mockRestore();
    }
  });

  it("downloads FFmpeg when M³ doesn't ship one (development)", async () => {
    fetchJsonMock.mockResolvedValue(null);
    const { setupFFmpeg } = await import('../fs');

    await setupFFmpeg();

    expect(fetchJsonMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/ffbinaries/ffbinaries-prebuilt/releases/latest',
      undefined,
      true,
    );
  });

  it('reports a release response without assets exactly once', async () => {
    fetchJsonMock.mockResolvedValue({ assets: [] });
    const { setupFFmpeg } = await import('../fs');

    await expect(setupFFmpeg()).resolves.toBe('');

    expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    expect(errorCatcherMock).toHaveBeenCalledWith(
      'No FFmpeg releases found',
      expect.anything(),
    );
  });
});
