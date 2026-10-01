import type * as FsUtils from 'src/utils/fs';
import type * as SqliteUtils from 'src/utils/sqlite';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogJwPlaylist from '../DialogJwPlaylist.vue';

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
});
