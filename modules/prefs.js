// Global constants
const { PREF_FIELDS } = require("./../constants");

// Internal modules
const { log, notifyUser } = require("./log");
const { translate } = require("./lang");
const { get, set, setPath, setPref } = require("./store");
const { perf } = require("./requests");
const { toggleScreen } = require("./ui");
const { shortcutSet, shortcutsUnset } = require("./obs");
// External modules
const fs = require("fs-extra");
const v8 = require("v8");
const os = require("os");
const path = require("upath");
const $ = require("jquery");
const remote = require("@electron/remote");
const datetime = require("flatpickr");

// Variables
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
    $("#" + initiatorEl.data("target")).val(initiatorEl.val()).trigger("change");
  }
});

function initPrefs(path) {
  if (fs.existsSync(path)) {
    try {
      set("prefs", JSON.parse(fs.readFileSync(path)));
    } catch (err) {
      notifyUser("error", "errorInvalidPrefs", null, true, err, true, false, get("prefs"));
    }
    prefsInitialize();
  }
}

function prefsInitialize() {
  let prefs = get("prefs");
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

  set("prefs", prefs);
}

async function getForcedPrefs(webdavExists, request, paths) {
  let forcedPrefs = {};
  if (await webdavExists(paths.forcedPrefs)) {
    try {
      forcedPrefs = (await request("https://" + get("prefs").congServer + ":" + get("prefs").congServerPort + paths.forcedPrefs, {
        webdav: true,
        noCache: true
      })).data;
    } catch(err) {
      notifyUser("error", "errorForcedSettingsEnforce", null, true, err, false, false, get("prefs"));
    }
  }
  return forcedPrefs;
}

function enablePreviouslyForcedPrefs() {
  $("div.row.text-muted.disabled").removeClass("text-muted disabled").tooltip("dispose").find(".forcedPref").prop("disabled", false).removeClass("forcedPref");
  $("div.row .settingLocked").remove();
}
async function enforcePrefs(paths, setMediaLang, validateConfig, webdavExists, request) {
  let prefs = get("prefs");
  paths.forcedPrefs = path.posix.join(prefs.congServerDir, "forcedPrefs.json");
  let forcedPrefs = await getForcedPrefs(webdavExists, request, paths);
  if (Object.keys(forcedPrefs).length > 0) {
    let previousPrefs = v8.deserialize(v8.serialize(prefs));
    Object.assign(prefs, forcedPrefs);
    if (JSON.stringify(previousPrefs) !== JSON.stringify(prefs)) {
      setMediaLang();
      validateConfig(true);
    }
    for (var pref of Object.entries(forcedPrefs)) {
      disableGlobalPref(pref);
    }
  } else {
    enablePreviouslyForcedPrefs(true);
  }
  set("prefs", prefs);
}

function disableGlobalPref([pref, value]) {
  let row = $("#" + pref).closest("div.row");
  if (row.find(".settingLocked").length === 0) row.find("label").first().prepend($("<span class='badge bg-warning me-1 rounded-pill settingLocked text-black'><i class='fa-lock fas'></i></span>"));
  row.addClass("text-muted disabled").tooltip({
    title: translate("settingLocked")
  }).find("#" + pref + ", #" + pref + " input, input[data-target=" + pref + "]").addClass("forcedPref").prop("disabled", true);
  log.info("%c[enforcedPrefs] [" + pref + "] " + value, "background-color: #FCE4EC; color: #AD1457;");
}

function congregationPrefsPopulate() {
  setPath("congPrefs", glob.sync(path.join(get("paths").app, "prefs*.json")).map(congregationPrefs => {
    let congPrefInfo = {}, congName = "Default";
    try {
      congName = JSON.parse(fs.readFileSync(congregationPrefs, "utf8")).congregationName;
    } catch (err) {
      log.error(err);
    } finally {
      congPrefInfo = ({
        name: congName,
        path: congregationPrefs
      });
    }
    return congPrefInfo;
  }).filter(congPrefInfo => congPrefInfo.name).sort((a, b) => b.name.localeCompare(a.name)));
}

function congregationSelectPopulate() {
  $("#congregationSelect .dropdown-menu .congregation").remove();
  for (var congregation of get("paths").congPrefs) {
    $("#congregationSelect .dropdown-menu").prepend(`<button
      class='dropdown-item congregation ${path.resolve(get("paths").prefs) == path.resolve(congregation.path) ? "active" : ""}'
      value='${congregation.path}'
    >
      ${get("paths").congPrefs.length > 1 ? "<i role='button' tabindex='0' class='fas fa-square-minus text-warning'></i> " : ""}
      ${congregation.name}
    </button>
    `);
    if (path.resolve(get("paths").prefs) == path.resolve(congregation.path)) $("#congregationSelect button.dropdown-toggle").text(congregation.name);
  }
  $("#congregationSelect .dropdown-menu .dropdown-item .fa-square-minus").popover({
    content: translate("clickAgain"),
    container: "body",
    trigger: "focus"
  }).on("hidden.bs.popover", function() {
    unconfirm(this);
  });
}

