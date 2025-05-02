// https://github.com/michael-ciniawsky/postcss-load-config

import autoprefixer from 'autoprefixer';
// import rtlcss from 'postcss-rtlcss'

export default {
  plugins: [
    // https://github.com/postcss/autoprefixer
    autoprefixer({ overrideBrowserslist: ['Electron >= 36'] }),

    // https://github.com/elchininet/postcss-rtlcss
    // If you want to support RTL css, then
    // 1. yarn/pnpm/bun/npm install postcss-rtlcss
    // 2. optionally set quasar.config.ts > framework > lang to an RTL language
    // 3. uncomment the following line (and its import statement above):
    // rtlcss()
  ],
};
