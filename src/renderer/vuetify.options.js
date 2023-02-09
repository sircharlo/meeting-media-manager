import minifyTheme from 'minify-css-string'
import colors from 'vuetify/es5/util/colors'

export default {
  theme: {
    dark: false,
    options: {
      minifyTheme,
    },
    themes: {
      light: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        accent: '#f8f9fa',
        error: '#dc3545',
        info: '#0dcaf0',
        success: colors.green.base,
        warning: '#ffc107',
        // btn: '#212529',
        btn: colors.grey.darken3,
        treasures: '#626262',
        apply: '#9d5d07',
        living: '#942926',
      },
      dark: {
        primary: '#375a7f',
        secondary: '#626262',
        accent: '#9e9e9e',
        error: '#e74c3c',
        info: '#17a2b8',
        success: colors.green.accent3,
        warning: '#f39c12',
        btn: '#3b3b3b',
        treasures: '#a7a7a7',
        apply: '#ecb368',
        living: '#d27674',
      },
    },
  },
  icons: {
    iconfont: 'faSvg',
  },
}
