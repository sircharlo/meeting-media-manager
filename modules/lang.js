// Internal modules
const { log } = require("./log");
const { get, set, setPref } = require("./store");
const { request, getMediaLinks } = require("./requests");

// External modules
const $ = require("jquery");
const dayjs = require("dayjs");
const path = require("upath");
const fs = require("fs-extra");
const i18n = require("i18n");
i18n.configure({
  directory: path.join(__dirname, "../locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true
});

const now = dayjs().hour(0).minute(0).second(0).millisecond(0);

function translate(phrase) {
  return i18n.__(phrase);
}

async function getJwOrgLanguages(forceRefresh) {
  if ((!fs.existsSync(get("paths").langs)) || (!get("prefs").langUpdatedLast) || dayjs(get("prefs").langUpdatedLast).isBefore(now.subtract(3, "months")) || forceRefresh) {
    let cleanedJwLangs = (await request("https://www.jw.org/en/languages/")).data.languages.filter(lang => lang.hasWebContent).map(lang => ({
      name: lang.name,
      langcode: lang.langcode,
      symbol: lang.symbol,
      vernacularName: lang.vernacularName,
      isSignLanguage: lang.isSignLanguage
    }));
    fs.writeFileSync(get("paths").langs, JSON.stringify(cleanedJwLangs, null, 2));
    setPref("langUpdatedLast", dayjs());
    set("jsonLangs", cleanedJwLangs);
  } else {
    set("jsonLangs", JSON.parse(fs.readFileSync(get("paths").langs)));
  }
  $("#lang").empty();
  const jsonLangs = get("jsonLangs");
  for (let lang of jsonLangs) {
    $("#lang").append($("<option>", {
      value: lang.langcode,
      text: lang.vernacularName + " (" + lang.name + ")"
    }));
  }
  $("#lang").val(get("prefs").lang).select2();
  set("songPub", "sjj" + (!jsonLangs.find(lang => lang.langcode == get("prefs").lang) || (jsonLangs.find(lang => lang.langcode == get("prefs").lang) && !jsonLangs.find(lang => lang.langcode == get("prefs").lang).isSignLanguage) ? "m" : ""));
}

function getLocaleLanguages() {
  const jsonLangs = get("jsonLangs");
  try {
    $("#localAppLang").empty();
    fs.readdirSync(path.join(__dirname, "../locales")).map(file => {
      let basename = path.basename(file, path.extname(file));
      let localeLangMatch = jsonLangs.find(item => item.symbol === basename);
      return {
        friendlyName: (localeLangMatch ? localeLangMatch.vernacularName + " (" + localeLangMatch.name + ")" : basename),
        actualName: (localeLangMatch ? localeLangMatch.name : basename),
        localeCode: basename
      };
    }).sort((a, b) => a.actualName.localeCompare(b.actualName)).map(lang => {
      $("#localAppLang").append($("<option>", {
        value: lang.localeCode,
        text: lang.friendlyName
      }));
    });
    $("#localAppLang").val(get("prefs").localAppLang);
  } catch (err) {
    log.error(err);
  }
}

function setAppLang(getMediaWindowDestination, unconfirm, dateFormatter) {
  try {
    i18n.setLocale(get("prefs").localAppLang ? get("prefs").localAppLang : "en");
    $("[data-i18n-string]").each(function () {
      $(this).html(i18n.__($(this).data("i18n-string")));
    });
    $(".row.disabled").each(function () {
      $(this).tooltip("dispose").tooltip({
        title: i18n.__("settingLocked")
      });
    });
    $("[data-bs-toggle='popover'][data-bs-trigger='focus']").popover("dispose").popover({
      content: i18n.__("clickAgain")
    }).on("hidden.bs.popover", function () {
      unconfirm(this);
    });
    getMediaWindowDestination();
  } catch (err) {
    log.error(err);
  }
  dateFormatter();
}

async function setMediaLang() {
  const prefs = get("prefs");
  if (prefs.lang) {
    set("jwpubDbs", {});
    set("meetingMedia", {});
    try {
      $("#songPicker").empty();
      for (let sjj of (await getMediaLinks({ pubSymbol: get("songPub"), format: "MP4" }))) {
        if (sjj.track && sjj.track > 0) $("#songPicker").append($("<option>", {
          value: sjj.track,
          text: sjj.title,
          "data-thumbnail": sjj.trackImage
        }));
      }
    } catch (err) {
      $("label[for=typeSong]").removeClass("active").addClass("disabled");
      $("label[for=typeFile]").trigger("click").addClass("active");
    }
    $("#lang").val(prefs.lang).select2("destroy").select2();
    let currentJwLang = get("jsonLangs").filter(item => item.langcode == prefs.lang);
    $(".jwLang small").text(currentJwLang.length == 1 && currentJwLang[0].vernacularName ? "(" + currentJwLang[0].vernacularName + ")" : "");
  }
}

module.exports = {
  translate,
  setAppLang,
  setMediaLang,
  getJwOrgLanguages,
  getLocaleLanguages
};