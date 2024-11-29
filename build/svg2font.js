// eslint-disable-next-line @typescript-eslint/no-require-imports
var IconfontWebpackPlugin = require('@daipeng7/rollup-plugin-iconfont');
var options = {
  cssOutput: 'src/css/mmm-icons.css',
  // iconFont name prefix
  cssPrefix: 'mmm',
  fontName: 'mmm-icons',
  fontsOutput: 'src/css/',
  formats: ['woff2'],
  htmlOutput: false,
  jsOutput: false,
  svgs: 'build/icons/*.svg',
  // Font loads the absolute path. If not set, the relative path will be automatically calculated based on `cssOutput` and `fontsOutput`.
  // cssFontPath: '',
  template: 'scss',
};

IconfontWebpackPlugin(options).buildStart();
