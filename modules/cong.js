// Global constants
const fadeDelay = require("./../constants").FADE_DELAY;

// Internal modules
const { log, notifyUser } = require("./log");
const { overlay, unconfirm, delay, showModal, refreshBackgroundImagePreview, getMediaWindowDestination, setMediaWindowPosition } = require("./ui");
const { get, set, setPref, setPath } = require("./store");
const { translate, setAppLang, getJwOrgLanguages, getLocaleLanguages, setMediaLang } = require("./lang");
const { prefsInitialize, initPrefs, enforcePrefs, enablePreviouslyForcedPrefs, setVars, validateConfig, congregationSelectPopulate, congregationPrefsPopulate } = require("./prefs");
const { obsGetScenes } = require("./obs");
const { request, isReachable } = require("./requests");
const { dateFormatter } = require("./date");
const { shortcutSet, shortcutsUnset } = require("./obs");
const { webdavLs, webdavExists, webdavStatus } = require("./webdav");

// External modules
const $ = require("jquery"); 
const fs = require("fs-extra");
const path = require("upath");
const glob = require("fast-glob");
const os = require("os");
const dayjs = require("dayjs");
const remote = require("@electron/remote");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

let cancelSync = false;
const currentAppVersion = "v" + remote.app.getVersion();
const now = dayjs().hour(0).minute(0).second(0).millisecond(0);

function showMediaWindow() {
  shortcutSet("Alt+D", "mediaWindow", function () {
    if ($("#staticBackdrop:visible").length == 0) $("#btnMediaWindow:visible").trigger("click");
  });
  shortcutSet("Alt+Z", "mediaWindow", function () {
    $("#btnToggleMediaWindowFocus").trigger("click");
  });
  require("electron").ipcRenderer.send("showMediaWindow", getMediaWindowDestination());
}

function closeMediaWindow() {
  shortcutsUnset("mediaWindow");
  require("electron").ipcRenderer.send("closeMediaWindow");
}

