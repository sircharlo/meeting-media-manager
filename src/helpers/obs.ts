import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';
import { sleep } from 'src/utils/general';
import { initObsWebSocket, obsWebSocket } from 'src/utils/obs';
import { portNumberValidator } from 'src/utils/settings';

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
        const { OBSWebSocketError } = await import('obs-websocket-js');
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
