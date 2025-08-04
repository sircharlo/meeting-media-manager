/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ElectronApi } from 'src/types';

import robot from '@jitsi/robotjs';
import fs, { ensureDir } from 'fs-extra';
import { fileUrlToPath, pathToFileURL, readDirectory } from 'preload/fs';
import upath from 'upath';

export const basePath = upath.join(__dirname, '..', 'fs');
const fakePath = async (path: string) => {
  const dir = upath.join(basePath, path);
  await ensureDir(dir);
  return dir;
};

export const electronApi: ElectronApi = {
  askForMediaAccess: function () {
    throw new Error('Function not implemented.');
  },
  checkForUpdates: () => void 0,
  closeWebsiteWindow: function () {
    throw new Error('Function not implemented.');
  },
  convertHeic: function (image) {
    throw new Error('Function not implemented.');
  },
  convertPdfToImages: function (pdfPath, outputFolder) {
    throw new Error('Function not implemented.');
  },
  createVideoFromNonVideo: function (originalFile, ffmpegPath) {
    throw new Error('Function not implemented.');
  },
  decompress: function (input, output, opts) {
    throw new Error('Function not implemented.');
  },
  downloadFile: function (url, saveDir, destFilename, lowPriority) {
    throw new Error('Function not implemented.');
  },
  executeQuery: function (dbPath, query) {
    throw new Error('Function not implemented.');
  },
  fileUrlToPath,
  fs,
  getAllScreens: function () {
    throw new Error('Function not implemented.');
  },
  getAppDataPath: async () => fakePath('app'),
  getLocales: async () => [],
  getLocalPathFromFileObject: function (fileObject) {
    throw new Error('Function not implemented.');
  },
  getNrOfPdfPages: function (pdfPath) {
    throw new Error('Function not implemented.');
  },
  getScreenAccessStatus: function () {
    throw new Error('Function not implemented.');
  },
  getUserDataPath: async () => fakePath('app/meeting-media-manager'),
  getVideoDuration: function (filePath) {
    throw new Error('Function not implemented.');
  },
  inferExtension: async function (filename, filetype) {
    throw new Error('Function not implemented.');
  },
  isDownloadErrorExpected: async () => false,
  moveMediaWindow: function (targetScreenNumber, windowedMode, noEvent?) {
    throw new Error('Function not implemented.');
  },
  navigateWebsiteWindow: function (action) {
    throw new Error('Function not implemented.');
  },
  onDownloadCancelled: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadCompleted: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadError: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadProgress: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadStarted: function (callback) {
    throw new Error('Function not implemented.');
  },
  onLog: function (callback) {
    throw new Error('Function not implemented.');
  },
  onShortcut: function (callback) {
    throw new Error('Function not implemented.');
  },
  onWatchFolderUpdate: function (callback) {
    throw new Error('Function not implemented.');
  },
  openDiscussion: function (category, title, params) {
    throw new Error('Function not implemented.');
  },
  openExternal: function (website) {
    throw new Error('Function not implemented.');
  },
  openFileDialog: function (single, filter) {
    throw new Error('Function not implemented.');
  },
  openFolderDialog: function () {
    throw new Error('Function not implemented.');
  },
  openWebsiteWindow: function (lang) {
    throw new Error('Function not implemented.');
  },
  parseMediaFile: function (filePath, options) {
    throw new Error('Function not implemented.');
  },
  path: upath,
  pathToFileURL,
  readdir: readDirectory,
  registerShortcut: function (name, shortcut) {
    throw new Error('Function not implemented.');
  },
  removeListeners: function (channel) {
    throw new Error('Function not implemented.');
  },
  robot,
  setAutoStartAtLogin: function (value) {
    throw new Error('Function not implemented.');
  },
  setElectronUrlVariables: function (variables) {
    throw new Error('Function not implemented.');
  },
  setScreenPreferences: function (screenPreferences) {
    throw new Error('Function not implemented.');
  },
  startWebsiteStream: function () {
    throw new Error('Function not implemented.');
  },
  toggleMediaWindow: function (show) {
    throw new Error('Function not implemented.');
  },
  unregisterAllShortcuts: function () {
    throw new Error('Function not implemented.');
  },
  unregisterShortcut: function (shortcut) {
    throw new Error('Function not implemented.');
  },
  unwatchFolders: function () {
    throw new Error('Function not implemented.');
  },
  watchFolder: function (path) {
    throw new Error('Function not implemented.');
  },
  zoomWebsiteWindow: function (direction) {
    throw new Error('Function not implemented.');
  },
};
