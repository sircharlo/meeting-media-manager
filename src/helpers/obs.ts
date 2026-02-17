import { errorCatcher } from 'src/helpers/error-catcher';
import { sleep } from 'src/utils/general';
import { initObsWebSocket, obsWebSocketInfo } from 'src/utils/obs';
import { portNumberValidator } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';

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

export const obsConnect = async (setup?: boolean) => {
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
  } catch (error) {
    errorCatcher(error);
  }
};

export const obsStartRecording = async (): Promise<boolean> => {
  try {
    if (!obsWebSocketInfo.obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    await obsWebSocketInfo.obsWebSocket.call('StartRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsStopRecording = async (): Promise<boolean> => {
  try {
    if (!obsWebSocketInfo.obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    await obsWebSocketInfo.obsWebSocket.call('StopRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsGetRecordingDirectory = async (): Promise<null | string> => {
  try {
    if (!obsWebSocketInfo.obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return null;
    }

    const response =
      await obsWebSocketInfo.obsWebSocket.call('GetRecordDirectory');
    return response.recordDirectory || null;
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

export const obsGetRecordingState = async (): Promise<boolean> => {
  try {
    if (!obsWebSocketInfo.obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    const response =
      await obsWebSocketInfo.obsWebSocket.call('GetRecordStatus');
    return response?.outputActive || false;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
