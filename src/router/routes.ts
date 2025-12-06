import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('layouts/RouteHelper.vue'),
    path: '/',
  },
  {
    alias: ['/initial-congregation-selector'],
    children: [
      {
        component: () => import('pages/CongregationSelectorPage.vue'),
        name: 'congregation-selector',
        path: '',
      },
    ],
    component: () => import('layouts/MainLayout.vue'),
    meta: { icon: 'mmm-groups', title: 'titles.profileSelection' },
    path: '/congregation-selector',
  },
  {
    children: [
      {
        component: () => import('pages/MediaCalendarPage.vue'),
        name: 'media-calendar',
        path: '',
      },
    ],
    component: () => import('layouts/MainLayout.vue'),
    meta: { icon: 'mmm-media', title: 'titles.meetingMedia' },
    path: '/media-calendar/:typeOfLoad?',
  },
  {
    children: [
      {
        component: () => import('pages/PresentWebsite.vue'),
        name: 'present-website',
        path: '',
      },
    ],
    component: () => import('layouts/MainLayout.vue'),
    meta: { icon: 'mmm-open-web', title: 'titles.presentWebsite' },
    path: '/present-website',
  },
  {
    children: [
      {
        component: () => import('pages/MediaPlayerPage.vue'),
        name: 'media-player',
        path: '',
      },
    ],
    component: () => import('layouts/MediaPlayerLayout.vue'),
    meta: { title: 'titles.mediaPlayer' },
    path: '/media-player',
  },
  {
    children: [
      {
        component: () => import('pages/TimerPage.vue'),
        name: 'timer',
        path: '',
      },
    ],
    component: () => import('layouts/TimerLayout.vue'),
    meta: { title: 'Timer' },
    path: '/timer',
  },
  {
    children: [
      {
        component: () => import('pages/SetupWizard.vue'),
        name: 'setup-wizard',
        path: '',
      },
    ],
    component: () => import('layouts/MainLayout.vue'),
    meta: { icon: 'mmm-configuration', title: 'setup-wizard' },
    path: '/setup-wizard',
  },
  {
    children: [
      {
        component: () => import('pages/SettingsPage.vue'),
        name: 'settings',
        path: '',
      },
    ],
    component: () => import('layouts/MainLayout.vue'),
    meta: { icon: 'mmm-settings', title: 'settings' },
    path: '/settings/:setting?',
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    component: () => import('pages/ErrorNotFound.vue'),
    path: '/:catchAll(.*)*',
  },
];

export default routes;
