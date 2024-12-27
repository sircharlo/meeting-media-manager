import type { Announcement, Release } from 'src/types';

export const releases: Release[] = [
  { prerelease: true, tag_name: 'v1.2.4-beta.0' },
  { prerelease: false, tag_name: 'v1.2.3' },
];

export const announcements: Announcement[] = [
  {
    actions: ['update'],
    id: 'new-update',
    maxVersion: '24.11.4',
    message: 'update-available',
    persistent: true,
  },
  {
    actions: ['update'],
    id: 'new-update',
    maxVersion: '24.12.0',
    message: 'update-available',
    minVersion: '24.11.5',
    persistent: true,
    platform: ['win'],
  },
  {
    id: 'media-window-title-update',
    message:
      'Starting in v25.1.0, the title of the media window will change. If OBS Studio is set to capture the media window by title, it may stop working. Be prepared to update your OBS Studio window capture settings after the update.',
    minVersion: '24.12.1',
    scope: ['obs'],
    type: 'warning',
  },
  { id: '', message: 'Message without id' },
  { id: 'message-without-message', message: '' },
];
