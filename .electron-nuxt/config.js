const { join } = require('path')

const PROJECT_ROOT = join(__dirname, '..')
const SRC_DIR = join(PROJECT_ROOT, 'src')

const config = {
  ELECTRON_RELAUNCH_CODE: 250, // valid range in unix system: <1,255>
  ELECTRON_INSPECTION_PORT: 5858,
  SERVER_PORT: 9080,
  SERVER_HOST: 'http://localhost',

  PROJECT_ROOT,
  SRC_DIR,
  MAIN_PROCESS_DIR: join(SRC_DIR, 'main', 'dist'),
  RENDERER_PROCESS_DIR: join(SRC_DIR, 'renderer'),
  RESOURCES_DIR: join(SRC_DIR, 'extraResources'),
  DIST_DIR: join(PROJECT_ROOT, 'dist'),
  BUILD_DIR: join(PROJECT_ROOT, 'build'),

  DISABLE_BABEL_LOADER: false, // experimental
}

module.exports = Object.freeze(config)
