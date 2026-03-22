import type {
  ElectronIpcInvokeKey,
  ElectronIpcListenKey,
  ElectronIpcSendKey,
} from 'src/types';

import { ipcRenderer } from 'electron/renderer';
import { log } from 'src/shared/vanilla';

export const invoke = (channel: ElectronIpcInvokeKey, ...args: unknown[]) => {
  if (process.env.DEBUGGING) {
    log('[preload] invoke', 'electronIpc', 'debug', { args, channel });
  }
  return ipcRenderer.invoke(channel, ...args);
};

export const send = (channel: ElectronIpcSendKey, ...args: unknown[]) => {
  if (process.env.DEBUGGING) {
    log('[preload] send', 'electronIpc', 'debug', { args, channel });
  }
  ipcRenderer.send(channel, ...args);
};

export const listen = (
  channel: ElectronIpcListenKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (args: any) => void,
) => {
  if (process.env.DEBUGGING) {
    log('[preload] listen', 'electronIpc', 'debug', { channel });
  }
  ipcRenderer.on(channel, (_e, args) => callback(args));
};

export const removeAllIpcListeners = ipcRenderer.removeAllListeners;
