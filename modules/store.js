const path = require("upath");
const remote = require("@electron/remote");

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

module.exports = {
  get,
  set,
  setPref
};