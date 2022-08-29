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
        success: colors.green,
        warning: '#ffc107',
      },
      dark: {
        primary: '#375a7f',
        secondary: '#626262',
        accent: '#9e9e9e',
        error: '#e74c3c',
        info: '#17a2b8',
        success: colors.green.accent3,
        warning: '#f39c12',
      },
    },
  },
  icons: {
    iconfont: 'faSvg',
  },
}
