// TODO: check why bounds are weird on display removed, ie not detecting only one screen properly??

const { request } = require("./modules/requests");
const { progressSet } = require("./modules/ui");
const { get, set, setPref } = require("./modules/store");
const { translate, setAppLang, getJwOrgLanguages, getLocaleLanguages } = require("./modules/lang");
const { initPrefs, prefsInitialize, enforcePrefs, getForcedPrefs, enablePreviouslyForcedPrefs } = require("./modules/prefs");
const { log, bugUrl, notifyUser, setLogLevel } = require("./modules/log");
const constants = require("./constants");
const { mp4Convert, convertUnusableFiles } = require("./modules/converters");
const { obsGetScenes, obsSetScene, shortcutSet, shortcutsUnset } = require("./modules/obs");
const fadeDelay = 200,
  aspect = require("aspectratio"),
  axios = require("axios"),
  bootstrap = require("bootstrap"),
  dayjs = require("dayjs"),
  escape = require("escape-html"),
  ffmpeg = require("fluent-ffmpeg"),
  fs = require("fs-extra"),
  glob = require("fast-glob"),
  hme = require("h264-mp4-encoder"),
  isAudio = require("is-audio"),
  isImage = require("is-image"),
  isVideo = require("is-video"),
  net = require("net"),
  os = require("os"),
  path = require("upath"),
  remote = require("@electron/remote"),
  {shell} = require("electron"),
  sizeOf = require("image-size"),
  sqljs = require("sql.js"),
  url = require("url"),
  v8 = require("v8"),
  {XMLParser, XMLBuilder} = require("fast-xml-parser"),
  zipper = require("adm-zip"),
  $ = require("jquery");
require("jquery-ui");
require("jquery-ui/ui/data");
require("jquery-ui/ui/effect");
require("jquery-ui/ui/effects/effect-blind");
require("jquery-ui/ui/effects/effect-clip");
// require("jquery-ui/ui/effects/effect-slide");
require("jquery-ui/ui/scroll-parent");
require("jquery-ui/ui/widgets/mouse");
require("jquery-ui/ui/widgets/sortable");
const currentAppVersion = "v" + remote.app.getVersion();

var jworgIsReachable = false,
  initialConnectivityCheck = true;

function checkInternet(online) {
  jworgIsReachable = !!online;
  $("#mediaSync").toggleClass("noJwOrg", !online).prop("disabled", !online);
  if (!online) {
    initialConnectivityCheck = false;
    setTimeout(updateOnlineStatus, 10000);
  } else {
    require("electron").ipcRenderer.send("checkForUpdates");
  }
}
const updateOnlineStatus = async () => checkInternet((await isReachable("www.jw.org", 443, !initialConnectivityCheck)));
require("electron").ipcRenderer.on("overlay", (_event, message) => overlay(true, message[0], message[1]));
require("electron").ipcRenderer.on("macUpdate", async () => {
  await overlay(true, "cloud-download-alt fa-beat", "circle-notch fa-spin text-success");
  try {
    let latestVersion = (await request(constants.REPO_URL + "releases/latest")).data;
    let macDownload = latestVersion.assets.find(a => a.name.includes("dmg"));
    notifyUser("info", "updateDownloading", latestVersion.tag_name, false, null);
    let macDownloadPath = path.join(remote.app.getPath("downloads"), macDownload.name);
    fs.writeFileSync(macDownloadPath, Buffer.from(new Uint8Array((await request(macDownload.browser_download_url, {isFile: true})).data)));
    await shell.openPath(url.fileURLToPath(url.pathToFileURL(macDownloadPath).href));
    // remote.app.exit();
  } catch(err) {
    notifyUser("error", "updateNotDownloaded", currentAppVersion, true, err, {desc: "moreInfo", url: constants.REPO_URL + "releases/latest"});
  }
  $("#bg-mac-update").fadeIn(fadeDelay);
  $("#btn-settings").addClass("pulse-danger");
  $("#version").addClass("btn-danger pulse-danger").removeClass("btn-light").find("i").remove().end().prepend("<i class='fas fa-hand-point-right'></i> ").append(" <i class='fas fa-hand-point-left'></i>").on("click", function() {
    shell.openExternal(constants.REPO_URL + "releases/latest");
  });
  await overlay(false);
});
require("electron").ipcRenderer.on("notifyUser", (_event, arg) => {
  notifyUser(arg[0], arg[1]);
});

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

var baseDate = dayjs().startOf("isoWeek"),
  cancelSync = false,
  downloadStats = {},
  dryrun = false,
  ffmpegIsSetup = false,
  jwpubDbs = {},
  meetingMedia,
  modal = new bootstrap.Modal(document.getElementById("staticBackdrop"), {
    backdrop: "static",
    keyboard: false
  }),
  now = dayjs().hour(0).minute(0).second(0).millisecond(0),
  paths = {
    app: path.normalize(remote.app.getPath("userData"))
  },
  pendingMusicFadeOut = {},
  perfStats = {},
  tempMediaArray = [],
  totals = {},
  webdavIsAGo = false,
  stayAlive;
paths.langs = path.join(paths.app, "langs.json");
paths.lastRunVersion = path.join(paths.app, "lastRunVersion.json");

overlay(true, "cog fa-spin");
$(function() {
  updateCleanup();
  updateOnlineStatus();
  congregationInitialSelector();
});
function goAhead() {
  initPrefs(paths.prefs);
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
    if ($(this).prop("name").includes("Day") || $(this).prop("name").includes("exclude") || $(this).prop("id") == "maxRes" || $(this).prop("id").includes("congServer") || $(this).prop("id") == "outputFolderDateFormat") meetingMedia = {};
    if ($(this).prop("id").includes("congServer") || $(this).prop("name").includes("Day") || $(this).prop("id") == "outputFolderDateFormat") {
      setVars();
      if (paths.media) rm(glob.sync(path.join(paths.media, "*"), {
        ignore: [path.join(paths.media, "Recurring")],
        onlyDirectories: true
      }));
      dateFormatter();
    }
    validateConfig(true, $(this).prop("id") == "disableHardwareAcceleration");
  });
}
function addMediaItemToPart(date, paragraph, media, source) {
  if (!meetingMedia[date]) meetingMedia[date] = [];
  media.uniqueId = [paragraph, source, media.checksum, media.filepath].filter(Boolean).toString();
  if (!media.uniqueId || !meetingMedia[date].map(part => part.media).flat().map(item => item.uniqueId).filter(Boolean).includes(media.uniqueId)) {
    if (meetingMedia[date].filter(part => part.title == paragraph).length === 0) {
      meetingMedia[date].push({
        title: paragraph,
        media: []
      });
    }
    media.folder = date;
    meetingMedia[date].find(part => part.title == paragraph).media.push(media);
    meetingMedia[date] = meetingMedia[date].sort((a, b) => a.title > b.title && 1 || -1);
  }
}
async function calculateCacheSize() {
  setVars();
  $("#cacheSizeInMb").prop("Counter", 0).animate({
    Counter: glob.sync([path.join(paths.media, "**"), paths.langs, path.join(paths.pubs, "**")], {
      ignore: [path.join(paths.media, "Recurring")],
      stats: true
    }).map(file => file.stats.size).reduce((a, b) => a + b, 0) / 1024 / 1024
  }, {
    duration: fadeDelay * 3,
    step: function (now) {
      $(this).text(now.toFixed(1) + "MB");
    }
  });
}
function rm(toDelete) {
  if (!Array.isArray(toDelete)) toDelete = [toDelete];
  for (var fileOrDir of toDelete) {
    fs.removeSync(fileOrDir);
  }
}
function congregationChange(prefsFile) {
  overlay(true, "cog fa-spin").then(() => {
    paths.prefs = prefsFile;
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
    if (paths.congPrefs.length > 1) {
      let congregationList = $("<div id='congregationList' class='list-group'>");
      for (var congregation of paths.congPrefs) {
        $(congregationList).prepend("<button class='d-flex list-group-item list-group-item-action' value='" + congregation.path + "'>" + congregation.name + "</div></button>");
      }
      $(congregationList).on("click", "button", function() {
        showModal(false);
        congregationChange($(this).val());
      });
      showModal(true, true, "<i class='fas fa-2x fa-building-user'></i>", congregationList);
    } else if (paths.congPrefs.length == 1) {
      paths.prefs = paths.congPrefs[0].path;
      goAhead();
    } else {
      congregationCreate();
    }
  });
}
function congregationCreate() {
  congregationChange(path.join(paths.app, "prefs-" + Math.floor(Math.random() * Date.now()) + ".json"));
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
function congregationPrefsPopulate() {
  paths.congPrefs = glob.sync(path.join(paths.app, "prefs*.json")).map(congregationPrefs => {
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
  }).filter(congPrefInfo => congPrefInfo.name).sort((a, b) => b.name.localeCompare(a.name));
}
function congregationSelectPopulate() {
  $("#congregationSelect .dropdown-menu .congregation").remove();
  for (var congregation of paths.congPrefs) {
    $("#congregationSelect .dropdown-menu").prepend(`<button
      class='dropdown-item congregation ${path.resolve(paths.prefs) == path.resolve(congregation.path) ? "active" : ""}'
      value='${congregation.path}'
    >
      ${paths.congPrefs.length > 1 ? "<i role='button' tabindex='0' class='fas fa-square-minus text-warning'></i> " : ""}
      ${congregation.name}
    </button>
    `);
    if (path.resolve(paths.prefs) == path.resolve(congregation.path)) $("#congregationSelect button.dropdown-toggle").text(congregation.name);
  }
  $("#congregationSelect .dropdown-menu .dropdown-item .fa-square-minus").popover({
    content: translate("clickAgain"),
    container: "body",
    trigger: "focus"
  }).on("hidden.bs.popover", function() {
    unconfirm(this);
  });
}

function createMediaNames() {
  perf("createMediaNames", "start");
  Object.values(meetingMedia).map(meeting => {
    meeting.map((part, i) => {
      part.media.filter(media => !media.safeName).map((media, j) => {
        media.safeName = (i + 1).toString().padStart(2, "0") + "-" + (j + 1).toString().padStart(2, "0");
        if (!media.congSpecific) {
          media.safeName = sanitizeFilename(
            media.safeName + " - "
            + ((media.queryInfo && media.queryInfo.TargetParagraphNumberLabel ? "Paragraph " + media.queryInfo.TargetParagraphNumberLabel + " - " : ""))
            + (media.pub && media.pub.includes("sjj") ? "Song " : "") + media.title + path.extname((media.url ? media.url : media.filepath))
          );
        }
      });
    });
  });
  log.debug(Object.entries(meetingMedia).map(meeting => { meeting[1] = meeting[1]
    .filter(mediaItem => mediaItem.media.length > 0)
    .map(item => item.media)
    .flat(); return meeting;
  }));
  perf("createMediaNames", "stop");
}
function createVideoSync(mediaFile){
  let outputFilePath = path.format({ ...path.parse(mediaFile), base: undefined, ext: ".mp4" });
  return new Promise((resolve)=>{
    try {
      if (path.extname(mediaFile).includes("mp3")) {
        ffmpegSetup().then(function () {
          ffmpeg(mediaFile).on("end", function() {
            if (!get("prefs").keepOriginalsAfterConversion) rm(mediaFile);
            return resolve();
          }).on("error", function(err) {
            notifyUser("warn", "warnMp4ConversionFailure", path.basename(mediaFile), true, err, true);
            return resolve();
          }).noVideo().save(path.join(outputFilePath));
        });
      } else {
        let convertedImageDimensions = [],
          imageDimesions = sizeOf(mediaFile);
        if (imageDimesions.orientation && imageDimesions.orientation >= 5) [imageDimesions.width, imageDimesions.height] = [imageDimesions.height, imageDimesions.width];
        convertedImageDimensions = aspect.resize(
          imageDimesions.width,
          imageDimesions.height,
          (constants.FULL_HD[1] / constants.FULL_HD[0] > imageDimesions.height / imageDimesions.width ? (imageDimesions.width > constants.FULL_HD[0] ? constants.FULL_HD[0] : imageDimesions.width) : null),
          (constants.FULL_HD[1] / constants.FULL_HD[0] > imageDimesions.height / imageDimesions.width ? null : (imageDimesions.height > constants.FULL_HD[1] ? constants.FULL_HD[1] : imageDimesions.height))
        );
        $("body").append("<div id='convert' style='display: none;'>");
        $("div#convert").append("<img id='imgToConvert'>").append("<canvas id='imgCanvas'></canvas>");
        hme.createH264MP4Encoder().then(function (encoder) {
          $("img#imgToConvert").on("load", function() {
            var canvas = $("#imgCanvas")[0],
              image = $("img#imgToConvert")[0];
            encoder.quantizationParameter = 10;
            image.width = convertedImageDimensions[0];
            image.height = convertedImageDimensions[1];
            encoder.width = canvas.width = (image.width % 2 ? image.width - 1 : image.width);
            encoder.height = canvas.height = (image.height % 2 ? image.height - 1 : image.height);
            encoder.initialize();
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            encoder.addFrameRgba(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data);
            encoder.finalize();
            fs.writeFileSync(outputFilePath, encoder.FS.readFile(encoder.outputFilename));
            encoder.delete();
            $("div#convert").remove();
            if (!get("prefs").keepOriginalsAfterConversion) rm(mediaFile);
            return resolve();
          });
          $("img#imgToConvert").on("error", function(err) {
            notifyUser("warn", "warnMp4ConversionFailure", path.basename(mediaFile), true, err, true);
            $("div#convert").remove();
            return resolve();
          });
          $("img#imgToConvert").prop("src", escape(mediaFile));
        });
      }
    } catch (err) {
      notifyUser("warn", "warnMp4ConversionFailure", path.basename(mediaFile), true, err, true);
      return resolve();
    }
  });
}
function createVlcPlaylists() {
  for (var date of glob.sync(path.join(paths.media, "*/"), {
    onlyDirectories: true
  }).map(item => path.basename(item)).filter(item => dayjs(item, get("prefs").outputFolderDateFormat).isValid())) {
    var playlistItems = {
      "?xml": {
        "@_version": "1.0",
        "@_encoding": "UTF-8"
      },
      "playlist": {
        "title": date,
        "trackList": {
          "track": glob.sync(path.join(paths.media, date, "*")).map(k => ({"location": url.pathToFileURL(k).href}))
        },
        "@_xmlns": "http://xspf.org/ns/0/",
        "@_xmlns:vlc": "http://www.videolan.org/vlc/playlist/ns/0/",
        "@_version": "1"
      }
    };
    fs.ensureDirSync(path.join(paths.media, date));
    fs.writeFileSync(path.join(paths.media, date, date + ".xspf"), (new XMLBuilder({ignoreAttributes: false})).build(playlistItems));
  }
}
function dateFormatter() {
  meetingMedia = {};
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
  baseDate = dayjs(baseDate).locale(locale);
  $("#folders .day").remove();
  for (var d = 6; d >= 0; d--) {
    if (!baseDate.clone().add(d, "days").isBefore(now)) $("#folders").prepend($("<button>", {
      id: "day" + d,
      class: "day alertIndicators m-1 col btn btn-sm align-items-center justify-content-center "
        + (baseDate.clone().add(d, "days").isSame(now) ? "pulse-info " : "")
        + ([get("prefs").mwDay, get("prefs").weDay].includes(d.toString()) ? "meeting btn-secondary " : "btn-light ")
        + (get("prefs").mwDay == d.toString() ? "mw " : "") + (get("prefs").weDay == d.toString() ? "we " : ""),
      "data-datevalue": baseDate.clone().add(d, "days").locale(locale).format(get("prefs").outputFolderDateFormat)
    }).append($("<div>", {
      class: "col dayLongDate"
    }).append($("<div>", {
      class: "dateOfMonth"
    }).append($("<span>", {
      class: "date",
      text: baseDate.clone().add(d, "days").locale(locale).format("D ")
    })).append($("<span>", {
      class: "month",
      text: baseDate.clone().add(d, "days").locale(locale).format("MMM")
    }))).append($("<div>", {
      class: "dayOfWeek",
      text: baseDate.clone().add(d, "days").locale(locale).format("ddd")
    })).append($("<div>", {
      class: "dayOfWeekLong",
      text: baseDate.clone().add(d, "days").locale(locale).format("dddd")
    }))).append($("<div>", {
      class: "position-absolute bottom-0 start-0 progress-bar progress-bar-striped progress-bar-animated"
    })));
    $("#mwDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    $("#weDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
  }
  $(".alertIndicators.btn-success").addClass("btn-secondary").removeClass("btn-success");
}
const delay = s => new Promise(res => {
  let finalTimeout = setTimeout(res, s * 1000);
  let secsRemaining = s;
  $("button .action-countdown").html(secsRemaining);
  const timeinterval = setInterval(function() {
    secsRemaining--;
    if (secsRemaining < 1) {
      secsRemaining = "";
      $("button .action-countdown").html();
      clearInterval(timeinterval);
      clearTimeout(finalTimeout);
      res();
    }
    $("button .action-countdown").html(secsRemaining);
  }, 1000);
  $("#bottomIcon button").on("click", function() {
    window[$(this).attr("class").split(" ")
      .filter(el => el.includes("btn-action-"))
      .join(" ").split("-").splice(2).join("-").toLowerCase()
      .replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""))] = true;
    clearInterval(timeinterval);
    clearTimeout(finalTimeout);
    res();
  });
});

function displayMusicRemaining() {
  let timeRemaining;
  if (get("prefs").enableMusicFadeOut && pendingMusicFadeOut.endTime >0) {
    let rightNow = dayjs();
    timeRemaining = (dayjs(pendingMusicFadeOut.endTime).isAfter(rightNow) ? dayjs(pendingMusicFadeOut.endTime).diff(rightNow) : 0);
  } else {
    timeRemaining = (isNaN($("#meetingMusic")[0].duration) ? 0 : ($("#meetingMusic")[0].duration - $("#meetingMusic")[0].currentTime) * 1000);
  }
  $("#musicRemaining").text(dayjs.duration(timeRemaining, "ms").format((timeRemaining >= 3600000 ? "HH:" : "") + "mm:ss"));
}
async function downloadIfRequired(file) {
  file.downloadRequired = true;
  if (!file.queryInfo) file.queryInfo = {};
  file.cacheDir = path.join(paths.pubs, (file.pub || file.queryInfo.KeySymbol || file.queryInfo.MultiMeps || file.primaryCategory || "unknown").toString(), (file.issue || file.queryInfo.IssueTagNumber || 0).toString(), (file.track || file.queryInfo.Track || 0).toString());
  file.cacheFilename = path.basename(file.url) || file.safeName;
  file.cacheFile = path.join(file.cacheDir, file.cacheFilename);
  file.destFilename = file.folder ? file.safeName : file.cacheFilename;
  if (fs.existsSync(file.cacheFile)) file.downloadRequired = file.filesize !== fs.statSync(file.cacheFile).size;
  if (file.downloadRequired) {
    if (path.extname(file.cacheFile) == ".jwpub") rm(file.cacheDir);
    fs.ensureDirSync(file.cacheDir);
    let downloadedFile = Buffer.from(new Uint8Array((await request(file.url, {isFile: true})).data));
    fs.writeFileSync(file.cacheFile, downloadedFile);
    if (file.folder) {
      fs.ensureDirSync(path.join(paths.media, file.folder));
      fs.writeFileSync(path.join(paths.media, file.folder, file.destFilename), downloadedFile);
    }
    downloadStat("jworg", "live", file);
    if (path.extname(file.cacheFile) == ".jwpub") await new zipper((await new zipper(file.cacheFile).readFile("contents"))).extractAllTo(file.cacheDir);
  } else {
    if (file.folder) {
      fs.ensureDirSync(path.join(paths.media, file.folder));
      fs.copyFileSync(file.cacheFile, path.join(paths.media, file.folder, file.destFilename));
    }
    downloadStat("jworg", "cache", file);
  }
  return file.cacheFile;
}
function downloadStat(origin, source, file) {
  if (!downloadStats[origin]) downloadStats[origin] = {};
  if (!downloadStats[origin][source]) downloadStats[origin][source] = [];
  downloadStats[origin][source].push(file);
}


