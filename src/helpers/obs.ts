import { OBSWebSocketError } from 'obs-websocket-js';
import { errorCatcher } from 'src/helpers/error-catcher';
import { sleep } from 'src/utils/general';
import { initObsWebSocket, obsWebSocket } from 'src/utils/obs';
import { portNumberValidator } from 'src/utils/settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';

export const obsConnect = async (setup?: boolean) => {
  const currentState = useCurrentStateStore();
  const obsState = useObsStateStore();
  try {
    if (!currentState.currentSettings?.obsEnable) {
      await obsWebSocket?.disconnect();
      return;
    }

    const obsPort = currentState.currentSettings?.obsPort || '';
    if (!portNumberValidator(obsPort)) return;

    const obsPassword = currentState.currentSettings?.obsPassword || '';
    if (obsPassword?.length === 0) return;

    obsState.obsConnectionState = 'connecting';
    obsState.obsMessage = 'obs.connecting';

    let attempt = 0;
    const maxAttempts = setup ? 1 : 12;
    const timeBetweenAttempts = 5000;
    while (
      attempt < maxAttempts &&
      // @ts-expect-error connecting and connected have no overlap
      obsState.obsConnectionState !== 'connected'
    ) {
      try {
        await initObsWebSocket();
        const connection = await obsWebSocket?.connect(
          'ws://127.0.0.1:' + obsPort,
          obsPassword,
        );
        if (
          connection?.negotiatedRpcVersion &&
          connection?.obsWebSocketVersion
        ) {
          break;
        }
      } catch (err) {
        if (err instanceof OBSWebSocketError) obsState.obsErrorHandler(err);
        else errorCatcher(err);
      } finally {
        attempt++;
        if (attempt < maxAttempts) {
          await sleep(timeBetweenAttempts);
        }
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

export const obsStartRecording = async (): Promise<boolean> => {
  try {
    if (!obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    await obsWebSocket.call('StartRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsStopRecording = async (): Promise<boolean> => {
  try {
    if (!obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    await obsWebSocket.call('StopRecord');
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsGetRecordingDirectory = async (): Promise<null | string> => {
  try {
    if (!obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return null;
    }

    const response = await obsWebSocket.call('GetRecordDirectory');
    return response.recordDirectory || null;
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

export const obsGetRecordingState = async (): Promise<boolean> => {
  try {
    if (!obsWebSocket) {
      console.warn('OBS WebSocket not connected');
      return false;
    }

    const response = await obsWebSocket.call('GetRecordStatus');
    return response?.outputActive || false;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
