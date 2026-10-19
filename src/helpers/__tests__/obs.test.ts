import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();
const createTemporaryNotificationMock = vi.fn();
const sleepMock = vi.fn(() => Promise.resolve());
const connectMock = vi.fn();
const disconnectMock = vi.fn();
const obsErrorHandlerMock = vi.fn();

const currentStateStore = {
  currentSettings: {
    obsEnable: true,
    obsPassword: 'hunter2',
    obsPort: '4455',
  } as Record<string, unknown>,
};

const obsStateStore = {
  obsCloseHandler: vi.fn(() => {
    obsStateStore.obsConnectionState = 'disconnected';
    obsStateStore.obsMessage = 'obs.disconnected';
  }),
  obsConnectionState: 'notConnected',
  obsErrorHandler: obsErrorHandlerMock,
  obsMessage: '',
  scenes: [] as unknown[],
};

vi.mock('boot/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: createTemporaryNotificationMock,
}));

vi.mock('src/utils/general', () => ({
  sleep: sleepMock,
}));

vi.mock('src/utils/obs', () => ({
  initObsWebSocket: vi.fn(async () => undefined),
  obsWebSocketInfo: {
    obsWebSocket: { connect: connectMock, disconnect: disconnectMock },
  },
}));

vi.mock('src/utils/settings', () => ({
  portNumberValidator: (val: string) => {
    const num = Number(val);
    return Number.isInteger(num) && num > 0 && num < 65536;
  },
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateStore,
}));

vi.mock('stores/obs-state', () => ({
  useObsStateStore: () => obsStateStore,
}));

describe('obsConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obsStateStore.obsConnectionState = 'notConnected';
    currentStateStore.currentSettings = {
      obsEnable: true,
      obsPassword: 'hunter2',
      obsPort: '4455',
    };
    connectMock.mockResolvedValue({
      negotiatedRpcVersion: 1,
      obsWebSocketVersion: '5.0',
    });
  });

  it('shares a single connection attempt across concurrent calls', async () => {
    const { obsConnect } = await import('../obs');

    await Promise.all([obsConnect(), obsConnect(), obsConnect()]);

    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh attempt once a previous one has finished', async () => {
    const { obsConnect } = await import('../obs');

    await obsConnect();
    await obsConnect();

    expect(connectMock).toHaveBeenCalledTimes(2);
  });

  it('does not attempt to connect when OBS integration is disabled', async () => {
    currentStateStore.currentSettings = { obsEnable: false };
    const { obsConnect } = await import('../obs');

    await obsConnect();

    expect(connectMock).not.toHaveBeenCalled();
    expect(disconnectMock).toHaveBeenCalled();
  });

  // MMM-V2-3FC: the ConnectionClosed listener is already gone by the time
  // a disable disconnects, so nothing else resets the state.
  it('resets the connection state and scene list when OBS integration is turned off', async () => {
    obsStateStore.obsConnectionState = 'connected';
    obsStateStore.scenes = [{ sceneName: 'Camera' }];
    currentStateStore.currentSettings = { obsEnable: false };
    const { obsConnect } = await import('../obs');

    await obsConnect();

    expect(obsStateStore.obsConnectionState).toBe('disconnected');
    expect(obsStateStore.scenes).toEqual([]);
  });

  it('does not report an error on a successful connection attempt', async () => {
    const { obsConnect } = await import('../obs');

    await obsConnect();

    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  // FE-6 (full-audit-2026-09-04.md): previously left obsConnectionState
  // stuck at 'connecting' forever once every retry was exhausted without
  // ever reaching 'connected' - disabling both the manual retry button and
  // any future automatic reconnect attempt (both gated on not being
  // 'connecting') until the app was restarted.
  it('resets state to disconnected (not stuck at connecting) once every retry attempt fails', async () => {
    connectMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const { obsConnect } = await import('../obs');

    await obsConnect(true);

    expect(obsStateStore.obsCloseHandler).toHaveBeenCalled();
    expect(obsStateStore.obsConnectionState).toBe('disconnected');
  });
});

describe('OBS RPC calls before the socket is identified', () => {
  const callMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    obsStateStore.obsConnectionState = 'connecting';
  });

  it('does not call the socket while still connecting', async () => {
    const obsUtils = await import('src/utils/obs');
    obsUtils.obsWebSocketInfo.obsWebSocket = { call: callMock } as never;

    const { obsGetRecordingState, obsStartRecording } = await import('../obs');

    await expect(obsStartRecording()).resolves.toBe(false);
    await expect(obsGetRecordingState()).resolves.toBe(false);

    expect(callMock).not.toHaveBeenCalled();
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('calls the socket once identified', async () => {
    obsStateStore.obsConnectionState = 'connected';
    const obsUtils = await import('src/utils/obs');
    callMock.mockResolvedValue({ outputActive: true });
    obsUtils.obsWebSocketInfo.obsWebSocket = { call: callMock } as never;

    const { obsGetRecordingState } = await import('../obs');

    await expect(obsGetRecordingState()).resolves.toBe(true);
    expect(callMock).toHaveBeenCalledWith('GetRecordStatus');
  });
});

