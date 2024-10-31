import type {
  ElectronIpcInvokeKey,
  ElectronIpcListenKey,
  ElectronIpcSendKey,
} from 'src/types';

import { ipcRenderer } from 'electron/renderer';

export const invoke = (channel: ElectronIpcInvokeKey, ...args: unknown[]) => {
  if (process.env.DEBUGGING) {
    console.debug('[preload] invoke', { args, channel });
  }
  return ipcRenderer.invoke(channel, ...args);
};

export const send = (channel: ElectronIpcSendKey, ...args: unknown[]) => {
  if (process.env.DEBUGGING) {
    console.debug('[preload] send', { args, channel });
  }
  ipcRenderer.send(channel, ...args);
};

export const listen = (
  channel: ElectronIpcListenKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (args: any) => void,
) => {
  if (process.env.DEBUGGING) {
    console.debug('[preload] listen', { channel });
  }
  ipcRenderer.on(channel, (_e, args) => callback(args));
};

export const removeAllIpcListeners = ipcRenderer.removeAllListeners;
