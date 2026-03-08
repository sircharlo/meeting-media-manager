import type { BrowserWindow } from 'electron';

import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import {
  createWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';

export const zoomMeetingManagerWindowInfo = {
  zoomMeetingManagerWindow: null as BrowserWindow | null,
};

export const createZoomMeetingManagerWindow = (meetingId: string) => {
  if (!meetingId) return;

  if (
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow &&
    !zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.isDestroyed()
  ) {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.show();
    return;
  }

  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow = createWindow(
    'zoomMeetingManager',
    {
      alwaysOnTop: true,
      height: HD_RESOLUTION[1],
      show: true,
      title: 'Zoom Meeting Manager',
      useContentSize: PLATFORM !== 'darwin',
      width: HD_RESOLUTION[0],
    },
  );

  const meetingUrl = `https://app.zoom.us/wc/${meetingId}/start?ref_from=launch&fromPWA=1`;
  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.loadURL(meetingUrl);

  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.webContents.setWindowOpenHandler(
    (details) => {
      zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow?.loadURL(
        details.url,
      );
      return { action: 'deny' };
    },
  );

  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.on('close', () => {
    sendToWindow(
      zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow,
      'zoomMeetingManagerWindowClosed',
    );
  });

  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.on('closed', () => {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow = null;
  });
};
