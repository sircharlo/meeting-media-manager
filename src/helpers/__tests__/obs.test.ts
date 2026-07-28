import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();
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
  obsConnectionState: 'notConnected',
  obsErrorHandler: obsErrorHandlerMock,
  obsMessage: '',
};

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
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
