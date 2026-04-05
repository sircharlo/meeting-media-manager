import { send } from 'src-electron/preload/ipc';

export const launchZoomMeeting = (meetingId: string) =>
  send('launchZoomMeeting', meetingId);
