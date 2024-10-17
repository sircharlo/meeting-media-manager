import type { ElectronApi } from 'src/helpers/electron-api';

export {};

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}
