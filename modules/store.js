const path = require("upath");
const remote = require("@electron/remote");
const dayjs = require("dayjs");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

const APP_PATH = path.normalize(remote.app.getPath("userData"));

let store = {
  prefs: {},
  obs: {},
  paths: {
    app: APP_PATH,
    pubs: null,
    prefs: null,
    media: null,
    yearText: null,
    congPrefs: null,
    langs: path.join(APP_PATH, "langs.json"),
    lastRunVersion: path.join(APP_PATH, "lastRunVersion.json")
  },
  jsonLangs: [],
  dryrun: false,
  songPub: null,
  jwpubDbs: {},
  meetingMedia: undefined,
  baseDate: dayjs().startOf("isoWeek"),
  webdavIsAGo: false,
  downloadStats: {},
  perfStats: {},
};

function get(key) {
  return store[key];
}

function set(key, value) {
  store[key] = value;
  return value;
}

function setPref(key, value) {
  store.prefs[key] = value;
  return store.prefs;
}

function setPath(key, value) {
  store.paths[key] = value;
  return store.paths;
}

function setMeetingMedia(key, value) {
  store.meetingMedia[key] = value;
  return store.meetingMedia;
}

module.exports = {
  get,
  set,
  setPref,
  setPath,
  setMeetingMedia
};