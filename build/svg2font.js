import path from 'path';
import WebpackIconfontPluginNodejs from 'webpack-iconfont-plugin-nodejs';

const dir = 'src';

var options = {
  cssOutput: path.join(dir, 'css/mmm-icons.css'),
  // iconFont name prefix
  cssPrefix: 'mmm',
  fontName: 'mmm-icons',
  fontsOutput: path.join(dir, 'css/'),
  formats: ['woff2'],
  htmlOutput: false,
  jsOutput: false,
  svgs: path.join('build/icons/', '*.svg'),
  // Font loads the absolute path. If not set, the relative path will be automatically calculated based on `cssOutput` and `fontsOutput`.
  // cssFontPath: '',
  template: 'scss',
};

new WebpackIconfontPluginNodejs(options).build();
