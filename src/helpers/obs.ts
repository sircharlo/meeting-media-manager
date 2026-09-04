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

    const response =
      await obsWebSocketInfo.obsWebSocket?.call('GetRecordDirectory');
    return response?.recordDirectory || null;
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

export const obsGetRecordingState = async (): Promise<boolean> => {
  try {
    if (!isObsWebSocketReady()) {
      log('OBS WebSocket not connected', 'obs', 'warn');
      return false;
    }

    const response =
      await obsWebSocketInfo.obsWebSocket?.call('GetRecordStatus');
    return response?.outputActive || false;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