function setVars() {
  const prefs = get("prefs");
  if (prefs.localOutputPath && prefs.lang) {
    perf("setVars", "start");
    try {
      set("downloadStats", {});
      setPath("media", path.join(prefs.localOutputPath, prefs.lang));
      if (!get("dryrun")) fs.ensureDirSync(get("paths").media);
      setPath("pubs", path.join(get("paths").app, "Publications", prefs.lang));
      setPath("yearText", path.join(get("paths").pubs, "yeartext-" + prefs.lang + "-" + (new Date().getFullYear()).toString()));
    } catch (err) {
      notifyUser("error", "errorSetVars", get("paths").media, true, err);
    }
    perf("setVars", "stop");
  }
}

function validateConfig(changed, restart) {
  let prefs = get("prefs");
  let configIsValid = true;
  $(".alertIndicators").removeClass("meeting");
  if (prefs.localOutputPath === "false" || !fs.existsSync(prefs.localOutputPath)) {
    prefs = setPref("localOutputPath", null);
  } else if (prefs.localOutputPath) {
    let badCharacters = prefs.localOutputPath.match(/(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g);
    if (badCharacters) {
      notifyUser("error", "errorBadOutputPath", badCharacters.join(" "), true);
      prefs = setPref("localOutputPath", null);
    }
  }
  let mandatoryFields = ["localOutputPath", "localAppLang", "lang", "mwDay", "weDay", "maxRes", "congregationName"];
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    if (prefs.enableMusicButton && prefs.enableMusicFadeOut && prefs.musicFadeOutType === "smart") mandatoryFields.push(timeField);
    else $("#" + timeField + ", .timePicker[data-target='" + timeField + "']").removeClass("is-invalid");
  }
  if (prefs.enableObs) {
    mandatoryFields.push("obsPort", "obsPassword");
    if (get("obs")._connected) mandatoryFields.push("obsMediaScene", "obsCameraScene");
  }
  for (var setting of mandatoryFields) {
    if (setting.includes("Day")) $("#day" + prefs[setting]).addClass("meeting");
    $("#" + setting + ", .timePicker[data-target='" + setting + "']").toggleClass("is-invalid", !prefs[setting]);
    $("#" + setting).next(".select2").toggleClass("is-invalid", !prefs[setting]);
    $("#" + setting + " label.btn").toggleClass("btn-outline-dark", !!prefs[setting]).toggleClass("btn-outline-danger", !prefs[setting]);
    $("#" + setting).closest("div.row").find("label").toggleClass("text-danger", !prefs[setting]);
    if (!prefs[setting]) configIsValid = false;
  }
  $("#enableMusicFadeOut, #musicVolume").closest(".row").toggle(!!prefs.enableMusicButton);
  $(".relatedToFadeOut").toggle(!!prefs.enableMusicButton && !!prefs.enableMusicFadeOut);
  $(".relatedToObs").toggle(!!prefs.enableObs);
  if (os.platform() !== "linux") remote.app.setLoginItemSettings({ openAtLogin: prefs.autoRunAtBoot });
  $("#enableMusicFadeOut").closest(".row").find("label").first().toggleClass("col-11", prefs.enableMusicButton && !prefs.enableMusicFadeOut);
  if (prefs.enableMusicButton) {
    shortcutSet("Alt+K", "musicButton", function () {
      $("#btnMeetingMusic:visible, #btnStopMeetingMusic:visible").trigger("click");
    });
    if (prefs.enableMusicFadeOut) {
      if (!prefs.musicFadeOutTime) $("#musicFadeOutTime").val(5).trigger("change");
      if (!prefs.musicFadeOutType) $("label[for=musicFadeOutSmart]").trigger("click");
    }
    $("#musicFadeOutType label span").text(prefs.musicFadeOutTime);
    if (prefs.musicVolume) {
      $("#meetingMusic").animate({volume: prefs.musicVolume / 100});
      $("#musicVolumeDisplay").html(prefs.musicVolume);
    } else {
      $("#musicVolume").val(100).trigger("change");
    }
  } else {
    shortcutsUnset("musicButton");
  }
  $("#btnMediaWindow, #btnToggleMediaWindowFocus").toggle(!!prefs.enableMediaDisplayButton);
  $("#currentMediaBackground, #hideMediaLogo").closest(".row").toggle(!!prefs.enableMediaDisplayButton);
  $("#mp4Convert").toggleClass("d-flex", !!prefs.enableMp4Conversion);
  $("#keepOriginalsAfterConversion").closest(".row").toggle(!!prefs.enableMp4Conversion);
  $("#btnMeetingMusic").toggle(!!prefs.enableMusicButton && $("#btnStopMeetingMusic:visible").length === 0);
  $(".btn-home").toggleClass("btn-dark", configIsValid).toggleClass("btn-danger", !configIsValid);
  $("#mediaSync:not(.noJwOrg), .btn-home").prop("disabled", !configIsValid);
  if (!configIsValid) {
    toggleScreen("overlaySettings", true);
  } else if (changed) {
    fs.writeFileSync(get("paths").prefs, JSON.stringify(Object.keys(prefs).sort().reduce((acc, key) => ({...acc, [key]: prefs[key]}), {}), null, 2));
    congregationPrefsPopulate();
    congregationSelectPopulate();
  }
  if (restart) {
    remote.app.relaunch();
    remote.app.exit();
  }
  return configIsValid;
}

module.exports = {
  initPrefs,
  prefsInitialize,
  enforcePrefs,
  getForcedPrefs,
  enablePreviouslyForcedPrefs,
  congregationPrefsPopulate,
  congregationSelectPopulate,
  setVars,
  validateConfig
};