// MMM-V2-3JD/3JE: OBS accepts connections before it has finished loading and
// answers requests with "OBS is not ready to perform the request." until
// then - that's not a bug worth reporting.
describe('OBS recording queries while OBS is still loading', () => {
  const callMock = vi.fn();
  const notReady = () => new Error('OBS is not ready to perform the request.');

  beforeEach(async () => {
    vi.clearAllMocks();
    obsStateStore.obsConnectionState = 'connected';
    const obsUtils = await import('src/utils/obs');
    obsUtils.obsWebSocketInfo.obsWebSocket = { call: callMock } as never;
  });

  it('retries until OBS is ready', async () => {
    callMock
      .mockRejectedValueOnce(notReady())
      .mockRejectedValueOnce(notReady())
      .mockResolvedValueOnce({ outputActive: true });
    const { obsGetRecordingState } = await import('../obs');

    await expect(obsGetRecordingState()).resolves.toBe(true);
    expect(callMock).toHaveBeenCalledTimes(3);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('gives up quietly when OBS stays not-ready', async () => {
    callMock.mockRejectedValue(notReady());
    const { obsGetRecordingDirectory } = await import('../obs');

    await expect(obsGetRecordingDirectory()).resolves.toBeNull();
    expect(callMock).toHaveBeenCalledTimes(5);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('does not retry or report a dropped socket', async () => {
    callMock.mockRejectedValue(new Error('Not connected'));
    const { obsGetRecordingState } = await import('../obs');

    await expect(obsGetRecordingState()).resolves.toBe(false);
    expect(callMock).toHaveBeenCalledTimes(1);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('still reports a genuine failure', async () => {
    callMock.mockRejectedValue(new Error('Something unexpected'));
    const { obsGetRecordingState } = await import('../obs');

    await expect(obsGetRecordingState()).resolves.toBe(false);
    expect(errorCatcherMock).toHaveBeenCalledTimes(1);
  });
});

// MMM-V2-3MA: StartRecord answers success before OBS has even tried to
// record, and OBS can then skip the recording without a word.
describe('obsStartRecording', () => {
  const callMock = vi.fn();
  const recordStatus = (outputActive: boolean) => ({ outputActive });

  beforeEach(async () => {
    vi.clearAllMocks();
    obsStateStore.obsConnectionState = 'connected';
    const obsUtils = await import('src/utils/obs');
    obsUtils.obsWebSocketInfo.obsWebSocket = { call: callMock } as never;
  });

  it('counts the recording as started once OBS reports it active', async () => {
    callMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(recordStatus(false))
      .mockResolvedValueOnce(recordStatus(true));
    const { obsStartRecording } = await import('../obs');

    await expect(obsStartRecording()).resolves.toBe(true);
    expect(callMock).toHaveBeenNthCalledWith(1, 'StartRecord');
    expect(callMock).toHaveBeenLastCalledWith('GetRecordStatus');
    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });

  it('tells the user, and does not count it, when OBS never starts recording', async () => {
    callMock.mockImplementation(async (request: string) =>
      request === 'StartRecord' ? undefined : recordStatus(false),
    );
    const { obsStartRecording } = await import('../obs');

    await expect(obsStartRecording()).resolves.toBe(false);
    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'obs-recording-not-started',
        type: 'negative',
      }),
    );
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('treats "already recording" (OutputRunning) as started, without reporting it', async () => {
    callMock.mockRejectedValue(Object.assign(new Error(''), { code: 500 }));
    const { obsStartRecording } = await import('../obs');

    await expect(obsStartRecording()).resolves.toBe(true);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('reports any other failure under its own name', async () => {
    const error = new Error('Something unexpected');
    callMock.mockRejectedValue(error);
    const { obsStartRecording } = await import('../obs');

    await expect(obsStartRecording()).resolves.toBe(false);
    expect(errorCatcherMock).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'obsStartRecording' } },
    });
  });
});

describe('obsStopRecording', () => {
  const callMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    obsStateStore.obsConnectionState = 'connected';
    const obsUtils = await import('src/utils/obs');
    obsUtils.obsWebSocketInfo.obsWebSocket = { call: callMock } as never;
  });

  // MMM-V2-3MA: OBS answers OutputNotRunning (501), with no message, when
  // it isn't recording - the recording M³ was showing never existed.
  it('treats "not recording" (OutputNotRunning) as stopped, without reporting it', async () => {
    callMock.mockRejectedValue(Object.assign(new Error(''), { code: 501 }));
    const { obsStopRecording } = await import('../obs');

    await expect(obsStopRecording()).resolves.toBe(true);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('reports any other failure under its own name', async () => {
    const error = Object.assign(new Error('Output failed'), { code: 702 });
    callMock.mockRejectedValue(error);
    const { obsStopRecording } = await import('../obs');

    await expect(obsStopRecording()).resolves.toBe(false);
    expect(errorCatcherMock).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'obsStopRecording' } },
    });
  });
});
