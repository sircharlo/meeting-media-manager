import type * as JwMediaHelpers from 'src/helpers/jw-media';
import type * as FsUtils from 'src/utils/fs';
import type * as SqliteUtils from 'src/utils/sqlite';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { QImg } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogJwPlaylist from '../DialogJwPlaylist.vue';

vi.mock('src/helpers/jw-media', async (importOriginal) => ({
  ...(await importOriginal<typeof JwMediaHelpers>()),
  // The extracted playlist files don't exist on disk in tests.
  resolveFilePath: vi.fn(async (path: string) => path || undefined),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/utils/fs', async (importOriginal) => ({
  ...(await importOriginal<typeof FsUtils>()),
  getTempPath: vi.fn(async () => '/tmp'),
}));

vi.mock('src/utils/sqlite', async (importOriginal) => ({
  ...(await importOriginal<typeof SqliteUtils>()),
  findDb: vi.fn(async (dir: string) => `${dir}/userData.db`),
}));

installQuasarPlugin();
installPinia();

const unzipMock = vi.fn(async () => []);
const executeQueryMock = vi.fn(async () => []);
const closeSqliteConnectionMock = vi.fn(async () => undefined);

let wrapper: ReturnType<typeof mount<typeof DialogJwPlaylist>> | undefined;

const openWithPlaylist = async (jwPlaylistPath: string) => {
  wrapper = mount(DialogJwPlaylist, {
    props: {
      dialogId: 'jw-playlist',
      jwPlaylistPath,
      modelValue: false,
      section: undefined,
    },
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
};

const closeDialog = async () => {
  await wrapper?.setProps({ modelValue: false });
  wrapper?.unmount();
  wrapper = undefined;
};

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.electronApi.unzip = unzipMock;
  globalThis.electronApi.executeQuery = executeQueryMock;
  globalThis.electronApi.closeSqliteConnection = closeSqliteConnectionMock;
});

afterEach(async () => {
  await closeDialog();
  document.body.innerHTML = '';
});

describe('DialogJwPlaylist - loading a playlist', () => {
  // MMM-V2-3K5/3JT/3JY: re-importing a playlist with the same filename used
  // to extract over the previous import's folder while its userData.db was
  // still held open by the SQLite worker.
  it('extracts each import into its own folder and closes the playlist db afterwards', async () => {
    await openWithPlaylist('/tmp/stage-a/Talk.jwlplaylist');
    await closeDialog();
    await openWithPlaylist('/tmp/stage-b/Talk.jwlplaylist');

    expect(unzipMock).toHaveBeenCalledTimes(2);
    const [firstOutput, secondOutput] = unzipMock.mock.calls.map(
      (call) => (call as unknown[])[1],
    );
    expect(firstOutput).toMatch(/^\/tmp\/Talk\.jwlplaylist-/);
    expect(secondOutput).toMatch(/^\/tmp\/Talk\.jwlplaylist-/);
    expect(firstOutput).not.toBe(secondOutput);

    expect(closeSqliteConnectionMock).toHaveBeenCalledTimes(2);
    expect(closeSqliteConnectionMock).toHaveBeenLastCalledWith(
      `${String(secondOutput)}/userData.db`,
    );
  });

  // MMM-V2-3K4/3JS/3JX/3JZ: the main process already reports unzip failures
  // it can act on, and a corrupt file picked by the user isn't a bug.
  it('does not report an unzip failure from the renderer', async () => {
    unzipMock.mockRejectedValueOnce(
      new Error('Invalid comment length. Expected: 7. Found: 0.'),
    );

    await openWithPlaylist('/tmp/stage-c/Broken.jwlplaylist');

    expect(errorCatcher).not.toHaveBeenCalled();
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' }),
    );
    expect(executeQueryMock).not.toHaveBeenCalled();
  });

  // The extraction folder is named after the playlist file, so a `#` in that
  // name used to break the plain `'file://' + path` preview URL (everything
  // after it was parsed as a URL fragment).
  it('builds a valid file URL for item previews when the playlist name has URL-reserved characters', async () => {
    const playlistQueryMock = vi.fn(async (_dbFile: string, query: string) => {
      if (query.includes('FROM Tag')) return [{ Name: 'Talk' }];
      if (query.includes('FROM PlaylistItem pi')) {
        return [
          {
            Label: 'Picture',
            PlaylistItemId: 1,
            ThumbnailFilePath: 'thumb.jpg',
          },
        ];
      }
      return [];
    });
    globalThis.electronApi.executeQuery =
      playlistQueryMock as unknown as typeof globalThis.electronApi.executeQuery;

    await openWithPlaylist('/tmp/stage-d/Talk #3.jwlplaylist');

    const previewSrc = wrapper?.findComponent(QImg).props('src');
    expect(previewSrc).toMatch(
      /^file:\/\/\/.*\/Talk%20%233\.jwlplaylist-[^/]+\/thumb\.jpg$/,
    );
  });
});
