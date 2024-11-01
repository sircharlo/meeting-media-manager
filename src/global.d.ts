import type { ElectronApi } from 'src/types';

export {};

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}
