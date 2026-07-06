import routes from 'src/router/routes';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { defineRouter } from '#q-app';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function () {
  let createHistory = createWebHashHistory;
  if (import.meta.env.QUASAR_SERVER) {
    createHistory = createMemoryHistory;
  } else if (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history') {
    createHistory = createWebHistory;
  }

  const Router = createRouter({
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    scrollBehavior: () => ({ left: 0, top: 0 }),
  });

  return Router;
});
