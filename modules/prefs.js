const fs = require("fs-extra")
const path = require("upath")
const remote = require("@electron/remote")
const datetime = require("flatpickr")

const { notifyUser } = require("./log")

let prefs = {}
const datepickers = datetime(".timePicker", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  time_24hr: true,
  minuteIncrement: 15,
  minTime: "06:00",
  maxTime: "22:00",
  onClose: function() {
    var initiatorEl = $($(this)[0].element);
    $("#" + initiatorEl.data("target")).val(initiatorEl.val()).change();
  }
});

function getPrefs(path) {
  if (fs.existsSync(path)) {
    try {
      prefs = JSON.parse(fs.readFileSync(path));
    } catch (err) {
      notifyUser("error", "errorInvalidPrefs", null, true, err, true, false, prefs);
    }
    prefsInitialize();
  }
  return prefs
}

function setPrefs(p) {
  prefs = p
  return prefs
}

function prefsInitialize() {
  $("#overlaySettings input:checkbox, #overlaySettings input:radio").prop( "checked", false );
  prefs.disableHardwareAcceleration = !!fs.existsSync(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"));
  for (var pref of ["localAppLang", "lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "localOutputPath", "enableMp4Conversion", "keepOriginalsAfterConversion", "congServer", "congServerPort", "congServerUser", "congServerPass", "autoOpenFolderWhenDone", "maxRes", "enableMusicButton", "enableMusicFadeOut", "musicFadeOutTime", "musicFadeOutType", "musicVolume", "mwStartTime", "weStartTime", "excludeTh", "excludeLffi", "excludeLffiImages", "enableVlcPlaylistCreation", "enableMediaDisplayButton", "congregationName", "disableHardwareAcceleration", "enableObs", "obsPort", "obsPassword", "obsMediaScene", "obsCameraScene", "preferredOutput", "hideMediaLogo"]) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) prefs[pref] = null;
  }
  for (let field of ["localAppLang", "lang", "localOutputPath", "congregationName", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir", "musicFadeOutTime", "musicVolume", "mwStartTime", "weStartTime", "obsPort", "obsPassword", "obsMediaScene", "obsCameraScene", "preferredOutput"]) {
    $("#" + field).val(prefs[field]).closest(".row").find("#" + field + "Display").html(prefs[field]);
  }
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    $(".timePicker").filter("[data-target='" + timeField + "']").val($("#" + timeField).val());
  }
  for (let dtPicker of datepickers) {
    dtPicker.setDate($(dtPicker.element).val());
  }
  for (let checkbox of ["autoStartSync", "autoRunAtBoot", "enableMp4Conversion", "keepOriginalsAfterConversion", "autoQuitWhenDone", "autoOpenFolderWhenDone", "enableMusicButton", "enableMusicFadeOut", "excludeTh", "excludeLffi", "excludeLffiImages", "enableVlcPlaylistCreation", "enableMediaDisplayButton", "disableHardwareAcceleration", "enableObs", "hideMediaLogo"]) {
    $("#" + checkbox).prop("checked", prefs[checkbox]);
  }
  for (let radioSel of ["mwDay", "weDay", "maxRes", "musicFadeOutType"]) {
    $("#" + radioSel + " input[value='" + prefs[radioSel] + "']").prop("checked", true);
  }

  return prefs
}

module.exports = {
  getPrefs,
  setPrefs,
  prefsInitialize
}