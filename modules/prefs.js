// Global constants
const { PREF_FIELDS } = require("./../constants");

// Internal modules
const { notifyUser } = require("./log");

// External modules
const fs = require("fs-extra");
const path = require("upath");
const $ = require("jquery");
const remote = require("@electron/remote");
const datetime = require("flatpickr");

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
    $("#" + initiatorEl.data("target")).val(initiatorEl.val()).trigger("change");
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
    $("#" + field).val(prefs[field]).closest(".row").find("#" + field + "Display").html(prefs[field]);
  }
  for (let timeField of PREF_FIELDS.time) {
    $(".timePicker").filter("[data-target='" + timeField + "']").val($("#" + timeField).val());
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

module.exports = {
  initPrefs,
  getPrefs,
  setPref,
  setPrefs,
  prefsInitialize
};