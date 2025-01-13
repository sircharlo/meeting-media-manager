import type { Announcement, Release } from 'src/types';

export const releases: Release[] = [
  { assets: [], prerelease: true, tag_name: 'v1.2.4-beta.0' },
  { assets: [], prerelease: false, tag_name: 'v1.2.3' },
];

export const invalidAnnouncements: Announcement[] = [
  { id: '', message: 'Message without id' },
  { id: 'message-without-message', message: '' },
];

export const validAnnouncements: Announcement[] = [
  { id: 'past', maxVersion: '1.2.2', message: 'Message for past releases' },
  { id: 'future', message: 'Message for future releases', minVersion: '1.2.4' },
  { id: 'macos', message: 'Message for macOS users', platform: ['mac'] },
  { id: 'windows', message: 'Message for Windows users', platform: ['win'] },
  { id: 'linux', message: 'Message for Linux users', platform: ['linux'] },
  { id: 'all', message: 'Message for all users' },
  { id: 'obs', message: 'Message for OBS users', scope: ['obs'] },
];

export const announcements = [...invalidAnnouncements, ...validAnnouncements];
