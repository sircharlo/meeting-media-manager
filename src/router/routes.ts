import type { RouteRecordRaw } from 'vue-router';

const mainChildRoute = (
  path: string,
  name: string,
  page: string,
  meta?: RouteRecordRaw['meta'],
  extra?: Partial<RouteRecordRaw>,
  layout = 'MainLayout',
): RouteRecordRaw =>
  ({
    children: [
      {
        component: () => import(`pages/${page}.vue`),
        name,
        path: '',
      },
    ],
    component: () => import(`layouts/${layout}.vue`),
    meta,
    path,
    ...extra,
  }) as RouteRecordRaw;

const routes: RouteRecordRaw[] = [
  {
    component: () => import('layouts/RouteHelper.vue'),
    path: '/',
  },

  mainChildRoute(
    '/congregation-selector',
    'congregation-selector',
    'CongregationSelectorPage',
    { icon: 'mmm-groups', title: 'titles.profileSelection' },
    { alias: ['/initial-congregation-selector'] },
  ),

  mainChildRoute(
    '/media-calendar/:typeOfLoad?',
    'media-calendar',
    'MediaCalendarPage',
    { icon: 'mmm-media', title: 'titles.meetingMedia' },
  ),

  mainChildRoute('/present-website', 'present-website', 'PresentWebsite', {
    icon: 'mmm-open-web',
    title: 'titles.presentWebsite',
  }),

  mainChildRoute(
    '/media-player',
    'media-player',
    'MediaPlayerPage',
    { title: 'titles.mediaPlayer' },
    undefined,
    'MediaPlayerLayout',
  ),

  mainChildRoute(
    '/timer',
    'timer',
    'TimerPage',
    { title: 'Timer' },
    undefined,
    'TimerLayout',
  ),

  mainChildRoute('/setup-wizard', 'setup-wizard', 'SetupWizard', {
    icon: 'mmm-configuration',
    title: 'setup-wizard',
  }),

  mainChildRoute('/settings/:setting?', 'settings', 'SettingsPage', {
    icon: 'mmm-settings',
    title: 'settings',
  }),

  {
    component: () => import('pages/ErrorNotFound.vue'),
    path: '/:catchAll(.*)*',
  },
];

export default routes;
