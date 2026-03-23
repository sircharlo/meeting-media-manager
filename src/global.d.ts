import type { ElectronApi } from 'src/types';

export {};

declare global {
  interface MediaTrackConstraints {
    cursor?: 'always' | 'motion' | 'never';
  }

  var electronApi: ElectronApi;
}
