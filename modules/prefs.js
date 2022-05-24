// Global constants
const { PREF_FIELDS } = require("./../constants");

// Internal modules
const { log, notifyUser } = require("./log");

// External modules
const fs = require("fs-extra");
const v8 = require("v8");
const path = require("upath");
const $ = require("jquery");
const remote = require("@electron/remote");
const datetime = require("flatpickr");
const i18n = require("i18n");
i18n.configure({
  directory: path.join(__dirname, "../locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true,
});

// Variables
let prefs = {};
const datepickers = datetime(".timePicker", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  time_24hr: true,
  minuteIncrement: 15,
  minTime: "06:00",
  maxTime: "22:00",
  onClose: function() {
    let initiatorEl = $($(this)[0].element);
    $("#" + initiatorEl.data("target")).val(initiatorEl.val()).change();
  }
});

function initPrefs(path) {
  if (fs.existsSync(path)) {
    try {
      prefs = JSON.parse(fs.readFileSync(path));
    } catch (err) {
      notifyUser("error", "errorInvalidPrefs", null, true, err, true, false, prefs);
    }
    prefsInitialize();
  }
  return prefs;
}

function getPrefs() {
  return prefs;
}

function setPref(name, val) {
  prefs[name] = val;
  return prefs;
}

function setPrefs(p) {
  prefs = p;
  return prefs;
}

function prefsInitialize() {
  $("#overlaySettings input:checkbox, #overlaySettings input:radio").prop( "checked", false );
  prefs.disableHardwareAcceleration = !!fs.existsSync(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"));
  for (let pref of PREF_FIELDS.all) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) prefs[pref] = null;
  }
  for (let field of PREF_FIELDS.text) {
    $("#" + field)
      .val(prefs[field])
      .closest(".row")
      .find("#" + field + "Display")
      .html(prefs[field]);
  }
  for (let timeField of PREF_FIELDS.time) {
    $(".timePicker")
      .filter("[data-target='" + timeField + "']")
      .val($("#" + timeField).val());
  }
  for (let dtPicker of datepickers) {
    dtPicker.setDate($(dtPicker.element).val());
  }
  for (let checkbox of PREF_FIELDS.checkbox) {
    $("#" + checkbox).prop("checked", prefs[checkbox]);
  }
  for (let radioSel of PREF_FIELDS.radio) {
    $("#" + radioSel + " input[value='" + prefs[radioSel] + "']").prop("checked", true);
  }

  return prefs;
}

async function getForcedPrefs(webdavExists, request, paths) {
  let forcedPrefs = {};
  if (await webdavExists(paths.forcedPrefs)) {
    try {
      forcedPrefs = (await request("https://" + prefs.congServer + ":" + prefs.congServerPort + paths.forcedPrefs, {
        webdav: true,
        noCache: true
      })).data;
    } catch(err) {
      notifyUser("error", "errorForcedSettingsEnforce", null, true, err, false, false, prefs);
    }
  }
  return forcedPrefs;
}

function enablePreviouslyForcedPrefs() {
  $("div.row.text-muted.disabled").removeClass("text-muted disabled").tooltip("dispose").find(".forcedPref").prop("disabled", false).removeClass("forcedPref");
  $("div.row .settingLocked").remove();
}
async function enforcePrefs(paths, setMediaLang, validateConfig, webdavExists, request) {
  paths.forcedPrefs = path.posix.join(prefs.congServerDir, "forcedPrefs.json");
  let forcedPrefs = await getForcedPrefs(webdavExists, request, paths);
  if (Object.keys(forcedPrefs).length > 0) {
    let previousPrefs = v8.deserialize(v8.serialize(prefs));
    Object.assign(prefs, forcedPrefs);
    if (JSON.stringify(previousPrefs) !== JSON.stringify(prefs)) {
      setMediaLang();
      validateConfig(true);
      prefs = prefsInitialize();
    }
    for (var pref of Object.entries(forcedPrefs)) {
      disableGlobalPref(pref);
    }
  } else {
    enablePreviouslyForcedPrefs(true);
  }
}

function disableGlobalPref([pref, value]) {
  let row = $("#" + pref).closest("div.row");
  if (row.find(".settingLocked").length === 0) row.find("label").first().prepend($("<span class='badge bg-warning me-1 rounded-pill settingLocked text-black'><i class='fa-lock fas'></i></span>"));
  row.addClass("text-muted disabled").tooltip({
    title: i18n.__("settingLocked")
  }).find("#" + pref + ", #" + pref + " input, input[data-target=" + pref + "]").addClass("forcedPref").prop("disabled", true);
  log.info("%c[enforcedPrefs] [" + pref + "] " + value, "background-color: #FCE4EC; color: #AD1457;");
}

module.exports = {
  initPrefs,
  getPrefs,
  setPref,
  setPrefs,
  prefsInitialize,
  enforcePrefs,
  getForcedPrefs,
  enablePreviouslyForcedPrefs
};