async function webdavSetup() {
  const prefs = get("prefs");
  let congServerEntered = !!(prefs.congServer && prefs.congServer.length > 0);
  let congServerHeartbeat = false;
  let webdavLoginSuccessful = false;
  let webdavDirIsValid = false;
  $("#webdavFolderList").empty();
  try {
    if (congServerEntered && prefs.congServerPort) {
      congServerHeartbeat = await isReachable(prefs.congServer, prefs.congServerPort);
      if (congServerHeartbeat) {
        if (prefs.congServerUser && prefs.congServerPass) {
          if (prefs.congServerDir == null || prefs.congServerDir.length === 0) {
            $("#congServerDir").val("/").trigger("change");
          } else {
            let webdavStatusCode = await webdavStatus(prefs.congServerDir);
            if (webdavStatusCode < 500) {
              if (webdavStatusCode === 200) {
                webdavLoginSuccessful = true;
                webdavDirIsValid = true;
              }
              if (!([401, 403, 405, 429].includes(webdavStatusCode))) webdavLoginSuccessful = true;
              if (webdavStatusCode !== 404) webdavDirIsValid = true;
              if (congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid) {
                if (prefs.congServerDir !== "/") $("#webdavFolderList").append("<li><i class='fas fa-fw fa-chevron-circle-up'></i> ../ </li>");
                for (var item of (await webdavLs(prefs.congServerDir, true))) {
                  if (item.type == "directory") $("#webdavFolderList").append("<li><i class='fas fa-fw fa-folder-open'></i>" + item.basename + "</li>");
                }
                $("#webdavFolderList").css("column-count", Math.ceil($("#webdavFolderList li").length / 8));
                $("#webdavFolderList li").on("click", function() {
                  $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).trigger("change");
                });
                enforcePrefs(get("paths"), setMediaLang, validateConfig, webdavExists, request);
                let items = await webdavLs(prefs.congServerDir, true);
                if (items) {
                  let remoteMediaWindowBackgrounds = items.filter(item => item.basename.includes("media-window-background-image"));
                  if (remoteMediaWindowBackgrounds.length >0) {
                    let localFile = path.join(get("paths").app, remoteMediaWindowBackgrounds[0].basename);
                    if (!fs.existsSync(localFile) || !(remoteMediaWindowBackgrounds[0].size == fs.statSync(localFile).size)) {
                      fs.writeFileSync(localFile, Buffer.from(new Uint8Array((await request("https://" + prefs.congServer + ":" + prefs.congServerPort + remoteMediaWindowBackgrounds[0].filename, {
                        webdav: true,
                        isFile: true
                      })).data)));
                      refreshBackgroundImagePreview();
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    notifyUser("error", "errorWebdavLs", null, true, err);
  }
  $("#webdavStatus").toggleClass("text-success text-warning text-muted", webdavDirIsValid).toggleClass("text-danger", congServerEntered && !webdavDirIsValid);
  $(".webdavHost").toggleClass("is-valid", congServerHeartbeat).toggleClass("is-invalid", congServerEntered && !congServerHeartbeat);
  $(".webdavCreds").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && !webdavLoginSuccessful));
  $("#congServerDir").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && !webdavDirIsValid));
  $("#webdavFolderList").closest(".row").fadeToAndToggle(fadeDelay, congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
  $("#specificCong").toggleClass("d-flex", congServerEntered).toggleClass("btn-danger", congServerEntered && !(congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid));
  $("#btn-settings, #headingCongSync button").toggleClass("pulse-danger", congServerEntered && !webdavDirIsValid);
  let webdavIsAGo = get("webdavIsAGo");
  webdavIsAGo = (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
  $("#btnForcedPrefs").prop("disabled", !webdavIsAGo);
  if (!webdavIsAGo) enablePreviouslyForcedPrefs();
  set("webdavIsAGo", webdavIsAGo);
}

function toggleHardwareAcceleration() {
  if (get("prefs").disableHardwareAcceleration) {
    fs.writeFileSync(get("paths").join(remote.app.getPath("userData"), "disableHardwareAcceleration"), "true");
  } else {
    rm(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"));
  }
}
async function toggleMediaWindow(action) {
  if (!action) action = get("prefs").enableMediaDisplayButton ? "open" : "close";
  if (action == "open") {
    await refreshBackgroundImagePreview();
    await showMediaWindow();
  } else {
    closeMediaWindow();
    if (action == "reopen") toggleMediaWindow();
  }
}

function rm(toDelete) {
  if (!Array.isArray(toDelete)) toDelete = [toDelete];
  for (var fileOrDir of toDelete) {
    fs.removeSync(fileOrDir);
  }
}

function periodicCleanup() {
  try {
    setVars();
    if (get("paths").pubs) {
      let lastPeriodicCleanupPath = path.join(get("paths").pubs, "lastPeriodicCleanup"),
        lastPeriodicCleanup = fs.existsSync(lastPeriodicCleanupPath) && fs.readFileSync(lastPeriodicCleanupPath, "utf8") || false;
      if (!dayjs(lastPeriodicCleanup).isValid() || dayjs(lastPeriodicCleanup).isBefore(now.subtract(6, "months"))) {
        rm(glob.sync(path.join(get("paths").pubs, "**", "*.mp*")).map(video => {
          let itemDate = dayjs(path.basename(path.join(path.dirname(video), "../")), "YYYYMMDD");
          let itemPub = path.basename(path.join(path.dirname(video), "../../"));
          if (!itemPub.includes("sjj") && (!itemDate.isValid() || (itemDate.isValid() && itemDate.isBefore(now.subtract(3, "months"))))) return video;
        }).filter(Boolean));
        fs.ensureDirSync(get("paths").pubs);
        fs.writeFileSync(lastPeriodicCleanupPath, dayjs().format());
      }
    }
  } catch(err) {
    log.error(err);
  }
}

async function getInitialData() {
  const prefs = get("prefs");
  set("meetingMedia", {});
  set("jwpubDbs", {});
  await getJwOrgLanguages();
  await getLocaleLanguages();
  await setAppLang(getMediaWindowDestination, unconfirm, dateFormatter);
  await periodicCleanup();
  await setMediaLang();
  await webdavSetup();
  let configIsValid = validateConfig();
  await obsGetScenes(false, validateConfig);
  await toggleMediaWindow();
  $("#version").html("M³ " + (remote.app.isPackaged ? escape(currentAppVersion) : "Development Version"));
  $(".notLinux").closest(".row").add(".notLinux").toggle(os.platform() !== "linux");
  $(".onlyWindows").closest(".row").add(".onlyWindows").toggle(os.platform() == "win32");
  congregationSelectPopulate();
  $("#baseDate .dropdown-menu").empty();
  for (var a = 0; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class='dropdown-item' value='" + get("baseDate").clone().add(a, "week").format(get("prefs").outputFolderDateFormat) + "'>" + get("baseDate").clone().add(a, "week").format(prefs.outputFolderDateFormat.replace(" - dddd", "")) + " - " + get("baseDate").clone().add(a, "week").add(6, "days").format(prefs.outputFolderDateFormat.replace(" - dddd", "")) + "</button>");
  }
  $("#baseDate button.dropdown-toggle").text($("#baseDate .dropdown-item:eq(0)").text());
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  if (prefs.autoStartSync && configIsValid) {
    await overlay(true, "flag-checkered fa-beat", "pause", "cancel-sync");
    await delay(5);
    if (!cancelSync) $("#mediaSync").trigger("click");
  }
  overlay(false, (prefs.autoStartSync && configIsValid ? "flag-checkered" : null));
}

function goAhead() {
  initPrefs(get("paths").prefs);
  getInitialData();
  dateFormatter();
  $("#overlaySettings input:not(.timePicker), #overlaySettings select").on("change", function() {
    if ($(this).prop("tagName") == "INPUT") {
      if ($(this).prop("type") == "checkbox") {
        setPref($(this).prop("id"), $(this).prop("checked"));
      } else if ($(this).prop("type") == "radio") {
        setPref($(this).closest("div").prop("id"), escape($(this).closest("div").find("input:checked").val()));
      } else if ($(this).prop("type") == "text" || $(this).prop("type") == "password"  || $(this).prop("type") == "hidden" || $(this).prop("type") == "range") {
        setPref($(this).prop("id"), escape($(this).val()));
      }
    } else if ($(this).prop("tagName") == "SELECT") {
      setPref($(this).prop("id"), escape($(this).find("option:selected").val()));
    }
    if ($(this).prop("id") == "disableHardwareAcceleration") toggleHardwareAcceleration();
    if ($(this).prop("id") == "congServer" && $(this).val() == "") $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #webdavFolderList").val("").empty().trigger("change");
    if ($(this).prop("id").includes("congServer")) webdavSetup();
    if ($(this).prop("id") == "localAppLang") setAppLang(getMediaWindowDestination, unconfirm, dateFormatter, get("prefs").localAppLang);
    if ($(this).prop("id") == "lang" || $(this).prop("id").includes("maxRes")) {
      setVars();
      setMediaLang().finally(() => {
        refreshBackgroundImagePreview();
      });
    }
    if ($(this).prop("id") == "enableMediaDisplayButton") toggleMediaWindow();
    if ($(this).prop("id") == "hideMediaLogo") toggleMediaWindow("reopen");
    if ($(this).prop("id") == "preferredOutput") setMediaWindowPosition();
    if ($(this).prop("id") == "enableObs" || $(this).prop("id") == "obsPort" || $(this).prop("id") == "obsPassword") obsGetScenes(false, validateConfig);
    if ($(this).prop("name").includes("Day") || $(this).prop("name").includes("exclude") || $(this).prop("id") == "maxRes" || $(this).prop("id").includes("congServer") || $(this).prop("id") == "outputFolderDateFormat") set("meetingMedia", {});
    if ($(this).prop("id").includes("congServer") || $(this).prop("name").includes("Day") || $(this).prop("id") == "outputFolderDateFormat") {
      setVars();
      if (get("paths").media) rm(glob.sync(path.join(get("paths").media, "*"), {
        ignore: [path.join(get("paths").media, "Recurring")],
        onlyDirectories: true
      }));
      dateFormatter();
    }
    validateConfig(true, $(this).prop("id") == "disableHardwareAcceleration");
  });
}

function congregationChange(prefsFile) {
  overlay(true, "cog fa-spin").then(() => {
    setPath("prefs", prefsFile);
    set("prefs", {});
    prefsInitialize();
    goAhead();
  });
}

function congregationInitialSelector() {
  $(function() {
    $("[data-bs-toggle='popover'][data-bs-trigger='focus']").popover({
      content: translate("clickAgain")
    }).on("hidden.bs.popover", function() {
      unconfirm(this);
    });
    congregationPrefsPopulate();
    if (get("paths").congPrefs.length > 1) {
      let congregationList = $("<div id='congregationList' class='list-group'>");
      for (var congregation of get("paths").congPrefs) {
        $(congregationList).prepend("<button class='d-flex list-group-item list-group-item-action' value='" + congregation.path + "'>" + congregation.name + "</div></button>");
      }
      $(congregationList).on("click", "button", function() {
        showModal(false);
        congregationChange($(this).val());
      });
      showModal(true, true, "<i class='fas fa-2x fa-building-user'></i>", congregationList);
    } else if (get("paths").congPrefs.length == 1) {
      setPath("prefs", get("paths").congPrefs[0].path);
      goAhead();
    } else {
      congregationCreate();
    }
  });
}

function congregationCreate() {
  congregationChange(path.join(get("paths").app, "prefs-" + Math.floor(Math.random() * Date.now()) + ".json"));
}

function congregationDelete(prefsFile) {
  let congToDelete = $("#congregationSelect .dropdown-item").filter(function() {
    return this.value == prefsFile;
  });
  rm(prefsFile);
  congregationPrefsPopulate();
  congregationSelectPopulate();
  if (congToDelete.hasClass("active")) {
    $("#congregationSelect .dropdown-item.congregation:eq(0)").trigger("click");
  }
}

module.exports = {
  congregationInitialSelector,
  congregationChange,
  congregationDelete,
  congregationCreate
};