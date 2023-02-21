/* eslint-disable no-template-curly-in-string */
const ICONS_DIR = 'build/icons/'

const windowsOS = {
  win: {
    icon: ICONS_DIR + 'icon.ico',
    target: 'nsis',
    publish: ['github'],
  },

  nsis: {
    oneClick: false,
    differentialPackage: false,
    artifactName: 'meeting-media-manager-${version}.${ext}',
  },
}

const linuxOS = {
  linux: {
    icon: ICONS_DIR,
    target: ['AppImage'],
    category: 'Utility',
    publish: ['github'],
  },
}

const macOS = {
  mac: {
    icon: ICONS_DIR + 'icon.icns',
    target: {
      target: 'dmg',
      arch: ['universal'],
    },
    publish: ['github'],
  },

  dmg: {
    writeUpdateInfo: false,
  },
}

module.exports = {
  productName: 'Meeting Media Manager',
  appId: 'sircharlo.meeting-media-manager',
  artifactName: 'meeting-media-manager-${version}.${ext}',
  buildDependenciesFromSource: true,
  generateUpdatesFilesForAllChannels: true,
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
