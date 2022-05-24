// Internal modules
const { log } = require("./log");

// External modules
const $ = require("jquery");
const path = require("upath");
const i18n = require("i18n");
i18n.configure({
  directory: path.join(__dirname, "../locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true
});

function translate(phrase) {
  return i18n.__(phrase);
}

function setAppLang(getMediaWindowDestination, unconfirm, dateFormatter, localAppLang) {
  try {
    i18n.setLocale(localAppLang ? localAppLang : "en");
    $("[data-i18n-string]").each(function() {
      $(this).html(i18n.__($(this).data("i18n-string")));
    });
    $(".row.disabled").each(function() {
      $(this).tooltip("dispose").tooltip({
        title: i18n.__("settingLocked")
      });
    });
    $("[data-bs-toggle='popover'][data-bs-trigger='focus']").popover("dispose").popover({
      content: i18n.__("clickAgain")
    }).on("hidden.bs.popover", function() {
      unconfirm(this);
    });
    getMediaWindowDestination();
  } catch(err) {
    log.error(err);
  }
  dateFormatter();
}

module.exports = {
  translate,
  setAppLang
};