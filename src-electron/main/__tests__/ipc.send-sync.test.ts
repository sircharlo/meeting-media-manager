import type { IpcMainEvent } from 'electron';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Covers handleIpcSendSync through the real secret channels: their listeners
// are async since safeStorage's sync API is removed in Electron 46, so the
// reply has to be delivered after the await, and a rejection must still
// answer (a never-set returnValue would block the renderer forever).

const {
  captureElectronErrorMock,
  decryptSecretMock,
  encryptSecretMock,
  ipcMainOn,
  isSecretEncryptionAvailableMock,
  isSelfMock,
} = vi.hoisted(() => ({
  captureElectronErrorMock: vi.fn(),
  decryptSecretMock: vi.fn(),
  encryptSecretMock: vi.fn(),
  ipcMainOn: vi.fn(),
  isSecretEncryptionAvailableMock: vi.fn(),
  isSelfMock: vi.fn(() => true),
}));

vi.mock('electron', () => ({
  app: { on: vi.fn() },
  ipcMain: { handle: vi.fn(), on: ipcMainOn },
  shell: { openExternal: vi.fn() },
}));

vi.mock('src-electron/main/secrets', () => ({
  decryptSecret: decryptSecretMock,
  encryptSecret: encryptSecretMock,
  isSecretEncryptionAvailable: isSecretEncryptionAvailableMock,
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: captureElectronErrorMock,
  isSelf: isSelfMock,
}));

vi.mock('src-electron/main/window/window-base', () => ({
  logToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

// Everything else ipc.ts imports is only used inside other channels' handlers.
vi.mock('src-electron/constants', () => ({}));
vi.mock('src-electron/main/dev-menu', () => ({}));
vi.mock('src-electron/main/disk-space', () => ({}));
vi.mock('src-electron/main/downloads', () => ({}));
vi.mock('src-electron/main/ffmpeg', () => ({}));
vi.mock('src-electron/main/fs', () => ({}));
vi.mock('src-electron/main/heic', () => ({}));
vi.mock('src-electron/main/open-folder', () => ({}));
vi.mock('src-electron/main/pdf', () => ({}));
vi.mock('src-electron/main/screen', () => ({}));
vi.mock('src-electron/main/session', () => ({}));
vi.mock('src-electron/main/shortcuts', () => ({}));
vi.mock('src-electron/main/sqlite', () => ({}));
vi.mock('src-electron/main/timer-remote', () => ({}));
vi.mock('src-electron/main/updater', () => ({}));
vi.mock('src-electron/main/waf-challenge', () => ({}));
vi.mock('src-electron/main/window/window-media', () => ({}));
vi.mock('src-electron/main/window/window-timer', () => ({}));
vi.mock('src-electron/main/window/window-website', () => ({
  askForMediaAccess: vi.fn(),
}));
vi.mock('src-electron/main/zoom-helper-manager', () => ({}));
vi.mock('src-electron/main/zoom-helper-process', () => ({}));
vi.mock('src-electron/main/zoom-test-participants', () => ({}));

type SyncListener = (event: IpcMainEvent, ...args: unknown[]) => void;

// ipc.ts registers its listeners once, on import - capture them before
// beforeEach's clearAllMocks wipes ipcMainOn's recorded calls.
const listeners = new Map<string, SyncListener>();

beforeAll(async () => {
  await import('../ipc');
  for (const [channel, listener] of ipcMainOn.mock.calls) {
    listeners.set(channel, listener);
  }
});

const getListener = (channel: string): SyncListener => {
  const listener = listeners.get(channel);
  if (!listener) throw new Error(`No listener registered for ${channel}`);
  return listener;
};

/**
 * A stand-in for Electron's sync IPC event: `returnValue` is a setter that
 * sends the reply, so record every value it was set to.
 */
const createEvent = (url = 'file:///index.html') => {
  const replies: unknown[] = [];
  const event = {
    set returnValue(value: unknown) {
      replies.push(value);
    },
    senderFrame: { url },
  } as unknown as IpcMainEvent;
  return { event, replies };
};

describe('handleIpcSendSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSelfMock.mockReturnValue(true);
  });

  it('replies with the resolved value of an async listener', async () => {
    encryptSecretMock.mockResolvedValue('enc:v1:abc');
    const listener = getListener('encryptSecretSync');
    const { event, replies } = createEvent();

    listener(event, 'hunter2');
    await vi.waitFor(() => expect(replies).toEqual(['enc:v1:abc']));

    expect(encryptSecretMock).toHaveBeenCalledWith('hunter2');
  });

  it('replies once the async listener settles, not before', async () => {
    let resolveDecrypt: (value: string) => void = () => undefined;
    decryptSecretMock.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveDecrypt = resolve;
      }),
    );
    const listener = getListener('decryptSecretSync');
    const { event, replies } = createEvent();

    listener(event, 'enc:v1:abc');
    await Promise.resolve();
    expect(replies).toEqual([]);

    resolveDecrypt('hunter2');
    await vi.waitFor(() => expect(replies).toEqual(['hunter2']));
  });

  it('still replies (with undefined) and reports when the listener rejects', async () => {
    isSecretEncryptionAvailableMock.mockRejectedValue(new Error('boom'));
    const listener = getListener('isSecretEncryptionAvailableSync');
    const { event, replies } = createEvent();

    listener(event);
    await vi.waitFor(() => expect(replies).toEqual([undefined]));

    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: {
          fn: {
            channel: 'isSecretEncryptionAvailableSync',
            name: 'handleIpcSendSync',
          },
        },
      }),
    );
  });

  it('replies undefined without calling the listener for an untrusted sender', async () => {
    isSelfMock.mockReturnValue(false);
    const listener = getListener('encryptSecretSync');
    const { event, replies } = createEvent('https://example.com/');

    listener(event, 'hunter2');

    expect(replies).toEqual([undefined]);
    expect(encryptSecretMock).not.toHaveBeenCalled();
  });
});
