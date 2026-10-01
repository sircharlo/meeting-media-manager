import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { sleep } from 'src/utils/general';
import { initObsWebSocket, obsWebSocketInfo } from 'src/utils/obs';
import { portNumberValidator } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';

// obsWebSocketInfo.obsWebSocket exists as soon as connect() is called, but
// obs-websocket-js only accepts .call() requests once the 'Identified'
// handshake completes (obsConnectionState flips to 'connected' - see
// ObsStatus.vue). Callers that only checked the socket's existence could
// race an in-flight connection attempt and throw "Socket not identified"/
// "Not connected" instead of failing gracefully.
const isObsWebSocketReady = () =>
  !!obsWebSocketInfo.obsWebSocket &&
  useObsStateStore().obsConnectionState === 'connected';

/**
 * Whether an obs-websocket request failed only because OBS can't answer
 * yet, rather than for a real reason: "OBS is not ready to perform the
 * request." (error 207 NotReady, returned until OBS has finished loading
 * its scene collection/plugins after start-up) or "Not connected" (the
 * socket dropped between 'Identified' and the request - the reconnect flow
 * re-runs whatever asked).
 * @param error The error thrown by an obs-websocket `call()`
 * @returns Whether the failure is transient
 */
export const isTransientObsError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes('OBS is not ready') ||
    error.message === 'Not connected');

const OBS_NOT_READY_RETRIES = 5;
const OBS_NOT_READY_RETRY_MS = 2000;

/**
 * Runs an obs-websocket request, retrying for a while if OBS answers that
 * it isn't ready yet (it accepts connections before it has finished
 * loading). Any other failure - including the socket dropping - is thrown
 * immediately.
 * @param request The request to run
 * @returns The request's result
 */
const callWhenObsReady = async <T>(request: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      const notReadyYet =
        error instanceof Error && error.message.includes('OBS is not ready');
      if (!notReadyYet || attempt >= OBS_NOT_READY_RETRIES) throw error;
      await sleep(OBS_NOT_READY_RETRY_MS);
    }
  }
};

const reportObsCallError = (error: unknown, name: string) => {
  if (isTransientObsError(error)) {
    log(`${name}: OBS not ready, giving up for now`, 'obs', 'warn', error);
    return;
  }
  errorCatcher(error, { contexts: { fn: { name } } });
};

const getObsConnectionSettings = () => {
  const currentState = useCurrentStateStore();
  if (!currentState.currentSettings?.obsEnable) return 'disabled';

  const obsPort = currentState.currentSettings?.obsPort || '';
  if (!portNumberValidator(obsPort)) return 'invalid';

  const obsPassword = currentState.currentSettings?.obsPassword || '';
  if (obsPassword?.length === 0) return 'invalid';

  return { obsPassword, obsPort };
};

const performConnectionAttempt = async (
  obsPort: string,
  obsPassword: string,
) => {
  const obsState = useObsStateStore();
  try {
    await initObsWebSocket();
    const connection = await obsWebSocketInfo.obsWebSocket?.connect(
      'ws://127.0.0.1:' + obsPort,
      obsPassword,
    );
    return !!(
      connection?.negotiatedRpcVersion && connection?.obsWebSocketVersion
    );
  } catch (err) {
    const { OBSWebSocketError } = await import('obs-websocket-js');
    if (err instanceof OBSWebSocketError) obsState.obsErrorHandler(err);
    else errorCatcher(err);
    return false;
  }
};

let ongoingConnectAttempt: null | Promise<void> = null;

const runObsConnect = async (setup?: boolean) => {
  const obsState = useObsStateStore();
  try {
    const settings = getObsConnectionSettings();
    if (settings === 'disabled') {
      await obsWebSocketInfo.obsWebSocket?.disconnect();
      return;
    }
    if (settings === 'invalid') return;

    obsState.obsConnectionState = 'connecting';
    obsState.obsMessage = 'obs.connecting';

    let attempt = 0;
    const maxAttempts = setup ? 1 : 12;
    while (
      attempt < maxAttempts &&
      // @ts-expect-error connecting and connected have no overlap
      obsState.obsConnectionState !== 'connected'
    ) {
      if (
        await performConnectionAttempt(settings.obsPort, settings.obsPassword)
      )
        break;

      attempt++;
      if (attempt < maxAttempts) {
        await sleep(5000);
      }
    }

    // FE-6 (full-audit-2026-09-04.md): without this, exhausting every retry
    // left obsConnectionState stuck at 'connecting' - which, since
    // ObsStatus.vue disables its button while connecting, made both the
    // manual retry button and any future automatic reconnect attempt
    // permanently unreachable until the app was restarted.
    // @ts-expect-error connecting and connected have no overlap
    if (obsState.obsConnectionState !== 'connected') {
      obsState.obsCloseHandler();
    }
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Connects to OBS, retrying with backoff until connected or out of attempts.
 * Concurrent calls (e.g. a settings change and a manual retry firing close
 * together) share the same in-flight attempt instead of racing multiple
 * overlapping connect/retry loops against each other.
 * @param setup Whether this is the initial setup attempt (single try only)
 */
export const obsConnect = async (setup?: boolean) => {
  if (ongoingConnectAttempt) return ongoingConnectAttempt;

  ongoingConnectAttempt = runObsConnect(setup).finally(() => {
    ongoingConnectAttempt = null;
  });

  return ongoingConnectAttempt;
};

export const obsStartRecording = async (): Promise<boolean> => {
  try {
    if (!isObsWebSocketReady()) {
      log('OBS WebSocket not connected', 'obs', 'warn');
      return false;
    }

    await obsWebSocketInfo.obsWebSocket?.call('StartRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsStopRecording = async (): Promise<boolean> => {
  try {
    if (!isObsWebSocketReady()) {
      log('OBS WebSocket not connected', 'obs', 'warn');
      return false;
    }

    await obsWebSocketInfo.obsWebSocket?.call('StopRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsGetRecordingDirectory = async (): Promise<null | string> => {
  try {
    if (!isObsWebSocketReady()) {
      log('OBS WebSocket not connected', 'obs', 'warn');
      return null;
    }

    const response = await callWhenObsReady(async () =>
      obsWebSocketInfo.obsWebSocket?.call('GetRecordDirectory'),
    );
    return response?.recordDirectory || null;
  } catch (error) {
    reportObsCallError(error, 'obsGetRecordingDirectory');
    return null;
  }
};

export const obsGetRecordingState = async (): Promise<boolean> => {
  try {
    if (!isObsWebSocketReady()) {
      log('OBS WebSocket not connected', 'obs', 'warn');
      return false;
    }

    const response = await callWhenObsReady(async () =>
      obsWebSocketInfo.obsWebSocket?.call('GetRecordStatus'),
    );
    return response?.outputActive || false;
  } catch (error) {
    reportObsCallError(error, 'obsGetRecordingState');
    return false;
  }
};
