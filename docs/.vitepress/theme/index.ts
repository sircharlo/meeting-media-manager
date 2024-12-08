// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress';

import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';

import './style.css';

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enhanceApp({ app, router, siteData }) {
    // ...
  },
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
} satisfies Theme;
