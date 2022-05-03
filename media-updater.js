// TODO: add "song " when manually uploaded

const fadeDelay = 200,
  aspect = require("aspectratio"),
  axios = require("axios"),
  bootstrap = require("bootstrap"),
  datetime = require("flatpickr"),
  dayjs = require("dayjs"),
  escape = require("escape-html"),
  ffmpeg = require("fluent-ffmpeg"),
  fs = require("graceful-fs"),
  fullHd = [1920, 1080],
  glob = require("fast-glob"),
  hme = require("h264-mp4-encoder"),
  i18n = require("i18n"),
  isAudio = require("is-audio"),
  isImage = require("is-image"),
  isVideo = require("is-video"),
  log = {
    debug: function() {
      let now = + new Date();
      if (!logOutput.debug[now]) logOutput.debug[now] = [];
      logOutput.debug[now].push(arguments);
      if (logLevel == "debug") console.log.apply(console,arguments);
    },
    error: function() {
      let now = + new Date();
      if (!logOutput.error[now]) logOutput.error[now] = [];
      logOutput.error[now].push(arguments);
      console.error.apply(console,arguments);
    },
    info: function() {
      let now = + new Date();
      if (!logOutput.info[now]) logOutput.info[now] = [];
      logOutput.info[now].push(arguments);
      console.info.apply(console,arguments);
    },
    warn: function() {
      let now = + new Date();
      if (!logOutput.warn[now]) logOutput.warn[now] = [];
      logOutput.warn[now].push(arguments);
      console.warn.apply(console,arguments);
    },
  },
  net = require("net"),
  OBSWebSocket = require("obs-websocket-js"),
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
const currentAppVersion = "v" + remote.app.getVersion();
i18n.configure({
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true
});

var jworgIsReachable = false,
  initialConnectivityCheck = true;

function checkInternet(online) {
  jworgIsReachable = !!online;
  $("#mediaSync").toggleClass("noJwOrg", !online).prop("disabled", !online);
  if (!online) {
    initialConnectivityCheck = false;
    setTimeout(updateOnlineStatus, 10000);
  }
}
const updateOnlineStatus = async () => checkInternet((await isReachable("www.jw.org", 443, !initialConnectivityCheck)));
overlay(true, "cog fa-spin");
updateOnlineStatus();
require("electron").ipcRenderer.on("overlay", (event, message) => overlay(true, message[0], message[1]));
require("electron").ipcRenderer.on("macUpdate", async () => {
  await overlay(true, "cloud-download-alt fa-beat", "circle-notch fa-spin text-success");
  try {
    let latestVersion = (await request("https://api.github.com/repos/sircharlo/jw-meeting-media-fetcher/releases/latest")).data;
    let macDownload = latestVersion.assets.find(a => a.name.includes("dmg"));
    notifyUser("info", "updateDownloading", latestVersion.tag_name, false, null);
    let macDownloadPath = path.join(remote.app.getPath("downloads"), macDownload.name);
    fs.writeFileSync(macDownloadPath, new Buffer((await request(macDownload.browser_download_url, {isFile: true})).data));
    await shell.openExternal(url.pathToFileURL(macDownloadPath).href);
    // remote.app.exit();
  } catch(err) {
    notifyUser("error", "updateNotDownloaded", currentAppVersion, true, err, {desc: "moreInfo", url: "https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest"});
  }
  $("#bg-mac-update").fadeIn(fadeDelay);
  $("#btn-settings").addClass("pulse-danger");
  $("#version").addClass("btn-danger pulse-danger").removeClass("btn-light").find("i").remove().end().prepend("<i class='fas fa-hand-point-right'></i> ").append(" <i class='fas fa-hand-point-left'></i>").click(function() {
    shell.openExternal("https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest");
  });
  await overlay(false);
});
require("electron").ipcRenderer.on("notifyUser", (event, arg) => {
  notifyUser(arg[0], arg[1]);
});
require("electron").ipcRenderer.on("congregationInitialSelector", () => {
  congregationInitialSelector();
});
const bugUrl = () => "https://github.com/sircharlo/jw-meeting-media-fetcher/issues/new?labels=bug,from-app&title=ISSUE DESCRIPTION HERE&body=" + encodeURIComponent("### Describe the bug\nA clear and concise description of what the bug is.\n\n### To Reproduce\nSteps to reproduce the behavior:\n1. Go to '...'\n2. Click on '....'\n3. Do '....'\n4. See error\n\n### Expected behavior\nA clear and concise description of what you expected to happen.\n\n### Screenshots\nIf possible, add screenshots to help explain your problem.\n\n### System specs\n- " + os.type() + " " + os.release() + "\n- JWMMF " + currentAppVersion + "\n\n### Additional context\nAdd any other context about the problem here.\n" + (prefs ? "\n### Anonymized `prefs.json`\n```\n" + JSON.stringify(Object.fromEntries(Object.entries(prefs).map(entry => {
  if ((entry[0].startsWith("cong") || entry[0] == "localOutputPath") && entry[1]) entry[1] = "***";
  return entry;
})), null, 2) + "\n```" : "") + (logOutput.error && logOutput.error.length >0 ? "\n### Full error log\n```\n" + JSON.stringify(logOutput.error, null, 2) + "\n```" : "") + "\n").replace(/\n/g, "%0D%0A");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

var baseDate = dayjs().startOf("isoWeek"),
  cancelSync = false,
  datepickers,
  downloadStats = {},
  dryrun = false,
  ffmpegIsSetup = false,
  jsonLangs = {},
  jwpubDbs = {},
  logLevel = "info",
  logOutput = {
    error: {},
    warn: {},
    info: {},
    debug: {}
  },
  meetingMedia,
  modal = new bootstrap.Modal(document.getElementById("staticBackdrop"), {
    backdrop: "static",
    keyboard: false
  }),
  now = dayjs().hour(0).minute(0).second(0).millisecond(0),
  obs = {},
  paths = {
    app: path.normalize(remote.app.getPath("userData"))
  },
  pendingMusicFadeOut = {},
  perfStats = {},
  prefs = {},
  tempMediaArray = [],
  totals = {},
  webdavIsAGo = false,
  stayAlive;
paths.langs = path.join(paths.app, "langs.json");
paths.lastRunVersion = path.join(paths.app, "lastRunVersion.json");

