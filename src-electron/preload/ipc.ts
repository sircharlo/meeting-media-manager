import type {
  ElectronIpcInvokeKey,
  ElectronIpcListenKey,
  ElectronIpcSendKey,
  ElectronIpcSendSyncKey,
} from 'src/types';

import { ipcRenderer } from 'electron/renderer';
import { log } from 'src/shared/vanilla';

export const invoke = (channel: ElectronIpcInvokeKey, ...args: unknown[]) => {
  if (import.meta.env.QUASAR_DEBUG) {
    log('[preload] invoke', 'electronIpc', 'debug', { args, channel });
  }
  return ipcRenderer.invoke(channel, ...args);
};

export const send = (channel: ElectronIpcSendKey, ...args: unknown[]) => {
  if (import.meta.env.QUASAR_DEBUG) {
    log('[preload] send', 'electronIpc', 'debug', { args, channel });
  }
  ipcRenderer.send(channel, ...args);
};

/**
 * Sends a message to the main process and blocks until it replies.
 * Reserved for small, fast, main-process-only operations (e.g. safeStorage
 * encryption) that must complete before a synchronous caller (such as a
 * Pinia persistence serializer) can continue.
 */
export const sendSync = <T = unknown>(
  channel: ElectronIpcSendSyncKey,
  ...args: unknown[]
): T => {
  if (import.meta.env.QUASAR_DEBUG) {
    log('[preload] sendSync', 'electronIpc', 'debug', { args, channel });
  }
  return ipcRenderer.sendSync(channel, ...args) as T;
};

/**
 * Subscribes to a main-process IPC broadcast. Returns an unsubscribe
 * function so callers whose listener can be registered more than once per
 * app lifetime (e.g. a component that mounts/unmounts with route changes)
 * can remove it on cleanup instead of accumulating a new ipcRenderer
 * listener on every mount.
 */
export const listen = (
  channel: ElectronIpcListenKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (args: any) => void,
) => {
  if (import.meta.env.QUASAR_DEBUG) {
    log('[preload] listen', 'electronIpc', 'debug', { channel });
  }
  const wrappedCallback = (_e: Electron.IpcRendererEvent, args: unknown) =>
    callback(args);
  ipcRenderer.on(channel, wrappedCallback);
  return () => ipcRenderer.off(channel, wrappedCallback);
};

export const removeAllIpcListeners = ipcRenderer.removeAllListeners;