async function executeStatement(db, statement) {
  var vals = await db.exec(statement)[0],
    valObj = [];
  if (vals) {
    for (var v = 0; v < vals.values.length; v++) {
      valObj[v] = {};
      for (var c = 0; c < vals.columns.length; c++) {
        valObj[v][vals.columns[c]] = vals.values[v][c];
      }
    }
  }
  log.debug({statement: statement, valObj: valObj});
  return valObj;
}
async function ffmpegSetup() {
  if (!ffmpegIsSetup) {
    var osType = os.type();
    var targetOs;
    if (osType == "Windows_NT") {
      targetOs = "win-64";
    } else if (osType == "Darwin") {
      targetOs = "osx-64";
    } else {
      targetOs = "linux-64";
    }
    var ffmpegVersion = (await request(constants.FFMPEG_VERSION)).data.assets.filter(a => a.name.includes(targetOs) && a.name.includes("ffmpeg"))[0];
    var ffmpegZipPath = path.join(paths.app, "ffmpeg", "zip", ffmpegVersion.name);
    if (!fs.existsSync(ffmpegZipPath) || fs.statSync(ffmpegZipPath).size !== ffmpegVersion.size) {
      await rm([path.join(paths.app, "ffmpeg", "zip")]);
      fs.ensureDirSync(path.join(paths.app, "ffmpeg", "zip"));
      fs.writeFileSync(ffmpegZipPath, Buffer.from( new Uint8Array((await request(ffmpegVersion.browser_download_url, {isFile: true})).data)));
    }
    var zip = new zipper(ffmpegZipPath);
    var zipEntry = zip.getEntries().filter((x) => !x.entryName.includes("MACOSX"))[0];
    var ffmpegPath = path.join(path.join(paths.app, "ffmpeg", zipEntry.entryName));
    if (!fs.existsSync(ffmpegPath) || fs.statSync(ffmpegPath).size !== zipEntry.header.size) {
      zip.extractEntryTo(zipEntry.entryName, path.join(paths.app, "ffmpeg"), true, true);
    }
    try {
      fs.accessSync(ffmpegPath, fs.constants.X_OK);
    } catch (err) {
      fs.chmodSync(ffmpegPath, "777");
    }
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpegIsSetup = true;
  }
}
async function getCongMedia() {
  perf("getCongMedia", "start");
  updateTile("specificCong", "warning");
  updateStatus("cloud");
  try {
    for (let meeting of Object.keys(meetingMedia).filter(meeting => dayjs(meeting, get("prefs").outputFolderDateFormat).isValid() && dayjs(meeting, get("prefs").outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]"))) {
      meetingMedia[meeting] = meetingMedia[meeting].filter(part => part.media.filter(mediaItem => mediaItem.recurring).length == 0);
    }
    for (let congSpecificFolder of (await webdavLs(path.posix.join(get("prefs").congServerDir, "Media")))) {
      let isMeetingDate = dayjs(congSpecificFolder.basename, get("prefs").outputFolderDateFormat).isValid() && dayjs(congSpecificFolder.basename, get("prefs").outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(congSpecificFolder.basename, get("prefs").outputFolderDateFormat));
      let isRecurring = congSpecificFolder.basename == "Recurring";
      let congSubFolder = (isRecurring ? congSpecificFolder.basename : dayjs(congSpecificFolder.basename, get("prefs").outputFolderDateFormat).format(get("prefs").outputFolderDateFormat));
      if (isMeetingDate || isRecurring) {
        if (!meetingMedia[congSubFolder]) meetingMedia[congSubFolder] = [];
        for (let remoteFile of (await webdavLs(path.posix.join(get("prefs").congServerDir, "Media", congSpecificFolder.basename)))) {
          let congSpecificFile = {
            "title": "Congregation-specific",
            media: [{
              safeName: remoteFile.basename,
              congSpecific: true,
              filesize: remoteFile.size,
              folder: congSubFolder,
              url: remoteFile.filename
            }]
          };
          if (!meetingMedia[congSubFolder].map(part => part.media).flat().map(item => item.url).filter(Boolean).includes(remoteFile.filename)) meetingMedia[congSubFolder].push(congSpecificFile);
          if (isRecurring) {
            for (let meeting of Object.keys(meetingMedia)) {
              if (dayjs(meeting, get("prefs").outputFolderDateFormat).isValid() && dayjs(meeting, get("prefs").outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
                var repeatFile = v8.deserialize(v8.serialize(congSpecificFile));
                repeatFile.media[0].recurring = true;
                repeatFile.media[0].folder = meeting;
                if (!meetingMedia[meeting].map(part => part.media).flat().map(item => item.safeName).filter(Boolean).includes(remoteFile.basename)) meetingMedia[meeting].push(repeatFile);
              }
            }
          }
        }
      }
    }
    for (var hiddenFilesFolder of (await webdavLs(path.posix.join(get("prefs").congServerDir, "Hidden"))).filter(hiddenFilesFolder => dayjs(hiddenFilesFolder.basename, get("prefs").outputFolderDateFormat).isValid() && dayjs(hiddenFilesFolder.basename, get("prefs").outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(hiddenFilesFolder.basename, get("prefs").outputFolderDateFormat))).sort((a, b) => (a.basename > b.basename) ? 1 : -1)) {
      for (var hiddenFile of await webdavLs(path.posix.join(get("prefs").congServerDir, "Hidden", hiddenFilesFolder.basename))) {
        var hiddenFileLogString = "background-color: #d6d8d9; color: #1b1e21;";
        if (meetingMedia[dayjs(hiddenFilesFolder.basename, get("prefs").outputFolderDateFormat).format(get("prefs").outputFolderDateFormat)]) {
          meetingMedia[dayjs(hiddenFilesFolder.basename, get("prefs").outputFolderDateFormat).format(get("prefs").outputFolderDateFormat)]
            .filter(part => part.media.filter(mediaItem => mediaItem.safeName == hiddenFile.basename).map(function (mediaItem) {
              mediaItem.hidden = true;
              hiddenFileLogString = "background-color: #fff3cd; color: #856404;";
            }));
        }
        log.info("%c[hiddenMedia] [" + hiddenFilesFolder.basename + "] " + hiddenFile.basename, hiddenFileLogString);
      }
    }
  } catch (err) {
    notifyUser("error", "errorGetCongMedia", null, true, err, true);
    updateTile("specificCong", "danger");
  }
  perf("getCongMedia", "stop");
}
async function getDbFromJwpub(pub, issue, localpath, lang) {
  try {
    var SQL = await sqljs();
    if (localpath) {
      var jwpubContents = await new zipper(localpath).readFile("contents");
      var tempDb = new SQL.Database(await new zipper(jwpubContents).readFile((await new zipper(jwpubContents).getEntries())
        .filter(entry => path.extname(entry.name) == ".db")[0].entryName));
      var jwpubInfo = (await executeStatement(tempDb, "SELECT UniqueEnglishSymbol, IssueTagNumber FROM Publication"))[0];
      pub = jwpubInfo.UniqueEnglishSymbol.replace(/[0-9]/g, "");
      issue = jwpubInfo.IssueTagNumber;
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      jwpubDbs[pub][issue] = tempDb;
    } else {
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      if (!jwpubDbs[pub][issue]) {
        var jwpub = (await getMediaLinks({pubSymbol: pub, issue: issue, format: "JWPUB", ...(lang && { lang: lang })}))[0];
        if (jwpub) {
          jwpub.pub = pub;
          jwpub.issue = issue;
          jwpub.queryInfo = {};
          await downloadIfRequired(jwpub);
          jwpubDbs[pub][issue] = new SQL.Database(fs.readFileSync(glob.sync(path.join(paths.pubs, jwpub.pub, jwpub.issue, "0", "*.db"))[0]));
        } else {
          notifyUser("warn", "errorJwpubDbFetch", pub + " - " + issue, false, null, true);
        }
      }
    }
    return jwpubDbs[pub][issue];
  } catch (err) {
    notifyUser("warn", "errorJwpubDbFetch", pub + " - " + issue, false, err, true);
  }
}
async function getDocumentExtract(db, docId) {
  var extractMultimediaItems = [];
  for (var extractItem of (await executeStatement(
    db,
    `SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,
      Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UniqueEnglishSymbol,IssueTagNumber,
      Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal, Extract.Link
    FROM DocumentExtract
      INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
      INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
      INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId
    WHERE DocumentExtract.DocumentId = ${docId}
      AND NOT UniqueEnglishSymbol = 'sjj'
      AND NOT UniqueEnglishSymbol = 'mwbr'
      ${get("prefs").excludeTh ? "AND NOT UniqueEnglishSymbol = 'th' " : ""}
    ORDER BY DocumentExtract.BeginParagraphOrdinal`))) {
    extractItem.Lang = get("prefs").lang;
    if (extractItem.Link) {
      try {
        extractItem.Lang = extractItem.Link.match(/\/(.*)\//).pop().split(":")[0];
      } catch (err) {
        log.error(err);
      }
    }
    let uniqueEnglishSymbol = extractItem.UniqueEnglishSymbol.replace(/[0-9]/g, "");
    if (uniqueEnglishSymbol !== "snnw") { // exclude the "old new songs" songbook, as we don't need images from that
      var extractDb = await getDbFromJwpub(uniqueEnglishSymbol, extractItem.IssueTagNumber, null, extractItem.Lang);
      if (extractDb) {
        extractMultimediaItems = extractMultimediaItems.concat((await getDocumentMultimedia(extractDb, null, extractItem.RefMepsDocumentId, null, extractItem.Lang)).filter(extractMediaFile => {
          if (extractMediaFile.queryInfo.tableQuestionIsUsed && !extractMediaFile.queryInfo.TargetParagraphNumberLabel) extractMediaFile.BeginParagraphOrdinal = extractMediaFile.queryInfo.NextParagraphOrdinal;
          if (get("jsonLangs").find(lang => lang.langcode == get("prefs").lang).isSignLanguage && !!extractMediaFile.queryInfo.FilePath && isVideo(extractMediaFile.queryInfo.FilePath) && !extractMediaFile.queryInfo.TargetParagraphNumberLabel) {
            return true; // include videos with no specific paragraph for sign language, as they are sometimes used (ie the CBS chapter video)
          } else if (extractMediaFile.BeginParagraphOrdinal && extractItem.RefBeginParagraphOrdinal && extractItem.RefEndParagraphOrdinal) {
            return extractItem.RefBeginParagraphOrdinal <= extractMediaFile.BeginParagraphOrdinal && extractMediaFile.BeginParagraphOrdinal <= extractItem.RefEndParagraphOrdinal;
          } else {
            return true;
          }
        }).map(extractMediaFile => {
          extractMediaFile.BeginParagraphOrdinal = extractItem.BeginParagraphOrdinal;
          return extractMediaFile;
        }));
      }
    }
  }
  return extractMultimediaItems;
}
async function getDocumentMultimedia(db, destDocId, destMepsId, memOnly, lang) {
  const prefs = get("prefs");
  let tableMultimedia = ((await executeStatement(db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
  let keySymbol = (await executeStatement(db, "SELECT UniqueEnglishSymbol FROM Publication"))[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
  let issueTagNumber = (await executeStatement(db, "SELECT IssueTagNumber FROM Publication"))[0].IssueTagNumber;
  let targetParagraphNumberLabelExists = (await executeStatement(db, "PRAGMA table_info('Question')")).map(item => item.name).includes("TargetParagraphNumberLabel");
  let suppressZoomExists = (await executeStatement(db, "PRAGMA table_info('Multimedia')")).map(item => item.name).includes("SuppressZoom");
  let multimediaItems = [];
  if (!(keySymbol == "lffi" && prefs.excludeLffi && prefs.excludeLffiImages)) for (var multimediaItem of (await executeStatement(
    db,
    `SELECT ${tableMultimedia}.DocumentId, ${tableMultimedia}.MultimediaId, `
    + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId," + (suppressZoomExists ? " Multimedia.SuppressZoom," : "") + " Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ")
    + (targetParagraphNumberLabelExists && tableMultimedia == "DocumentMultimedia" ? "Question.TargetParagraphNumberLabel, " : "")
    + "Multimedia.MimeType, Multimedia.DataType, Multimedia.MajorType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia
    + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "")
    + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId "
    + (targetParagraphNumberLabelExists && tableMultimedia == "DocumentMultimedia" ? "LEFT JOIN Question ON Question.DocumentId = " + tableMultimedia + ".DocumentId AND Question.TargetParagraphOrdinal = " + tableMultimedia + ".BeginParagraphOrdinal " : "")
    + "WHERE " + (destDocId || destDocId === 0 ? tableMultimedia + ".DocumentId = " + destDocId : "Document.MepsDocumentId = " + destMepsId)
    + " AND (" + (keySymbol !== "lffi" || !prefs.excludeLffi ? "(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')" : "")
    + (keySymbol !== "lffi" || (!prefs.excludeLffi && !prefs.excludeLffiImages) ? " OR " : "")
    + (keySymbol !== "lffi" || !prefs.excludeLffiImages ? "(Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 6 AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25)" : "") + ")"
    + (suppressZoomExists ? " AND Multimedia.SuppressZoom <> 1" : "")
    + (tableMultimedia == "DocumentMultimedia" ? " GROUP BY " + tableMultimedia + ".MultimediaId ORDER BY BeginParagraphOrdinal" : "")))) {
    if (targetParagraphNumberLabelExists) {
      let paragraphNumber = await executeStatement(db, "SELECT TargetParagraphNumberLabel From Question WHERE DocumentId = " + multimediaItem.DocumentId + " AND TargetParagraphOrdinal = " + multimediaItem.BeginParagraphOrdinal);
      if (paragraphNumber.length === 1) Object.assign(multimediaItem, paragraphNumber[0]);
      if ((await executeStatement(db, "SELECT COUNT(*) as Count FROM Question"))[0].Count > 0) {
        multimediaItem.tableQuestionIsUsed = true;
        let nextParagraphQuery = await executeStatement(db, "SELECT TargetParagraphNumberLabel, TargetParagraphOrdinal From Question WHERE DocumentId = " + multimediaItem.DocumentId + " AND TargetParagraphOrdinal > " + multimediaItem.BeginParagraphOrdinal + " LIMIT 1");
        if (nextParagraphQuery.length > 0) multimediaItem.NextParagraphOrdinal = nextParagraphQuery[0].TargetParagraphOrdinal;
      }
    }
    try {
      if ((multimediaItem.MimeType.includes("audio") || multimediaItem.MimeType.includes("video"))) {
        var json = {
          queryInfo: multimediaItem,
          BeginParagraphOrdinal: multimediaItem.BeginParagraphOrdinal
        };
        Object.assign(json, (await getMediaLinks({pubSymbol: multimediaItem.KeySymbol, track: multimediaItem.Track, issue: multimediaItem.IssueTagNumber, docId: multimediaItem.MultiMeps, ...(lang && { lang: lang })}))[0]);
        multimediaItems.push(json);
      } else {
        if (multimediaItem.KeySymbol == null) {
          multimediaItem.KeySymbol = keySymbol;
          multimediaItem.IssueTagNumber = issueTagNumber;
          if (!memOnly) multimediaItem.LocalPath = path.join(paths.pubs, multimediaItem.KeySymbol, multimediaItem.IssueTagNumber, "0", multimediaItem.FilePath);
        }
        multimediaItem.FileName = sanitizeFilename((multimediaItem.Caption.length > multimediaItem.Label.length ? multimediaItem.Caption : multimediaItem.Label), true);
        var picture = {
          BeginParagraphOrdinal: multimediaItem.BeginParagraphOrdinal,
          title: multimediaItem.FileName,
          queryInfo: multimediaItem
        };
        if (!memOnly) {
          picture.filepath = multimediaItem.LocalPath;
          picture.filesize = fs.statSync(multimediaItem.LocalPath).size;
        }
        multimediaItems.push(picture);
      }
    } catch (err) {
      notifyUser("warn", "errorJwpubMediaExtract", keySymbol + " - " + issueTagNumber, false, err, true);
    }
  }
  return multimediaItems;
}

async function getInitialData() {
  const prefs = get("prefs");
  meetingMedia = {};
  jwpubDbs = {};
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
    $("#baseDate .dropdown-menu").append("<button class='dropdown-item' value='" + baseDate.clone().add(a, "week").format(get("prefs").outputFolderDateFormat) + "'>" + baseDate.clone().add(a, "week").format(prefs.outputFolderDateFormat.replace(" - dddd", "")) + " - " + baseDate.clone().add(a, "week").add(6, "days").format(prefs.outputFolderDateFormat.replace(" - dddd", "")) + "</button>");
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

async function getMediaLinks(mediaItem) {
  let mediaFiles = [];
  if ((mediaItem.lang || get("prefs").lang) && get("prefs").maxRes) {
    try {
      if (mediaItem.pubSymbol === "w" && mediaItem.issue && parseInt(mediaItem.issue) >= 20080101 && mediaItem.issue.toString().slice(-2) == "01") mediaItem.pubSymbol = "wp";
      let requestUrl = constants.JW_API + (mediaItem.pubSymbol ? "&pub=" + mediaItem.pubSymbol + (mediaItem.track ? "&track=" + mediaItem.track : "") + (mediaItem.issue ? "&issue=" + mediaItem.issue : "") + (mediaItem.format ? "&fileformat=" + mediaItem.format : "") : (mediaItem.docId ? "&docid=" + mediaItem.docId : "")) + "&langwritten=" + (mediaItem.lang || get("prefs").lang);
      let result = (await request(requestUrl)).data;
      log.debug(mediaItem.pubSymbol, mediaItem.track, mediaItem.issue, mediaItem.format, mediaItem.docId, requestUrl);
      if (result && result.length > 0 && result[0].status && [400, 404].includes(result[0].status) && mediaItem.pubSymbol && mediaItem.track) {
        requestUrl = constants.JW_API + "&pub=" + mediaItem.pubSymbol + "m" + "&track=" + mediaItem.track + (mediaItem.issue ? "&issue=" + mediaItem.issue : "") + (mediaItem.format ? "&fileformat=" + mediaItem.format : "") + "&langwritten=" + (mediaItem.lang || get("prefs").lang);
        result = (await request(requestUrl)).data;
        log.debug(mediaItem.pubSymbol + "m", mediaItem.track, mediaItem.issue, mediaItem.format, mediaItem.docId, requestUrl);
      }
      if (result && result.length > 0 && result[0].status && [400, 404].includes(result[0].status) && mediaItem.pubSymbol && mediaItem.pubSymbol.endsWith("m") && mediaItem.track) {
        requestUrl = constants.JW_API + "&pub=" + mediaItem.pubSymbol.slice(0, -1) + "&track=" + mediaItem.track + (mediaItem.issue ? "&issue=" + mediaItem.issue : "") + (mediaItem.format ? "&fileformat=" + mediaItem.format : "") + "&langwritten=" + (mediaItem.lang || get("prefs").lang);
        result = (await request(requestUrl)).data;
        log.debug(mediaItem.pubSymbol + "m", mediaItem.track, mediaItem.issue, mediaItem.format, mediaItem.docId, requestUrl);
      }
      if (result && result.files) {
        let mediaFileCategories = Object.values(result.files)[0];
        mediaFiles = mediaFileCategories[("MP4" in mediaFileCategories ? "MP4" : Object.keys(mediaFileCategories)[0])].filter(({label}) => label.replace(/\D/g, "") <= get("prefs").maxRes.replace(/\D/g, ""));
        let map = new Map(mediaFiles.map(item => [item.title, item]));
        for (let item of mediaFiles) {
          let {label, subtitled} = map.get(item.title);
          if ((item.label.replace(/\D/g, "") - label.replace(/\D/g, "") || subtitled - item.subtitled) > 0) map.set(item.title, item);
        }
        mediaFiles = Array.from(map.values(), ({title, file: {url}, file: {checksum}, filesize, duration, trackImage, track, pub, markers}) => ({title, url, checksum, filesize, duration, trackImage, track, pub, markers})).map(item => {
          item.trackImage = item.trackImage.url;
          if (mediaItem.issue) item.issue = mediaItem.issue;
          return item;
        });
        for (var item of mediaFiles) {
          if (item.duration >0 && (!item.trackImage || !item.pub)) {
            Object.assign(item, (await getMediaAdditionalInfo(mediaItem.pubSymbol, mediaItem.track, mediaItem.issue, mediaItem.format, mediaItem.docId)));
          }
        }
      }
    } catch(err) {
      notifyUser("warn", "infoPubIgnored", mediaItem.pubSymbol + " - " + mediaItem.track + " - " + mediaItem.issue + " - " + mediaItem.format, false, err);
    }
  }
  log.debug(mediaFiles);
  return mediaFiles;
}
async function getMediaAdditionalInfo(pub, track, issue, _format, docId) {
  let mediaAdditionalInfo = {};
  if (issue) issue = issue.toString().replace(/(\d{6})00$/gm, "$1");
  let result = (await request(constants.JWPUB_API + get("prefs").lang + "/" + (docId ? "docid-" + docId + "_1": "pub-" + [pub, issue, track].filter(Boolean).join("_")) + "_VIDEO")).data;
  if (result && result.media && result.media.length > 0) {
    if (result.media[0].images.wss.sm) mediaAdditionalInfo.thumbnail = result.media[0].images.wss.sm;
    if (result.media[0].primaryCategory) mediaAdditionalInfo.primaryCategory = result.media[0].primaryCategory;
  }
  return mediaAdditionalInfo;
}
async function getMwMediaFromDb() {
  var mwDate = baseDate.clone().add(get("prefs").mwDay, "days").format(get("prefs").outputFolderDateFormat);
  if (now.isSameOrBefore(dayjs(mwDate, get("prefs").outputFolderDateFormat))) {
    updateTile("day" + get("prefs").mwDay, "warning");
    try {
      var issue = baseDate.format("YYYYMM") + "00";
      if (parseInt(baseDate.format("M")) % 2 === 0) issue = baseDate.clone().subtract(1, "months").format("YYYYMM") + "00";
      var db = await getDbFromJwpub("mwb", issue);
      var docId = (await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + baseDate.format("YYYYMMDD") + ""))[0].DocumentId;
      (await getDocumentMultimedia(db, docId)).map(video => {
        addMediaItemToPart(mwDate, video.BeginParagraphOrdinal, video, "internal");
      });
      (await getDocumentExtract(db, docId)).map(extract => {
        addMediaItemToPart(mwDate, extract.BeginParagraphOrdinal, extract, "external");
      });
      for (var internalRef of (await executeStatement(db, "SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = " + docId + " AND Document.Class <> 94"))) {
        (await getDocumentMultimedia(db, internalRef.DocumentId)).map(internalRefMediaFile => {
          addMediaItemToPart(mwDate, internalRef.BeginParagraphOrdinal, internalRefMediaFile, "internal");
        });
      }
      updateTile("day" + get("prefs").mwDay, "success");
    } catch(err) {
      notifyUser("error", "errorGetMwMedia", null, true, err, true);
      updateTile("day" + get("prefs").mwDay, "danger");
    }
  }
}
function getPrefix() {
  for (var a0 = 0; a0 < 6; a0++) {
    let curValuePresent = $("#enterPrefix-" + a0).val().length > 0;
    if (!curValuePresent) $(Array(6 - 1 - a0).fill(a0).map((x, y) => "#enterPrefix-" + (x + 1 + y)).join(", ")).val("");
    $("#enterPrefix-" + (a0 + 1)).fadeToAndToggle(fadeDelay, curValuePresent).filter(":not(.disabled-while-load)").prop("disabled", !curValuePresent);
  }
  let prefix = $(".enterPrefixInput").map(function() {
    return $(this).val();
  }).toArray().join("").trim();
  if ($("#enterPrefix-0").val().length > 0) $("#enterPrefix-" + prefix.length).focus();
  if (prefix.length % 2) prefix = prefix + 0;
  if (prefix.length > 0) prefix = prefix.match(/.{1,2}/g).join("-");
  return prefix;
}

function getMediaWindowDestination() {
  let mediaWindowOpts = {
    destination: null,
    type: "window"
  };
  $("#preferredOutput").closest(".row").hide().find(".display").remove();
  try {
    if (get("prefs").enableMediaDisplayButton) {
      let screenInfo = require("electron").ipcRenderer.sendSync("getScreenInfo");
      screenInfo.otherScreens.map(screen => {
        $("#preferredOutput").append($("<option />", {
          value: screen.id,
          class: "display",
          text: translate("screen") + " " + screen.humanFriendlyNumber + (screen.size && screen.size.width && screen.size.height ? " (" + screen.size.width + "x" + screen.size.height + ") (ID: " + screen.id + ")" : "")
        }));
      });
      if (get("prefs").preferredOutput) $("#preferredOutput").val(get("prefs").preferredOutput);
      $("#preferredOutput").closest(".row").toggle(screenInfo.otherScreens.length > 0);
      if (screenInfo.otherScreens.length > 0) { // at least one external screen
        if (get("prefs").preferredOutput !== "window") { // fullscreen mode
          let preferredDisplay = screenInfo.displays.find(display => display.id == get("prefs").preferredOutput); // try to find preferred display
          if (screenInfo.otherScreens.length > 1) { // more than one external screen
            mediaWindowOpts.destination = preferredDisplay ? preferredDisplay.id : screenInfo.otherScreens[screenInfo.otherScreens.length - 1].id; // try to use preferred display; otherwise use another available one
          }
          mediaWindowOpts.type = "fullscreen";
        }
        if (!mediaWindowOpts.destination) mediaWindowOpts.destination = screenInfo.otherScreens[screenInfo.otherScreens.length - 1].id;
        if (mediaWindowOpts.type == "fullscreen") $("#preferredOutput").val(mediaWindowOpts.destination); // set the display menu to show the selected screen, but don't save it in prefs in case preferred screen comes back
      } else { // no  external screen, use main one
        mediaWindowOpts.destination = screenInfo.displays[0].id;
      }
    }
  } catch(err) {
    log.error(err);
  }
  return mediaWindowOpts;
}

function setMediaWindowPosition() {
  require("electron").ipcRenderer.send("setMediaWindowPosition", getMediaWindowDestination());
}

async function getWeMediaFromDb() {
  const prefs = get("prefs");
  var weDate = baseDate.clone().add(prefs.weDay, "days").format(prefs.outputFolderDateFormat);
  if (now.isSameOrBefore(dayjs(weDate, prefs.outputFolderDateFormat))) {
    updateTile("day" + prefs.weDay, "warning");
    try {
      var issue = baseDate.clone().subtract(8, "weeks").format("YYYYMM") + "00";
      var db = await getDbFromJwpub("w", issue);
      var weekNumber = (await executeStatement(db, "SELECT FirstDateOffset FROM DatedText")).findIndex(weekItem => dayjs(weekItem.FirstDateOffset.toString(), "YYYYMMDD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]"));
      if (weekNumber < 0) {
        issue = baseDate.clone().subtract(9, "weeks").format("YYYYMM") + "00";
        db = await getDbFromJwpub("w", issue);
        weekNumber = (await executeStatement(db, "SELECT FirstDateOffset FROM DatedText")).findIndex(weekItem => dayjs(weekItem.FirstDateOffset.toString(), "YYYYMMDD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]"));
      }
      if (weekNumber < 0) throw("No WE meeting date found!");
      var docId = (await executeStatement(db, "SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET " + weekNumber))[0].DocumentId;
      for (var picture of (await executeStatement(
        db,
        `SELECT DocumentMultimedia.MultimediaId,Document.DocumentId, Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType, DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption, Question.TargetParagraphNumberLabel
        FROM DocumentMultimedia
          INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId
          INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
          LEFT JOIN Question ON Question.DocumentId = DocumentMultimedia.DocumentId AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
        WHERE Document.DocumentId = ${docId} AND Multimedia.CategoryType <> 9 GROUP BY DocumentMultimedia.MultimediaId`))) {
        if (!isImage(picture.FilePath)) {
          let mediaObj = await getMediaLinks({pubSymbol: picture.KeySymbol, track: picture.Track, issue: picture.IssueTagNumber});
          if (mediaObj && mediaObj.length > 0) addMediaItemToPart(weDate, 1, mediaObj[0]);
        } else {
          var LocalPath = path.join(paths.pubs, "w", issue, "0", picture.FilePath);
          var FileName = sanitizeFilename((picture.Caption.length > picture.Label.length ? picture.Caption : picture.Label), true);
          var pictureObj = {
            title: FileName,
            filepath: LocalPath,
            filesize: fs.statSync(LocalPath).size,
            queryInfo: picture
          };
          addMediaItemToPart(weDate, 1, pictureObj);
        }
      }
      var qrySongs = await executeStatement(db, "SELECT * FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DataType = 2 ORDER BY BeginParagraphOrdinal LIMIT 2 OFFSET " + weekNumber * 2);
      for (var song = 0; song < qrySongs.length; song++) {
        let songJson = await getMediaLinks({pubSymbol: qrySongs[song].KeySymbol, track: qrySongs[song].Track});
        if (songJson.length > 0) {
          songJson[0].queryInfo = qrySongs[song];
          addMediaItemToPart(weDate, song * 2, songJson[0]);
        } else {
          notifyUser("error", "errorGetWeMedia", null, true, songJson, true);
        }
      }
      updateTile("day" + prefs.weDay, "success");
    } catch(err) {
      notifyUser("error", "errorGetWeMedia", null, true, err, true);
      updateTile("day" + prefs.weDay, "danger");
    }
  }
}

async function getRemoteYearText(force) {
  let yearText = null;
  try {
    if (!fs.existsSync(paths.yearText) || force) {
      await axios.get(constants.YEARTEXT(get("prefs").lang), {
        adapter: require("axios/lib/adapters/http")
      }).then(result => {
        fs.ensureDirSync(path.join(paths.yearText, "../"));
        if (result && result.data && result.data.content) {
          fs.writeFileSync(paths.yearText, JSON.parse(JSON.stringify(result.data.content)));
          yearText = JSON.parse(JSON.stringify(result.data.content));
        }
      }).catch(err => {
        log.error(err);
      });
    } else {
      yearText = fs.readFileSync(paths.yearText, "utf8");
    }
  } catch (err) {
    log.error(err);
  }
  return yearText;
}

function isReachable(hostname, port, silent) {
  return new Promise(resolve => {
    try {
      let client = net.createConnection(port, hostname);
      client.setTimeout(3000);
      client.on("timeout", () => {
        client.destroy("Timeout: " + hostname + ":" + port);
      });
      client.on("connect", function() {
        client.destroy();
        resolve(true);
      });
      client.on("error", function(err) {
        if (!silent) notifyUser("error", "errorSiteCheck", hostname + ":" + port, false, err);
        resolve(false);
      });
    } catch(err) {
      resolve(false);
    }
  });
}

function listMediaFolders() {
  $(".for-folder-listing-only").hide();
  let folderListing = $("<div id='folderListing' class='list-group'>");
  $("h5.modal-title").text(translate("meeting"));
  for (var folder of glob.sync(path.join(paths.media, "*/"), {
    onlyDirectories: true
  }).sort()) {
    folder = escape(folder);
    $(folderListing).append("<button class='d-flex list-group-item list-group-item-action folder " + (now.format(get("prefs").outputFolderDateFormat) == path.basename(folder) ? "thatsToday" : "") + "' data-folder='" + folder + "'>" + path.basename(folder) + "</div></button>");
  }
  return folderListing;
}

async function manageMedia(day, isMeetingDate, mediaType) {
  await overlay(true, (webdavIsAGo ? "cloud" : "folder-open") + " fa-beat");
  $("#chosenMeetingDay").data("folderName", day).text(dayjs(day, get("prefs").outputFolderDateFormat).isValid() ? day : translate("recurring"));
  removeEventListeners();
  document.addEventListener("drop", dropHandler);
  document.addEventListener("dragover", dragoverHandler);
  document.addEventListener("dragenter", dragenterHandler);
  document.addEventListener("dragleave", dragleaveHandler);
  $("#chooseUploadType input").prop("checked", false).trigger("change");
  $("#chooseUploadType label.active").removeClass("active");
  if (!meetingMedia[day]) meetingMedia[day] = [];
  await startMediaSync(true, isMeetingDate || mediaType ? mediaType : null);
  if (!webdavIsAGo) $("#overlayUploadFile .fa-2x").toggleClass("fa-cloud fa-folder-open");
  updateFileList(true);
  await toggleScreen("overlayUploadFile");
  overlay(false);
}

function overlay(show, topIcon, bottomIcon, action) {
  return new Promise((resolve) => {
    if (!show) {
      if (!topIcon || (topIcon && $("#overlayMaster i.fa-" + topIcon).length > 0)) $("#overlayMaster").stop().fadeOut(fadeDelay, () => resolve());
    } else {
      if ($("#overlayMaster #topIcon i.fa-" + topIcon).length === 0) $("#overlayMaster #topIcon i").removeClass().addClass("fas fa-fw fa-" + topIcon);
      $("#overlayMaster #bottomIcon i").removeClass().unwrap("button");
      $("#overlayMaster #bottomIcon .action-countdown").html("");
      if (bottomIcon) {
        $("#overlayMaster #bottomIcon i").addClass("fas fa-fw fa-" + bottomIcon + (action ? " " + action : "")).unwrap("button");
        if (action) $("#overlayMaster #bottomIcon i").next("span").addBack().wrapAll("<button type='button' class='btn btn-danger btn-action-" + action + " position-relative'></button>");
      }
      $("#overlayMaster").stop().fadeIn(fadeDelay, () => resolve());
    }
  });
}

function perf(func, op) {
  if (!perfStats[func]) perfStats[func] = {};
  perfStats[func][op] = performance.now();
}

function perfPrint() {
  for (var perfItem of Object.entries(perfStats).sort((a, b) => a[1].stop - b[1].stop)) {
    log.info("%c[perf] [" + perfItem[0] + "] " + (perfItem[1].stop - perfItem[1].start).toFixed(1) + "ms", "background-color: #e2e3e5; color: #41464b;");
  }
  for (let downloadSource of Object.entries(downloadStats)) {
    log.info("%c[perf] [" + downloadSource[0] + "Fetch] " + Object.entries(downloadSource[1]).sort((a,b) => a[0].localeCompare(b[0])).map(downloadOrigin => "from " + downloadOrigin[0] + ": " + (downloadOrigin[1].map(source => source.filesize).reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1) + "MB").join(", "), "background-color: #fbe9e7; color: #000;");
  }
}

function periodicCleanup() {
  try {
    setVars();
    if (paths.pubs) {
      let lastPeriodicCleanupPath = path.join(paths.pubs, "lastPeriodicCleanup"),
        lastPeriodicCleanup = fs.existsSync(lastPeriodicCleanupPath) && fs.readFileSync(lastPeriodicCleanupPath, "utf8") || false;
      if (!dayjs(lastPeriodicCleanup).isValid() || dayjs(lastPeriodicCleanup).isBefore(now.subtract(6, "months"))) {
        rm(glob.sync(path.join(paths.pubs, "**", "*.mp*")).map(video => {
          let itemDate = dayjs(path.basename(path.join(path.dirname(video), "../")), "YYYYMMDD");
          let itemPub = path.basename(path.join(path.dirname(video), "../../"));
          if (!itemPub.includes("sjj") && (!itemDate.isValid() || (itemDate.isValid() && itemDate.isBefore(now.subtract(3, "months"))))) return video;
        }).filter(Boolean));
        fs.ensureDirSync(paths.pubs);
        fs.writeFileSync(lastPeriodicCleanupPath, dayjs().format());
      }
    }
  } catch(err) {
    log.error(err);
  }
}

function refreshBackgroundImagePreview(force) {
  try {
    if (get("prefs").enableMediaDisplayButton) {
      let mediaWindowBackgroundImages = glob.sync(path.join(paths.app, "media-window-background-image*"));
      if (mediaWindowBackgroundImages.length == 0) {
        getRemoteYearText(force).then((yearText) => {
          $("#fetchedYearText").text($(yearText).text());
          $("#fetchedYearText, #refreshYeartext").toggle(!!yearText);
        }).finally(() => {
          require("electron").ipcRenderer.send("startMediaDisplay", paths.prefs);
        });
      } else {
        $("#currentMediaBackground").prop("src", escape(mediaWindowBackgroundImages[0]) + "?" + (new Date()).getTime());
      }
      $("#currentMediaBackground, #deleteBackground").toggle(mediaWindowBackgroundImages.length > 0);
      $("#chooseBackground").toggle(mediaWindowBackgroundImages.length == 0);
    }
  } catch (err) {
    log.error(err);
  }
}

function refreshFolderListing(folderPath) {
  $(".for-folder-listing-only").show();
  $("h5.modal-title").html($("<button class='btn btn-secondary'>" + path.basename(folderPath) + "</button>").on("click", function() {
    $("div#folderListing").empty().append(listMediaFolders());
  }));
  $("div#folderListing").empty().sortable({
    placeholder: "list-group-item",
    handle: ".move-handle",
    cancel: ".position-relative",
    axis: "y",
  });
  for (var item of glob.sync(path.join(folderPath, "*")).sort()) {
    item = escape(item);
    let lineItem = $(`<li class='d-flex align-items-center list-group-item flex-column item ${(isVideo(item) || isAudio(item) ? "video" : (isImage(item) ? "image" : "unknown"))}' data-item='${item}'>
    <div class='bg-opacity-75 bg-primary h-100 p-1 position-absolute previously-played small start-0 top-0' style='display: none'></div>
    <div class='align-items-center d-flex flex-row w-100'>
      <div class='d-flex me-3' style='height: 5rem;'>
    </div>
    <div class='flex-fill mediaDesc'>`
    + path.basename(item)
      .replace(/^(\d{2}-\d{2} - )/, "<span class='sort-prefix text-nowrap' style='display: none;'>$1</span>")
      .replace(/Paragraph (\d+) -/g, "<big><span class='alert alert-secondary fw-bold px-2 py-1 small'><i class='fas fa-paragraph'></i> $1</span></big>")
      .replace(/Song (\d+) -/g, "<big><span class='alert alert-info fw-bold px-2 py-1 small'><i class='fas fa-music'></i> $1</span></big>")
    + `</div>
    <div class='ps-3 pe-2'>
      <button class='btn btn-lg btn-warning pausePlay pause' style='visibility: hidden;'>
        <i class='fas fa-fw fa-pause'></i>
      </button>
    </div>
    <div class='d-flex flex-shrink-0'>
      <button class='btn btn-lg btn-warning stop' data-bs-toggle='popover' data-bs-trigger='focus' style='display: none;'>
        <i class='fas fa-fw fa-stop'></i>
      </button>
      <button class='btn btn-lg btn-primary play'>
        <i class='fas fa-fw fa-play'></i>
      </button>
      <div class='btn btn-lg btn-info move-handle mb-0 ms-3' style='display: none;'>
        <i class='fas fa-sort'></i>
      </div>
    </div>
  </div>
  <div class='align-items-center d-flex flex-row w-100'>
    <div class='d-flex flex-wrap markerList w-100' style='column-count: 3;'>
    </div>
  </div>
  ${(isVideo(item) || isAudio(item) ? `<div id='videoBounds' class='bg-transparent bottom-0 justify-content-between position-absolute progress start-0 w-100' style='height: 3px; display: none; z-index: 2;'>
    <div class='progress-bar bg-danger Start' role='progressbar' style='width: 0%'></div>
    <div class='progress-bar bg-danger End' role='progressbar' style='width: 0%'></div>
  </div>` : "")}
</li>`);

    lineItem.find(".mediaDesc").prev("div").append($("<div class='align-self-center d-flex media-item position-relative'></div>").append((isVideo(item) || isAudio(item) ? $("<video preload='metadata' " + (isAudio(item) && !isVideo(item) ? `poster='${constants.AUDIO_ICON}'` : `poster='${constants.VIDEO_ICON}'`) + "><source src='" + url.pathToFileURL(item).href + "#t=5'></video>").on("loadedmetadata", function() {
      try {
        lineItem.data("originalStart", 0);
        if ($(this)[0].duration) {
          let durationAsMs = dayjs.duration($(this)[0].duration, "s").asMilliseconds().toFixed(0);
          lineItem.data("originalEnd", durationAsMs);
          lineItem.find(".time .duration").text(dayjs.duration(durationAsMs, "ms").format("mm:ss"));
        }
      } catch (err) {
        log.error(err);
      }
    }).add(`<div class='h-100 w-100 position-absolute p-2 small text-light customStartStop d-none flex-column'>
    <div class='d-flex'>
      <div class='d-flex fs-5 align-items-center'>
        <i role='button' class='setTimeToCurrent beginning fas fa-fw fa-backward-step'></i>
      </div>
    <div>
    <input type='text' class='col form-control form-control-sm timestart px-1 py-0 text-center'>
  </div>
  <div class='d-flex fs-5 align-items-center'>
    <i role='button' class='fas fa-fw fa-rotate-left timeReset'></i>
  </div>
</div>
<div class='d-flex'>
  <div class='d-flex fs-5 align-items-center'>
    <i role='button' class='fas fa-fw fa-forward-step setTimeToCurrent end'></i></i>
  </div>
  <div><input type='text' class='col form-control form-control-sm timeend px-1 py-0 text-center'></div>
  <div class='d-flex fs-5 align-items-center'><i role='button' tabindex='0' class='applyTimeChanges fas fa-fw fa-square-check text-danger'></i></div>
  </div></div>`)
      .add($("<div role='button' tabindex='0' class='bottom-0 position-absolute px-2 small start-0 text-light time'><i class='fas fa-" + (isVideo(item) ? "film" : "headphones-simple" ) + "'></i> <span class='current'></span><span class='duration'></span></div>")
        .popover({
          content: translate("clickAgain"),
          container: "body",
          trigger: "focus"
        }).on("hidden.bs.popover", function() {
          unconfirm(this);
        }).on("click", function() {
          if (!$(this).hasClass("confirmed")) {
            waitToConfirm(this);
          } else {
            unconfirm(this);
            getMediaDuration(lineItem);
            lineItem.find(".customStartStop").toggleClass("d-flex d-none");
            $(this).hide();
          }
        })) : "<img class='mx-auto' src='" + url.pathToFileURL(item).href + "' />")));
    if (lineItem.hasClass("video") && fs.existsSync(path.changeExt(item, ".json"))) {
      lineItem.data("markers", JSON.parse(fs.readFileSync(path.changeExt(item, ".json"), "utf8")));
      for (let marker of lineItem.data("markers")) {
        let startTime = {
          asTime: dayjs(marker.startTime, "hh:mm:ss.SSS")
        };
        startTime.asMs = dayjs.duration({
          h: startTime.asTime.format("h"),
          m: startTime.asTime.format("m"),
          s: startTime.asTime.format("s"),
          ms: startTime.asTime.format("SSS"),
        }).asMilliseconds();
        let endTime = {
          offsetFromStart: dayjs(marker.duration, "hh:mm:ss.SSS"),
          transitionAsTime: dayjs(marker.endTransitionDuration, "hh:mm:ss.SSS")
        };
        endTime.offsetAsMs = dayjs.duration({
          h: endTime.offsetFromStart.format("h"),
          m: endTime.offsetFromStart.format("m"),
          s: endTime.offsetFromStart.format("s"),
          ms: endTime.offsetFromStart.format("SSS"),
        }).asMilliseconds();
        endTime.transitionAsMs = dayjs.duration({
          h: endTime.transitionAsTime.format("h"),
          m: endTime.transitionAsTime.format("m"),
          s: endTime.transitionAsTime.format("s"),
          ms: endTime.transitionAsTime.format("SSS"),
        }).asMilliseconds();
        endTime.asMs = startTime.asTime.add(dayjs.duration(endTime.offsetAsMs, "ms")).subtract(endTime.transitionAsMs + 400, "ms");
        lineItem.find(".markerList").append($("<div>", {
          "data-custom-start": startTime.asMs,
          "data-custom-end": endTime.asMs,
          class: "btn btn-sm btn-info mt-2 me-2",
          role: "button",
          text: marker.label
        }));
      }
      lineItem.find(".markerList .btn").on("click", function() {
        lineItem.data("customStart", $(this).data("customStart"));
        lineItem.data("customEnd", $(this).data("customEnd"));
        lineItem.find("button.play:not(.pausePlay)").trigger("click");
        lineItem.find(".markerList div.btn.btn-primary").addClass("btn-info").removeClass("btn-primary");
        $(this).removeClass("btn-info").addClass("btn-primary");
        lineItem.find(".time").addClass("pulse-danger");
        $(this).addClass("opacity-75");
      });
    }
    lineItem.find(".customStartStop i.setTimeToCurrent").on("click", function() {
      try {
        if (!isNaN(lineItem.data("timeElapsed"))) lineItem.find(".time" + ($(this).hasClass("beginning") ? "start" : "end")).val(dayjs.duration(Math.round(lineItem.data("timeElapsed") * 1000, "ms")).format("mm:ss.SSS")).trigger("change");
      } catch (err) {
        log.error(err);
      }
    });
    lineItem.find(".customStartStop i.timeReset").on("click", function() {
      try {
        for (let timeItem of ["Start", "End"]) {
          lineItem.find(".time" + timeItem.toLowerCase()).val(!isNaN(lineItem.data("original" + timeItem)) ? dayjs.duration(lineItem.data("original" + timeItem), "ms").format("mm:ss.SSS"): "");
        }
      } catch (err) {
        log.error(err);
      }
    });
    lineItem.find(".customStartStop .timestart, .customStartStop .timeend").inputmask("99:99.999", { "placeholder": "0" }).on("change", function() {
      try {
        let inputTimes = {};
        for (let timeItem of ["Start", "End"]) {
          inputTimes[timeItem] = {
            asTime: dayjs($(this).closest(".customStartStop").find(".time" + timeItem.toLowerCase()).val(), "mm:ss.SSS")
          };
          inputTimes[timeItem].asMs = dayjs.duration({
            m: inputTimes[timeItem].asTime.format("m"),
            s: inputTimes[timeItem].asTime.format("s"),
            ms: inputTimes[timeItem].asTime.format("SSS"),
          }).asMilliseconds();
        }
        if (isNaN(inputTimes.Start.asMs) || isNaN(inputTimes.End.asMs) || inputTimes.Start.asMs < 0 || inputTimes.End.asMs > lineItem.data("originalEnd") || inputTimes.Start.asMs >= inputTimes.End.asMs || inputTimes.End.asMs <= inputTimes.Start.asMs) {
          $(this).val(dayjs.duration($(this).hasClass("timestart") ? 0 : lineItem.data("originalEnd"), "ms").format("mm:ss.SSS"));
        }
      } catch (err) {
        log.error(err);
      }
    });
    lineItem.find(".customStartStop i.applyTimeChanges").popover({
      content: translate("clickAgain"),
      container: "body",
      trigger: "focus"
    }).on("hidden.bs.popover", function() {
      unconfirm(this);
    }).on("click", function() {
      if (!$(this).hasClass("confirmed")) {
        waitToConfirm(this);
      } else {
        unconfirm(this);
        try {
          for (let timeItem of ["Start", "End"]) {
            let inputTime = dayjs(lineItem.find(".time" + timeItem.toLowerCase()).val(), "mm:ss.SSS");
            let newTimeAsMs = dayjs.duration({
              m: inputTime.format("m"),
              s: inputTime.format("s"),
              ms: inputTime.format("SSS"),
            }).asMilliseconds();
            if (lineItem.data("original" + timeItem).toString() !== newTimeAsMs.toString()) {
              lineItem.data("custom" + timeItem, newTimeAsMs);
              lineItem.find(".stop:visible").addClass("confirmed").trigger("click");
            } else {
              lineItem.removeData("custom" + timeItem);
            }
            lineItem.find("#videoBounds ." + timeItem).css("width", Math.abs((timeItem == "End" ? 100 : 0) - (newTimeAsMs / lineItem.data("originalEnd") * 100)) + "%");
          }
          lineItem.find(".time .current").text(!isNaN(lineItem.data("customStart")) ? dayjs.duration(lineItem.data("customStart"), "ms").format("mm:ss/") : "");
          lineItem.find(".time .duration").text(dayjs.duration(!isNaN(lineItem.data("customEnd")) ? lineItem.data("customEnd") : lineItem.data("originalEnd"), "ms").format("mm:ss"));
          let customStartStopIsSet = (!!lineItem.data("customStart") && lineItem.data("customStart") !== lineItem.data("originalStart")) || (!!lineItem.data("customEnd") && lineItem.data("customEnd") !== lineItem.data("originalEnd"));
          lineItem.find(".time").toggleClass("pulse-danger", customStartStopIsSet).show();
          if (customStartStopIsSet) {
            lineItem.find("#videoBounds").show("blind", { direction: "vertical"}, fadeDelay);
          } else {
            lineItem.find("#videoBounds").hide("blind", { direction: "vertical"}, fadeDelay);
          }
          lineItem.find(".customStartStop").toggleClass("d-flex d-none");
        } catch (err) {
          log.error(err);
        }
      }
    });
    if (isVideo(item) || isAudio(item) || isImage(item)) $("div#folderListing").append(lineItem);
  }
  function getMediaDuration(lineItem) {
    for (let timeItem of ["Start", "End"]) {
      try {
        lineItem.find(".time" + timeItem.toLowerCase()).val(dayjs.duration(!isNaN(lineItem.data("custom" + timeItem)) ? lineItem.data("custom" + timeItem) : lineItem.data("original" + timeItem), "ms").format("mm:ss.SSS"));
      } catch (err) {
        log.error(err);
      }
    }
  }
  $("div#folderListing .video .stop").popover({
    content: translate("clickAgain")
  }).on("hidden.bs.popover", function() {
    unconfirm(this);
  });
}
function removeEventListeners() {
  document.removeEventListener("drop", dropHandler);
  document.removeEventListener("dragover", dragoverHandler);
  document.removeEventListener("dragenter", dragenterHandler);
  document.removeEventListener("dragleave", dragleaveHandler);
}

function sanitizeFilename(filename, isNotFile) {
  let fileExtIfApplicable = (isNotFile ? "" : path.extname(filename).toLowerCase());
  filename = path.basename(filename, (isNotFile ? "" : path.extname(filename))).replace(/["»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1f\x80-\x9f]/g, "").replace(/ *[—?;:|.!?] */g, " - ").replace(/\u00A0/g, " ").trim().replace(/[ -]+$/g, "") + fileExtIfApplicable;
  if (!isNotFile && paths.media) {
    let maxCharactersInPath = 245,
      projectedPathCharLength = path.join(paths.media, "9999-99-99", filename).length;
    if (projectedPathCharLength > maxCharactersInPath) {
      filename = path.basename(filename, (isNotFile ? "" : path.extname(filename))).slice(0, -(projectedPathCharLength - maxCharactersInPath)).trim() + fileExtIfApplicable;
    }
    let currentBytes = Buffer.byteLength(filename, "utf8");
    while (currentBytes > 200) {
      filename = path.basename(filename, (isNotFile ? "" : path.extname(filename))).slice(0, -1).trim() + fileExtIfApplicable;
      currentBytes = Buffer.byteLength(filename, "utf8");
    }
  }
  return path.basename(filename, (isNotFile ? "" : path.extname(filename))) + fileExtIfApplicable;
}
async function setMediaLang() {
  const prefs = get("prefs");
  if (prefs.lang) {
    jwpubDbs = {};
    meetingMedia = {};
    try {
      $("#songPicker").empty();
      for (let sjj of (await getMediaLinks({pubSymbol: get("songPub"), format: "MP4"}))) {
        $("#songPicker").append($("<option>", {
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
function setVars() {
  const prefs = get("prefs");
  if (prefs.localOutputPath && prefs.lang) {
    perf("setVars", "start");
    try {
      downloadStats = {};
      paths.media = path.join(prefs.localOutputPath, prefs.lang);
      if (!dryrun) fs.ensureDirSync(paths.media);
      paths.pubs = path.join(paths.app, "Publications", prefs.lang);
      paths.yearText = path.join(paths.pubs, "yeartext-" + prefs.lang + "-" + (new Date().getFullYear()).toString());
    } catch (err) {
      notifyUser("error", "errorSetVars", paths.media, true, err);
    }
    perf("setVars", "stop");
  }
}
function showModal(isVisible, header, headerContent, bodyContent, footer, footerButtonEnabled) {
  if (isVisible) {
    $("#staticBackdrop .modal-header").html(header ? "<h5 class='modal-title'>" + headerContent + "</h5>" : "").toggle(header);
    $("#staticBackdrop .modal-body").html(bodyContent);
    if (footer) $("#staticBackdrop .modal-footer").html($("<button type='button' class='btn btn-primary' data-bs-dismiss='modal'><i class='fas fa-fw fa-check'></i></button>").prop("disabled", !footerButtonEnabled));
    $("#staticBackdrop .modal-footer").toggle(footer);
    modal.show();
  } else {
    modal.hide();
  }
}
function showMediaWindow() {
  shortcutSet("Alt+D", "mediaWindow", function () {
    if ($("#staticBackdrop:visible").length == 0) $("#btnMediaWindow:visible").trigger("click");
  });
  shortcutSet("Alt+Z", "mediaWindow", function () {
    $("#btnToggleMediaWindowFocus").trigger("click");
  });
  require("electron").ipcRenderer.send("showMediaWindow", getMediaWindowDestination());
}
async function startMediaDisplay() {
  try {
    await obsSetScene(get("prefs").obsCameraScene);
    await getRemoteYearText().finally(() => {
      require("electron").ipcRenderer.send("startMediaDisplay", paths.prefs);
    });
  } catch(err) {
    log.error(err);
  }
}
async function startMediaSync(isDryrun, meetingFilter) {
  const prefs = get("prefs");
  perf("total", "start");
  dryrun = set("dryrun", !!isDryrun);
  if (!dryrun) {
    $("#statusIcon").toggleClass("text-primary text-muted fa-flip");
    $("#congregationSelect-dropdown").addClass("sync-started");
    $(".alertIndicators.btn-success").addClass("btn-secondary").removeClass("btn-success");
  }
  stayAlive = false;
  $(".alertIndicators:not(.disabledWhileSyncing):not(.disabled)").addClass("disabledWhileSyncing disabled");
  if (!dryrun) $("#btn-settings").fadeToAndToggle(fadeDelay, 0);
  await setVars();
  if (!dryrun) await rm(glob.sync(path.join(paths.media, "*/"), {
    ignore: [path.join(paths.media, "Recurring")],
    onlyDirectories: true
  }).filter(folderPath => dayjs(path.basename(folderPath), prefs.outputFolderDateFormat).isValid() && dayjs(path.basename(folderPath), prefs.outputFolderDateFormat).isBefore(now) || !dayjs(path.basename(folderPath), prefs.outputFolderDateFormat).isValid()));
  perf("getJwOrgMedia", "start");
  updateStatus("globe-americas");
  await Promise.all([
    (!meetingFilter || meetingFilter == "mw") && getMwMediaFromDb(),
    (!meetingFilter || meetingFilter == "we") && getWeMediaFromDb()
  ]);
  perf("getJwOrgMedia", "stop");
  createMediaNames();
  if (webdavIsAGo) await getCongMedia();
  if (!dryrun) {
    updateStatus("download");
    await Promise.all([
      syncCongMedia(),
      syncJwOrgMedia(),
      syncLocalRecurringMedia(),
    ]);
    await convertUnusableFiles(rm, paths.media);
    if (prefs.enableMp4Conversion) await mp4Convert(perf, updateStatus, updateTile, progressSet, createVideoSync, totals, paths.media);
    if (prefs.enableVlcPlaylistCreation) createVlcPlaylists();
    if (prefs.autoOpenFolderWhenDone) shell.openPath(url.fileURLToPath(url.pathToFileURL(paths.media).href));
    $("#btn-settings").fadeToAndToggle(fadeDelay, 1);
    $("#statusIcon").toggleClass("text-muted text-primary fa-flip");
    updateStatus("photo-video");
    setTimeout(() => {
      $(".alertIndicators").addClass("btn-secondary").removeClass("btn-success");
    }, fadeDelay * 65);
    $("#congregationSelect-dropdown").removeClass("sync-started");
  }
  $(".alertIndicators.disabledWhileSyncing").removeClass("disabledWhileSyncing disabled");
  perf("total", "stop");
  perfPrint();
}
function closeMediaWindow() {
  shortcutsUnset("mediaWindow");
  require("electron").ipcRenderer.send("closeMediaWindow");
}
function stopMeetingMusic() {
  const clearMusic = () => {
    $("#meetingMusic").remove();
    $("#btnStopMeetingMusic").hide().addClass("btn-warning").removeClass("btn-danger stopping");
    $("#musicRemaining").empty().show();
    if (get("prefs").enableMusicButton) $("#btnMeetingMusic").attr("title", "Alt+K").show();
    $("#congregationSelect-dropdown").removeClass("music-playing");
    $("#congregationSelect-dropdown:not(.sync-started)").prop("disabled", false);
    pendingMusicFadeOut = {};
  };
  try {
    clearTimeout(pendingMusicFadeOut.id);
    $("#btnStopMeetingMusic").removeClass("btn-warning").addClass("btn-danger");
    $("#musicRemaining").hide();
    if ($("#btnStopMeetingMusic").hasClass("stopping")) {
      clearMusic();
    } else {
      $("#btnStopMeetingMusic").addClass("stopping");
      $("#meetingMusic").stop().animate({volume: 0}, fadeDelay * (pendingMusicFadeOut.autoStop ? 50 : 10), () => {
        clearMusic();
      });
    }
  } catch (err) {
    log.error(err);
    clearMusic();
  }
}
async function syncCongMedia() {
  const prefs = get("prefs");
  let congSyncMeetingMedia = Object.fromEntries(Object.entries(meetingMedia).filter(([key]) => key !== "Recurring" && dayjs(key, prefs.outputFolderDateFormat).isValid() && dayjs(key, prefs.outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")));
  if (webdavIsAGo) {
    perf("syncCongMedia", "start");
    try {
      totals.cong = {
        total: Object.values(congSyncMeetingMedia).map(parts => Object.values(parts).map(part => part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden).length)).flat().reduce((previousValue, currentValue) => previousValue + currentValue, 0),
        current: 1
      };
      for (let datedFolder of await glob.sync(path.join(paths.media, "*/"), {
        ignore: [path.join(paths.media, "Recurring")],
        onlyDirectories: true
      })) {
        if (congSyncMeetingMedia[path.basename(datedFolder)]) for (let jwOrCongFile of await glob.sync(path.join(datedFolder, "*"))) {
          if (!congSyncMeetingMedia[path.basename(datedFolder)].map(part => part.media.filter(media => !media.hidden).map(media => media.safeName)).flat().includes(path.basename(jwOrCongFile))) await rm(jwOrCongFile);
        }
      }
      progressSet(totals.cong.current, totals.cong.total, "specificCong");
      for (let [meeting, parts] of Object.entries(congSyncMeetingMedia)) {
        for (let part of parts) {
          for (var mediaItem of part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden)) {
            log.info("%c[congMedia] [" + meeting + "] " + mediaItem.safeName, "background-color: #d1ecf1; color: #0c5460");
            await webdavGet(mediaItem);
            if (mediaItem.recurring) updateTile("recurringMedia", "warning");
            totals.cong.current++;
            progressSet(totals.cong.current, totals.cong.total, "specificCong");
          }
        }
      }
      if (Object.values(congSyncMeetingMedia).flat().map(part => part.media).flat().filter(media => media.recurring).length > 0) updateTile("recurringMedia", "success");
      updateTile("specificCong", "success");
    } catch (err) {
      notifyUser("error", "errorSyncCongMedia", null, true, err, true);
      updateTile("specificCong", "danger");
      progressSet(0, 100, "specificCong");
    }
    perf("syncCongMedia", "stop");
  }
}
async function syncJwOrgMedia() {
  const prefs = get("prefs");
  perf("syncJwOrgMedia", "start");
  updateTile("syncJwOrgMedia", "warning");
  let jwOrgSyncMeetingMedia = Object.fromEntries(Object.entries(meetingMedia).filter(([key]) => key !== "Recurring" && dayjs(key, prefs.outputFolderDateFormat).isValid() && dayjs(key, prefs.outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")));
  totals.jw = {
    total: Object.values(jwOrgSyncMeetingMedia).map(meeting => Object.values(meeting).map(part => part.media.filter(mediaItem => !mediaItem.congSpecific).length)).flat().reduce((previousValue, currentValue) => previousValue + currentValue, 0),
    current: 1
  };
  progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
  for (var h = 0; h < Object.values(jwOrgSyncMeetingMedia).length; h++) { // meetings
    var meeting = Object.values(jwOrgSyncMeetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      var partMedia = meeting[i].media.filter(mediaItem => !mediaItem.congSpecific);
      for (var j = 0; j < partMedia.length; j++) { // media
        if (!partMedia[j].hidden && !partMedia[j].congSpecific && !partMedia[j].isLocal && !dryrun) {
          if (!partMedia[j].filesize) {
            notifyUser("warn", "warnFileNotAvailable", [partMedia[j].queryInfo.KeySymbol, partMedia[j].queryInfo.Track, partMedia[j].queryInfo.IssueTagNumber].filter(Boolean).join("_"), true, partMedia[j]);
          } else {
            log.info("%c[jwOrg] [" + Object.keys(jwOrgSyncMeetingMedia)[h] + "] " + partMedia[j].safeName, "background-color: #cce5ff; color: #004085;");
            if (partMedia[j].markers) {
              let markers = partMedia[j].markers.markers.map(({duration, label, startTime, endTransitionDuration}) => ({duration, label, startTime, endTransitionDuration}));
              markers = Array.from(new Set(markers.map(JSON.stringify))).map(JSON.parse);
              fs.ensureDirSync(path.join(paths.media, partMedia[j].folder));
              fs.writeFileSync(path.join(paths.media, partMedia[j].folder, path.changeExt(partMedia[j].safeName, ".json")), JSON.stringify(markers));
            }
            if (partMedia[j].url) {
              await downloadIfRequired(partMedia[j]);
            } else {
              fs.ensureDirSync(path.join(paths.media, partMedia[j].folder));
              var destFile = path.join(paths.media, partMedia[j].folder, partMedia[j].safeName);
              if (!fs.existsSync(destFile) || fs.statSync(destFile).size !== partMedia[j].filesize) fs.copyFileSync(partMedia[j].filepath, destFile);
            }
          }
        }
        totals.jw.current++;
        progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
      }
    }
  }
  updateTile("syncJwOrgMedia", "success");
  perf("syncJwOrgMedia", "stop");
}
function syncLocalRecurringMedia() {
  const prefs = get("prefs");
  if (!webdavIsAGo && fs.existsSync(path.join(paths.media, "Recurring"))) {
    updateTile("recurringMedia", "warning");
    glob.sync(path.join(paths.media, "Recurring", "*")).forEach((recurringItem) => {
      Object.keys(meetingMedia).filter(key => key !== "Recurring" && dayjs(key, prefs.outputFolderDateFormat).isValid() && dayjs(key, prefs.outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")).forEach((meeting) => {
        fs.ensureDirSync(path.join(paths.media, meeting));
        fs.copyFileSync(recurringItem, path.join(paths.media, meeting, path.basename(recurringItem)));
      });
    });
    updateTile("recurringMedia", "success");
  }
}
async function testApp() {
  setLogLevel("debug");
  let previousLang = get("prefs").lang;
  for (var lang of ["E", "F", "M", "R", "S", "T", "U", "X"] ) {
    setPref("lang", lang);
    await startMediaSync(true);
  }
  setPref("lang", previousLang);
  setLogLevel("info");
}
function toggleHardwareAcceleration() {
  if (get("prefs").disableHardwareAcceleration) {
    fs.writeFileSync(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"), "true");
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
function toggleScreen(screen, forceShow, sectionToShow) {
  return new Promise((resolve) => {
    if (screen === "overlaySettings" && !$("#" + screen).is(":visible")) {
      $("#" + screen + " .accordion-collapse").each(function() {
        $(this).collapse($(this).find(".is-invalid").length > 0 || $(this).prop("id") == sectionToShow ? "show" : "hide");
      });
    }
    if (forceShow) {
      $("#" + screen).slideDown(fadeDelay, () => resolve() );
    } else {
      $("#" + screen).slideToggle(fadeDelay, () => resolve() );
    }
  });
}
function updateCleanup() {
  const prefs = get("prefs");
  try { // do some housecleaning after version updates
    var lastRunVersion = "0";
    if (fs.existsSync(paths.lastRunVersion)) lastRunVersion = fs.readFileSync(paths.lastRunVersion, "utf8");
  } catch(err) {
    notifyUser("warn", "warnUnknownLastVersion", null, false, err);
  } finally {
    if (lastRunVersion !== currentAppVersion) {
      try {
        if (parseInt(lastRunVersion.replace(/\D/g, "")) <= 2255 && parseInt(currentAppVersion.replace(/\D/g, "")) >= 2256) { // one-time migrate from jwmmf to mmm
          try {
            let files = glob.sync(path.join(remote.app.getPath("appData"), "jw-meeting-media-fetcher", "pref*.json"));
            files.push(path.join(remote.app.getPath("appData"), "jw-meeting-media-fetcher", "Publications"));
            for (let file of files) {
              try {
                if (fs.pathExistsSync(file)) fs.copySync(file, path.join(remote.app.getPath("userData"), path.basename(file)));
              } catch (err) {
                log.error(file, err);
              }
            }
            let prevJwmmfVersion = path.join(remote.app.getPath("appData"), "jw-meeting-media-fetcher", "lastRunVersion.json");
            if (fs.existsSync(prevJwmmfVersion)) lastRunVersion = fs.readFileSync(prevJwmmfVersion, "utf8");
            fs.removeSync(path.join(remote.app.getPath("appData"), "jw-meeting-media-fetcher"));
          } catch (err) {
            log.error(err);
          }
        }
        setVars();
        // for dev only
        // fs.writeFileSync(paths.lastRunVersion, currentAppVersion);
        if (remote.app.isPackaged) fs.writeFileSync(paths.lastRunVersion, currentAppVersion);
        if (lastRunVersion !== "0") {
          notifyUser("info", "updateInstalled", currentAppVersion, false, null, {desc: "moreInfo", url: constants.REPO_URL + "releases/latest"});
          /* if (parseInt(lastRunVersion.replace(/\D/g, "")) <= 2242 && parseInt(currentAppVersion.replace(/\D/g, "")) >= 2243) {
          notifyUser(
            "info",
            `<h6>Managing media just got simpler</h6>
               <p>You can now choose which files will be downloaded from JW.org for any particular meeting, as well as add or remove additional media to a meeting, <strong>simply by clicking that day's icon</strong> on the main screen.</p>
               ${(prefs.congServer ? "<p>The cloud upload button has therefore been removed from the bottom left corner of the app.</p>" : "")}
               <p>Media can also now easily be added to non-meeting days, for special events and meetings, simply by clicking the desired date.</p>
               <h6>In short:</h6>
               ${prefs.congServer ? "<li>No more cloud button</li> " : ""}
               <li><strong>Click on any day</strong> to manage media for that day</li>`,
            null, true, null, {desc: "understood", noLink: true}, true);
             $("#folders").addClass("new-stuff");
           }*/
          let currentLang = get("jsonLangs") ? get("jsonLangs").filter(item => item.langcode === prefs.lang)[0] : null;
          if (prefs.lang && currentLang && !fs.readdirSync(path.join(__dirname, "locales")).map(file => file.replace(".json", "")).includes(currentLang.symbol)) notifyUser("wannaHelp", translate("wannaHelpExplain") + "<br/><small>" +  translate("wannaHelpWillGoAway") + "</small>", currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")", true, null, {
            desc: "wannaHelpForSure",
            url: constants.REPO_URL + "discussions/new?category=translations&title=New+translation+in+" + currentLang.name + "&body=I+would+like+to+help+to+translate+M³+into+a+language+I+speak,+" + currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")."
          });
          getJwOrgLanguages(true).then(function() {
            setMediaLang();
          });
        }
      } catch (err) {
        log.error(err);
      }
    }
  }
}
function updateFileList(initialLoad) {
  try {
    if (initialLoad) {
      $("#chooseUploadType input").prop("checked", false).trigger("change");
      $("#chooseUploadType label.active").removeClass("active");
      $("#btnUpload").prop("disabled", false).find("i").addClass("fa-save").removeClass("fa-circle-notch fa-spin");
      $("#overlayUploadFile button:enabled, #overlayUploadFile select:enabled, #overlayUploadFile input:enabled").addClass("disabled-while-load").prop("disabled", true);
      $("#fileList").empty();
    }
    $("div.row.file-to-upload").fadeToAndToggle(fadeDelay, $("input[name='chooseUploadType']").is(":checked"));
    $("div.row.prefix").fadeToAndToggle(fadeDelay, !!$("#fileToUpload").val());
    $("#overlayUploadFile *:not(.enterPrefixInput):enabled").prop("disabled", true).addClass("fileListLoading");
    var weekMedia = {
      existing: [],
      new: []
    };
    if (!meetingMedia[$("#chosenMeetingDay").data("folderName")]) meetingMedia[$("#chosenMeetingDay").data("folderName")] = [];
    weekMedia.existing = meetingMedia[$("#chosenMeetingDay").data("folderName")].filter(mediaItem => mediaItem.media.length > 0);
    if (!webdavIsAGo) {
      if (fs.existsSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName")))) {
        fs.readdirSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName"))).map(item => {
          let existingItem = weekMedia.existing.map(weekMediaItem => weekMediaItem.media).flat().filter(weekMediaItemMedia => weekMediaItemMedia.safeName == item);
          if (existingItem.length >0) {
            existingItem.map(item => {
              item.isLocal = true;
              return item;
            });
          } else {
            weekMedia.existing.push({
              title: item,
              media: [{
                safeName: item,
                isLocal: true,
                isNotPresentOnRemote: true,
                filepath: path.join(paths.media, $("#chosenMeetingDay").data("folderName"), item)
              }]
            });
          }
        });
      }
      if ($("#chosenMeetingDay").data("folderName") !== "Recurring" && fs.existsSync(path.join(paths.media, "Recurring"))) {
        fs.readdirSync(path.join(paths.media, "Recurring")).map(function(item) {
          let recurringItem = weekMedia.existing.map(weekMediaItem => weekMediaItem.media).flat().filter(weekMediaItemMedia => weekMediaItemMedia.safeName == item);
          if (recurringItem.length >0) {
            recurringItem.map(item => {
              item.recurring = true;
              return item;
            });
          } else {
            weekMedia.existing.push({
              title: item,
              media: [{
                safeName: item,
                isLocal: true,
                recurring: true,
                filepath: path.join(paths.media, "Recurring", item)
              }]
            });
          }
        });
      }
    }
    var newFiles = [];
    let newFileChosen = $("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0;
    if (newFileChosen) {
      for (var splitFileToUpload of $("input#typeSong:checked").length > 0 ? [$("#songPicker option:selected").text() + ".mp4"] : $("#fileToUpload").val().split(" -//- ")) {
        newFiles.push({
          title: "New file!",
          media: [{
            safeName: sanitizeFilename(getPrefix() + " - " + path.basename(splitFileToUpload)).trim(),
            newFile: true,
            recurring: false,
            filepath: splitFileToUpload,
            trackImage: ($("input#typeSong:checked").length > 0 && $("#songPicker option:selected").data("thumbnail") ? $("#songPicker option:selected").data("thumbnail") : null)
          }]
        });
      }
      weekMedia.new = newFiles;
    }
    $("#fileList li.new-file").slideUp(fadeDelay, function() {
      $(this).remove();
      $(".tooltip").remove();
      $("#btnUpload").toggle(newFileChosen).prop("disabled", $("#fileList .duplicated-file").length > 0);
    });
    let newList = Object.values(weekMedia).flat().filter(Boolean).map(weekMediaItem => weekMediaItem.media).flat().sort((a, b) => a.safeName.localeCompare(b.safeName));
    for (var file of newList) {
      let html = $("<li data-bs-toggle='tooltip' " + (file.isNotPresentOnRemote ? "data-isnotpresentonremote='true' " : "") + (file.thumbnail ? "data-thumbnail='" + file.thumbnail + "' " : "") + (file.url ? "data-url='" + file.url + "'": "data-islocal='true'") + " data-safename='" + file.safeName + "' style='display: none;'><span class='filename w-100'>" + file.safeName + "</span><div class='infoIcons ms-1'></div></li>").tooltip({
        title: file.safeName
      });
      if (!file.recurring && ((file.isLocal && !file.newFile) || file.congSpecific)) html.addClass("canDelete").prepend($("<i role='button' tabindex='0' class='fas fa-fw fa-minus-square me-2 text-danger'></i>").popover({
        content: translate("clickAgain"),
        container: "body",
        trigger: "focus"
      }).on("hidden.bs.popover", function() {
        unconfirm(this);
      }));
      if (!file.newFile) {
        if ((file.isLocal || file.congSpecific) && !file.recurring) html.addClass("canMove").find(".infoIcons").append("<i class='fas fa-fw fa-pen me-1'></i>");
        if (!file.isLocal && ((!file.congSpecific && (file.url || file.safeName.includes(" - "))) || file.recurring) && !file.hidden) html.addClass("canHide").prepend("<i class='far fa-fw fa-check-square me-2'></i>");
        if (file.recurring && file.isLocal || !file.isNotPresentOnRemote && !file.congSpecific && !(file.url || file.safeName.includes(" - "))) html.addClass("cantHide").prepend("<i class='fas fa-fw fa-stop me-2'></i>");
      }
      if (file.hidden) html.addClass("wasHidden").prepend("<i class='far fa-fw fa-square me-2'></i>");
      if (file.newFile) html.addClass("new-file").prepend("<i class='fas fa-fw fa-plus-square me-2'></i>");
      if (Object.values(weekMedia).flat().map(weekMediaItem => weekMediaItem.media).flat().filter(item => item.safeName == file.safeName).length > 1) html.addClass("duplicated-file");
      let fileOrigin = "fa-globe-americas";
      if (file.congSpecific || file.newFile || file.isNotPresentOnRemote || file.isLocal) {
        fileOrigin = webdavIsAGo ? "fa-cloud" : "fa-folder-open";
        if (file.recurring) html.find(".infoIcons").append("<i class='fas fa-fw fa-sync-alt me-1'></i>");
      }
      let fileType = "far fa-question-circle";
      if (isImage(file.safeName)) {
        fileType = "far fa-image";
      } else if (isVideo(file.safeName) || isAudio(file.safeName)) {
        fileType = "fas fa-film";
      } else if (path.extname(file.safeName).toLowerCase() == ".pdf") {
        fileType = "far fa-file-pdf";
      }
      html.find(".infoIcons").append("<i class='fa-fw " + fileType + " file-type me-1'></i><i class='fas fa-fw " + fileOrigin + " file-origin me-1'></i>");
      if (file.trackImage || file.congSpecific || file.filepath || file.thumbnail) {
        let imageSrc = {};
        if (file.trackImage) {
          imageSrc.path = file.trackImage;
        } else if (file.filepath) {
          imageSrc.path = file.filepath;
          if (tempMediaArray.find(item => item.filename == file.filepath)) imageSrc.data = tempMediaArray.find(item => item.filename == file.filepath).contents;
        } else if (file.thumbnail || file.url) {
          imageSrc.path = file.thumbnail || file.url;
        } else {
          imageSrc.path = path.join(paths.media, $("#chosenMeetingDay").data("folderName"), file.safeName);
        }
        if (isImage(imageSrc.path)) {
          if (file.congSpecific) {
            request("https://" + get("prefs").congServer + ":" + get("prefs").congServerPort + file.url, {
              webdav: true,
              isFile: true
            }).then(res => {
              if (res.data) {
                html.tooltip("dispose").tooltip({
                  html: true,
                  title: $("<img />", {
                    style: "max-height: 100%; max-width: 100%; min-width: 180px;",
                    src: "data:;base64," + Buffer.from(res.data, "binary").toString("base64")
                  })
                });
              }
            });
          } else {
            html.tooltip("dispose").tooltip({
              html: true,
              title: $("<img />", {
                style: "max-height: 100%; max-width: 100%; min-width: 180px;",
                src: (imageSrc.data ? "data:;base64," + Buffer.from(imageSrc.data, "binary").toString("base64") : imageSrc.path)
              })
            });
          }
        }
      }
      let insertPosition = $("#fileList li").toArray().concat(html).sort((a, b) => $(a).text().localeCompare($(b).text())).indexOf(html);
      if (initialLoad || file.newFile) {
        if (insertPosition >= $("#fileList li").length) {
          html.appendTo($("#fileList")).slideDown(fadeDelay);
        } else {
          if (insertPosition < $("#fileList li").length) {
            html.insertBefore($("#fileList li").eq($("#fileList li").toArray().concat(html).sort((a, b) => $(a).text().localeCompare($(b).text())).indexOf(html))).slideDown(fadeDelay);
          }
        }
      }
    }
    $("#fileList li").css("width", 100 / Math.ceil(Object.values(weekMedia).flat().map(item => item.media).flat().length / 11) + "%");
    $("#btnUpload").toggle(newFileChosen).prop("disabled", $("#fileList .duplicated-file").length > 0);
    $(".btn-cancel-upload.file-selected").toggle(!!newFileChosen);
    $(".btn-cancel-upload.no-file-selected").toggle(!newFileChosen);
    $(".fileListLoading").prop("disabled", false).removeClass("fileListLoading");
  } catch (err) {
    notifyUser("error", "errorAdditionalMediaList", null, true, err, true);
  } finally {
    $(".disabled-while-load").prop("disabled", false).removeClass("disabled-while-load");
  }
}
function updateStatus(icon) {
  if (!dryrun) $("#statusIcon").removeClass($("#statusIcon").attr("class").split(" ").filter(el => !["fa-fw", "fa-3x", "fa-flip"].includes(el) && el.includes("fa-")).join(" ")).addClass("fa-" + icon);
}
function updateTile(tile, color) {
  if (!dryrun) $("#" + tile).removeClass($("#" + tile).attr("class").split(" ").filter(el => el.includes("btn-") && !el.includes("-sm")).join(" ")).addClass("btn-" + color);
}
function unconfirm(el) {
  clearTimeout($(el).data("popover-timeout-id"));
  let currentDangerClass = $(el).attr("class").split(" ").filter(el => el.includes("-danger"));
  if ($(el).hasClass("wasWarningBefore")) $(el).addClass(currentDangerClass.join(" ").replace("-danger", "-warning"));
  let currentColorClasses = $(el).attr("class").split(" ").filter(el => el.includes("-danger") || el.includes("-warning") || el.includes("-primary") || el.includes("-info") || el.includes("-secondary"));
  if (currentColorClasses.length > 1) $(el).removeClass($(el).hasClass("wasWarningBefore") ? currentDangerClass.join(" ") : "btn-warning");
  $(el).removeClass("wasWarningBefore confirmed").blur();
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
    fs.writeFileSync(paths.prefs, JSON.stringify(Object.keys(prefs).sort().reduce((acc, key) => ({...acc, [key]: prefs[key]}), {}), null, 2));
    congregationPrefsPopulate();
    congregationSelectPopulate();
  }
  if (restart) {
    remote.app.relaunch();
    remote.app.exit();
  }
  return configIsValid;
}
function waitToConfirm(el) {
  let currentWarningClass = $(el).attr("class").split(" ").filter(el => el.includes("-warning"));
  if (currentWarningClass.length > 0) $(el).addClass("wasWarningBefore");
  if (!$(el).hasClass("confirmed")) {
    $(el).addClass("confirmed " + (currentWarningClass.length > 0 ? currentWarningClass.join(" ").replace("-warning", "-danger") : "btn-warning"));
    if (currentWarningClass.length > 0) $(el).removeClass(currentWarningClass.join(" "));
    $(el).data("popover-timeout-id", setTimeout(function() {
      unconfirm(el);
    }, 3000));
  }
}
async function webdavExists(url) {
  return (await webdavStatus(url)) < 400;
}
async function webdavGet(file) {
  const prefs = get("prefs");
  let localFile = path.join(paths.media, file.folder, file.safeName);
  if (!fs.existsSync(localFile) || !(file.filesize == fs.statSync(localFile).size)) {
    fs.ensureDirSync(path.join(paths.media, file.folder));
    let perf = {
      start: performance.now(),
      bytes: file.filesize,
      name: file.safeName
    };
    let remoteFile = await request("https://" + prefs.congServer + ":" + prefs.congServerPort + file.url, {
      webdav: true,
      isFile: true
    });
    perf.end = performance.now();
    perf.bits = perf.bytes * 8;
    perf.ms = perf.end - perf.start;
    perf.s = perf.ms / 1000;
    perf.bps = perf.bits / perf.s;
    perf.mbps = perf.bps / 1000000;
    perf.dir = "down";
    log.debug(perf);
    fs.writeFileSync(localFile, Buffer.from(new Uint8Array(remoteFile.data)));
    downloadStat("cong", "live", file);
  } else {
    downloadStat("cong", "cache", file);
  }
}
async function webdavLs(dir, force) {
  const prefs = get("prefs");
  let items = [],
    congUrl = "https://" + prefs.congServer + ":" + prefs.congServerPort + dir;
  try {
    if (webdavIsAGo || force) {
      await webdavMkdir(dir);
      let listing = new XMLParser({removeNSPrefix: true}).parse((await request(congUrl, {
        method: "PROPFIND",
        responseType: "text",
        headers: {
          Accept: "text/plain",
          Depth: "1"
        },
        webdav: true
      })).data);
      if (listing && listing.multistatus && listing.multistatus.response && Array.isArray(listing.multistatus.response)) {
        items = listing.multistatus.response.filter(item => path.resolve(decodeURIComponent(item.href)) !== path.resolve(dir)).map(item => {
          let href = decodeURIComponent(item.href);
          return {
            filename: href,
            basename: path.basename(href),
            type: typeof item.propstat.prop.resourcetype === "object" && "collection" in item.propstat.prop.resourcetype ? "directory" : "file",
            size: item.propstat.prop.getcontentlength ? item.propstat.prop.getcontentlength : 0
          };
        }).sort((a, b) => a.basename.localeCompare(b.basename));
      }
      return items;
    }
  } catch (err) {
    notifyUser("error", "errorWebdavLs", congUrl, true, err);
    return items;
  }
}
async function webdavMkdir(dir) {
  const prefs = get("prefs");
  if (!(await webdavExists(dir))) await request("https://" + prefs.congServer + ":" + prefs.congServerPort + dir, {
    method: "MKCOL",
    webdav: true
  });
}
async function webdavMv(src, dst) {
  const prefs = get("prefs");
  try {
    let congServerAddress = "https://" + prefs.congServer + ":" + prefs.congServerPort;
    if (await webdavExists(dst)) {
      throw("File overwrite not allowed.");
    } else if (await webdavExists(src)) await request(congServerAddress + src, {
      method: "MOVE",
      headers: {
        "Destination": congServerAddress + encodeURI(dst)
      },
      webdav: true
    });
    return true;
  } catch (err) {
    notifyUser("error", "errorWebdavPut", src + " => " + dst, true, err);
    return false;
  }
}
async function webdavPut(file, destFolder, destName) {
  const prefs = get("prefs");
  let destFile = path.posix.join("https://" + prefs.congServer + ":" + prefs.congServerPort, destFolder, (await sanitizeFilename(destName)));
  try {
    if (webdavIsAGo && file && destFolder && destName) {
      await webdavMkdir(destFolder);
      let perf = {
        start: performance.now(),
        bytes: file.byteLength,
        name: destName
      };
      await request(destFile, {
        method: "PUT",
        data: file,
        headers: {
          "Content-Type": "application/octet-stream"
        },
        webdav: true
      });
      perf.end = performance.now();
      perf.bits = perf.bytes * 8;
      perf.ms = perf.end - perf.start;
      perf.s = perf.ms / 1000;
      perf.bps = perf.bits / perf.s;
      perf.mbps = perf.bps / 1000000;
      perf.dir = "up";
      log.debug(perf);
    }
    return true;
  } catch (err) {
    notifyUser("error", "errorWebdavPut", destFile, true, err);
    return false;
  }
}
async function webdavRm(pathsToDel) {
  const prefs = get("prefs");
  if (pathsToDel.length == 0) pathsToDel = null;
  if (!Array.isArray(pathsToDel)) pathsToDel = [pathsToDel];
  let returnVal = true;
  for (var pathToDel of pathsToDel) {
    let deleteFile = "https://" + prefs.congServer + ":" + prefs.congServerPort + pathToDel;
    try {
      if (webdavIsAGo && pathToDel && await webdavExists(pathToDel)) {
        await request(deleteFile, {
          method: "DELETE",
          webdav: true
        });
      }
    } catch (err) {
      notifyUser("error", "errorWebdavRm", deleteFile, true, err);
      returnVal = false;
    }
  }
  return returnVal;
}
async function webdavSetup() {
  const prefs = get("prefs");
  let congServerEntered = !!(prefs.congServer && prefs.congServer.length > 0);
  let congServerHeartbeat = false;
  let webdavLoginSuccessful = false;
  let webdavDirIsValid = false;
  $("#webdavFolderList").empty();
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
              enforcePrefs(paths, setMediaLang, validateConfig, webdavExists, request);
              let items = await webdavLs(prefs.congServerDir, true);
              if (items) {
                let remoteMediaWindowBackgrounds = items.filter(item => item.basename.includes("media-window-background-image"));
                if (remoteMediaWindowBackgrounds.length >0) {
                  let localFile = path.join(paths.app, remoteMediaWindowBackgrounds[0].basename);
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
  $("#webdavStatus").toggleClass("text-success text-warning text-muted", webdavDirIsValid).toggleClass("text-danger", congServerEntered && !webdavDirIsValid);
  $(".webdavHost").toggleClass("is-valid", congServerHeartbeat).toggleClass("is-invalid", congServerEntered && !congServerHeartbeat);
  $(".webdavCreds").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && !webdavLoginSuccessful));
  $("#congServerDir").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && !webdavDirIsValid));
  $("#webdavFolderList").closest(".row").fadeToAndToggle(fadeDelay, congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
  $("#specificCong").toggleClass("d-flex", congServerEntered).toggleClass("btn-danger", congServerEntered && !(congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid));
  $("#btn-settings, #headingCongSync button").toggleClass("pulse-danger", congServerEntered && !webdavDirIsValid);
  webdavIsAGo = (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
  $("#btnForcedPrefs").prop("disabled", !webdavIsAGo);
  if (!webdavIsAGo) enablePreviouslyForcedPrefs();
}
async function webdavStatus(url) {
  const prefs = get("prefs");
  let response;
  try {
    response = await request("https://" + prefs.congServer + ":" + prefs.congServerPort + url, {
      method: "PROPFIND",
      responseType: "text",
      headers: {
        Accept: "text/plain",
        Depth: "1"
      },
      webdav: true
    });
  } catch (err) {
    response = (err.response ? err.response : err);
  }
  return response.status;
}
var dragenterHandler = () => {
  if ($("input#typeFile:checked").length > 0 || $("input#typeJwpub:checked").length > 0) $(".dropzone").css("display", "block");
};
var dragleaveHandler = (event) => {
  if (event.target.id == "dropzone") $(".dropzone").css("display", "none");
};
var dragoverHandler = (e) => {
  e.preventDefault();
  e.stopPropagation();
};
var dropHandler = (event) => {
  event.preventDefault();
  event.stopPropagation();
  var filesDropped = [];
  for (const f of event.dataTransfer.files) {
    filesDropped.push(f.path);
  }
  if ($("input#typeFile:checked").length > 0) {
    $("#filePicker").val(filesDropped.join(" -//- ")).trigger("change");
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val(filesDropped.filter(filepath => path.extname(filepath) == ".jwpub")[0]).trigger("change");
  }
  $(".dropzone").css("display", "none");
};
$(document).on("select2:open", () => {
  document.querySelector(".select2-search__field").focus();
});
$("#baseDate").on("click", ".dropdown-item", function() {
  let newBaseDate = dayjs($(this).val(), get("prefs").outputFolderDateFormat).startOf("isoWeek");
  if (!baseDate.isSame(newBaseDate)) {
    baseDate = newBaseDate;
    $(".alertIndicators:not(.congregation)").removeClass("btn-danger");
    $("#baseDate .dropdown-item.active").removeClass("active");
    $(this).addClass("active");
    $("#baseDate > button").text($(this).text());
    dateFormatter();
  }
});
$("#congregationSelect").on("click", ".dropdown-item:not(.active)", function() {
  congregationChange($(this).val());
});
$("#congregationSelect").on("click", ".dropdown-item .fa-square-minus", function(e) {
  e.stopPropagation();
});
$("#congregationSelect").on("click", ".dropdown-item .fa-square-minus", function() {
  if (!$(this).hasClass("confirmed")) {
    waitToConfirm(this);
  } else {
    unconfirm(this);
    congregationDelete($(this).closest("button").val());
  }
});
$("#overlayUploadFile").on("click", ".btn-cancel-upload.file-selected, .btn-cancel-upload.no-file-selected", function() {
  if (!$(this).is(".confirmed, .no-file-selected")) {
    waitToConfirm(this);
  } else {
    unconfirm(this);
    if ($(this).hasClass("changes-made")) notifyUser("warn", "dontForgetToGetMedia");
    toggleScreen("overlayUploadFile");
    $(".btn-cancel-upload").removeClass("changes-made");
    removeEventListeners();
  }
});
$("#btnForcedPrefs").on("click", () => {
  getForcedPrefs(webdavExists, request, paths).then(currentForcedPrefs => {
    const prefs = get("prefs");
    let html = "<h6>" + translate("settingsLockedWhoAreYou") + "</h6>";
    html += "<p>" + translate("settingsLockedExplain") + "</p>";
    html += "<div id='forcedPrefs' class='card'><div class='card-body'>";
    for (var pref of Object.keys(prefs).filter(pref => !pref.startsWith("congServer") && !pref.startsWith("auto") && !pref.startsWith("local") && !pref.includes("UpdatedLast") && !pref.includes("disableHardwareAcceleration")).sort((a, b) => a[0].localeCompare(b[0]))) {
      html += `<div class='form-check form-switch'>
      <input class='form-check-input' type='checkbox' id='forcedPref-${pref}' ${pref in currentForcedPrefs ? "checked" : ""}>
      <label class='form-check-label' for='forcedPref-${pref}'>
        <code class='badge bg-info text-dark prefName' title='"${$("#" + pref).closest(".row").find("label").first().find("span").last().html()}"' data-bs-toggle='tooltip' data-bs-html='true'>
          ${pref}
        </code>
        <code class='badge bg-secondary'>${(pref.toLowerCase().includes("password") ? "********" : prefs[pref])}</code>
      </label>
    </div>`;
    }
    html += "</div></div>";
    showModal(true, true, translate("settingsLocked"), html, true, true);
    $("#staticBackdrop #forcedPrefs .prefName").tooltip();
    $("#staticBackdrop #forcedPrefs input").on("change", async function() {
      $("#staticBackdrop #forcedPrefs input").prop("disabled", true);
      let checkedItems = $("#staticBackdrop #forcedPrefs input:checked").map(function() { return this.id.replace("forcedPref-", ""); }).get();
      let forcedPrefs = JSON.stringify(Object.fromEntries(Object.entries(prefs).filter(([key]) => checkedItems.includes(key))), null, 2);
      if (await webdavPut(forcedPrefs, prefs.congServerDir, "forcedPrefs.json")) {
        enablePreviouslyForcedPrefs();
        enforcePrefs(paths, setMediaLang, validateConfig, webdavExists, request);
      } else {
        $(this).prop("checked", !$(this).prop("checked"));
      }
      $("#staticBackdrop #forcedPrefs input").prop("disabled", false);
    });
  });
});
require("electron").ipcRenderer.on("videoProgress", (_event, stats) => {
  if (stats && Array.isArray(stats) && stats.length > 1) {
    let percent = stats[0] / stats[1] * 100;
    $("#videoProgress .progress-bar").css("width", percent + "%");
    $("#videoScrubber").val(percent);
    let videoItem = $("#videoScrubber").closest("li.video");
    videoItem.data("timeElapsed", stats[0]);
    videoItem.find(".time .current").text(dayjs.duration(stats[0], "s").format("mm:ss/"));
    videoItem.find(".time .duration").text(dayjs.duration(!isNaN(videoItem.data("customEnd")) ? videoItem.data("customEnd") : stats[1] * 1000, "ms").format("mm:ss"));
  }
});
require("electron").ipcRenderer.on("videoEnd", () => {
  $("#videoProgress").closest(".item").find("button.stop").addClass("confirmed").trigger("click");
});
require("electron").ipcRenderer.on("moveMediaWindowToOtherScreen", () => {
  setMediaWindowPosition();
});
require("electron").ipcRenderer.on("displaysChanged", () => {
  setMediaWindowPosition();
});
$("#btnToggleMediaWindowFocus").on("click", function() {
  require("electron").ipcRenderer.send("toggleMediaWindowFocus");
});
require("electron").ipcRenderer.on("mediaWindowVisibilityChanged", (_event, status) => {
  $("#btnToggleMediaWindowFocus").toggleClass("btn-warning", status !== "hidden").toggleClass("btn-primary pulse-danger", status == "hidden").find(".fa-stack-2x").toggleClass("fas fa-ban text-danger", status !== "hidden").toggleClass("far fa-circle", status == "hidden");
});
require("electron").ipcRenderer.on("mediaWindowShown", async () => {
  await startMediaDisplay();
});
$("#staticBackdrop").on("input change", "#videoScrubber", function() {
  let scrolled_value = $(this).val(),
    limits = {};
  try {
    if ($(this).closest(".video").data("customStart") || $(this).closest(".video").data("customEnd")) {
      if ($(this).closest(".video").data("customStart")) limits.min = ($(this).closest(".video").data("customStart") / $(this).closest(".video").data("originalEnd") * 100);
      if ($(this).closest(".video").data("customEnd")) limits.max = ($(this).closest(".video").data("customEnd") / $(this).closest(".video").data("originalEnd") * 100);
      if (scrolled_value > limits.max) {
        $(this).val(limits.max);
      } else if (scrolled_value < limits.min) {
        $(this).val(limits.min);
      }
    }
    require("electron").ipcRenderer.send("videoScrub", $(this).val());
  } catch (err) {
    console.error(err);
  }
});
$("#btnMediaWindow").on("click", function() {
  require("electron").ipcRenderer.send("preventQuit");
  setVars();
  let folderListing = listMediaFolders();
  $(folderListing).on("click", "button.folder", function() {
    refreshFolderListing($(this).data("folder"));
  });
  $(folderListing).on("click", "li.item button.pausePlay", function() {
    if ($(this).hasClass("pause") && !$(this).hasClass("shortVideoPaused")) {
      require("electron").ipcRenderer.send("pauseVideo");
    } else if ($(this).hasClass("play")) {
      require("electron").ipcRenderer.send("playVideo");
    }
    obsSetScene($(this).hasClass("pause") && !$(this).hasClass("shortVideoPaused") ? $("#obsTempCameraScene").val() : get("prefs").obsMediaScene);
    $("#videoProgress, #videoScrubber").toggle();
    $(this).removeClass("shortVideoPaused").toggleClass("play pause")
      .toggleClass("pulse-danger", $(this).hasClass("play"))
      .find("i").toggleClass("fa-play fa-pause");
  });
  $(folderListing).on("mouseenter", "li:not(.list-group-item-primary)", function () {
    $(this).addClass("list-group-item-secondary");
  });
  $(folderListing).on("mouseleave", "li:not(.list-group-item-primary)", function () {
    $(this).removeClass("list-group-item-secondary");
  });
  $(folderListing).on("click", "li.item button.play:not(.pausePlay)", function() {
    let mediaItem = $(this).closest(".item");
    $("#folderListing .item").removeClass("list-group-item-primary z-2");
    $("#btnToggleMediaWindowFocus.hidden").trigger("click");
    let mediaFileToPlay = {
      item: mediaItem.data("item"),
    };
    for (var timeItem of ["Start", "End"]) {
      if (!isNaN(mediaItem.data("custom" + timeItem))) {
        mediaFileToPlay[timeItem] = dayjs.duration(mediaItem.data("custom" + timeItem), "ms").format("mm:ss.SSS");
      }
    }
    require("electron").ipcRenderer.send("showMedia", mediaFileToPlay);
    $("#btnToggleMediaWindowFocus.pulse-danger").trigger("click");
    obsSetScene(get("prefs").obsMediaScene);
    if (mediaItem.hasClass("video") && !(mediaItem.data("originalEnd") < 1000)) {
      mediaItem.addClass("position-relative");
      mediaItem.append(`<div id='videoProgress' class='progress bottom-0 position-absolute start-0 w-100' style='height: 3px;'>
      <div class='progress-bar' role='progressbar' style='width: 0%'></div>
      </div>`);
      mediaItem.append("<input type='range' id='videoScrubber' class='form-range bottom-0 position-absolute start-0' min='0' max='100' step='any' />");
      mediaItem.find(".pausePlay").fadeToAndToggle(fadeDelay, 1);
      $("#folderListing button.play").not($(this)).prop("disabled", true);
      $("#folderListing .item").not(mediaItem).find(".markerList .btn-info").addClass("disabled");
      mediaItem.find(".time").addClass("disabled");
    }
    mediaItem.addClass("list-group-item-primary z-2").removeClass("list-group-item-secondary");
    $("#folderListing button.play").show();
    $("h5.modal-title button").not($(this)).prop("disabled", true);
    $("button.closeModal, #btnMeetingMusic, button.folderRefresh").prop("disabled", true);
    if (!get("jsonLangs").find(lang => lang.langcode == get("prefs").lang).isSignLanguage || mediaItem.find(".markerList div").length == 0) {
      $("#folderListing button.stop:visible").closest("li.item").addClass("opacity-75");
    }
    $("#folderListing button.stop").hide();
    $(this).hide();
    mediaItem.find(".stop").show();
    mediaItem.find(".previously-played").show("blind", { direction: "horizontal"}, fadeDelay);
  });
  $(folderListing).on("click", "li.item button.stop", function() {
    let mediaItem = $(this).closest(".item");
    if (!mediaItem.hasClass("video") || $(this).hasClass("confirmed")) {
      require("electron").ipcRenderer.send("hideMedia", mediaItem.data("item"));
      obsSetScene($("#obsTempCameraScene").val());
      if (mediaItem.hasClass("video")) {
        mediaItem.removeClass("position-relative");
        mediaItem.find("#videoProgress, #videoScrubber").remove();
        mediaItem.find(".time .current")
          .text(!isNaN(mediaItem.data("customStart")) ? dayjs.duration(mediaItem.data("customStart"), "ms").format("mm:ss/") : "");
        mediaItem.find(".pausePlay")
          .removeClass("play pulse-danger").addClass("pause")
          .fadeToAndToggle(fadeDelay, 0)
          .find("i")
          .removeClass("fa-play").addClass("fa-pause");
        mediaItem.find(".time").removeClass("disabled");
        if (mediaItem.find(".markerList div.btn.btn-primary").length > 0) {
          mediaItem.removeData("customStart");
          mediaItem.removeData("customEnd");
          mediaItem.find(".time .current").text("");
          mediaItem.find(".time .duration").text(dayjs.duration(mediaItem.data("originalEnd"), "ms").format("mm:ss"));
          mediaItem.find(".time").removeClass("pulse-danger");
        }
        mediaItem.find(".markerList div.btn.btn-primary").addClass("btn-info").removeClass("btn-primary");
        unconfirm(this);
      }
      mediaItem.removeClass("list-group-item-primary z-2");
      $("#folderListing button.play, #folderListing .markerList .btn-info, button.closeModal, #btnMeetingMusic, button.folderRefresh")
        .removeClass("disabled")
        .prop("disabled", false);
      $("#folderListing button.stop").hide();
      mediaItem.find(".play").show();
      if (!get("jsonLangs").find(lang => lang.langcode == get("prefs").lang).isSignLanguage || mediaItem.find(".markerList div").length == 0) {
        mediaItem.addClass("opacity-75");
      }
      $("h5.modal-title button").not($(this)).prop("disabled", false);
    } else {
      waitToConfirm(this);
    }
  });
  showModal(true, true, translate("meeting"), folderListing, false);
  obsGetScenes(false, validateConfig);
  $("#staticBackdrop .modal-header").addClass("d-flex").children().wrapAll("<div class='col-4 text-center'></div>");
  $("#staticBackdrop .modal-header").prepend(`<div class='col-4 for-folder-listing-only' style='display: none;'>
  <button class='btn btn-sm show-prefixes'>
    <i class='fas fa-fw fa-eye'></i>
    <i class='fas fa-fw fa-list-ol'></i>
  </button>
  </div>`);
  $("#staticBackdrop .modal-header").append(`<div class='col-4 for-folder-listing-only text-end' style='display: none;'>
  <button class='btn btn-sm folderRefresh'><i class='fas fa-fw fa-rotate-right'></i></button>
  <button class='btn btn-sm master-move-handle'><i class='fas fa-fw fa-arrow-down-short-wide'></i></button>
  <button class='btn btn-sm folderOpen'><i class='fas fa-fw fa-folder-open'></i></button>
  </div>`);
  $(folderListing).find(".thatsToday").trigger("click");
  $("#staticBackdrop .modal-footer").html($(`<div class='left d-flex flex-fill text-start'></div>
  <div class='right text-end'>
    <button type='button' class='closeModal btn btn-warning' data-bs-trigger='manual'><i class='fas fa-fw fa-2x fa-home'></i></button>
  </div>`)).addClass("d-flex");
  $("#staticBackdrop .modal-footer .left").prepend($("#btnMeetingMusic, #btnStopMeetingMusic").addClass("btn-lg"));
  $("#staticBackdrop .modal-footer .right").prepend($("#btnToggleMediaWindowFocus").removeClass("btn-sm"));
  $("#staticBackdrop .modal-footer").show();
});
$("#staticBackdrop .modal-footer").on("click", "button.closeModal", function() {
  set("obs",{});
  require("electron").ipcRenderer.send("allowQuit");
  $("#music-buttons").append($("#btnMeetingMusic, #btnStopMeetingMusic").removeClass("btn-lg"));
  $("#btnMediaWindow").before($("#btnToggleMediaWindowFocus").addClass("btn-sm"));
  showModal(false);
});
$("#staticBackdrop .modal-footer").on("change", "#obsTempCameraScene", async function() {
  if ((await obsGetScenes(true, validateConfig)) !== get("prefs").obsMediaScene) obsSetScene($(this).val());
});
$("#staticBackdrop .modal-header").on("click", "button.folderRefresh", function() {
  refreshFolderListing(path.join(paths.media, $(".modal-header h5").text()));
});
$("#staticBackdrop .modal-header").on("click", ".master-move-handle", function() {
  $(".move-handle").toggle("blind", {direction: "right"}, fadeDelay);
  $(this).find("i").toggleClass("fa-square-check fa-arrow-down-short-wide");
});
$("#staticBackdrop .modal-header").on("click", ".show-prefixes", function() {
  $(".sort-prefix").toggle("blind", {direction: "horizontal"}, fadeDelay);
  $(this).prop("disabled", true);
  setTimeout(() => {
    $(".show-prefixes").prop("disabled", false);
    $(".sort-prefix").toggle("blind", {direction: "horizontal"}, fadeDelay);
  }, 3000);
});
$("#staticBackdrop .modal-header").on("click", "button.folderOpen", function() {
  shell.openPath(url.fileURLToPath(url.pathToFileURL(path.join(paths.media, $(".modal-header h5").text())).href));
});
$("body").on("click", "#btnMeetingMusic", async function() {
  const prefs = get("prefs");
  if (!$(this).hasClass("confirmed")) {
    waitToConfirm(this);
  } else {
    unconfirm(this);
    $("#congregationSelect-dropdown").addClass("music-playing").prop("disabled", true);
    if (prefs.enableMusicFadeOut) {
      let timeBeforeFade;
      let rightNow = dayjs();
      if (prefs.musicFadeOutType == "smart") {
        let nowDay = now.day() == 0 ? 6 : now.day() - 1;
        if (nowDay == prefs.mwDay || nowDay == prefs.weDay) {
          let todaysMeetingStartTime = prefs[(nowDay == prefs.mwDay ? "mw" : "we") + "StartTime"].split(":");
          let timeToStartFading = now.clone().hour(todaysMeetingStartTime[0]).minute(todaysMeetingStartTime[1]).millisecond(rightNow.millisecond()).subtract(prefs.musicFadeOutTime, "s").subtract(fadeDelay * 30, "ms");
          timeBeforeFade = timeToStartFading.diff(rightNow);
        }
      } else {
        timeBeforeFade = prefs.musicFadeOutTime * 1000 * 60;
      }
      if (timeBeforeFade >= 0) {
        pendingMusicFadeOut.endTime = timeBeforeFade + rightNow.valueOf();
        pendingMusicFadeOut.id = setTimeout(function () {
          pendingMusicFadeOut.autoStop = true;
          stopMeetingMusic();
        }, timeBeforeFade);
      } else {
        pendingMusicFadeOut.endTime = 0;
      }
    } else {
      pendingMusicFadeOut.id = null;
    }
    $("#btnStopMeetingMusic").addClass("initialLoad").find("i")
      .addClass("fa-circle-notch fa-spin").removeClass("fa-stop")
      .closest("button").prop("title", "...");
    $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
    setVars();
    var songs = (jworgIsReachable
      ? (await getMediaLinks({pubSymbol: "sjjm", format: "MP3", lang: "E"})).filter(item => path.extname(item.url) == ".mp3")
      : glob.sync(path.join(paths.pubs, get("songPub"), "**", "*.mp3"))
        .map(item => ({title: path.basename(item), track: path.basename(path.resolve(item, "..")), path: item})))
      .sort(() => .5 - Math.random());
    if (songs.length > 0) {
      var iterator = 0;
      createAudioElem(iterator);
    } else {
      $("#btnStopMeetingMusic").removeClass("initialLoad").find("i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin");
      $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
    }
  }
  async function createAudioElem(iterator) {
    setVars();
    $("body").append($("<audio id='meetingMusic' autoplay>").data("track", songs[iterator].track).on("ended", function() {
      $("#meetingMusic").remove();
      iterator = (iterator < songs.length - 1 ? iterator + 1 : 0);
      createAudioElem(iterator);
    }).on("canplay", function() {
      $("#btnStopMeetingMusic").removeClass("initialLoad").find("i")
        .addClass("fa-stop").removeClass("fa-circle-notch fa-spin")
        .closest("button").prop("title", songs[iterator].title + " (Alt+K)");
      $("#meetingMusic").prop("volume", prefs.musicVolume / 100);
      displayMusicRemaining();
    }).on("timeupdate", function() {
      displayMusicRemaining();
    }));
    $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").closest("button").prop("title", "...");
    displayMusicRemaining();
    $("#meetingMusic").append("<source src='"+ (jworgIsReachable ? (await downloadIfRequired(songs[iterator])) : songs[iterator].path) + "' type='audio/mpeg'>");
  }
});
$(".btn-home, #btn-settings").on("click", async function() {
  toggleScreen("overlaySettings");
  if (!$(this).hasClass("btn-home")) calculateCacheSize();
});
$("[data-settingslink]").on("click", function() {
  toggleScreen("overlaySettings", null, $(this).data("settingslink"));
});
$("#btnStopMeetingMusic:not(.initialLoad)").on("click", function() {
  stopMeetingMusic();
});
$("#btnUpload").on("click", async () => {
  try {
    $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-save");
    $("#overlayUploadFile button:enabled, #overlayUploadFile select:enabled, #overlayUploadFile input:enabled")
      .addClass("disabled-while-load").prop("disabled", true);
    if (!webdavIsAGo || dayjs($("#chosenMeetingDay").data("folderName"), get("prefs").outputFolderDateFormat).isValid()) {
      fs.ensureDirSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName")));
    }
    if ($("input#typeSong:checked").length > 0) {
      let songFiles = await getMediaLinks({pubSymbol: get("songPub"), track: $("#fileToUpload").val(), format: "MP4"});
      if (songFiles.length > 0) {
        let songFile = await downloadIfRequired(songFiles[0]);
        let songFileName = sanitizeFilename(getPrefix() + " - Song " + $("#songPicker option:selected").text() + ".mp4");
        if (webdavIsAGo) {
          await webdavPut(
            fs.readFileSync(songFile),
            path.posix.join(get("prefs").congServerDir, "Media", $("#chosenMeetingDay").data("folderName")),
            songFileName
          );
        }
        if (!webdavIsAGo || dayjs($("#chosenMeetingDay").data("folderName"), get("prefs").outputFolderDateFormat).isValid()) {
          fs.copyFileSync(songFile, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), songFileName));
        }
      }
    } else if ($("input#typeJwpub:checked").length > 0) {
      for (var tempMedia of tempMediaArray) {
        if (tempMedia.url) tempMedia.contents = Buffer.from(new Uint8Array((await request(tempMedia.url, {isFile: true})).data));
        let jwpubFileName = sanitizeFilename(getPrefix() + " - " + tempMedia.filename);
        if (webdavIsAGo) {
          await webdavPut(
            (tempMedia.contents ? tempMedia.contents : fs.readFileSync(tempMedia.localpath)),
            path.posix.join(get("prefs").congServerDir, "Media", $("#chosenMeetingDay").data("folderName")),
            jwpubFileName
          );
        }
        if (!webdavIsAGo || dayjs($("#chosenMeetingDay").data("folderName"), get("prefs").outputFolderDateFormat).isValid()) {
          if (tempMedia.contents) {
            fs.writeFileSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName"), jwpubFileName), tempMedia.contents);
          } else {
            fs.copyFileSync(tempMedia.localpath, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), jwpubFileName));
          }
        }
      }
      tempMediaArray = [];
    } else {
      for (var splitLocalFile of $("#fileToUpload").val().split(" -//- ")) {
        let splitFileToUploadName = sanitizeFilename(getPrefix() + " - " + path.basename(splitLocalFile));
        if (webdavIsAGo) {
          await webdavPut(
            fs.readFileSync(splitLocalFile),
            path.posix.join(get("prefs").congServerDir, "Media", $("#chosenMeetingDay").data("folderName")),
            splitFileToUploadName
          );
        }
        if (!webdavIsAGo || dayjs($("#chosenMeetingDay").data("folderName"), get("prefs").outputFolderDateFormat).isValid()) {
          fs.copyFileSync(splitLocalFile, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), splitFileToUploadName));
        }
      }
    }
  } catch (err) {
    notifyUser("error", "errorAdditionalMedia", $("#fileToUpload").val(), true, err, true);
  }
  $(".btn-cancel-upload").addClass("changes-made");
  if (webdavIsAGo) await startMediaSync(true, "Recurring");
  updateFileList(true);
});
$("#congregationSelect").on("click", ".new-cong", function() {
  congregationCreate();
});
$("#chooseUploadType input").on("change", function() {
  $("div.row.file-to-upload").fadeToAndToggle(fadeDelay, $("input[name='chooseUploadType']").is(":checked"));
  $("#songPicker:visible").select2("destroy");
  $(".file-to-upload.selector").children().hide();
  $(".enterPrefixInput").val("").empty();
  if ($("#fileToUpload").val()) $("#fileToUpload").val("").trigger("change");
  if ($("input#typeSong:checked").length > 0) {
    $(".enterPrefixInput").slice(0, 4).val(0);
    $("#songPicker").val([]).prop("disabled", false).show().select2();
  } else if ($("input#typeFile:checked").length > 0) {
    $("#filePicker").val("").closest("div").show();
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val([]).closest("div").show();
  }
  getPrefix();
});
$(".enterPrefixInput, #congServerPort").on("keypress", function(e){ // cmd/ctrl || arrow keys || delete key || numbers
  return e.metaKey || e.which <= 0 || e.which === 8 || /[0-9]/.test(String.fromCharCode(e.which));
});
$("#folders").on("click", ".day.btn", function() {
  manageMedia($(this).data("datevalue"), $(this).hasClass("meeting"), ($(this).hasClass("mw") ? "mw" : $(this).hasClass("we") ? "we" : ""));
});
$("#recurringMedia").on("click", function() {
  manageMedia("Recurring", false, "Recurring");
});
$("#overlayUploadFile").on("change", "#filePicker", function() {
  $("#fileToUpload").val($(this).val()).trigger("change");
});
$("#overlayUploadFile").on("change", "#jwpubPicker", async function() {
  if ($(this).val().length >0) {
    let contents = await getDbFromJwpub(null, null, $(this).val());
    let tableMultimedia = ((await executeStatement(contents, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
    let suppressZoomExists = (await executeStatement(contents, "SELECT COUNT(*) AS CNT_REC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'")).map(function(item) {
      return (item.CNT_REC > 0 ? true : false);
    })[0];
    let itemsWithMultimedia = await executeStatement(
      contents,
      `SELECT DISTINCT ${tableMultimedia}.DocumentId, Document.Title FROM Document INNER JOIN ${tableMultimedia} ON Document.DocumentId = ${tableMultimedia}.DocumentId `
      + (tableMultimedia === "DocumentMultimedia" ? "INNER JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId " : "") + "WHERE (Multimedia.CategoryType <> 9)"
      + (suppressZoomExists ? " AND Multimedia.SuppressZoom = 0" : "") + ` ORDER BY ${tableMultimedia}.DocumentId`);
    if (itemsWithMultimedia.length > 0) {
      var docList = $("<div id='docSelect' class='list-group'>");
      for (var item of itemsWithMultimedia) {
        $(docList).append("<button class='d-flex list-group-item list-group-item-action' data-docid='" + item.DocumentId + "'><div class='flex-fill'> " + item.Title + "</div><div><i class='far fa-circle'></i></div></li>");
      }
      showModal(true, itemsWithMultimedia.length > 0, translate("selectDocument"), docList, itemsWithMultimedia.length === 0, true);
    } else {
      $(this).val("");
      $("#fileToUpload").val("").trigger("change");
      notifyUser("warn", "warnNoDocumentsFound", $(this).val(), true, null, true);
    }
  } else {
    $("#fileToUpload").val("").trigger("change");
  }
});
$("#staticBackdrop").on("click", "a", function() {
  shell.openExternal($(this).data("href"));
});
$("#staticBackdrop").on("mousedown", "#docSelect button", async function() {
  $("#docSelect button").prop("disabled", true);
  $(this).addClass("active").find("i").toggleClass("far fas fa-circle fa-circle-notch fa-spin");
  tempMediaArray = [];
  var multimediaItems = await getDocumentMultimedia((await getDbFromJwpub(null, null, $("#jwpubPicker").val())), $(this).data("docid"), null, true);
  var missingMedia = $("<div id='missingMedia' class='list-group'>");
  for (var i = 0; i < multimediaItems.length; i++) {
    progressSet(i + 1, multimediaItems.length);
    let multimediaItem = multimediaItems[i];
    var tempMedia = {
      filename: sanitizeFilename(
        (i + 1).toString().padStart(2, "0") + " - "
        + (multimediaItem.queryInfo.Label || multimediaItem.queryInfo.Caption || multimediaItem.queryInfo.FilePath || multimediaItem.queryInfo.KeySymbol + "." + (multimediaItem.queryInfo.MimeType ? (multimediaItem.queryInfo.MimeType.includes("video") ? "mp4" : "mp3") : ""))
        + (multimediaItem.queryInfo.FilePath && (multimediaItem.queryInfo.Label || multimediaItem.queryInfo.Caption) ? path.extname(multimediaItem.queryInfo.FilePath) : "")
      )
    };
    if (multimediaItem.queryInfo && multimediaItem.queryInfo.CategoryType && multimediaItem.queryInfo.CategoryType !== -1) {
      var jwpubContents = await new zipper($("#jwpubPicker").val()).readFile("contents");
      tempMedia.contents = (await new zipper(jwpubContents).readFile(((await new zipper(jwpubContents).getEntries()).filter(entry => entry.name == multimediaItem.queryInfo.FilePath)[0]).entryName));
    } else {
      var externalMedia = (await getMediaLinks({pubSymbol: multimediaItem.queryInfo.KeySymbol, track: multimediaItem.queryInfo.Track, issue: multimediaItem.queryInfo.IssueTagNumber, docId: multimediaItem.queryInfo.MultiMeps}));
      if (externalMedia.length > 0) {
        Object.assign(tempMedia, externalMedia[0]);
        tempMedia.filename = (i + 1).toString().padStart(2, "0") + " - " + path.basename(tempMedia.url);
      } else {
        $(missingMedia).append($("<button class='list-group-item list-group-item-action' data-filename='" + tempMedia.filename + "'>" + tempMedia.filename + "</li>").on("click", function() {
          var missingMediaPath = remote.dialog.showOpenDialogSync({
            title: $(this).data("filename"),
            filters: [
              { name: $(this).data("filename"), extensions: [path.extname($(this).data("filename")).replace(".", "")] }
            ]
          });
          if (typeof missingMediaPath !== "undefined") {
            tempMediaArray.find(item => item.filename == $(this).data("filename")).localpath = missingMediaPath[0];
            $(this).addClass("list-group-item-dark");
          }
          if (tempMediaArray.filter(item => !item.contents && !item.localpath).length === 0) {
            $("#staticBackdrop .modal-footer button").prop("disabled", false);
            $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).trigger("change");
          }
        }));
      }
    }
    tempMediaArray.push(tempMedia);
  }
  if (tempMediaArray.filter(item => !item.contents && !item.localpath && !item.url).length > 0) {
    showModal(true, true, translate("selectExternalMedia"), missingMedia, true, false);
  } else {
    $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).trigger("change");
    showModal(false);
  }
});
$("#mediaSync").on("click", async function() {
  $("#mediaSync, #baseDate-dropdown, #congregationSelect-dropdown").prop("disabled", true);
  await startMediaSync();
  await overlay(true, "circle-check text-success fa-beat", (get("prefs").autoQuitWhenDone ? "person-running" : null), "stay-alive");
  await delay(3);
  if (get("prefs").autoQuitWhenDone && !stayAlive) {
    remote.app.exit();
  } else {
    overlay(false);
    $(".btn-home, #btn-settings").fadeToAndToggle(fadeDelay, 1);
    $("#mediaSync, #baseDate-dropdown, #congregationSelect-dropdown:not(.music-playing)").prop("disabled", false);
  }
});
$("#chooseBackground").on("click", function() {
  const prefs = get("prefs");
  let mediaWindowBackground = remote.dialog.showOpenDialogSync({
    properties: ["openFile"]
  });
  if (mediaWindowBackground && isImage(mediaWindowBackground[0])) {
    rm(glob.sync(path.join(paths.app, "media-window-background-image*")));
    fs.copyFileSync(mediaWindowBackground[0], path.join(paths.app, "media-window-background-image" + path.extname(mediaWindowBackground[0])));
    if (webdavIsAGo) webdavLs(prefs.congServerDir).then(items => {
      webdavRm(items.filter(item => item.basename.includes("media-window-background-image")).map(item => path.join(prefs.congServerDir, item.basename))).then(() => {
        webdavPut(fs.readFileSync(mediaWindowBackground[0]), prefs.congServerDir, "media-window-background-image" + path.extname(mediaWindowBackground[0]));
      });
    });
    refreshBackgroundImagePreview();
  } else {
    notifyUser("error", "notAnImage");
  }
});
$("#deleteBackground").on("click", function() {
  rm(glob.sync(path.join(paths.app, "media-window-background-image*")));
  if (webdavIsAGo) webdavLs(get("prefs").congServerDir).then(items => {
    webdavRm(items.filter(item => item.basename.includes("media-window-background-image")).map(item => path.join(get("prefs").congServerDir, item.basename)));
  });
  refreshBackgroundImagePreview();
});
$("#overlaySettings").on("click", ".btn-clean-up", function() {
  if (!$(this).hasClass("confirmed")) {
    waitToConfirm(this);
  } else {
    unconfirm(this);
    $(this).toggleClass("btn-success btn-warning").prop("disabled", true);
    setVars();
    rm(glob.sync([path.join(paths.media, "*"), paths.pubs], {
      ignore: [path.join(paths.media, "Recurring")],
      onlyDirectories: true
    }).concat([paths.langs]));
    calculateCacheSize();
    jwpubDbs = {};
    setTimeout(() => {
      $(".btn-clean-up").toggleClass("btn-success btn-warning").prop("disabled", false);
    }, 3000);
  }
});
$("#fileList").on("click", "li:not(.webdavWait) .fa-minus-square", async function() {
  if (!$(this).hasClass("confirmed")) {
    waitToConfirm(this);
  } else {
    unconfirm(this);
    $(this).closest("li").addClass("webdavWait");
    let successful = true;
    if (!webdavIsAGo) {
      rm(path.join(paths.media, $("#chosenMeetingDay").data("folderName"), $(this).closest("li").data("safename")));
      $(this).closest("li").removeClass("webdavWait confirmed canDelete").data("islocal", "false");
    } else {
      successful = await webdavRm($(this).closest("li").data("url"));
    }
    if (successful) {
      if ($(this).closest("li").data("isnotpresentonremote") || $(this).closest("li").data("url") && (!$(this).closest("li").data("islocal") || $(this).closest("li").data("islocal") == false)) {
        $(this).closest("li").slideUp(fadeDelay, function(){
          $(this).tooltip("dispose").remove();
          $("#fileList li").css("width", 100 / Math.ceil($("#fileList li").length / 11) + "%");
        });
        meetingMedia[$("#chosenMeetingDay").data("folderName")].splice(meetingMedia[$("#chosenMeetingDay").data("folderName")].findIndex(item => item.media.find(mediaItem => mediaItem.safeName === $(this).closest("li").data("safename"))), 1);
      } else {
        $(this).toggleClass("fas fa-minus-square text-danger far fa-check-square").closest("li").toggleClass("canHide");
        let $this = $(this).closest("li");
        meetingMedia[$("#chosenMeetingDay").data("folderName")].map(item => {
          item.media.filter(mediaItem => mediaItem.safeName == $this.data("safename")).map(item => item.isLocal = false);
        });
      }
      $(".btn-cancel-upload").addClass("changes-made");
    }
  }
});
$("#fileList").on("click", ".canHide:not(.webdavWait)", async function() {
  $(this).addClass("webdavWait");
  if (!webdavIsAGo || await webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(get("prefs").congServerDir, "Hidden", $("#chosenMeetingDay").data("folderName")), $(this).data("safename"))) {
    $(this).removeClass("canHide").addClass("wasHidden").find("i.fa-check-square").removeClass("fa-check-square").addClass("fa-square");
    meetingMedia[$("#chosenMeetingDay").data("folderName")].map(item => {
      item.media.filter(mediaItem => mediaItem.safeName == $(this).data("safename")).map(mediaItem => {
        mediaItem.hidden = true;
      });
    });
  }
  $(this).removeClass("webdavWait");
  $(".btn-cancel-upload").addClass("changes-made");
});
$("#fileList").on("click", ".canMove:not(.webdavWait) i.fa-pen", async function() {
  let row = $(this).closest(".canMove");
  let src = webdavIsAGo ? row.data("url") : path.join(paths.media, $("#chosenMeetingDay").data("folderName"), row.data("safename"));
  let previousSafename = row.data("safename");
  await showModal(true, false, null, "<div class='input-group'><input type='text' class='form-control' value='" + path.basename(src, path.extname(src)) + "' /><span class='input-group-text'>" + path.extname(src) + "</span></div>", true, true);
  $("#staticBackdrop .modal-body input").focus().on("keypress", function(e) {
    if (e.which == 13) $("#staticBackdrop .modal-footer button").trigger("click");
  });
  $("#staticBackdrop .modal-footer button").on("click", async function() {
    let newName = escape($("#staticBackdrop .modal-body input").val().trim()) + path.extname(src);
    if (escape(path.basename(src, path.extname(src))) !== escape($("#staticBackdrop .modal-body input").val().trim())) {
      row.addClass("webdavWait");
      let successful = false;
      if (!webdavIsAGo) {
        try {
          fs.renameSync(src, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), newName));
          successful = true;
        } catch(err) {
          notifyUser("error", "errorWebdavPut", src + " => " + path.join(paths.media, $("#chosenMeetingDay").data("folderName"), newName), true, err);
        }
      } else {
        successful = await webdavMv(src, path.posix.join(path.dirname(src), newName));
      }
      if (successful) {
        Object.keys(meetingMedia).filter(meeting => dayjs($("#chosenMeetingDay").data("folderName"), get("prefs").outputFolderDateFormat).isValid() ? meeting == $("#chosenMeetingDay").data("folderName") : true).forEach(meeting => {
          meetingMedia[meeting].filter(item => item.media.filter(mediaItem => mediaItem.safeName == previousSafename).length > 0).forEach(item => item.media.forEach(mediaItem => {
            mediaItem.safeName = newName;
            if (webdavIsAGo) mediaItem.url = path.posix.join(path.dirname(src), newName);
          }));
        });
        if (webdavIsAGo) row.data("url", path.posix.join(path.dirname(src), newName));
        row.data("safename", newName).attr("title", newName).find("span.filename").text(newName);
        let files = $("#fileList li").detach().sort(function (a, b) {
          return ($(a).text() < $(b).text() ? -1 : $(a).text() > $(b).text() ? 1 : 0);
        });
        $("#fileList").append(files);
      }
      row.removeClass("webdavWait");
      $(".btn-cancel-upload").addClass("changes-made");
    }
  });
});
$("#fileList").on("click", ".wasHidden:not(.webdavWait)", async function() {
  $(this).addClass("webdavWait");
  if (!webdavIsAGo || await webdavRm(path.posix.join(get("prefs").congServerDir, "Hidden", $("#chosenMeetingDay").data("folderName"), $(this).data("safename")))) {
    $(this).removeClass("wasHidden").addClass("canHide").find("i.fa-square").removeClass("fa-square").addClass("fa-check-square");
    meetingMedia[$("#chosenMeetingDay").data("folderName")].filter(item => item.media.filter(mediaItem => mediaItem.safeName == $(this).data("safename")).length > 0).forEach(item => item.media.forEach(mediaItem => mediaItem.hidden = false ));
  }
  $(this).removeClass("webdavWait");
  $(".btn-cancel-upload").addClass("changes-made");
});
$("#overlayUploadFile").on("change", ".enterPrefixInput, #fileToUpload", function() {
  $("div.row.prefix").fadeToAndToggle(fadeDelay, !!$("#fileToUpload").val());
  updateFileList();
});
$("#overlayUploadFile").on("keyup", ".enterPrefixInput", getPrefix);
$("body").on("mousedown", "#filePicker, #jwpubPicker, #localOutputPath", function() {
  $(this).prev("button").trigger("click");
});
$("body").on("click", "#filePickerButton, #jwpubPickerButton, #localOutputPathButton", function() {
  let options = {
    properties: ($(this).prop("id").includes("localOutputPath") ? ["openDirectory"] : ["multiSelections", "openFile"])
  };
  if ($(this).prop("id").includes("jwpub")) options = {
    filters: [
      { name: "JWPUB", extensions: ["jwpub"] }
    ]
  };
  let path = remote.dialog.showOpenDialogSync(options);
  if (typeof path !== "undefined") $(this).next("input").val($(this).prop("id").includes("file") ? path.join(" -//- ") : path).trigger("change");
  event.preventDefault();
});
$("#refreshYeartext").on("click", function() {
  refreshBackgroundImagePreview(true);
});
$("#songPicker").on("change", function() {
  if ($(this).val()) $("#fileToUpload").val($(this).val()).trigger("change");
});
$(document).on("shown.bs.modal", "#staticBackdrop", function () {
  if ($("#staticBackdrop input").length > 0) {
    let inputVal = $("#staticBackdrop input").first().val();
    $("#staticBackdrop input")[0].focus();
    $("#staticBackdrop input").first().val("").val(inputVal);
  }
});
$("#overlaySettings").on("click", ".btn-action:not(.btn-danger)", function() {
  if ($(this).hasClass("btn-report-issue")) $(this).data("action-url", bugUrl());
  shell.openExternal($(this).data("action-url"));
});
$("#btnTestApp").on("click", testApp);
$("#toastContainer").on("click", "button.toast-action", async function() {
  if ($(this).data("toast-action-url")) shell.openExternal($(this).data("toast-action-url"));
  $(this).closest(".toast").find(".toast-header button.btn-close").trigger("click");
  await delay(2);
  $(".new-stuff").removeClass("new-stuff");
});
$("#webdavProviders a").on("click", function() {
  for (let i of Object.entries($(this).data())) {
    let name = "cong" + (i[0][0].toUpperCase() + i[0].slice(1));
    setPref(name, i[1]);
    $("#" + name).val(i[1]);
  }
  $("#congServer").trigger("change");
});
$.fn.extend({
  fadeToAndToggle: function(speed, to, easing, callback) {
    return this.stop().css("visibility", "visible").animate( { opacity: to }, speed, easing, function() {
      $(this).css("visibility", to ? "visible" : "hidden");
      if (callback) callback();
    } );
  }
});
