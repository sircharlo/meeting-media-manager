const ICONS_DIR = 'build/icons/'

const windowsOS = {
  win: {
    icon: ICONS_DIR + 'icon.ico',
    target: 'nsis',
  },

  nsis: {
    oneClick: false,
  },
}

const linuxOS = {
  linux: {
    icon: ICONS_DIR + 'icon.png',
    target: 'AppImage',
    category: 'Utility',
  },
}

const macOS = {
  mac: {
    target: {
      target: 'dmg',
      arch: ['universal'],
    },
  },
}

module.exports = {
  productName: 'Meeting Media Manager',
  appId: 'sircharlo.meeting-media-manager',
  // eslint-disable-next-line no-template-curly-in-string
  artifactName: 'Meeting-Media-Manager-${version}.${ext}',
  directories: {
    output: 'build',
  },
  // default files: https://www.electron.build/configuration/contents
  files: [
    'package.json',
    {
      from: 'dist/main/',
      to: 'dist/main/',
    },
    {
      from: 'dist/renderer/',
      to: 'dist/renderer/',
    },
  ],
  extraResources: [
    {
      from: 'src/extraResources/',
      to: '',
    },
  ],
  ...windowsOS,
  ...linuxOS,
  ...macOS,
}
