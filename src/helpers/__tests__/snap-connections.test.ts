import type { SnapConnections } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const copyToClipboard = vi.fn();
vi.mock('quasar', () => ({
  copyToClipboard: (...args: unknown[]) => copyToClipboard(...(args as [])),
}));

const errorCatcher = vi.fn();
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcher(...(args as [])),
}));

const appSettings = {
  snapConnectReminderDismissed: {} as Record<string, boolean>,
};
vi.mock('stores/app-settings', () => ({
  useAppSettingsStore: () => appSettings,
}));

const REMOVABLE_MEDIA = 'snap connect meeting-media-manager:removable-media';
const KEYRING = 'snap connect meeting-media-manager:password-manager-service';

const getSnapConnections = vi.fn<() => Promise<null | SnapConnections>>();

/** Pretends to be M³'s snap, with these interfaces' states. */
const runAsSnap = (connections: null | SnapConnections) => {
  getSnapConnections.mockResolvedValue(connections);
  vi.stubGlobal('electronApi', {
    appStore: 'snap-store',
    getSnapConnections,
  });
};

interface NotifyAction {
  handler?: () => void;
  label?: string;
}

/** The reminder's action with this label, from its last call. */
const getAction = (label: string) => {
  const [options] = createTemporaryNotification.mock.lastCall as [
    { actions: NotifyAction[] },
  ];
  const action = options.actions.find((a) => a.label === label);
  if (!action?.handler) throw new Error(`No "${label}" action`);
  return action.handler;
};

const remind = async (obsEnabled = false) => {
  const { remindToConnectSnapInterfaces } = await import('../snap-connections');
  await remindToConnectSnapInterfaces({ obsEnabled });
};

beforeEach(() => {
  // What it brought up lasts the session: a fresh session per test.
  vi.resetModules();
  createTemporaryNotification.mockClear();
  copyToClipboard.mockReset();
  errorCatcher.mockClear();
  getSnapConnections.mockReset();
  appSettings.snapConnectReminderDismissed = {};
});

describe('remindToConnectSnapInterfaces', () => {
  it('gives the exact command for removable-media, alone, as code', async () => {
    runAsSnap({ 'password-manager-service': true, 'removable-media': false });

    await remind();

    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        caption: REMOVABLE_MEDIA,
        classes: 'snap-connect-notice',
        message: 'snap-connect-removable-media\nsnap-connect-command',
        type: 'warning',
      }),
    );
  });

  it('leaves the keyring out unless OBS Studio is on', async () => {
    runAsSnap({ 'password-manager-service': false, 'removable-media': true });

    await remind(false);
    expect(createTemporaryNotification).not.toHaveBeenCalled();

    await remind(true);
    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        caption: KEYRING,
        message:
          'snap-connect-password-manager-service\nsnap-connect-command-restart',
      }),
    );
  });

  it('puts both in one notice, one command per line joined by &&, with a restart', async () => {
    runAsSnap({ 'password-manager-service': false, 'removable-media': false });

    await remind(true);

    expect(createTemporaryNotification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        caption: `${REMOVABLE_MEDIA} &&\n${KEYRING}`,
        message: 'snap-connect-both\nsnap-connect-command-restart',
      }),
    );

    // What's copied is what's shown.
    copyToClipboard.mockResolvedValue(undefined);
    getAction('snap-connect-copy')();
    expect(copyToClipboard).toHaveBeenCalledWith(
      `${REMOVABLE_MEDIA} &&\n${KEYRING}`,
    );
  });

  it('brings each interface up once a session', async () => {
    runAsSnap({ 'password-manager-service': false, 'removable-media': false });

    await remind(false);
    await remind(false);
    expect(createTemporaryNotification).toHaveBeenCalledOnce();

    // OBS Studio turned on later: only the keyring is new.
    await remind(true);
    expect(createTemporaryNotification).toHaveBeenCalledTimes(2);
    expect(createTemporaryNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message:
          'snap-connect-password-manager-service\nsnap-connect-command-restart',
      }),
    );
  });

  it('copies the command', async () => {
    runAsSnap({ 'removable-media': false });
    copyToClipboard.mockResolvedValue(undefined);

    await remind();
    getAction('snap-connect-copy')();
    await vi.waitFor(() => {
      expect(createTemporaryNotification).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'snap-connect-command-copied',
          type: 'positive',
        }),
      );
    });

    expect(copyToClipboard).toHaveBeenCalledWith(REMOVABLE_MEDIA);
  });

  it('stops reminding about what the user turned down, in later sessions too', async () => {
    runAsSnap({ 'password-manager-service': false, 'removable-media': false });

    await remind(true);
    getAction('snap-connect-dont-remind')();
    expect(appSettings.snapConnectReminderDismissed).toEqual({
      'password-manager-service': true,
      'removable-media': true,
    });

    vi.resetModules();
    createTemporaryNotification.mockClear();
    await remind(true);
    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });

  it('says nothing when everything is connected', async () => {
    runAsSnap({ 'password-manager-service': true, 'removable-media': true });

    await remind(true);

    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });

  it('says nothing when snapctl could not tell, and does not ask again', async () => {
    runAsSnap({});

    await remind(true);
    await remind(true);

    expect(createTemporaryNotification).not.toHaveBeenCalled();
    expect(getSnapConnections).toHaveBeenCalledOnce();
  });

  it('does not ask snapctl again once each interface was checked', async () => {
    runAsSnap({ 'password-manager-service': false, 'removable-media': true });

    await remind(false);
    await remind(false);
    expect(getSnapConnections).toHaveBeenCalledOnce();

    // OBS Studio turned on: the keyring is still to check.
    await remind(true);
    await remind(true);
    expect(getSnapConnections).toHaveBeenCalledTimes(2);
  });

  it("does nothing outside M³'s snap", async () => {
    vi.stubGlobal('electronApi', { appStore: null, getSnapConnections });

    await remind(true);

    expect(getSnapConnections).not.toHaveBeenCalled();
    expect(createTemporaryNotification).not.toHaveBeenCalled();
  });
});
