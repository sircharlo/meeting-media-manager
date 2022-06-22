// Internal modules
const { get, set } = require("./store");
const { log } = require("./log");

// External modules
const $ = require("jquery"); 
const dayjs = require("dayjs");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));


// Internal variables
let now = dayjs().hour(0).minute(0).second(0).millisecond(0);


function dateFormatter() {
  set("meetingMedia", {});
  let locale = get("prefs").localAppLang ? get("prefs").localAppLang.split("-")[0] : "en";
  try {
    if (locale !== "en") require("dayjs/locale/" + locale);
    dayjs.locale(locale);
  } catch(err) {
    log.warn("%c[locale] Date locale " + locale + " not found, falling back to 'en'");
  }
  $("#outputFolderDateFormat option.customDateFormat").remove();
  for (let dateFormat of ["YYYY-MM-DD", "YYYY-MM-DD - dddd", "DD-MM-YYYY", "DD-MM-YYYY - dddd"]) {
    $("#outputFolderDateFormat").append($("<option>", {
      value: dateFormat,
      class: "customDateFormat",
      text: dayjs().locale(locale).format(dateFormat),
      ...(get("prefs").outputFolderDateFormat == dateFormat && { selected: "selected" }),
    }));
  }
  if (!get("prefs").outputFolderDateFormat) $("#outputFolderDateFormat").val("YYYY-MM-DD").trigger("change");
  set("baseDate", dayjs(get("baseDate")).locale(locale));
  $("#folders .day").remove();
  for (var d = 6; d >= 0; d--) {
    if (!get("baseDate").clone().add(d, "days").isBefore(now)) $("#folders").prepend($("<button>", {
      id: "day" + d,
      class: "day alertIndicators m-1 col btn btn-sm align-items-center justify-content-center "
        + (get("baseDate").clone().add(d, "days").isSame(now) ? "pulse-info " : "")
        + ([get("prefs").mwDay, get("prefs").weDay].includes(d.toString()) ? "meeting btn-secondary " : "btn-light ")
        + (get("prefs").mwDay == d.toString() ? "mw " : "") + (get("prefs").weDay == d.toString() ? "we " : ""),
      "data-datevalue": get("baseDate").clone().add(d, "days").locale(locale).format(get("prefs").outputFolderDateFormat)
    }).append($("<div>", {
      class: "col dayLongDate"
    }).append($("<div>", {
      class: "dateOfMonth"
    }).append($("<span>", {
      class: "date",
      text: get("baseDate").clone().add(d, "days").locale(locale).format("D ")
    })).append($("<span>", {
      class: "month",
      text: get("baseDate").clone().add(d, "days").locale(locale).format("MMM")
    }))).append($("<div>", {
      class: "dayOfWeek",
      text: get("baseDate").clone().add(d, "days").locale(locale).format("ddd")
    })).append($("<div>", {
      class: "dayOfWeekLong",
      text: get("baseDate").clone().add(d, "days").locale(locale).format("dddd")
    }))).append($("<div>", {
      class: "position-absolute bottom-0 start-0 progress-bar progress-bar-striped progress-bar-animated"
    })));
    $("#mwDay label:eq(" + d + ")").text(get("baseDate").clone().add(d, "days").locale(locale).format("dd"));
    $("#weDay label:eq(" + d + ")").text(get("baseDate").clone().add(d, "days").locale(locale).format("dd"));
  }
  $(".alertIndicators.btn-success").addClass("btn-secondary").removeClass("btn-success");
}

module.exports = {
  dateFormatter
};