datepickers = datetime(".timePicker", {
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
if (remote.app.isPackaged) {
  require("electron").ipcRenderer.send("attemptAutoUpdate");
} else {
  congregationInitialSelector();
}
function goAhead() {
  if (fs.existsSync(paths.prefs)) {
    try {
      prefs = JSON.parse(fs.readFileSync(paths.prefs));
    } catch (err) {
      notifyUser("error", "errorInvalidPrefs", null, true, err, true);
    }
    prefsInitialize();
  }
  getInitialData();
  dateFormatter();
  $("#overlaySettings input:not(.timePicker), #overlaySettings select").on("change", function() {
    if ($(this).prop("tagName") == "INPUT") {
      if ($(this).prop("type") == "checkbox") {
        prefs[$(this).prop("id")] = $(this).prop("checked");
      } else if ($(this).prop("type") == "radio") {
        prefs[$(this).closest("div").prop("id")] = escape($(this).closest("div").find("input:checked").val());
      } else if ($(this).prop("type") == "text" || $(this).prop("type") == "password"  || $(this).prop("type") == "hidden" || $(this).prop("type") == "range") {
        prefs[$(this).prop("id")] = escape($(this).val());
      }
    } else if ($(this).prop("tagName") == "SELECT") {
      prefs[$(this).prop("id")] = escape($(this).find("option:selected").val());
    }
    if ($(this).prop("id") == "disableHardwareAcceleration") toggleHardwareAcceleration();
    if ($(this).prop("id") == "congServer" && $(this).val() == "") $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #webdavFolderList").val("").empty().change();
    if ($(this).prop("id").includes("congServer")) webdavSetup();
    if ($(this).prop("id") == "localAppLang") setAppLang();
    if ($(this).prop("id") == "lang") {
      setVars();
      setMediaLang().finally(() => {
        refreshBackgroundImagePreview();
      });
    }
    if ($(this).prop("id") == "enableObs" || $(this).prop("id") == "obsPort" || $(this).prop("id") == "obsPassword") obsGetScenes(true);
    if ($(this).prop("name").includes("Day") || $(this).prop("name").includes("exclude") || $(this).prop("id") == "maxRes" || $(this).prop("id").includes("congServer")) meetingMedia = {};
    if ($(this).prop("id").includes("congServer") || $(this).prop("name").includes("Day")) {
      setVars();
      rm(glob.sync(path.join(paths.media, "*"), {
        ignore: [path.join(paths.media, "Recurring")],
        onlyDirectories: true
      }));
      dateFormatter();
    }
    validateConfig(true, $(this).prop("id") == "disableHardwareAcceleration");
  });
}
function addMediaItemToPart (date, paragraph, media) {
  if (!meetingMedia[date]) meetingMedia[date] = [];
  if ((media.filepath && !meetingMedia[date].map(part => part.media).flat().map(item => item.filepath).filter(Boolean).includes(media.filepath)) || (media.checksum && !meetingMedia[date].map(part => part.media).flat().map(item => item.checksum).filter(Boolean).includes(media.checksum))) {
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
    fs.rmSync(fileOrDir, {
      recursive: true,
      force: true
    });
  }
}
function congregationChange(prefsFile) {
  overlay(true, "cog fa-spin").then(() => {
    paths.prefs = prefsFile;
    prefs = {};
    prefsInitialize();
    goAhead();
  });
}
function congregationInitialSelector() {
  $(document).ready(function(){
    congregationPrefsPopulate();
    if (paths.congprefs.length > 1) {
      let congregationList = $("<div id='congregationList' class='list-group'>");
      for (var congregation of paths.congprefs) {
        $(congregationList).prepend("<button class='d-flex list-group-item list-group-item-action' value='" + congregation.path + "'>" + congregation.name + "</div></button>");
      }
      $(congregationList).on("click", "button", function() {
        showModal(false);
        congregationChange($(this).val());
      });
      showModal(true, true, "<i class='fas fa-2x fa-building-user'></i>", congregationList);
    } else if (paths.congprefs.length == 1) {
      paths.prefs = paths.congprefs[0].path;
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
    $("#congregationSelect .dropdown-item.congregation:eq(0)").click();
  }
}
function congregationPrefsPopulate() {
  paths.congprefs = glob.sync(path.join(paths.app, "prefs*.json")).map(congregationPrefs => ({
    name: JSON.parse(fs.readFileSync(congregationPrefs)).congregationName || "Default",
    path: congregationPrefs
  })).sort((a, b) => b.name.localeCompare(a.name));
}
function congregationSelectPopulate() {
  $("#congregationSelect .dropdown-menu .congregation").remove();
  for (var congregation of paths.congprefs) {
    $("#congregationSelect .dropdown-menu").prepend("<button class='dropdown-item congregation " + (path.resolve(paths.prefs) == path.resolve(congregation.path) ? "active" : "") + "' value='" + congregation.path + "'>" + (paths.congprefs.length > 1 ? "<i class='fas fa-square-minus text-warning'></i> " : "") + congregation.name + "</button>");
    if (path.resolve(paths.prefs) == path.resolve(congregation.path)) $("#congregationSelect button.dropdown-toggle").text(congregation.name);
  }
}
function convertPdf(mediaFile) {
  return new Promise((resolve)=>{
    var pdfjsLib = require("pdfjs-dist/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.entry.js");
    pdfjsLib.getDocument({
      url: mediaFile,
      verbosity: 0
    }).promise.then(async function(pdf) {
      for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        await convertPdfPage(mediaFile, pdf, pageNum);
      }
      await rm(mediaFile);
    }).catch((err) => {
      notifyUser("warn", "warnPdfConversionFailure", path.basename(mediaFile), true, err);
    }).then(() => {
      resolve();
    });
  });
}
function convertPdfPage(mediaFile, pdf, pageNum) {
  return new Promise((resolve)=>{
    pdf.getPage(pageNum).then(function(page) {
      $("body").append("<div id='pdf' style='display: none;'>");
      $("div#pdf").append("<canvas id='pdfCanvas'></canvas>");
      let scale = fullHd[1] / page.getViewport({scale: 1}).height * 2;
      var canvas = $("#pdfCanvas")[0];
      let ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      canvas.height = fullHd[1] * 2;
      canvas.width = page.getViewport({scale: scale}).width;
      page.render({
        canvasContext: ctx,
        viewport: page.getViewport({scale: scale})
      }).promise.then(function() {
        fs.writeFileSync(path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + "-" + String(pageNum).padStart(2, "0") + ".png"), new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
        $("div#pdf").remove();
        resolve();
      });
    });
  });
}
function convertSvg(mediaFile) {
  return new Promise((resolve)=>{
    $("body").append("<div id='svg'>");
    $("div#svg").append("<img id='svgImg'>").append("<canvas id='svgCanvas'></canvas>");
    $("img#svgImg").on("load", function() {
      let canvas = $("#svgCanvas")[0],
        image = $("img#svgImg")[0];
      image.height = fullHd[1] * 2;
      canvas.height = image.height;
      canvas.width  = image.width;
      let canvasContext = canvas.getContext("2d");
      canvasContext.fillStyle = "white";
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);
      canvasContext.imageSmoothingEnabled = true;
      canvasContext.imageSmoothingQuality = "high";
      canvasContext.drawImage(image, 0, 0);
      fs.writeFileSync(path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + ".png"), new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
      rm(mediaFile);
      $("div#svg").remove();
      return resolve();
    });
    $("img#svgImg").on("error", function() {
      notifyUser("warn", "warnSvgConversionFailure", path.basename(mediaFile), true);
      return resolve();
    });
    $("img#svgImg").prop("src", escape(mediaFile));
  });
}
async function convertUnusableFiles() {
  for (let pdfFile of glob.sync(path.join(paths.media, "**", "*pdf"), {
    ignore: [path.join(paths.media, "Recurring")]
  })) {
    await convertPdf(pdfFile);
  }
  for (let svgFile of glob.sync(path.join(paths.media, "**", "*svg"), {
    ignore: [path.join(paths.media, "Recurring")]
  })) {
    await convertSvg(svgFile);
  }
}
function createMediaNames() {
  perf("createMediaNames", "start");
  Object.values(meetingMedia).map(meeting => {
    meeting.map((part, i) => {
      part.media.filter(media => !media.safeName).map((media, j) => {
        media.safeName = (i + 1).toString().padStart(2, "0") + "-" + (j + 1).toString().padStart(2, "0");
        if (!media.congSpecific) {
          media.safeName = sanitizeFilename(media.safeName + " - " + ((media.queryInfo && media.queryInfo.TargetParagraphNumberLabel ? "Paragraph " + media.queryInfo.TargetParagraphNumberLabel + " - " : "")) + (media.pub && media.pub.includes("sjj") ? "Song " : "") + media.title + path.extname((media.url ? media.url : media.filepath)));
        }
      });
    });
  });
  log.debug(Object.entries(meetingMedia).map(meeting => { meeting[1] = meeting[1].filter(mediaItem => mediaItem.media.length > 0).map(item => item.media).flat(); return meeting; }));
  perf("createMediaNames", "stop");
}
function createVideoSync(mediaFile){
  let outputFilePath = path.format({ ...path.parse(mediaFile), base: undefined, ext: ".mp4" });
  return new Promise((resolve)=>{
    try {
      if (path.extname(mediaFile).includes("mp3")) {
        ffmpegSetup().then(function () {
          ffmpeg(mediaFile).on("end", function() {
            if (!prefs.keepOriginalsAfterConversion) rm(mediaFile);
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
        convertedImageDimensions = aspect.resize(imageDimesions.width, imageDimesions.height, (fullHd[1] / fullHd[0] > imageDimesions.height / imageDimesions.width ? (imageDimesions.width > fullHd[0] ? fullHd[0] : imageDimesions.width) : null), (fullHd[1] / fullHd[0] > imageDimesions.height / imageDimesions.width ? null : (imageDimesions.height > fullHd[1] ? fullHd[1] : imageDimesions.height)));
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
            if (!prefs.keepOriginalsAfterConversion) rm(mediaFile);
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
  }).map(item => path.basename(item)).filter(item => dayjs(item).isValid())) {
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
    mkdirSync(path.join(paths.media, date));
    fs.writeFileSync(path.join(paths.media, date, date + ".xspf"), (new XMLBuilder({ignoreAttributes: false})).build(playlistItems));
  }
}
function dateFormatter() {
  let locale = prefs.localAppLang ? prefs.localAppLang : "en";
  try {
    if (locale !== "en") require("dayjs/locale/" + locale);
  } catch(err) {
    log.warn("%c[locale] Date locale " + locale + " not found, falling back to 'en'");
  }
  $("#folders .day").remove();
  for (var d = 6; d >= 0; d--) {
    if (!baseDate.clone().add(d, "days").isBefore(now)) $("#folders").prepend($("<button>", {
      id: "day" + d,
      class: "day alertIndicators m-1 col btn btn-sm align-items-center justify-content-center " + (baseDate.clone().add(d, "days").isSame(now) ? "pulse-info " : "") + ([prefs.mwDay, prefs.weDay].includes(d.toString()) ? "meeting btn-secondary " : "btn-light ") + (prefs.mwDay == d.toString() ? "mw " : "") + (prefs.weDay == d.toString() ? "we " : ""),
      "data-datevalue": baseDate.clone().add(d, "days").locale(locale).format("YYYY-MM-DD")
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
    window[$(this).attr("class").split(" ").filter(el => el.includes("btn-action-")).join(" ").split("-").splice(2).join("-").toLowerCase().replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""))] = true;
    clearInterval(timeinterval);
    clearTimeout(finalTimeout);
    res();
  });
});
function disableGlobalPref([pref, value]) {
  let row = $("#" + pref).closest("div.row");
  if (row.find(".settingLocked").length === 0) row.find("label").first().prepend($("<span class='badge bg-warning me-1 rounded-pill settingLocked text-black i18n-title' data-bs-toggle='tooltip'><i class='fa-lock fas'></i></span>"));
  row.addClass("text-muted disabled").tooltip({
    title: i18n.__("settingLocked")
  }).find("#" + pref + ", #" + pref + " input, input[data-target=" + pref + "]").addClass("forcedPref").prop("disabled", true);
  log.info("%c[enforcedPrefs] [" + pref + "] " + value, "background-color: #FCE4EC; color: #AD1457;");
}
function displayMusicRemaining() {
  let timeRemaining;
  if (prefs.enableMusicFadeOut && pendingMusicFadeOut.endTime >0) {
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
    mkdirSync(file.cacheDir);
    let downloadedFile = new Buffer((await request(file.url, {isFile: true})).data);
    fs.writeFileSync(file.cacheFile, downloadedFile);
    if (file.folder) {
      mkdirSync(path.join(paths.media, file.folder));
      fs.writeFileSync(path.join(paths.media, file.folder, file.destFilename), downloadedFile);
    }
    downloadStat("jworg", "live", file);
    if (path.extname(file.cacheFile) == ".jwpub") await new zipper((await new zipper(file.cacheFile).readFile("contents"))).extractAllTo(file.cacheDir);
  } else {
    if (file.folder) {
      mkdirSync(path.join(paths.media, file.folder));
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
function enablePreviouslyForcedPrefs() {
  $("div.row.text-muted.disabled").removeClass("text-muted disabled").tooltip("dispose").find(".forcedPref").prop("disabled", false).removeClass("forcedPref");
  $("div.row .settingLocked").remove();
}
async function enforcePrefs() {
  paths.forcedPrefs = path.posix.join(prefs.congServerDir, "forcedPrefs.json");
  let forcedPrefs = await getForcedPrefs();
  if (Object.keys(forcedPrefs).length > 0) {
    let previousPrefs = v8.deserialize(v8.serialize(prefs));
    Object.assign(prefs, forcedPrefs);
    if (JSON.stringify(previousPrefs) !== JSON.stringify(prefs)) {
      setMediaLang();
      validateConfig(true);
      prefsInitialize();
    }
    for (var pref of Object.entries(forcedPrefs)) {
      disableGlobalPref(pref);
    }
  } else {
    enablePreviouslyForcedPrefs(true);
  }
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
    var ffmpegVersion = (await request("https://api.github.com/repos/vot/ffbinaries-prebuilt/releases/latest")).data.assets.filter(a => a.name.includes(targetOs) && a.name.includes("ffmpeg"))[0];
    var ffmpegZipPath = path.join(paths.app, "ffmpeg", "zip", ffmpegVersion.name);
    if (!fs.existsSync(ffmpegZipPath) || fs.statSync(ffmpegZipPath).size !== ffmpegVersion.size) {
      await rm([path.join(paths.app, "ffmpeg", "zip")]);
      mkdirSync(path.join(paths.app, "ffmpeg", "zip"));
      fs.writeFileSync(ffmpegZipPath, new Buffer((await request(ffmpegVersion.browser_download_url, {isFile: true})).data));
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
    for (let meeting of Object.keys(meetingMedia).filter(meeting => dayjs(meeting, "YYYY-MM-DD").isValid() && dayjs(meeting, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]"))) {
      meetingMedia[meeting] = meetingMedia[meeting].filter(part => part.media.filter(mediaItem => mediaItem.recurring).length == 0);
    }
    for (let congSpecificFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Media")))) {
      let isMeetingDate = dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isValid() && dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(congSpecificFolder.basename, "YYYY-MM-DD"));
      let isRecurring = congSpecificFolder.basename == "Recurring";
      if (isMeetingDate || isRecurring) {
        if (!meetingMedia[congSpecificFolder.basename]) meetingMedia[congSpecificFolder.basename] = [];
        for (let remoteFile of (await webdavLs(path.posix.join(prefs.congServerDir, "Media", congSpecificFolder.basename)))) {
          let congSpecificFile = {
            "title": "Congregation-specific",
            media: [{
              safeName: remoteFile.basename,
              congSpecific: true,
              filesize: remoteFile.size,
              folder: congSpecificFolder.basename,
              url: remoteFile.filename
            }]
          };
          if (!meetingMedia[congSpecificFolder.basename].map(part => part.media).flat().map(item => item.url).filter(Boolean).includes(remoteFile.filename)) meetingMedia[congSpecificFolder.basename].push(congSpecificFile);
          if (isRecurring) {
            for (let meeting of Object.keys(meetingMedia)) {
              if (dayjs(meeting, "YYYY-MM-DD").isValid() && dayjs(meeting, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
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
    for (var hiddenFilesFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Hidden"))).filter(hiddenFilesFolder => dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isValid() && dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD"))).sort((a, b) => (a.basename > b.basename) ? 1 : -1)) {
      for (var hiddenFile of await webdavLs(path.posix.join(prefs.congServerDir, "Hidden", hiddenFilesFolder.basename))) {
        var hiddenFileLogString = "background-color: #d6d8d9; color: #1b1e21;";
        if (meetingMedia[hiddenFilesFolder.basename]) {
          meetingMedia[hiddenFilesFolder.basename].filter(part => part.media.filter(mediaItem => mediaItem.safeName == hiddenFile.basename).map(function (mediaItem) {
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
async function getDbFromJwpub(pub, issue, localpath) {
  try {
    var SQL = await sqljs();
    if (localpath) {
      var jwpubContents = await new zipper(localpath).readFile("contents");
      var tempDb = new SQL.Database(await new zipper(jwpubContents).readFile((await new zipper(jwpubContents).getEntries()).filter(entry => path.extname(entry.name) == ".db")[0].entryName));
      var jwpubInfo = (await executeStatement(tempDb, "SELECT UniqueEnglishSymbol, IssueTagNumber FROM Publication"))[0];
      pub = jwpubInfo.UniqueEnglishSymbol.replace(/[0-9]/g, "");
      issue = jwpubInfo.IssueTagNumber;
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      jwpubDbs[pub][issue] = tempDb;
    } else {
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      if (!jwpubDbs[pub][issue]) {
        var jwpub = (await getMediaLinks(pub, null, issue, "JWPUB"))[0];
        jwpub.pub = pub;
        jwpub.issue = issue;
        jwpub.queryInfo = {};
        await downloadIfRequired(jwpub);
        jwpubDbs[pub][issue] = new SQL.Database(fs.readFileSync(glob.sync(path.join(paths.pubs, jwpub.pub, jwpub.issue, "0", "*.db"))[0]));
      }
    }
    return jwpubDbs[pub][issue];
  } catch (err) {
    notifyUser("warn", "errorJwpubDbFetch", pub + " - " + issue, false, err, true);
  }
}
async function getDocumentExtract(db, docId) {
  var extractMultimediaItems = [];
  for (var extractItem of (await executeStatement(db, "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UniqueEnglishSymbol,IssueTagNumber,Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + docId + " AND NOT UniqueEnglishSymbol = 'sjj' AND NOT UniqueEnglishSymbol = 'mwbr' " + (prefs.excludeTh ? "AND NOT UniqueEnglishSymbol = 'th' " : "") + "ORDER BY DocumentExtract.BeginParagraphOrdinal"))) {
    let uniqueEnglishSymbol = extractItem.UniqueEnglishSymbol.replace(/[0-9]/g, "");
    if (uniqueEnglishSymbol !== "snnw") { // exclude the "old new songs" songbook, as we don't need images from that
      var extractDb = await getDbFromJwpub(uniqueEnglishSymbol, extractItem.IssueTagNumber);
      if (extractDb) {
        extractMultimediaItems = extractMultimediaItems.concat((await getDocumentMultimedia(extractDb, null, extractItem.RefMepsDocumentId)).filter(extractMediaFile => {
          if (extractMediaFile.queryInfo.tableQuestionIsUsed && !extractMediaFile.queryInfo.TargetParagraphNumberLabel) extractMediaFile.BeginParagraphOrdinal = extractMediaFile.queryInfo.NextParagraphOrdinal;
          if (extractMediaFile.BeginParagraphOrdinal && extractItem.RefBeginParagraphOrdinal && extractItem.RefEndParagraphOrdinal) {
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
async function getDocumentMultimedia(db, destDocId, destMepsId, memOnly) {
  let tableMultimedia = ((await executeStatement(db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
  let keySymbol = (await executeStatement(db, "SELECT UniqueEnglishSymbol FROM Publication"))[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
  let issueTagNumber = (await executeStatement(db, "SELECT IssueTagNumber FROM Publication"))[0].IssueTagNumber;
  let targetParagraphNumberLabelExists = (await executeStatement(db, "PRAGMA table_info('Question')")).map(item => item.name).includes("TargetParagraphNumberLabel");
  let suppressZoomExists = (await executeStatement(db, "PRAGMA table_info('Multimedia')")).map(item => item.name).includes("SuppressZoom");
  let multimediaItems = [];
  if (!(keySymbol == "lffi" && prefs.excludeLffi && prefs.excludeLffiImages)) for (var multimediaItem of (await executeStatement(db, "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId," + (suppressZoomExists ? " Multimedia.SuppressZoom," : "") + " Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + (targetParagraphNumberLabelExists && tableMultimedia == "DocumentMultimedia" ? "Question.TargetParagraphNumberLabel, " : "") + "Multimedia.MimeType, Multimedia.DataType, Multimedia.MajorType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId " + (targetParagraphNumberLabelExists && tableMultimedia == "DocumentMultimedia" ? "LEFT JOIN Question ON Question.DocumentId = " + tableMultimedia + ".DocumentId AND Question.TargetParagraphOrdinal = " + tableMultimedia + ".BeginParagraphOrdinal " : "") + "WHERE " + (destDocId || destDocId === 0 ? tableMultimedia + ".DocumentId = " + destDocId : "Document.MepsDocumentId = " + destMepsId) + " AND (" + (keySymbol !== "lffi" || !prefs.excludeLffi ? "(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')" : "") + (keySymbol !== "lffi" || (!prefs.excludeLffi && !prefs.excludeLffiImages) ? " OR " : "") + (keySymbol !== "lffi" || !prefs.excludeLffiImages ? "(Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 6 AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25)" : "") + ")" + (suppressZoomExists ? " AND Multimedia.SuppressZoom <> 1" : "") + (tableMultimedia == "DocumentMultimedia" ? " GROUP BY " + tableMultimedia + ".MultimediaId ORDER BY BeginParagraphOrdinal" : "")))) {
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
        Object.assign(json, (await getMediaLinks(multimediaItem.KeySymbol, multimediaItem.Track, multimediaItem.IssueTagNumber, null, multimediaItem.MultiMeps))[0]);
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
async function getForcedPrefs() {
  let forcedPrefs = {};
  if (await webdavExists(paths.forcedPrefs)) {
    try {
      forcedPrefs = (await request("https://" + prefs.congServer + ":" + prefs.congServerPort + paths.forcedPrefs, {
        webdav: true,
        noCache: true
      })).data;
    } catch(err) {
      notifyUser("error", "errorForcedSettingsEnforce", null, true, err);
    }
  }
  return forcedPrefs;
}
async function getInitialData() {
  meetingMedia = {};
  jwpubDbs = {};
  await getJwOrgLanguages();
  await getLocaleLanguages();
  await setAppLang();
  await updateCleanup();
  await periodicCleanup();
  await setMediaLang();
  await webdavSetup();
  let configIsValid = validateConfig();
  await obsGetScenes();
  $("#version").html("JWMMF " + (remote.app.isPackaged ? escape(currentAppVersion) : "Development Version"));
  $(".notLinux").closest(".row").add(".notLinux").toggle(os.platform() !== "linux");
  congregationSelectPopulate();
  $("#baseDate .dropdown-menu").empty();
  for (var a = 0; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class='dropdown-item' value='" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "'>" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
  }
  $("#baseDate button.dropdown-toggle").text($("#baseDate .dropdown-item:eq(0)").text());
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  if (prefs.autoStartSync && configIsValid) {
    await overlay(true, "flag-checkered fa-beat", "pause", "cancel-sync");
    await delay(5);
    if (!cancelSync) $("#mediaSync").click();
  }
  overlay(false, (prefs.autoStartSync && configIsValid ? "flag-checkered" : null));
}
async function getJwOrgLanguages(forceRefresh) {
  if ((!fs.existsSync(paths.langs)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(now.subtract(3, "months")) || forceRefresh) {
    let cleanedJwLangs = (await request("https://www.jw.org/en/languages/")).data.languages.filter(lang => lang.hasWebContent).map(lang => ({
      name: lang.name,
      langcode: lang.langcode,
      symbol: lang.symbol,
      vernacularName: lang.vernacularName
    }));
    fs.writeFileSync(paths.langs, JSON.stringify(cleanedJwLangs, null, 2));
    prefs.langUpdatedLast = dayjs();
    validateConfig(true);
    jsonLangs = cleanedJwLangs;
  } else {
    jsonLangs = JSON.parse(fs.readFileSync(paths.langs));
  }
  $("#lang").empty();
  for (var lang of jsonLangs) {
    $("#lang").append($("<option>", {
      value: lang.langcode,
      text: lang.vernacularName + " (" + lang.name + ")"
    }));
  }
  $("#lang").val(prefs.lang).select2();
}
function getLocaleLanguages() {
  $("#localAppLang").empty();
  for (var localeLang of fs.readdirSync(path.join(__dirname, "locales")).map(file => file.replace(".json", ""))) {
    let localeLangMatches = jsonLangs.filter(item => item.symbol === localeLang);
    $("#localAppLang").append($("<option>", {
      value: localeLang,
      text: (localeLangMatches.length === 1 ? localeLangMatches[0].vernacularName + " (" + localeLangMatches[0].name + ")" : localeLang)
    }));
  }
  $("#localAppLang").val(prefs.localAppLang);
}
async function getMediaLinks(pubSymbol, track, issue, format, docId) {
  let mediaFiles = [];
  if (prefs.lang && prefs.maxRes) {
    try {
      if (pubSymbol === "w" && parseInt(issue) >= 20080101 && issue.slice(-2) == "01") pubSymbol = "wp";
      let requestUrl = "https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json" + (docId ? "&docid=" + docId : "&pub=" + pubSymbol + (track ? "&track=" + track : "") + (issue ? "&issue=" + issue : "")) + (format ? "&fileformat=" + format : "") + "&langwritten=" + prefs.lang;
      let result = (await request(requestUrl)).data;
      log.debug(pubSymbol, track, issue, format, docId, requestUrl);
      if (result && result.length > 0 && result[0].status && result[0].status == 404 && pubSymbol && track) {
        requestUrl = "https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json" + "&pub=" + pubSymbol + "m" + "&track=" + track + (issue ? "&issue=" + issue : "") + (format ? "&fileformat=" + format : "") + "&langwritten=" + prefs.lang;
        result = (await request(requestUrl)).data;
        log.debug(pubSymbol + "m", track, issue, format, docId, requestUrl);
      }
      if (result && result.files) {
        let mediaFileCategories = Object.values(result.files)[0];
        mediaFiles = mediaFileCategories[("MP4" in mediaFileCategories ? "MP4" : Object.keys(mediaFileCategories)[0])].filter(({label}) => label.replace(/\D/g, "") <= prefs.maxRes.replace(/\D/g, ""));
        let map = new Map(mediaFiles.map(item => [item.title, item]));
        for (let item of mediaFiles) {
          let {label, subtitled} = map.get(item.title);
          if ((item.label.replace(/\D/g, "") - label.replace(/\D/g, "") || subtitled - item.subtitled) > 0) map.set(item.title, item);
        }
        mediaFiles = Array.from(map.values(), ({title, file: {url}, file: {checksum}, filesize, duration, trackImage, track, pub}) => ({title, url, checksum, filesize, duration, trackImage, track, pub})).map(item => {
          item.trackImage = item.trackImage.url;
          if (issue) item.issue = issue;
          return item;
        });
        for (var item of mediaFiles) {
          if (item.duration >0 && (!item.trackImage || !item.pub)) {
            Object.assign(item, (await getMediaAdditionalInfo(pubSymbol, track, issue, format, docId)));
          }
        }
      }
    } catch(err) {
      notifyUser("warn", "infoPubIgnored", pubSymbol + " - " + track + " - " + issue + " - " + format, false, err);
    }
  }
  log.debug(mediaFiles);
  return mediaFiles;
}
async function getMediaAdditionalInfo(pub, track, issue, format, docId) {
  let mediaAdditionalInfo = {};
  if (issue) issue = issue.toString().replace(/(\d{6})00$/gm, "$1");
  let result = (await request("https://b.jw-cdn.org/apis/mediator/v1/media-items/" + prefs.lang + "/" + (docId ? "docid-" + docId + "_1": "pub-" + [pub, issue, track].filter(Boolean).join("_")) + "_VIDEO")).data;
  if (result && result.media && result.media.length > 0) {
    if (result.media[0].images.wss.sm) mediaAdditionalInfo.thumbnail = result.media[0].images.wss.sm;
    if (result.media[0].primaryCategory) mediaAdditionalInfo.primaryCategory = result.media[0].primaryCategory;
  }
  return mediaAdditionalInfo;
}
async function getMwMediaFromDb() {
  var mwDate = baseDate.clone().add(prefs.mwDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(mwDate))) {
    updateTile("day" + prefs.mwDay, "warning");
    try {
      var issue = baseDate.format("YYYYMM") + "00";
      if (parseInt(baseDate.format("M")) % 2 === 0) issue = baseDate.clone().subtract(1, "months").format("YYYYMM") + "00";
      var db = await getDbFromJwpub("mwb", issue);
      var docId = (await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + baseDate.format("YYYYMMDD") + ""))[0].DocumentId;
      (await getDocumentMultimedia(db, docId)).map(video => {
        addMediaItemToPart(mwDate, video.BeginParagraphOrdinal, video);
      });
      (await getDocumentExtract(db, docId)).map(extract => {
        addMediaItemToPart(mwDate, extract.BeginParagraphOrdinal, extract);
      });
      for (var internalRef of (await executeStatement(db, "SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = " + docId + " AND Document.Class <> 94"))) {
        (await getDocumentMultimedia(db, internalRef.DocumentId)).map(internalRefMediaFile => {
          addMediaItemToPart(mwDate, internalRef.BeginParagraphOrdinal, internalRefMediaFile);
        });
      }
      updateTile("day" + prefs.mwDay, "success");
    } catch(err) {
      notifyUser("error", "errorGetMwMedia", null, true, err, true);
      updateTile("day" + prefs.mwDay, "danger");
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
function setAppLang() {
  try {
    i18n.setLocale(prefs.localAppLang ? prefs.localAppLang : "en");
    $("[data-i18n-string]").each(function() {
      $(this).html(i18n.__($(this).data("i18n-string")));
    });
    $(".i18n-title").each(() => {
      $(this).tooltip("dispose").tooltip({
        title: i18n.__("settingLocked")
      });
    });
  } catch(err) {
    log.error(err);
  }
  dateFormatter();
}
async function getWeMediaFromDb() {
  var weDate = baseDate.clone().add(prefs.weDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(weDate))) {
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
      for (var picture of (await executeStatement(db, "SELECT DocumentMultimedia.MultimediaId,Document.DocumentId, Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType, DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption, Question.TargetParagraphNumberLabel FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId LEFT JOIN Question ON Question.DocumentId = DocumentMultimedia.DocumentId AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal WHERE Document.DocumentId = " + docId + " AND Multimedia.CategoryType <> 9"))) {
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
      var qrySongs = await executeStatement(db, "SELECT * FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DataType = 2 ORDER BY BeginParagraphOrdinal LIMIT 2 OFFSET " + weekNumber * 2);
      for (var song = 0; song < qrySongs.length; song++) {
        let songJson = await getMediaLinks(qrySongs[song].KeySymbol, qrySongs[song].Track);
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
      await axios.get("https://wol.jw.org/wol/finder?docid=1102022800&wtlocale=" + prefs.lang + "&format=json&snip=yes", {
        adapter: require("axios/lib/adapters/http")
      }).then(result => {
        mkdirSync(path.join(paths.yearText, "../"));
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
  $("h5.modal-title").text(i18n.__("meeting"));
  for (var folder of glob.sync(path.join(paths.media, "*/"), {
    onlyDirectories: true
  })) {
    folder = escape(folder);
    $(folderListing).append("<button class='d-flex list-group-item list-group-item-action folder " + (now.format("YYYY-MM-DD") == path.basename(folder) ? "thatsToday" : "") + "' data-folder='" + folder + "'>" + path.basename(folder) + "</div></button>");
  }
  return folderListing;
}
async function manageMedia(day, isMeetingDate, mediaType) {
  await overlay(true, (webdavIsAGo ? "cloud" : "folder-open") + " fa-beat");
  $("#chosenMeetingDay").data("folderName", day).text(dayjs(day, "YYYY-MM-DD").isValid() ? day : i18n.__("recurring"));
  removeEventListeners();
  document.addEventListener("drop", dropHandler);
  document.addEventListener("dragover", dragoverHandler);
  document.addEventListener("dragenter", dragenterHandler);
  document.addEventListener("dragleave", dragleaveHandler);
  $("#chooseUploadType input").prop("checked", false).change();
  $("#chooseUploadType label.active").removeClass("active");
  if (!meetingMedia[day]) meetingMedia[day] = [];
  await startMediaSync(true, isMeetingDate || mediaType ? mediaType : null);
  if (!webdavIsAGo) $("#overlayUploadFile .fa-2x").toggleClass("fa-cloud fa-folder-open");
  updateFileList(true);
  await toggleScreen("overlayUploadFile");
  overlay(false);
}
function mkdirSync(dirPath) {
  try {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
}
async function mp4Convert() {
  perf("mp4Convert", "start");
  updateStatus("file-video");
  updateTile("mp4Convert", "warning");
  var filesToProcess = glob.sync(path.join(paths.media, "*"), {
    onlyDirectories: true
  }).map(folderPath => path.basename(folderPath)).filter(folder => dayjs(folder, "YYYY-MM-DD").isValid() && dayjs(folder, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(folder, "YYYY-MM-DD"))).map(folder => glob.sync(path.join(paths.media, folder, "*"), {
    ignore: ["!**/(*.mp4|*.xspf)"]
  })).flat();
  totals.mp4Convert = {
    total: filesToProcess.length,
    current: 1
  };
  progressSet(totals.mp4Convert.current, totals.mp4Convert.total, "mp4Convert");
  for (var mediaFile of filesToProcess) {
    await createVideoSync(mediaFile);
    totals.mp4Convert.current++;
    progressSet(totals.mp4Convert.current, totals.mp4Convert.total, "mp4Convert");
  }
  updateTile("mp4Convert", "success");
  perf("mp4Convert", "stop");
}
function notifyUser(type, message, fileOrUrl, persistent, errorFedToMe, action, hideDismiss) {
  try {
    let icon;
    switch (type) {
    case "error":
      icon = "fa-exclamation-circle text-danger";
      break;
    case "warn":
      icon = "fa-exclamation-circle text-warning";
      break;
    default:
      icon = "fa-info-circle text-primary";
    }
    if (fileOrUrl) fileOrUrl = escape(fileOrUrl);
    if (["error", "warn"].includes(type)) log[type](fileOrUrl ? fileOrUrl : "", errorFedToMe ? errorFedToMe : "");
    type = i18n.__(type);
    let thisBugUrl = bugUrl() + (errorFedToMe ? encodeURIComponent("\n### Error details\n```\n" + JSON.stringify(errorFedToMe, Object.getOwnPropertyNames(errorFedToMe), 2) + "\n```\n").replace(/\n/g, "%0D%0A") : "");
    $("#toastContainer").append($("<div class='toast' role='alert' data-bs-autohide='" + !persistent + "' data-bs-delay='10000'><div class='toast-header'><i class='fas " + icon + "'></i><strong class='me-auto ms-2'>" + type + "</strong><button type='button' class='btn-close " + (hideDismiss ? "d-none" : "") + "' data-bs-dismiss='toast'></button></div><div class='toast-body'><p>" + i18n.__(message) + "</p>" + (fileOrUrl ? "<code>" + fileOrUrl + "</code>" : "") + (action ? "<div class='mt-2 pt-2 border-top'><button type='button' class='btn btn-primary btn-sm toast-action' " + (action && !action.noLink ? "data-toast-action-url='" + escape((action && action.url ? action.url : thisBugUrl)) + "'" :"") + ">" + i18n.__(action && action.desc ? action.desc : "reportIssue") + "</button></div>" : "") + "</div></div>").toast("show"));
  } catch (err) {
    log.error(err);
  }
}
async function obsConnect(force) {
  try {
    if (!prefs.enableObs && obs._connected) {
      await obs.disconnect();
      log.info("OBS disconnected.");
      obs = {};
    } else if ((!obs._connected || force) && prefs.enableObs && prefs.obsPort && prefs.obsPassword) {
      obs = new OBSWebSocket();
      await obs.connect({ address: "localhost:" + prefs.obsPort, password: prefs.obsPassword }).then(() => {
        log.info("OBS success! Connected & authenticated.");
        $(".relatedToObsLogin input").removeClass("is-invalid").addClass("is-valid");

      }).catch(err => {
        notifyUser("error", "errorObs", null, false, err);
        $(".relatedToObsLogin input").removeClass("is-valid").addClass("is-invalid");
      });
      obs.on("error", err => {
        notifyUser("error", "errorObs", null, false, err);
      });
    }
  } catch (err) {
    notifyUser("error", "errorObs", null, false, err);
  }
  return !!obs._connected;
}
async function obsGetScenes(force, currentOnly) {
  try {
    let connectionAttempt = await obsConnect(force);
    $(".relatedToObsScenes").toggle(connectionAttempt);
    return (connectionAttempt ? await obs.send("GetSceneList").then(data => {
      if (currentOnly) {
        return data.currentScene;
      } else {
        $("#overlaySettings .obs-scenes .loaded-scene").remove();
        data.scenes.map(scene => scene.name).sort().forEach(scene => {
          $("#overlaySettings .obs-scenes").append($("<option>", {
            class: "loaded-scene",
            text: scene,
            value: scene
          }));
        });
        for (var pref of ["obsCameraScene", "obsMediaScene"]) {
          if ($("#" + pref + " option[value='" + prefs[pref] + "']").length == 0) {
            prefs[pref] = null;
            validateConfig();
          } else {
            $("#" + pref).val(prefs[pref]);
          }
        }
        $(".modal-footer .left").append("<select class='form-select form-select-lg ms-3 obs-scenes w-auto' id='obsTempCameraScene'></select>");
        $("#obsCameraScene").children().clone().filter(function (i, el) {
          return $(el).val() !== prefs.obsMediaScene;
        }).appendTo("#obsTempCameraScene");
        $("#obsTempCameraScene").val(prefs.obsCameraScene);
        return data;
      }
    }) : false);
  } catch (err) {
    notifyUser("error", "errorObs", null, false, err);
    return false;
  }
}
async function obsSetScene(scene) {
  try {
    if (await obsConnect()) obs.send("SetCurrentScene", { "scene-name": scene });
  } catch (err) {
    notifyUser("error", "errorObs", null, false, err);
  }
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
    let lastPeriodicCleanupPath = path.join(paths.pubs, "lastPeriodicCleanup"),
      lastPeriodicCleanup = fs.existsSync(lastPeriodicCleanupPath) && fs.readFileSync(lastPeriodicCleanupPath, "utf8") || false;
    if (paths.pubs && (!dayjs(lastPeriodicCleanup).isValid() || dayjs(lastPeriodicCleanup).isBefore(now.subtract(6, "months")))) {
      rm(glob.sync(path.join(paths.pubs, "**", "*.mp*")).map(video => {
        let itemDate = dayjs(path.basename(path.join(path.dirname(video), "../")), "YYYYMMDD");
        let itemPub = path.basename(path.join(path.dirname(video), "../../"));
        if (itemPub !== "sjjm" && (!itemDate.isValid() || (itemDate.isValid() && itemDate.isBefore(now.subtract(3, "months"))))) return video;
      }).filter(Boolean));
      mkdirSync(paths.pubs);
      fs.writeFileSync(lastPeriodicCleanupPath, dayjs().format());
    }
  } catch(err) {
    log.error(err);
  }
}
function prefsInitialize() {
  $("#overlaySettings input:checkbox, #overlaySettings input:radio").prop( "checked", false );
  prefs.disableHardwareAcceleration = !!fs.existsSync(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"));
  for (var pref of ["localAppLang", "lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "localOutputPath", "enableMp4Conversion", "keepOriginalsAfterConversion", "congServer", "congServerPort", "congServerUser", "congServerPass", "autoOpenFolderWhenDone", "maxRes", "enableMusicButton", "enableMusicFadeOut", "musicFadeOutTime", "musicFadeOutType", "musicVolume", "mwStartTime", "weStartTime", "excludeTh", "excludeLffi", "excludeLffiImages", "enableVlcPlaylistCreation", "enableMediaDisplayButton", "congregationName", "disableHardwareAcceleration", "enableObs", "obsPort", "obsPassword", "obsMediaScene", "obsCameraScene"]) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) prefs[pref] = null;
  }
  for (let field of ["localAppLang", "lang", "localOutputPath", "congregationName", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir", "musicFadeOutTime", "musicVolume", "mwStartTime", "weStartTime", "obsPort", "obsPassword", "obsMediaScene", "obsCameraScene"]) {
    $("#" + field).val(prefs[field]).closest(".row").find("#" + field + "Display").html(prefs[field]);
  }
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    $(".timePicker").filter("[data-target='" + timeField + "']").val($("#" + timeField).val());
  }
  for (let dtPicker of datepickers) {
    dtPicker.setDate($(dtPicker.element).val());
  }
  for (let checkbox of ["autoStartSync", "autoRunAtBoot", "enableMp4Conversion", "keepOriginalsAfterConversion", "autoQuitWhenDone", "autoOpenFolderWhenDone", "enableMusicButton", "enableMusicFadeOut", "excludeTh", "excludeLffi", "excludeLffiImages", "enableVlcPlaylistCreation", "enableMediaDisplayButton", "disableHardwareAcceleration", "enableObs"]) {
    $("#" + checkbox).prop("checked", prefs[checkbox]);
  }
  for (let radioSel of ["mwDay", "weDay", "maxRes", "musicFadeOutType"]) {
    $("#" + radioSel + " input[value='" + prefs[radioSel] + "']").prop("checked", true);
  }
}
function progressSet(current, total, blockId) {
  if (!dryrun || !blockId) {
    let percent = current / total * 100;
    if (percent > 100 || (!blockId && percent === 100)) percent = 0;
    remote.getCurrentWindow().setProgressBar(percent / 100);
    $("#" + (blockId ? blockId + " .progress-bar" : "globalProgress")).width(percent + "%");
  }
}
function refreshBackgroundImagePreview(force) {
  try {
    let mediaWindowBackgroundImages = glob.sync(path.join(paths.app, "media-window-background-image*"));
    if (mediaWindowBackgroundImages.length == 0) {
      getRemoteYearText(force).then((yearText) => {
        $("#fetchedYearText").text($(yearText).text());
        $("#fetchedYearText, #refreshYeartext").toggle(!!yearText);
      });
    } else {
      $("#currentMediaBackground").prop("src", escape(mediaWindowBackgroundImages[0]) + "?" + (new Date()).getTime());
    }
    $("#currentMediaBackground, #deleteBackground").toggle(mediaWindowBackgroundImages.length > 0);
    $("#chooseBackground").toggle(mediaWindowBackgroundImages.length == 0);
  } catch (err) {
    log.error(err);
  }
}
function refreshFolderListing(folderPath) {
  $(".for-folder-listing-only").show();
  $("h5.modal-title").html($("<button class='btn btn-secondary'>" + path.basename(folderPath) + "</button>").on("click", function() {
    $("div#folderListing").empty().append(listMediaFolders());
  }));
  $("div#folderListing").empty();
  for (var item of glob.sync(path.join(folderPath, "*"))) {
    item = escape(item);
    let lineItem = $("<li class='d-flex align-items-center list-group-item item position-relative " + (isVideo(item) || isAudio(item) ? "video" : (isImage(item) ? "image" : "unknown")) + "' data-item='" + item + "'><div class='d-flex me-3' style='height: 5rem;'></div><div class='flex-fill mediaDesc'>" + path.basename(item).replace(/- Paragraph (\d+) -/g, "<big><span class='alert alert-secondary fw-bold px-2 py-1 small'><i class='fas fa-paragraph'></i> $1</span></big>").replace(/- Song (\d+) -/g, "<big><span class='alert alert-info fw-bold px-2 py-1 small'><i class='fas fa-music'></i> $1</span></big>") + "</div><div class='ps-3 pe-2'><button class='btn btn-lg btn-warning pausePlay pause' style='visibility: hidden;'><i class='fas fa-fw fa-pause'></i></button></div><div><button class='btn btn-lg btn-primary playStop play'><i class='fas fa-fw fa-play'></i></button></div></li>");
    lineItem.find(".mediaDesc").prev("div").append($("<div class='align-self-center d-flex media-item position-relative'></div>").append((isVideo(item) || isAudio(item) ? $("<video preload='metadata' " + (isAudio(item) && !isVideo(item) ? "poster='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMC4wIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNMjU2IDMyQzExMi45IDMyIDQuNTYzIDE1MS4xIDAgMjg4djEwNEMwIDQwNS4zIDEwLjc1IDQxNiAyMy4xIDQxNlM0OCA0MDUuMyA0OCAzOTJWMjg4YzAtMTE0LjcgOTMuMzQtMjA3LjggMjA4LTIwNy44QzM3MC43IDgwLjIgNDY0IDE3My4zIDQ2NCAyODh2MTA0QzQ2NCA0MDUuMyA0NzQuNyA0MTYgNDg4IDQxNlM1MTIgNDA1LjMgNTEyIDM5MlYyODcuMUM1MDcuNCAxNTEuMSAzOTkuMSAzMiAyNTYgMzJ6TTE2MCAyODhMMTQ0IDI4OGMtMzUuMzQgMC02NCAyOC43LTY0IDY0LjEzdjYzLjc1QzgwIDQ1MS4zIDEwOC43IDQ4MCAxNDQgNDgwTDE2MCA0ODBjMTcuNjYgMCAzMi0xNC4zNCAzMi0zMi4wNXYtMTI3LjlDMTkyIDMwMi4zIDE3Ny43IDI4OCAxNjAgMjg4ek0zNjggMjg4TDM1MiAyODhjLTE3LjY2IDAtMzIgMTQuMzItMzIgMzIuMDR2MTI3LjljMCAxNy43IDE0LjM0IDMyLjA1IDMyIDMyLjA1TDM2OCA0ODBjMzUuMzQgMCA2NC0yOC43IDY0LTY0LjEzdi02My43NUM0MzIgMzE2LjcgNDAzLjMgMjg4IDM2OCAyODh6Ii8+PC9zdmc+'" : "poster='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48IS0tISBGb250IEF3ZXNvbWUgUHJvIDYuMS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIENvcHlyaWdodCAyMDIyIEZvbnRpY29ucywgSW5jLiAtLT48cGF0aCBkPSJNNDYzLjEgMzJoLTQxNkMyMS40OSAzMi0uMDAwMSA1My40OS0uMDAwMSA4MHYzNTJjMCAyNi41MSAyMS40OSA0OCA0Ny4xIDQ4aDQxNmMyNi41MSAwIDQ4LTIxLjQ5IDQ4LTQ4di0zNTJDNTExLjEgNTMuNDkgNDkwLjUgMzIgNDYzLjEgMzJ6TTExMS4xIDQwOGMwIDQuNDE4LTMuNTgyIDgtOCA4SDU1LjFjLTQuNDE4IDAtOC0zLjU4Mi04LTh2LTQ4YzAtNC40MTggMy41ODItOCA4LThoNDcuMWM0LjQxOCAwIDggMy41ODIgOCA4TDExMS4xIDQwOHpNMTExLjEgMjgwYzAgNC40MTgtMy41ODIgOC04IDhINTUuMWMtNC40MTggMC04LTMuNTgyLTgtOHYtNDhjMC00LjQxOCAzLjU4Mi04IDgtOGg0Ny4xYzQuNDE4IDAgOCAzLjU4MiA4IDhWMjgwek0xMTEuMSAxNTJjMCA0LjQxOC0zLjU4MiA4LTggOEg1NS4xYy00LjQxOCAwLTgtMy41ODItOC04di00OGMwLTQuNDE4IDMuNTgyLTggOC04aDQ3LjFjNC40MTggMCA4IDMuNTgyIDggOEwxMTEuMSAxNTJ6TTM1MS4xIDQwMGMwIDguODM2LTcuMTY0IDE2LTE2IDE2SDE3NS4xYy04LjgzNiAwLTE2LTcuMTY0LTE2LTE2di05NmMwLTguODM4IDcuMTY0LTE2IDE2LTE2aDE2MGM4LjgzNiAwIDE2IDcuMTYyIDE2IDE2VjQwMHpNMzUxLjEgMjA4YzAgOC44MzYtNy4xNjQgMTYtMTYgMTZIMTc1LjFjLTguODM2IDAtMTYtNy4xNjQtMTYtMTZ2LTk2YzAtOC44MzggNy4xNjQtMTYgMTYtMTZoMTYwYzguODM2IDAgMTYgNy4xNjIgMTYgMTZWMjA4ek00NjMuMSA0MDhjMCA0LjQxOC0zLjU4MiA4LTggOGgtNDcuMWMtNC40MTggMC03LjEtMy41ODItNy4xLThsMC00OGMwLTQuNDE4IDMuNTgyLTggOC04aDQ3LjFjNC40MTggMCA4IDMuNTgyIDggOFY0MDh6TTQ2My4xIDI4MGMwIDQuNDE4LTMuNTgyIDgtOCA4aC00Ny4xYy00LjQxOCAwLTgtMy41ODItOC04di00OGMwLTQuNDE4IDMuNTgyLTggOC04aDQ3LjFjNC40MTggMCA4IDMuNTgyIDggOFYyODB6TTQ2My4xIDE1MmMwIDQuNDE4LTMuNTgyIDgtOCA4aC00Ny4xYy00LjQxOCAwLTgtMy41ODItOC04bDAtNDhjMC00LjQxOCAzLjU4Mi04IDcuMS04aDQ3LjFjNC40MTggMCA4IDMuNTgyIDggOFYxNTJ6Ii8+PC9zdmc+'") + "><source src='" + url.pathToFileURL(item).href + "#t=5'></video>").on("loadedmetadata", function() {
      if ($(this)[0].duration) lineItem.find(".time .duration").text(dayjs.duration($(this)[0].duration, "s").format("mm:ss"));
    }).add("<div class='bottom-0 position-absolute px-2 small start-0 text-light time'><i class='fas fa-" + (isVideo(item) ? "film" : "headphones-simple" ) + "'></i> <span class='current'></span><span class='duration'></span></div>") : "<img class='mx-auto' src='" + url.pathToFileURL(item).href + "' />")));
    if (isVideo(item) || isAudio(item) || isImage(item)) $("div#folderListing").append(lineItem);
  }
}
function removeEventListeners() {
  document.removeEventListener("drop", dropHandler);
  document.removeEventListener("dragover", dragoverHandler);
  document.removeEventListener("dragenter", dragenterHandler);
  document.removeEventListener("dragleave", dragleaveHandler);
}
async function request(url, opts) {
  let response = null,
    payload,
    options = opts ? opts : {};
  try {
    if (options.webdav) options.auth = {
      username: prefs.congServerUser,
      password: prefs.congServerPass
    };
    if (options.isFile) {
      options.responseType = "arraybuffer";
      options.onDownloadProgress = progressEvent => progressSet(progressEvent.loaded, progressEvent.total);
    }
    if (options.noCache) {
      options.headers = {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Expires": "0",
      };
    }
    if (options.method === "PUT") options.onUploadProgress = progressEvent => progressSet(progressEvent.loaded, progressEvent.total);
    if (["jw.org", "www.jw.org"].includes((new URL(url)).hostname)) options.adapter = require("axios/lib/adapters/http");
    options.url = url;
    if (!options.method) options.method = "GET";
    payload = await axios.request(options);
    response = payload;
  } catch (err) {
    response = (err.response ? err.response : err);
    if (!response.status) response = (response.config.url && response.data) ? {
      url: response.config.url,
      data: response.data,
      status: response.status
    } : {
      url: url,
      status: 500,
      originalResponse: response
    };
    log.error(response);
    if (options.webdav) throw(response);
  }
  return response;
}
function sanitizeFilename(filename, isNotFile) {
  let fileExtIfApplicable = (isNotFile ? "" : path.extname(filename).toLowerCase());
  filename = path.basename(filename, (isNotFile ? "" : path.extname(filename))).replace(/["»“”‘’«()№+[\]$<>,/\\:*\x00-\x1f\x80-\x9f]/g, "").replace(/ *[—?;:|.!?] */g, " - ").trim().replace(/[ -]+$/g, "") + fileExtIfApplicable;
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
  if (prefs.lang) {
    jwpubDbs = {};
    meetingMedia = {};
    try {
      $("#songPicker").empty();
      for (let sjj of (await getMediaLinks("sjjm", null, null, "MP4"))) {
        $("#songPicker").append($("<option>", {
          value: sjj.track,
          text: sjj.title,
          "data-thumbnail": sjj.trackImage
        }));
      }
    } catch (err) {
      $("label[for=typeSong]").removeClass("active").addClass("disabled");
      $("label[for=typeFile]").click().addClass("active");
    }
    $("#lang").val(prefs.lang).select2("destroy").select2();
    let currentJwLang = jsonLangs.filter(item => item.langcode == prefs.lang);
    $(".jwLang small").text(currentJwLang.length == 1 && currentJwLang[0].vernacularName ? "(" + currentJwLang[0].vernacularName + ")" : "");
  }
}
function setVars() {
  if (prefs.localOutputPath && prefs.lang) {
    perf("setVars", "start");
    try {
      downloadStats = {};
      paths.media = path.join(prefs.localOutputPath, prefs.lang);
      if (!dryrun) mkdirSync(paths.media);
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
async function startMediaSync(isDryrun, meetingFilter) {
  perf("total", "start");
  dryrun = !!isDryrun;
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
  }).filter(folderPath => dayjs(path.basename(folderPath), "YYYY-MM-DD").isValid() && dayjs(path.basename(folderPath), "YYYY-MM-DD").isBefore(now) || !dayjs(path.basename(folderPath), "YYYY-MM-DD").isValid()));
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
    await convertUnusableFiles();
    if (prefs.enableMp4Conversion) await mp4Convert();
    if (prefs.enableVlcPlaylistCreation) createVlcPlaylists();
    if (prefs.autoOpenFolderWhenDone) shell.openExternal(url.pathToFileURL(paths.media).href);
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
async function syncCongMedia() {
  let congSyncMeetingMedia = Object.fromEntries(Object.entries(meetingMedia).filter(([key]) => key !== "Recurring" && dayjs(key, "YYYY-MM-DD").isValid() && dayjs(key, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")));
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
  perf("syncJwOrgMedia", "start");
  updateTile("syncJwOrgMedia", "warning");
  let jwOrgSyncMeetingMedia = Object.fromEntries(Object.entries(meetingMedia).filter(([key]) => key !== "Recurring" && dayjs(key, "YYYY-MM-DD").isValid() && dayjs(key, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")));
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
            if (partMedia[j].url) {
              await downloadIfRequired(partMedia[j]);
            } else {
              mkdirSync(path.join(paths.media, partMedia[j].folder));
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
  if (!webdavIsAGo && fs.existsSync(path.join(paths.media, "Recurring"))) {
    updateTile("recurringMedia", "warning");
    glob.sync(path.join(paths.media, "Recurring", "*")).forEach((recurringItem) => {
      Object.keys(meetingMedia).filter(key => key !== "Recurring" && dayjs(key, "YYYY-MM-DD").isValid() && dayjs(key, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")).forEach((meeting) => {
        mkdirSync(path.join(paths.media, meeting));
        fs.copyFileSync(recurringItem, path.join(paths.media, meeting, path.basename(recurringItem)));
      });
    });
    updateTile("recurringMedia", "success");
  }
}
async function testJwmmf() {
  logLevel = "debug";
  let previousLang = prefs.lang;
  for (var lang of ["E", "F", "M", "R", "S", "T", "U", "X"] ) {
    prefs.lang = lang;
    await startMediaSync(true);
  }
  prefs.lang = previousLang;
  logLevel = "info";
}
function toggleHardwareAcceleration() {
  if (prefs.disableHardwareAcceleration) {
    fs.writeFileSync(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"), "true");
  } else {
    rm(path.join(remote.app.getPath("userData"), "disableHardwareAcceleration"));
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
  try { // do some housecleaning after version updates
    var lastRunVersion = 0;
    if (fs.existsSync(paths.lastRunVersion)) lastRunVersion = fs.readFileSync(paths.lastRunVersion, "utf8");
  } catch(err) {
    notifyUser("warn", "warnUnknownLastVersion", null, false, err);
  } finally {
    if (lastRunVersion !== currentAppVersion) {
      setVars();
      if (remote.app.isPackaged) fs.writeFileSync(paths.lastRunVersion, currentAppVersion);
      if (lastRunVersion !== 0) {
        notifyUser("info", "updateInstalled", currentAppVersion, false, null, {desc: "moreInfo", url: "https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest"});
        if (parseInt(lastRunVersion.replace(/\D/g, "")) <= 2242 && parseInt(currentAppVersion.replace(/\D/g, "")) >= 2243) {
          notifyUser("info", "<h6>Managing media just got simpler</h6><p>You can now choose which files will be downloaded from JW.org for any particular meeting, as well as add or remove additional media to a meeting, <strong>simply by clicking that day's icon</strong> on the main screen.</p>" + (prefs.congServer ? "<p>The cloud upload button has therefore been removed from the bottom left corner of the app.</p>" : "") + "<p>Media can also now easily be added to non-meeting days, for special events and meetings, simply by clicking the desired date.</p><h6>In short:</h6> " + (prefs.congServer ? "<li>No more cloud button</li> " : "") + "<li><strong>Click on any day</strong> to manage media for that day</li>", null, true, null, {desc: "understood", noLink: true}, true);
          $("#folders").addClass("new-stuff");
        }
        let currentLang = jsonLangs.filter(item => item.langcode === prefs.lang)[0];
        if (prefs.lang && currentLang && !fs.readdirSync(path.join(__dirname, "locales")).map(file => file.replace(".json", "")).includes(currentLang.symbol)) notifyUser("wannaHelp", i18n.__("wannaHelpExplain") + "<br/><small>" +  i18n.__("wannaHelpWillGoAway") + "</small>", currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")", true, null, {
          desc: "wannaHelpForSure",
          url: "https://github.com/sircharlo/jw-meeting-media-fetcher/discussions/new?category=translations&title=New+translation+in+" + currentLang.name + "&body=I+would+like+to+help+to+translate+JWMMF+into+a+language+I+speak,+" + currentLang.name + " (" + currentLang.langcode + "/" + currentLang.symbol + ")."
        });
        getJwOrgLanguages(true).then(function() {
          setMediaLang();
        });
      }
    }
  }
}
function updateFileList(initialLoad) {
  try {
    if (initialLoad) {
      $("#chooseUploadType input").prop("checked", false).change();
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
      if (!file.recurring && ((file.isLocal && !file.newFile) || file.congSpecific)) html.addClass("canDelete").prepend("<i class='fas fa-fw fa-minus-square me-2 text-danger'></i>");
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
            request("https://" + prefs.congServer + ":" + prefs.congServerPort + file.url, {
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
function validateConfig(changed, restart) {
  let configIsValid = true;
  $(".alertIndicators").removeClass("meeting");
  if (prefs.localOutputPath === "false" || !fs.existsSync(prefs.localOutputPath)) $("#localOutputPath").val("");
  let mandatoryFields = ["localOutputPath", "localAppLang", "lang", "mwDay", "weDay", "maxRes", "congregationName"];
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    if (prefs.enableMusicButton && prefs.enableMusicFadeOut && prefs.musicFadeOutType === "smart") mandatoryFields.push(timeField);
    else $("#" + timeField + ", .timePicker[data-target='" + timeField + "']").removeClass("is-invalid");
  }
  if (prefs.enableObs) {
    mandatoryFields.push("obsPort", "obsPassword");
    if (obs._connected) mandatoryFields.push("obsMediaScene", "obsCameraScene");
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
    remote.globalShortcut.register("Alt+K", () => {
      $("#btnMeetingMusic:visible, #btnStopMeetingMusic:visible").click();
    });
    if (prefs.enableMusicFadeOut) {
      if (!prefs.musicFadeOutTime) $("#musicFadeOutTime").val(5).change();
      if (!prefs.musicFadeOutType) $("label[for=musicFadeOutSmart]").click();
    }
    $("#musicFadeOutType label span").text(prefs.musicFadeOutTime);
    if (prefs.musicVolume) {
      $("#meetingMusic").animate({volume: prefs.musicVolume / 100});
      $("#musicVolumeDisplay").html(prefs.musicVolume);
    } else {
      $("#musicVolume").val(100).change();
    }
  } else {
    remote.globalShortcut.unregister("Alt+B");
  }
  $("#btnMediaWindow").toggle(!!prefs.enableMediaDisplayButton);
  if (prefs.enableMediaDisplayButton) {
    remote.globalShortcut.register("Alt+D", () => {
      if ($("#btnToggleMediaWindowFocus:visible").length == 0) $("#btnMediaWindow:visible").click();
    });
  } else {
    remote.globalShortcut.unregister("Alt+D");
  }
  if (prefs.enableMediaDisplayButton) refreshBackgroundImagePreview();
  $("#currentMediaBackground").closest(".row").toggle(!!prefs.enableMediaDisplayButton);
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
async function webdavExists(url) {
  return (await webdavStatus(url)) < 400;
}
async function webdavGet(file) {
  let localFile = path.join(paths.media, file.folder, file.safeName);
  if (!fs.existsSync(localFile) || !(file.filesize == fs.statSync(localFile).size)) {
    mkdirSync(path.join(paths.media, file.folder));
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
    fs.writeFileSync(localFile, new Buffer(remoteFile.data));
    downloadStat("cong", "live", file);
  } else {
    downloadStat("cong", "cache", file);
  }
}
async function webdavLs(dir, force) {
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
  if (!(await webdavExists(dir))) await request("https://" + prefs.congServer + ":" + prefs.congServerPort + dir, {
    method: "MKCOL",
    webdav: true
  });
}
async function webdavMv(src, dst) {
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
          $("#congServerDir").val("/").change();
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
              $("#webdavFolderList li").click(function() {
                $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).change();
              });
              enforcePrefs();
              let items = await webdavLs(prefs.congServerDir, true);
              if (items) {
                let remoteMediaWindowBackgrounds = items.filter(item => item.basename.includes("media-window-background-image"));
                if (remoteMediaWindowBackgrounds.length >0) {
                  let localFile = path.join(paths.app, remoteMediaWindowBackgrounds[0].basename);
                  if (!fs.existsSync(localFile) || !(remoteMediaWindowBackgrounds[0].size == fs.statSync(localFile).size)) {
                    fs.writeFileSync(localFile, new Buffer((await request("https://" + prefs.congServer + ":" + prefs.congServerPort + remoteMediaWindowBackgrounds[0].filename, {
                      webdav: true,
                      isFile: true
                    })).data));
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
    $("#filePicker").val(filesDropped.join(" -//- ")).change();
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val(filesDropped.filter(filepath => path.extname(filepath) == ".jwpub")[0]).change();
  }
  $(".dropzone").css("display", "none");
};
$(document).on("select2:open", () => {
  document.querySelector(".select2-search__field").focus();
});
$("#baseDate").on("click", ".dropdown-item", function() {
  let newBaseDate = dayjs($(this).val()).startOf("isoWeek");
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
$("#congregationSelect").on("click", ".dropdown-item .fa-square-minus:not(.confirmed)", async function() {
  $(this).addClass("confirmed text-danger").tooltip({
    title: i18n.__("clickAgain"),
    trigger: "manual",
    placement: "left"
  }).tooltip("show");
  await delay(3);
  $(this).removeClass("confirmed text-danger").tooltip("dispose");
});
$("#congregationSelect").on("click", ".dropdown-item .fa-square-minus.confirmed", function() {
  $(this).tooltip("dispose");
  congregationDelete($(this).closest("button").val());
});
$("#overlayUploadFile").on("click", ".btn-cancel-upload.file-selected:not(.confirmed)", async function() {
  $(this).toggleClass("btn-warning btn-danger confirmed").tooltip({
    title: i18n.__("clickAgain"),
    trigger: "manual",
    placement: "right"
  }).tooltip("show");
  await delay(5);
  $(this).toggleClass("btn-warning btn-danger confirmed").tooltip("dispose");
});
$("#overlayUploadFile").on("click", ".btn-cancel-upload.file-selected.confirmed, .btn-cancel-upload.no-file-selected", function() {
  $(this).tooltip("dispose");
  if ($(this).hasClass("changes-made")) notifyUser("warn", "dontForgetToGetMedia");
  toggleScreen("overlayUploadFile");
  $(".btn-cancel-upload").removeClass("changes-made");
  removeEventListeners();
});
$("#btnForcedPrefs").on("click", () => {
  getForcedPrefs().then(currentForcedPrefs => {
    let html = "<h6>" + i18n.__("settingsLockedWhoAreYou") + "</h6>";
    html += "<p>" + i18n.__("settingsLockedExplain") + "</p>";
    html += "<div id='forcedPrefs' class='card'><div class='card-body'>";
    for (var pref of Object.keys(prefs).filter(pref => !pref.startsWith("congServer") && !pref.startsWith("auto") && !pref.startsWith("local") && !pref.includes("UpdatedLast") && !pref.includes("disableHardwareAcceleration")).sort((a, b) => a[0].localeCompare(b[0]))) {
      html += "<div class='form-check form-switch'><input class='form-check-input' type='checkbox' id='forcedPref-" + pref + "' " + (pref in currentForcedPrefs ? "checked" : "") + "> <label class='form-check-label' for='forcedPref-" + pref + "'><code class='badge bg-info text-dark prefName' title='\"" + $("#" + pref).closest(".row").find("label").first().find("span").last().html() + "\"' data-bs-toggle='tooltip' data-bs-html='true'>" + pref + "</code> <code class='badge bg-secondary'>" + (pref.toLowerCase().includes("password") ? "********" : prefs[pref]) + "</code></label></div>";
    }
    html += "</div></div>";
    showModal(true, true, i18n.__("settingsLocked"), html, true, true);
    $("#staticBackdrop #forcedPrefs .prefName").tooltip();
    $("#staticBackdrop #forcedPrefs input").on("change", async function() {
      $("#staticBackdrop #forcedPrefs input").prop("disabled", true);
      let checkedItems = $("#staticBackdrop #forcedPrefs input:checked").map(function() { return this.id.replace("forcedPref-", ""); }).get();
      let forcedPrefs = JSON.stringify(Object.fromEntries(Object.entries(prefs).filter(([key]) => checkedItems.includes(key))), null, 2);
      if (await webdavPut(forcedPrefs, prefs.congServerDir, "forcedPrefs.json")) {
        enablePreviouslyForcedPrefs();
        enforcePrefs();
      } else {
        $(this).prop("checked", !$(this).prop("checked"));
      }
      $("#staticBackdrop #forcedPrefs input").prop("disabled", false);
    });
  });
});
require("electron").ipcRenderer.on("videoProgress", (event, stats) => {
  if (stats && Array.isArray(stats) && stats.length > 1) {
    let percent = stats[0] / stats[1] * 100;
    $("#videoProgress .progress-bar").css("width", percent + "%");
    $("#videoScrubber").val(percent);
    $("#videoScrubber").closest("li.video").find(".time .current").text(dayjs.duration(stats[0], "s").format("mm:ss/"));
    $("#videoScrubber").closest("li.video").find(".time .duration").text(dayjs.duration(stats[1], "s").format("mm:ss"));
  }
});
require("electron").ipcRenderer.on("videoEnd", () => {
  $("#videoProgress").closest(".item").find("button.playStop.stop").addClass("confirmed btn-danger").click();
});
require("electron").ipcRenderer.on("videoPaused", () => {
  $("#videoProgress").closest(".item").find("button.pausePlay").click();
});
$("#staticBackdrop").on("click", "#btnToggleMediaWindowFocus", function() {
  require("electron").ipcRenderer.send("toggleMediaWindowFocus");
});
require("electron").ipcRenderer.on("mediaWindowVisibilityChanged", (event, status) => {
  $("#btnToggleMediaWindowFocus").toggleClass("btn-warning", status !== "hidden").toggleClass("btn-primary pulse-danger", status == "hidden").find(".fa-stack-2x").toggleClass("fas fa-ban text-danger", status !== "hidden").toggleClass("far fa-circle", status == "hidden");
});
$("#staticBackdrop").on("input change", "#videoScrubber", function() {
  require("electron").ipcRenderer.send("videoScrub", $(this).val());
});
$("#btnMediaWindow").on("click", function() {
  remote.globalShortcut.register("Alt+Z", () => {
    $("#btnToggleMediaWindowFocus:visible").click();
  });
  setVars();
  require("electron").ipcRenderer.send("showMediaWindow");
  getRemoteYearText().finally(async () => {
    require("electron").ipcRenderer.send("startMediaDisplay", paths.prefs);
    if (await obsGetScenes()) await obsSetScene(prefs.obsCameraScene);
  });
  let folderListing = listMediaFolders();
  $(folderListing).on("click", "button.folder", function() {
    refreshFolderListing($(this).data("folder"));
  });
  $(folderListing).on("click", "li.item button.pausePlay", function() {
    if ($(this).hasClass("pause")) {
      require("electron").ipcRenderer.send("pauseVideo");
    } else if ($(this).hasClass("play")) {
      require("electron").ipcRenderer.send("playVideo");
    }
    $("#videoProgress, #videoScrubber").toggle();
    $(this).toggleClass("play pause").find("i").toggleClass("fa-play fa-pause");
  });
  $(folderListing).on("mouseenter", "li:not(.list-group-item-primary)", function () {
    $(this).addClass("list-group-item-secondary");
  });
  $(folderListing).on("mouseleave", "li:not(.list-group-item-primary)", function () {
    $(this).removeClass("list-group-item-secondary");
  });
  $(folderListing).on("click", "li.item button.playStop", function() {
    let triggerButton = $(this),
      mediaItem = $(this).closest(".item");
    if (triggerButton.hasClass("play")) {
      $("#folderListing button.playStop.stop").toggleClass("play stop btn-warning btn-primary").find("i").toggleClass("fa-play fa-stop");
      $("#folderListing .item").removeClass("list-group-item-primary");
      $("#btnToggleMediaWindowFocus.hidden").click();
      require("electron").ipcRenderer.send("showMedia", mediaItem.data("item"));
      $("#btnToggleMediaWindowFocus.pulse-danger").click();
      obsSetScene(prefs.obsMediaScene);
      if (mediaItem.hasClass("video")) {
        mediaItem.append("<div id='videoProgress' class='progress bottom-0 position-absolute start-0 w-100' style='height: 3px;'><div class='progress-bar' role='progressbar' style='width: 0%'></div></div>");
        mediaItem.append("<input type='range' id='videoScrubber' class='form-range bottom-0 position-absolute start-0' min='0' max='100' step='any' />");
        mediaItem.find(".pausePlay").fadeToAndToggle(fadeDelay, 1);
        $("#folderListing button.playStop.play").not(triggerButton).prop("disabled", true);
      }
      triggerButton.toggleClass("play stop btn-primary btn-warning").find("i").toggleClass("fa-play fa-stop");
      mediaItem.addClass("list-group-item-primary").removeClass("list-group-item-secondary");
      $("h5.modal-title button").not(triggerButton).prop("disabled", true);
      $("button.closeModal, #btnMeetingMusic, button.folderRefresh").prop("disabled", true);
    } else if (triggerButton.hasClass("stop")) {
      if (!mediaItem.hasClass("video") || triggerButton.hasClass("confirmed")) {
        require("electron").ipcRenderer.send("hideMedia", mediaItem.data("item"));
        obsSetScene($("#obsTempCameraScene").val());
        if (mediaItem.hasClass("video")) {
          mediaItem.find("#videoProgress, #videoScrubber").remove();
          mediaItem.find(".time .current").text("");
          mediaItem.find(".pausePlay").removeClass("play").addClass("pause").fadeToAndToggle(fadeDelay, 0).find("i").removeClass("fa-play").addClass("fa-pause");
        }
        triggerButton.toggleClass("play stop btn-primary btn-warning").removeClass("confirmed btn-danger").tooltip("dispose").find("i").toggleClass("fa-play fa-stop");
        mediaItem.removeClass("list-group-item-primary");
        $("#folderListing button.playStop.play, button.closeModal, #btnMeetingMusic, button.folderRefresh").prop("disabled", false);
        $("h5.modal-title button").not(triggerButton).prop("disabled", false);
      } else {
        triggerButton.addClass("confirmed btn-danger").tooltip({
          title: i18n.__("clickAgain"),
          trigger: "manual",
          placement: "left"
        }).tooltip("show");
        setTimeout(() => {
          triggerButton.removeClass("confirmed btn-danger").tooltip("dispose");
        }, 3000);
      }
    }
  });
  showModal(true, true, i18n.__("meeting"), folderListing, false);
  $("#staticBackdrop .modal-header").addClass("d-flex").children().wrapAll("<div class='col-4 text-center'></div>");
  $("#staticBackdrop .modal-header").prepend("<div class='col-4 for-folder-listing-only' style='display: none;'></div>");
  $("#staticBackdrop .modal-header").append("<div class='col-4 for-folder-listing-only text-end' style='display: none;'><button class='btn btn-sm folderRefresh'><i class='fas fa-rotate-right'></i></button><button class='btn btn-sm folderOpen'><i class='fas fa-folder-open'></i></button></div>");
  $(folderListing).find(".thatsToday").click();
  $("#staticBackdrop .modal-footer").html($("<div class='left d-flex flex-fill text-start'></div><div class='right text-end'><button type='button' id='btnToggleMediaWindowFocus' class='btn btn-warning mx-2' title='Alt+Z'><span class='fa-stack'><i class='fas fa-desktop fa-stack-1x'></i><i class='fas fa-ban fa-stack-2x text-danger'></i></span></button><button type='button' class='closeModal btn btn-warning' data-bs-trigger='manual'><i class='fas fa-fw fa-2x fa-power-off'></i></button></div>")).addClass("d-flex");
  $("#staticBackdrop .modal-footer .left").prepend($("#btnMeetingMusic, #btnStopMeetingMusic").addClass("btn-lg"));
  $("#staticBackdrop .modal-footer").show();
});
$("#staticBackdrop .modal-footer").on("click", "button.closeModal:not(.confirmed)", async function() {
  $(this).addClass("confirmed btn-danger").tooltip({
    title: i18n.__("clickAgain"),
    trigger: "manual",
    placement: "left"
  }).tooltip("show");
  await delay(3);
  $(this).removeClass("confirmed btn-danger").tooltip("dispose");
});
$("#staticBackdrop .modal-footer").on("click", "button.closeModal.confirmed", function() {
  require("electron").ipcRenderer.send("hideMediaWindow");
  obs = {};
  remote.globalShortcut.unregister("Alt+Z");
  showModal(false);
  $(this).removeClass("confirmed btn-danger").tooltip("dispose");
  $("#actionButtons").append($("#btnMeetingMusic, #btnStopMeetingMusic").removeClass("btn-lg"));
});
$("#staticBackdrop .modal-footer").on("change", "#obsTempCameraScene", async function() {
  if ((await obsGetScenes(false, true)) !== prefs.obsMediaScene) obsSetScene($(this).val());
});
$("#staticBackdrop .modal-header").on("click", "button.folderRefresh", function() {
  refreshFolderListing(path.join(paths.media, $(".modal-header h5").text()));
});
$("#staticBackdrop .modal-header").on("click", "button.folderOpen", function() {
  shell.openExternal(url.pathToFileURL(path.join(paths.media, $(".modal-header h5").text())).href);
});
$("body").on("click", "#btnMeetingMusic:not(.confirmed)", async function() {
  $(this).attr("title", i18n.__("clickAgain")).addClass("confirmed btn-warning").tooltip({
    trigger: "manual",
    placement: "right"
  }).tooltip("show");
  await delay(5);
  $(this).attr("title", "Alt+K").removeClass("confirmed btn-warning").tooltip("dispose");
});
$("body").on("click", "#btnMeetingMusic.confirmed", async function() {
  $(this).attr("title", "Alt+K").removeClass("confirmed btn-warning").tooltip("dispose");
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
        $("#btnStopMeetingMusic").click();
      }, timeBeforeFade);
    } else {
      pendingMusicFadeOut.endTime = 0;
    }
  } else {
    pendingMusicFadeOut.id = null;
  }
  $("#btnStopMeetingMusic").addClass("initialLoad").find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").closest("button").prop("title", "...");
  $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
  setVars();
  var songs = (jworgIsReachable ? (await getMediaLinks("sjjm", null, null, "MP3")) : glob.sync(path.join(paths.pubs, "sjjm", "**", "*.mp3")).map(item => ({title: path.basename(item), track: path.basename(path.resolve(item, "..")), path: item}))).sort(() => .5 - Math.random());
  if (songs.length > 0) {
    var iterator = 0;
    createAudioElem(iterator);
  } else {
    $("#btnStopMeetingMusic").removeClass("initialLoad").find("i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin");
    $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
  }
  async function createAudioElem(iterator) {
    setVars();
    $("body").append($("<audio id='meetingMusic' autoplay>").data("track", songs[iterator].track).on("ended", function() {
      $("#meetingMusic").remove();
      iterator = (iterator < songs.length - 1 ? iterator + 1 : 0);
      createAudioElem(iterator);
    }).on("canplay", function() {
      $("#btnStopMeetingMusic").removeClass("initialLoad").find("i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin").closest("button").prop("title", songs[iterator].title + " (Alt+K)");
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
  clearTimeout(pendingMusicFadeOut.id);
  $("#btnStopMeetingMusic").toggleClass("btn-warning btn-danger").prop("disabled", true);
  $("#meetingMusic").animate({volume: 0}, fadeDelay * (pendingMusicFadeOut.autoStop ? 50 : 10), () => {
    $("#meetingMusic").remove();
    $("#btnStopMeetingMusic").hide().toggleClass("btn-warning btn-danger").prop("disabled", false);
    $("#musicRemaining").empty();
    if (prefs.enableMusicButton) $("#btnMeetingMusic").attr("title", "Alt+K").show();
    $("#congregationSelect-dropdown").removeClass("music-playing");
    $("#congregationSelect-dropdown:not(.sync-started)").prop("disabled", false);
  });
  pendingMusicFadeOut = {};
});
$("#btnUpload").on("click", async () => {
  try {
    $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-save");
    $("#overlayUploadFile button:enabled, #overlayUploadFile select:enabled, #overlayUploadFile input:enabled").addClass("disabled-while-load").prop("disabled", true);
    if (!webdavIsAGo) mkdirSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName")));
    if ($("input#typeSong:checked").length > 0) {
      let songFiles = await getMediaLinks("sjjm", $("#fileToUpload").val(), null, "MP4");
      if (songFiles.length > 0) {
        let songFile = await downloadIfRequired(songFiles[0]);
        let songFileName = sanitizeFilename(getPrefix() + " - Song " + $("#songPicker option:selected").text() + ".mp4");
        if (!webdavIsAGo) {
          fs.copyFileSync(songFile, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), songFileName));
        } else {
          await webdavPut(fs.readFileSync(songFile), path.posix.join(prefs.congServerDir, "Media", $("#chosenMeetingDay").data("folderName")), songFileName);
        }
      }
    } else if ($("input#typeJwpub:checked").length > 0) {
      for (var tempMedia of tempMediaArray) {
        if (tempMedia.url) tempMedia.contents = new Buffer((await request(tempMedia.url, {isFile: true})).data);
        let jwpubFileName = sanitizeFilename(getPrefix() + " - " + tempMedia.filename);
        if (!webdavIsAGo) {
          if (tempMedia.contents) {
            fs.writeFileSync(path.join(paths.media, $("#chosenMeetingDay").data("folderName"), jwpubFileName), tempMedia.contents);
          } else {
            fs.copyFileSync(tempMedia.localpath, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), jwpubFileName));
          }
        } else {
          await webdavPut((tempMedia.contents ? tempMedia.contents : fs.readFileSync(tempMedia.localpath)), path.posix.join(prefs.congServerDir, "Media", $("#chosenMeetingDay").data("folderName")), jwpubFileName);
        }
      }
      tempMediaArray = [];
    } else {
      for (var splitLocalFile of $("#fileToUpload").val().split(" -//- ")) {
        let splitFileToUploadName = sanitizeFilename(getPrefix() + " - " + path.basename(splitLocalFile));
        if (!webdavIsAGo) {
          fs.copyFileSync(splitLocalFile, path.join(paths.media, $("#chosenMeetingDay").data("folderName"), splitFileToUploadName));
        } else {
          await webdavPut(fs.readFileSync(splitLocalFile), path.posix.join(prefs.congServerDir, "Media", $("#chosenMeetingDay").data("folderName")), splitFileToUploadName);
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
  if ($("#fileToUpload").val()) $("#fileToUpload").val("").change();
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
  $("#fileToUpload").val($(this).val()).change();
});
$("#overlayUploadFile").on("change", "#jwpubPicker", async function() {
  if ($(this).val().length >0) {
    let contents = await getDbFromJwpub(null, null, $(this).val());
    let tableMultimedia = ((await executeStatement(contents, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
    let suppressZoomExists = (await executeStatement(contents, "SELECT COUNT(*) AS CNTREC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'")).map(function(item) {
      return (item.CNTREC > 0 ? true : false);
    })[0];
    let itemsWithMultimedia = await executeStatement(contents, "SELECT DISTINCT " + tableMultimedia + ".DocumentId, Document.Title FROM Document INNER JOIN " + tableMultimedia + " ON Document.DocumentId = " + tableMultimedia + ".DocumentId " + (tableMultimedia === "DocumentMultimedia" ? "INNER JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId " : "") + "WHERE (Multimedia.CategoryType <> 9)" + (suppressZoomExists ? " AND Multimedia.SuppressZoom = 0" : "") + " ORDER BY " + tableMultimedia + ".DocumentId");
    if (itemsWithMultimedia.length > 0) {
      var docList = $("<div id='docSelect' class='list-group'>");
      for (var item of itemsWithMultimedia) {
        $(docList).append("<button class='d-flex list-group-item list-group-item-action' data-docid='" + item.DocumentId + "'><div class='flex-fill'> " + item.Title + "</div><div><i class='far fa-circle'></i></div></li>");
      }
      showModal(true, itemsWithMultimedia.length > 0, i18n.__("selectDocument"), docList, itemsWithMultimedia.length === 0, true);
    } else {
      $(this).val("");
      $("#fileToUpload").val("").change();
      notifyUser("warn", "warnNoDocumentsFound", $(this).val(), true, null, true);
    }
  } else {
    $("#fileToUpload").val("").change();
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
      filename: sanitizeFilename((i + 1).toString().padStart(2, "0") + " - " + (multimediaItem.queryInfo.Label || multimediaItem.queryInfo.Caption || multimediaItem.queryInfo.FilePath || multimediaItem.queryInfo.KeySymbol + "." + (multimediaItem.queryInfo.MimeType ? (multimediaItem.queryInfo.MimeType.includes("video") ? "mp4" : "mp3") : "")) + (multimediaItem.queryInfo.FilePath && (multimediaItem.queryInfo.Label || multimediaItem.queryInfo.Caption) ? path.extname(multimediaItem.queryInfo.FilePath) : ""))
    };
    if (multimediaItem.queryInfo && multimediaItem.queryInfo.CategoryType && multimediaItem.queryInfo.CategoryType !== -1) {
      var jwpubContents = await new zipper($("#jwpubPicker").val()).readFile("contents");
      tempMedia.contents = (await new zipper(jwpubContents).readFile(((await new zipper(jwpubContents).getEntries()).filter(entry => entry.name == multimediaItem.queryInfo.FilePath)[0]).entryName));
    } else {
      var externalMedia = (await getMediaLinks(multimediaItem.queryInfo.KeySymbol, multimediaItem.queryInfo.Track, multimediaItem.queryInfo.IssueTagNumber, null, multimediaItem.queryInfo.MultiMeps));
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
            $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).change();
          }
        }));
      }
    }
    tempMediaArray.push(tempMedia);
  }
  if (tempMediaArray.filter(item => !item.contents && !item.localpath && !item.url).length > 0) {
    showModal(true, true, i18n.__("selectExternalMedia"), missingMedia, true, false);
  } else {
    $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).change();
    showModal(false);
  }
});
$("#mediaSync").on("click", async function() {
  $("#mediaSync, #baseDate-dropdown, #congregationSelect-dropdown").prop("disabled", true);
  await startMediaSync();
  await overlay(true, "circle-check text-success fa-beat", (prefs.autoQuitWhenDone ? "person-running" : null), "stay-alive");
  await delay(3);
  if (prefs.autoQuitWhenDone && !stayAlive) {
    remote.app.exit();
  } else {
    overlay(false);
    $(".btn-home, #btn-settings").fadeToAndToggle(fadeDelay, 1);
    $("#mediaSync, #baseDate-dropdown, #congregationSelect-dropdown:not(.music-playing)").prop("disabled", false);
  }
});
$("#localOutputPath").on("mousedown", function(event) {
  $(this).val(remote.dialog.showOpenDialogSync({ properties: ["openDirectory"] })).change();
  event.preventDefault();
});
$("#chooseBackground").on("click", function() {
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
  if (webdavIsAGo) webdavLs(prefs.congServerDir).then(items => {
    webdavRm(items.filter(item => item.basename.includes("media-window-background-image")).map(item => path.join(prefs.congServerDir, item.basename)));
  });
  refreshBackgroundImagePreview();
});
$("#overlaySettings").on("click", ".btn-clean-up", function() {
  $(this).toggleClass("btn-success btn-warning").prop("disabled", true);
  setVars();
  rm(glob.sync([path.join(paths.media, "*"), paths.pubs], {
    ignore: [path.join(paths.media, "Recurring")],
    onlyDirectories: true
  }).concat([paths.langs]));
  calculateCacheSize();
  setTimeout(() => {
    $(".btn-clean-up").toggleClass("btn-success btn-warning").prop("disabled", false);
  }, 3000);
});
$("#fileList").on("click", "li:not(.confirmDelete) .fa-minus-square", function() {
  $(this).closest("li").addClass("confirmDelete");
  setTimeout(() => {
    $(".confirmDelete").removeClass("confirmDelete");
  }, 3000);
});
$("#fileList").on("click", "li.confirmDelete:not(.webdavWait) .fa-minus-square", async function() {
  $(this).closest("li").addClass("webdavWait");
  let successful = true;
  if (!webdavIsAGo) {
    rm(path.join(paths.media, $("#chosenMeetingDay").data("folderName"), $(this).closest("li").data("safename")));
    $(this).closest("li").removeClass("webdavWait confirmDelete canDelete").data("islocal", "false");
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
});
$("#fileList").on("click", ".canHide:not(.webdavWait)", async function() {
  $(this).addClass("webdavWait");
  if (!webdavIsAGo || await webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chosenMeetingDay").data("folderName")), $(this).data("safename"))) {
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
    if (e.which == 13) $("#staticBackdrop .modal-footer button").click();
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
        Object.keys(meetingMedia).filter(meeting => dayjs($("#chosenMeetingDay").data("folderName")).isValid() ? meeting == $("#chosenMeetingDay").data("folderName") : true).forEach(meeting => {
          meetingMedia[meeting].filter(item => item.media.filter(mediaItem => mediaItem.safeName == previousSafename).length > 0).forEach(item => item.media.forEach(mediaItem => {
            mediaItem.safeName = newName;
            if (webdavIsAGo) mediaItem.url = path.posix.join(path.dirname(src), newName);
          }));
        });
        if (webdavIsAGo) row.data("url", path.posix.join(path.dirname(src), newName));
        row.data("safename", newName).attr("title", newName).find("span.filename").text(newName);
        let elems = $("#fileList li").detach().sort(function (a, b) {
          return ($(a).text() < $(b).text() ? -1 : $(a).text() > $(b).text() ? 1 : 0);
        });
        $("#fileList").append(elems);
      }
      row.removeClass("webdavWait");
      $(".btn-cancel-upload").addClass("changes-made");
    }
  });
});
$("#fileList").on("click", ".wasHidden:not(.webdavWait)", async function() {
  $(this).addClass("webdavWait");
  if (!webdavIsAGo || await webdavRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chosenMeetingDay").data("folderName"), $(this).data("safename")))) {
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
$("#overlayUploadFile").on("mousedown", "#filePicker, #jwpubPicker", function() {
  $(this).prev("button").click();
});
$("#overlayUploadFile").on("click", "#filePickerButton, #jwpubPickerButton", function() {
  let options = {
    properties: ["multiSelections", "openFile"]
  };
  if ($(this).prop("id").includes("jwpub")) options = {
    filters: [
      { name: "JWPUB", extensions: ["jwpub"] }
    ]
  };
  let path = remote.dialog.showOpenDialogSync(options);
  $(this).next("input").val((typeof path !== "undefined" ? ($(this).prop("id").includes("file") ? path.join(" -//- ") : path) : "")).change();
  event.preventDefault();
});
$("#refreshYeartext").on("click", function() {
  refreshBackgroundImagePreview(true);
});
$("#songPicker").on("change", function() {
  if ($(this).val()) $("#fileToUpload").val($(this).val()).change();
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
$("#btnTestApp").on("click", testJwmmf);
$("#toastContainer").on("click", "button.toast-action", async function() {
  if ($(this).data("toast-action-url")) shell.openExternal($(this).data("toast-action-url"));
  $(this).closest(".toast").find(".toast-header button.btn-close").click();
  await delay(2);
  $(".new-stuff").removeClass("new-stuff");
});
$("#webdavProviders a").on("click", function() {
  for (let i of Object.entries($(this).data())) {
    let name = "cong" + (i[0][0].toUpperCase() + i[0].slice(1));
    prefs[name] = i[1];
    $("#" + name).val(i[1]);
  }
  $("#congServer").change();
});
$.fn.extend({
  fadeToAndToggle: function(speed, to, easing, callback) {
    return this.stop().css("visibility", "visible").animate( { opacity: to }, speed, easing, function() {
      $(this).css("visibility", to ? "visible" : "hidden");
      if (callback) callback();
    } );
  }
});
