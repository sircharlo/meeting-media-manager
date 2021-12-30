const fadeDelay = 200,
  axios = require("axios"),
  i18n = require("i18n"),
  net = require("net"),
  path = require("path"),
  remote = require("@electron/remote"),
  {shell} = require("electron"),
  $ = require("jquery");
function checkInternet(online) {
  if (online) {
    overlay(true, "cog fa-spin");
    require("electron").ipcRenderer.send("autoUpdate");
  } else {
    overlay(true, "wifi", "circle-notch fa-spin text-danger");
    setTimeout(updateOnlineStatus, 4000);
  }
}
i18n.configure({
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true
});
const updateOnlineStatus = async () => checkInternet((await isReachable("www.jw.org", 443)));
updateOnlineStatus();
require("electron").ipcRenderer.on("overlay", (event, message) => overlay(true, message[0], message[1]));
require("electron").ipcRenderer.on("macUpdate", () => {
  $("#bg-mac-update").fadeIn(fadeDelay);
  $("#btn-settings").addClass("in-danger");
  $("#version").addClass("bg-danger in-danger").removeClass("bg-primary").prepend("<i class='fas fa-hand-point-right'></i> ").append(" <i class='fas fa-hand-point-left'></i>").click(function() {
    shell.openExternal("https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest");
  });
});
require("electron").ipcRenderer.on("goAhead", () => {
  goAhead();
});

const bootstrap = require("bootstrap"),
  dayjs = require("dayjs"),
  ffmpeg = require("fluent-ffmpeg"),
  fs = require("graceful-fs"),
  fullHd = [3840, 2160],
  glob = require("glob"),
  hme = require("h264-mp4-encoder"),
  datetime = require("flatpickr"),
  os = require("os"),
  sizeOf = require("image-size"),
  sqljs = require("sql.js"),
  v8 = require("v8"),
  xmlParser = require("fast-xml-parser"),
  zipper = require("adm-zip");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

var baseDate = dayjs().startOf("isoWeek"),
  cancelSync = false,
  currentStep,
  datepickers,
  downloadStats = {},
  dryrun = false,
  ffmpegIsSetup = false,
  jsonLangs = {},
  jwpubDbs = {},
  meetingMedia,
  modal = new bootstrap.Modal(document.getElementById("staticBackdrop"), {
    backdrop: "static",
    keyboard: false
  }),
  now = dayjs().hour(0).minute(0).second(0).millisecond(0),
  paths = {
    app: remote.app.getPath("userData")
  },
  pendingMusicFadeOut = {},
  perfStats = {},
  prefix,
  prefs = {},
  tempMediaArray = [],
  totals = {},
  webdavIsAGo = false,
  stayAlive;
paths.langs = path.join(paths.app, "langs.json");
paths.lastRunVersion = path.join(paths.app, "lastRunVersion.json");
paths.prefs = path.join(paths.app, "prefs.json");

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

function goAhead() {
  if (fs.existsSync(paths.prefs)) {
    try {
      prefs = JSON.parse(fs.readFileSync(paths.prefs));
    } catch (err) {
      notifyUser("error", "errorInvalidPrefs", null, true, err);
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
        prefs[$(this).closest("div").prop("id")] = $(this).closest("div").find("input:checked").val();
      } else if ($(this).prop("type") == "text" || $(this).prop("type") == "password"  || $(this).prop("type") == "hidden" || $(this).prop("type") == "range") {
        prefs[$(this).prop("id")] = $(this).val();
      }
    } else if ($(this).prop("tagName") == "SELECT") {
      prefs[$(this).prop("id")] = $(this).find("option:selected").val();
    }
    if ($(this).prop("id") == "congServer" && $(this).val() == "") $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #webdavFolderList").val("").empty().change();
    if ($(this).prop("id").includes("cong")) webdavSetup();
    if ($(this).prop("id") == "localAppLang") setAppLang();
    if ($(this).prop("id") == "lang") setMediaLang();
    if ($(this).prop("id").includes("cong") || $(this).prop("name").includes("Day")) rm([paths.media]);
    validateConfig(true);
  });
}
function additionalMedia() {
  perf("additionalMedia", "start");
  currentStep = "additionalMedia";
  return new Promise((resolve)=>{
    $("#chooseMeeting").empty();
    for (var meeting of [prefs.mwDay, prefs.weDay]) {
      let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
      $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-dark' for='" + meetingDate + "'" + (Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + meetingDate + "</label>");
    }
    $(".relatedToUpload, .relatedToUploadType").fadeTo(fadeDelay, 0);
    $("#btnCancelUpload").fadeOut(fadeDelay);
    $("#btnDoneUpload").unbind("click").on("click", function() {
      toggleScreen("overlayUploadFile");
      $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
      $("#fileList, #filePicker, #jwpubPicker, .enterPrefixInput").val("").empty().change();
      $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
      removeEventListeners();
      perf("additionalMedia", "stop");
      resolve();
    }).fadeIn(fadeDelay);
    toggleScreen("overlayUploadFile");
  });
}
function addMediaItemToPart (date, paragraph, media) {
  if (!meetingMedia[date]) meetingMedia[date] = [];
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
function rm(toDelete) {
  if (!Array.isArray(toDelete)) toDelete = [toDelete];
  for (var fileOrDir of toDelete) {
    fs.rmSync(fileOrDir, {
      recursive: true,
      force: true
    });
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
      notifyUser("warning", "warnPdfConversionFailure", path.basename(mediaFile), true, err);
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
      let scale = fullHd[1] / page.getViewport({scale: 1}).height;
      var canvas = $("#pdfCanvas")[0];
      let ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      canvas.height = fullHd[1];
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
      image.height = fullHd[1];
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
      notifyUser("warning", "warnSvgConversionFailure", path.basename(mediaFile), true);
      return resolve();
    });
    $("img#svgImg").prop("src", mediaFile);
  });
}
async function convertUnusableFiles() {
  for (let pdfFile of glob.sync(path.join(paths.media, "*", "*pdf"))) {
    await convertPdf(pdfFile);
  }
  for (let svgFile of glob.sync(path.join(paths.media, "*", "*svg"))) {
    await convertSvg(svgFile);
  }
}
function createMediaNames() {
  perf("createMediaNames", "start");
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      for (var j = 0; j < meeting[i].media.length; j++) { // media
        if (meeting[i].media[j].filesize) {
          meeting[i].media[j].safeName = sanitizeFilename((i + 1).toString().padStart(2, "0") + "-" + (j + 1).toString().padStart(2, "0") + " - " + ((meeting[i].media[j].queryInfo.TargetParagraphNumberLabel ? meeting[i].media[j].queryInfo.TargetParagraphNumberLabel + ". " : "")) + meeting[i].media[j].title + "." + (meeting[i].media[j].filetype ? meeting[i].media[j].filetype : path.extname((meeting[i].media[j].url ? meeting[i].media[j].url : meeting[i].media[j].filepath))));
        } else {
          continue;
        }
      }
    }
  }
  perf("createMediaNames", "stop");
}
function createVideoSync(mediaFile){
  let outputFilePath = path.format({ ...path.parse(mediaFile), base: undefined, ext: ".mp4" });
  return new Promise((resolve)=>{
    try {
      if (path.extname(mediaFile).includes("mp3")) {
        ffmpegSetup().then(function () {
          ffmpeg(mediaFile).on("end", function() {
            rm(mediaFile);
            return resolve();
          }).on("error", function(err) {
            notifyUser("warning", "warnMp4ConversionFailure", path.basename(mediaFile), true, err);
            return resolve();
          }).noVideo().save(path.join(outputFilePath));
        });
      } else {
        var imageDimesions = sizeOf(mediaFile);
        if (imageDimesions.orientation && imageDimesions.orientation >= 5) [imageDimesions.width, imageDimesions.height] = [imageDimesions.height, imageDimesions.width];
        $("body").append("<div id='convert' style='display: none;'>");
        $("div#convert").append("<img id='imgToConvert'>").append("<canvas id='imgCanvas'></canvas>");
        hme.createH264MP4Encoder().then(function (encoder) {
          $("img#imgToConvert").on("load", function() {
            var canvas = $("#imgCanvas")[0],
              image = $("img#imgToConvert")[0];
            encoder.quantizationParameter = 10;
            image.width = imageDimesions.width;
            image.height = imageDimesions.height;
            encoder.width = canvas.width = (image.width % 2 ? image.width - 1 : image.width);
            encoder.height = canvas.height = (image.height % 2 ? image.height - 1 : image.height);
            encoder.initialize();
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            encoder.addFrameRgba(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data);
            encoder.finalize();
            fs.writeFileSync(outputFilePath, encoder.FS.readFile(encoder.outputFilename));
            rm(mediaFile);
            encoder.delete();
            $("div#convert").remove();
            return resolve();
          });
          $("img#imgToConvert").on("error", function() {
            notifyUser("warning", "warnMp4ConversionFailure", path.basename(mediaFile), true);
          });
          $("img#imgToConvert").prop("src", mediaFile);
        });
      }
    } catch (err) {
      notifyUser("warning", "warnMp4ConversionFailure", path.basename(mediaFile), true, err);
      return resolve();
    }
  });
}
function dateFormatter() {
  let locale = prefs.localAppLang ? prefs.localAppLang : "en";
  try {
    if (locale !== "en") require("dayjs/locale/" + locale);
  } catch(err) {
    console.log("Date locale " + locale + " not found, falling back to 'en'");
  }
  $(".today").removeClass("today");
  for (var d = 0; d < 7; d++) {
    $("#day" + d + " .dayLongDate .dayOfWeek").text(baseDate.clone().add(d, "days").locale(locale).format("ddd"));
    $("#day" + d + " .dayLongDate .dayOfWeekLong").text(baseDate.clone().add(d, "days").locale(locale).format("dddd"));
    $("#day" + d + " .dayLongDate .dateOfMonth .date").text(baseDate.clone().add(d, "days").locale(locale).format("DD"));
    $("#day" + d + " .dayLongDate .dateOfMonth .month").text(baseDate.clone().add(d, "days").locale(locale).format("MMM"));
    $("#mwDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    $("#weDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    let meetingInPast = baseDate.clone().add(d, "days").isBefore(now);
    $("#day" + d).toggleClass("alert-secondary", meetingInPast).toggleClass("alert-primary", !meetingInPast).find("i").toggle(!meetingInPast);
    if (baseDate.clone().add(d, "days").isSame(now)) $("#day" + d).addClass("today");
  }
}
const delay = s => new Promise(res => {
  setTimeout(res, s * 1000);
  let secsRemaining = s;
  $("button .action-countdown").html(secsRemaining);
  const timeinterval = setInterval(function() {
    secsRemaining--;
    if (secsRemaining < 1) {
      secsRemaining = "";
      $("button .action-countdown").html();
      clearInterval(timeinterval);
    }
    $("button .action-countdown").html(secsRemaining);
  }, 1000);
  $("#bottomIcon button").on("click", function() {
    window[$(this).attr("class").split(" ").filter(el => el.includes("btn-action-")).join(" ").split("-").splice(2).join("-").toLowerCase().replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""))] = true;
    clearInterval(timeinterval);
    overlay(false);
  });
});
function disableGlobalPref(pref) {
  let row = $("#" + pref).closest("div.row");
  if (row.find(".settingLocked").length === 0) row.find("label").first().prepend($("<span class='badge bg-warning me-1 rounded-pill settingLocked text-black i18n-title' data-bs-toggle='tooltip'><i class='fa-lock fas'></i></span>").attr("title", i18n.__("settingLocked")).tooltip());
  row.addClass("text-muted disabled").find("#" + pref + ", #" + pref + " input, input[data-target=" + pref + "]").addClass("forcedPref").prop("disabled", true);
  console.log("%c - " + pref, "background-color: #FCE4EC; color: #AD1457; padding: 0 2em;");
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
  file.localDir = file.pub ? path.join(paths.pubs, file.pub, file.issue) : path.join(paths.media, file.folder);
  file.localFile = path.join(file.localDir, file.pub ? path.basename(file.url) : file.safeName);
  if (fs.existsSync(file.localFile)) file.downloadRequired = file.filesize !== fs.statSync(file.localFile).size;
  if (file.downloadRequired) {
    mkdirSync(file.localDir);
    fs.writeFileSync(file.localFile, new Buffer((await request(file.url, {isFile: true})).data));
    downloadStat("jworg", "live", file);
  } else {
    downloadStat("jworg", "cache", file);
  }
  if (path.extname(file.localFile) == ".jwpub") await new zipper((await new zipper(file.localFile).readFile("contents"))).extractAllTo(file.localDir);
}
function downloadStat(origin, source, file) {
  if (!downloadStats[origin]) downloadStats[origin] = {};
  if (!downloadStats[origin][source]) downloadStats[origin][source] = [];
  downloadStats[origin][source].push(file);
}
function enablePreviouslyForcedPrefs() {
  $("div.row.text-muted.disabled").removeClass("text-muted disabled").find(".forcedPref").prop("disabled", false).removeClass("forcedPref");
  $("div.row .settingLocked").remove();
}
async function enforcePrefs() {
  console.log("%cENFORCED SETTINGS", "background-color: #FCE4EC; color: #AD1457; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
  console.log("%c Some settings were enforced due to congregation sharing or by your videoconference organizer:", "background-color: #FCE4EC; color: #AD1457; padding: 0 2em;");
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
    for (var pref of Object.keys(forcedPrefs)) {
      disableGlobalPref(pref);
    }
  } else {
    enablePreviouslyForcedPrefs(true);
  }
}
async function executeDryrun(persistantOverlay) {
  await overlay(true, "cog fa-spin");
  await startMediaSync(true);
  if (!persistantOverlay) await overlay(false);
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
  updateTile("specificCong", "warning", "fas fa-circle-notch fa-spin");
  try {
    totals.cong = {
      total: 0,
      current: 1
    };
    for (let congSpecificFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Media")))) {
      for (let remoteFile of (await webdavLs(path.posix.join(prefs.congServerDir, "Media", congSpecificFolder.basename)))) {
        let isMeetingDate = dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isValid() && dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(congSpecificFolder.basename, "YYYY-MM-DD"));
        let isRecurring = congSpecificFolder.basename == "Recurring";
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
        if (isMeetingDate || isRecurring) {
          if (!meetingMedia[congSpecificFolder.basename]) meetingMedia[congSpecificFolder.basename] = [];
          meetingMedia[congSpecificFolder.basename].push(congSpecificFile);
          if (isRecurring) {
            for (var meeting of Object.keys(meetingMedia)) {
              if (dayjs(meeting, "YYYY-MM-DD").isValid()) {
                var repeatFile = v8.deserialize(v8.serialize(congSpecificFile));
                repeatFile.media[0].recurring = true;
                repeatFile.media[0].folder = meeting;
                meetingMedia[meeting].push(repeatFile);
              }
            }
          }
        }
      }
    }
    console.log("%cHIDDEN MEDIA", "background-color: #fff3cd; color: #856404; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
    for (var hiddenFilesFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Hidden"))).filter(hiddenFilesFolder => dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isValid() && dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD"))).sort((a, b) => (a.basename > b.basename) ? 1 : -1)) {
      console.log("%c[" + hiddenFilesFolder.basename + "]", "background-color: #fff3cd; color: #856404; padding: 0 1em; font-size: 125%;");
      for (var hiddenFile of await webdavLs(path.posix.join(prefs.congServerDir, "Hidden", hiddenFilesFolder.basename))) {
        var hiddenFileLogString = "background-color: #d6d8d9; color: #1b1e21; padding: 0 2em;";
        if (meetingMedia[hiddenFilesFolder.basename]) {
          meetingMedia[hiddenFilesFolder.basename].filter(part => part.media.filter(mediaItem => mediaItem.safeName == hiddenFile.basename).map(function (mediaItem) {
            mediaItem.hidden = true;
            hiddenFileLogString = "background-color: #fff3cd; color: #856404; padding: 0 2em;";
          }));
        }
        console.log("%c" + hiddenFile.basename, hiddenFileLogString);
      }
    }
  } catch (err) {
    notifyUser("error", "errorGetCongMedia", null, true, err);
    updateTile("specificCong", "danger", "fas fa-times-circle");
  }
  perf("getCongMedia", "stop");
}
async function getDbFromJwpub(pub, issue, localpath) {
  try {
    var SQL = await sqljs();
    if (localpath) {
      var jwpubContents = await new zipper(localpath).readFile("contents");
      var tempDb = new SQL.Database(await new zipper(jwpubContents).readFile((await new zipper(jwpubContents).getEntries()).filter(entry => path.extname(entry.name) == ".db")[0].entryName));
      var jwpubInfo = (await executeStatement(tempDb, "SELECT UndatedSymbol, IssueTagNumber FROM Publication"))[0];
      pub = jwpubInfo.UndatedSymbol;
      issue = jwpubInfo.IssueTagNumber;
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      jwpubDbs[pub][issue] = tempDb;
    } else {
      if (!jwpubDbs[pub]) jwpubDbs[pub] = {};
      if (!jwpubDbs[pub][issue]) {
        var jwpub = (await getMediaLinks(pub, null, issue, "JWPUB"))[0];
        jwpub.pub = pub;
        jwpub.issue = issue;
        await downloadIfRequired(jwpub);
        jwpubDbs[pub][issue] = new SQL.Database(fs.readFileSync(glob.sync(path.join(paths.pubs, jwpub.pub, jwpub.issue, "*.db"))[0]));
      }
    }
    return jwpubDbs[pub][issue];
  } catch (err) {
    notifyUser("warning", "errorJwpubDbFetch", pub + " - " + issue, false, err);
  }
}
async function getDocumentExtract(db, docId) {
  var extractMultimediaItems = [];
  for (var extractItem of (await executeStatement(db, "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber,Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' " + (prefs.excludeTh ? "AND NOT UndatedSymbol = 'th' " : "") + "ORDER BY DocumentExtract.BeginParagraphOrdinal"))) {
    var extractDb = await getDbFromJwpub(extractItem.UndatedSymbol, extractItem.IssueTagNumber);
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
  return extractMultimediaItems;
}
async function getDocumentMultimedia(db, destDocId, destMepsId, memOnly) {
  let tableMultimedia = ((await executeStatement(db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
  let keySymbol = (await executeStatement(db, "SELECT UniqueEnglishSymbol FROM Publication"))[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
  let issueTagNumber = (await executeStatement(db, "SELECT IssueTagNumber FROM Publication"))[0].IssueTagNumber;
  let tableQuestionExists = (await executeStatement(db, "SELECT * FROM sqlite_master WHERE type='table' AND name='Question'")).length !== 0;
  let suppressZoomExists = (await executeStatement(db, "SELECT COUNT(*) AS CNTREC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'")).map(function(item) {
    return (item.CNTREC > 0 ? true : false);
  })[0];
  let multimediaItems = [];
  for (var multimediaItem of (await executeStatement(db, "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId," + (suppressZoomExists ? " Multimedia.SuppressZoom," : "") + " Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + (tableQuestionExists && tableMultimedia == "DocumentMultimedia" ? "Question.TargetParagraphNumberLabel, " : "") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId " + (tableQuestionExists && tableMultimedia == "DocumentMultimedia" ? "LEFT JOIN Question ON Question.DocumentId = " + tableMultimedia + ".DocumentId AND Question.TargetParagraphOrdinal = " + tableMultimedia + ".BeginParagraphOrdinal " : "") + "WHERE " + (destDocId || destDocId === 0 ? tableMultimedia + ".DocumentId = " + destDocId : "Document.MepsDocumentId = " + destMepsId) + " AND (" + (keySymbol !== "lffi" || !prefs.excludeLffi ? "((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')) OR " : "") + "(Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 6 AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10" + (suppressZoomExists ? " AND Multimedia.SuppressZoom <> 1" : "") + "))" + (tableMultimedia == "DocumentMultimedia" ? " GROUP BY " + tableMultimedia + ".MultimediaId ORDER BY BeginParagraphOrdinal" : "")))) {
    if (tableQuestionExists) {
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
          if (!memOnly) multimediaItem.LocalPath = path.join(paths.pubs, multimediaItem.KeySymbol, multimediaItem.IssueTagNumber, multimediaItem.FilePath);
        }
        multimediaItem.FileName = (multimediaItem.Caption.length > multimediaItem.Label.length ? multimediaItem.Caption : multimediaItem.Label);
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
      notifyUser("warning", "errorJwpubMediaExtract", keySymbol + " - " + issueTagNumber, false, err);
    }
  }
  return multimediaItems;
}
async function getForcedPrefs() {
  let forcedPrefs = {};
  if (await webdavExists(paths.forcedPrefs)) {
    try {
      forcedPrefs = (await request("https://" + prefs.congServer + ":" + prefs.congServerPort + "/" + paths.forcedPrefs, {
        webdav: true,
        noCache: true
      })).data;
    } catch(err) {
      notifyUser("error", "errorForcedSettingsEnforce", null, true, err);
    }
  } else {
    await webdavPut(forcedPrefs, prefs.congServerDir, "forcedPrefs.json");
  }
  return forcedPrefs;
}
async function getInitialData() {
  await getJwOrgLanguages();
  await setAppLang();
  await updateCleanup();
  await setMediaLang();
  await webdavSetup();
  let configIsValid = validateConfig();
  $("#version").text("v" + remote.app.getVersion());
  $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
  if (os.platform() == "linux") $(".notLinux").prop("disabled", true);
  $("#baseDate button, #baseDate .dropdown-item:eq(0)").text(baseDate.format("YYYY-MM-DD") + " - " + baseDate.clone().add(6, "days").format("YYYY-MM-DD")).val(baseDate.format("YYYY-MM-DD"));
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  for (var a = 1; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class='dropdown-item' value='" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "'>" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
  }
  if (prefs.autoStartSync && configIsValid) {
    await overlay(true, "hourglass-start", "pause", "cancel-sync");
    await delay(5);
    if (!cancelSync) $("#mediaSync").click();
  }
  overlay(false, (prefs.autoStartSync && configIsValid ? "hourglass-start" : null));
}
async function getJwOrgLanguages() {
  if ((!fs.existsSync(paths.langs)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(now.subtract(3, "months"))) {
    let cleanedJwLangs = (await request("https://www.jw.org/en/languages/")).data.languages.filter(lang => lang.hasWebContent).map(lang => ({
      name: lang.vernacularName + " (" + lang.name + ")",
      langcode: lang.langcode,
      symbol: lang.symbol
    }));
    fs.writeFileSync(paths.langs, JSON.stringify(cleanedJwLangs, null, 2));
    prefs.langUpdatedLast = dayjs();
    validateConfig(true);
    jsonLangs = cleanedJwLangs;
  } else {
    jsonLangs = JSON.parse(fs.readFileSync(paths.langs));
  }
  for (var lang of jsonLangs) {
    $("#lang").append($("<option>", {
      value: lang.langcode,
      text: lang.name
    }));
  }
  $("#lang").val(prefs.lang).select2();
}
async function getMediaLinks(pub, track, issue, format, docId) {
  let mediaFiles = [];
  if (prefs.lang && prefs.maxRes) {
    try {
      if (pub === "w" && parseInt(issue) >= 20080101 && issue.slice(-2) == "01") pub = "wp";
      let result = (await request("https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json" + (docId ? "&docid=" + docId : "&pub=" + pub + (track ? "&track=" + track : "") + (issue ? "&issue=" + issue : "")) + (format ? "&fileformat=" + format : "") + "&langwritten=" + prefs.lang)).data;
      if (result && result.files) {
        let mediaFileCategories = Object.values(result.files)[0];
        for (var mediaFileItem of mediaFileCategories[("MP4" in mediaFileCategories ? "MP4" : result.fileformat[0])].reverse()) {
          let videoRes = mediaFileItem.label.replace(/\D/g, "");
          if ((videoRes !== 0 && videoRes > prefs.maxRes.replace(/\D/g, "")) || mediaFiles.filter(mediaFile => mediaFile.title == mediaFileItem.title).length > 0) {
            continue;
          } else {
            mediaFiles.push({
              title: mediaFileItem.title,
              filesize: mediaFileItem.filesize,
              url: mediaFileItem.file.url,
              duration: mediaFileItem.duration
            });
          }
        }
      }
    } catch(err) {
      notifyUser("warning", "infoPubIgnored", pub + " - " + track + " - " + issue + " - " + format, false, err);
    }
  }
  return mediaFiles;
}
async function getMwMediaFromDb() {
  var mwDate = baseDate.clone().add(prefs.mwDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(mwDate))) {
    updateTile("day" + prefs.mwDay, "warning", "fas fa-circle-notch fa-spin");
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
      updateTile("day" + prefs.mwDay, "success", "fas fa-check-circle");
    } catch(err) {
      notifyUser("error", "errorGetMwMedia", null, true, err);
      updateTile("day" + prefs.mwDay, "danger", "fas fa-times-circle");
    }
  }
}
function getPrefix() {
  prefix = $(".enterPrefixInput").map(function() {
    return $(this).val();
  }).toArray().join("").trim();
  for (var a0 = 0; a0 <= 4; a0++) {
    if ($("#enterPrefix-" + a0).val().length > 0) {
      for (var a1 = a0 + 1; a1 <= 5; a1++) {
        $("#enterPrefix-" + a1).prop("disabled", false);
      }
    } else {
      for (var a2 = a0 + 1; a2 <= 5; a2++) {
        $("#enterPrefix-" + a2).val("").prop("disabled", true);
      }
    }
  }
  $(".enterPrefixInput").each(function() {
    $(this).fadeTo(fadeDelay, !$(this).prop("disabled"));
  });
  $("#enterPrefix-" + prefix.length).focus();
  if (prefix.length % 2) prefix = prefix + 0;
  if (prefix.length > 0) prefix = prefix.match(/.{1,2}/g).join("-");
}
function setAppLang() {
  $("#localAppLang option").each(function() {
    let localeLang = jsonLangs.filter(item => item.symbol === $(this).val());
    if (localeLang.length === 1) $(this).text(localeLang[0].name);
  });
  i18n.configure({
    directory: path.join(__dirname, "locales"),
    defaultLocale: "en",
    updateFiles: false,
    retryInDefaultLocale: true
  });
  i18n.setLocale(prefs.localAppLang ? prefs.localAppLang : "en");
  $("[data-i18n-string]").each(function() {
    $(this).html(i18n.__($(this).data("i18n-string")));
  });
  dateFormatter();
}
async function getWeMediaFromDb() {
  var weDate = baseDate.clone().add(prefs.weDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(weDate))) {
    updateTile("day" + prefs.weDay, "warning", "fas fa-circle-notch fa-spin");
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
        var LocalPath = path.join(paths.pubs, "w", issue, picture.FilePath);
        var FileName = (picture.Caption.length > picture.Label.length ? picture.Caption : picture.Label);
        var pictureObj = {
          title: FileName,
          filepath: LocalPath,
          filesize: fs.statSync(LocalPath).size,
          queryInfo: picture
        };
        addMediaItemToPart(weDate, picture.BeginParagraphOrdinal, pictureObj);
      }
      var qrySongs = await executeStatement(db, "SELECT * FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DataType = 2 ORDER BY BeginParagraphOrdinal LIMIT 2 OFFSET " + weekNumber * 2);
      for (var song = 0; song < qrySongs.length; song++) {
        var songObj = (await getMediaLinks(qrySongs[song].KeySymbol, qrySongs[song].Track))[0];
        songObj.queryInfo = qrySongs[song];
        addMediaItemToPart(weDate, song * 1000, songObj);
      }
      updateTile("day" + prefs.weDay, "success", "fas fa-check-circle");
    } catch(err) {
      notifyUser("error", "errorGetWeMedia", null, true, err);
      updateTile("day" + prefs.weDay, "danger", "fas fa-times-circle");
    }
  }
}
function isReachable(hostname, port) {
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
        notifyUser("error", "errorSiteCheck", hostname + ":" + port, false, err);
        resolve(false);
      });
    } catch(err) {
      resolve(false);
    }
  });
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
  updateStatus("microchip");
  updateTile("mp4Convert", "warning", "fas fa-circle-notch fa-spin");
  await convertUnusableFiles();
  var filesToProcess = glob.sync(path.join(paths.media, "*", "*"), {
    ignore: path.join(paths.media, "*", "*.mp4")
  });
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
  updateStatus("photo-video");
  updateTile("mp4Convert", "success", "fas fa-check-circle");
  perf("mp4Convert", "stop");
}
function notifyUser(type, message, fileOrUrl, persistent, logOutput) {
  let icon;
  switch (type) {
  case "error":
    icon = "fa-exclamation-circle text-danger";
    break;
  case "warning":
    icon = "fa-exclamation-circle text-warning";
    break;
  default:
    icon = "info-circle text-primary";
  }
  type = i18n.__(type);
  let newToast = "<div class='toast' role='alert' data-bs-autohide='" + !persistent + "'><div class='toast-header'><i class='fas " + icon + "'></i><strong class='me-auto ms-2'>" + type + "</strong><button type='button' class='btn-close' data-bs-dismiss='toast'></button></div><div class='toast-body'><p>" + i18n.__(message) + "</p>" + (fileOrUrl ? "<code>" + fileOrUrl + "</code>" : "") + "</div></div>";
  $("#toastContainer").append($(newToast).toast("show"));
  console.error(message, fileOrUrl ? fileOrUrl : "", logOutput ? logOutput : "");
}
function overlay(show, topIcon, bottomIcon, action) {
  return new Promise((resolve) => {
    if (!show) {
      if (!topIcon || (topIcon && $("#overlayMaster i.fa-" + topIcon).length > 0)) $("#overlayMaster").stop().fadeOut(fadeDelay, () => resolve());
    } else {
      if ($("#overlayMaster #topIcon i.fa-" + topIcon).length === 0) $("#overlayMaster #topIcon i").removeClass().addClass("fas fa-fw fa-" + topIcon);
      $("#overlayMaster #bottomIcon i").removeClass();
      if (bottomIcon) {
        $("#overlayMaster #bottomIcon i").addClass("fas fa-fw fa-" + bottomIcon + (action ? " " + action : "")).unwrap("button");
        $("#overlayMaster #bottomIcon button .action-countdown").html();
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
  console.log("\n%cPERFORMANCE AND NETWORK INFO", "background-color: #e2e3e5; color: #41464b; padding: 0.5em 1em; font-weight: bold; font-size: 125%;");
  for (var perfItem of Object.entries(perfStats).sort((a, b) => a[1].stop - b[1].stop)) {
    console.log("%c[" + perfItem[0] + "] " + (perfItem[1].stop - perfItem[1].start).toFixed(1) + "ms", "background-color: #e2e3e5; color: #41464b; padding: 0 1em;");
  }
  for (let downloadSource of Object.entries(downloadStats)) {
    console.log("%c[" + downloadSource[0] + "Fetch] " + Object.entries(downloadSource[1]).sort((a,b) => a[0].localeCompare(b[0])).map(downloadOrigin => "from " + downloadOrigin[0] + ": " + (downloadOrigin[1].map(source => source.filesize).reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1) + "MB").join(", "), "background-color: #fbe9e7; color: #000; padding: 0 1em;");
  }
}
function prefsInitialize() {
  for (var pref of ["localAppLang", "lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "localOutputPath", "enableMp4Conversion", "congServer", "congServerPort", "congServerUser", "congServerPass", "autoOpenFolderWhenDone", "localAdditionalMediaPrompt", "maxRes", "enableMusicButton", "enableMusicFadeOut", "musicFadeOutTime", "musicFadeOutType", "mwStartTime", "weStartTime", "excludeTh", "excludeLffi"]) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) prefs[pref] = null;
  }
  for (let field of ["localAppLang", "lang", "localOutputPath", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir", "musicFadeOutTime", "mwStartTime", "weStartTime"]) {
    $("#" + field).val(prefs[field]);
  }
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    $(".timePicker").filter("[data-target='" + timeField + "']").val($("#" + timeField).val());
  }
  for (let dtPicker of datepickers) {
    dtPicker.setDate($(dtPicker.element).val());
  }
  for (let checkbox of ["autoStartSync", "autoRunAtBoot", "enableMp4Conversion", "autoQuitWhenDone", "autoOpenFolderWhenDone", "localAdditionalMediaPrompt", "enableMusicButton", "enableMusicFadeOut", "excludeTh", "excludeLffi"]) {
    $("#" + checkbox).prop("checked", prefs[checkbox]);
  }
  for (let radioSel of ["mwDay", "weDay", "maxRes", "musicFadeOutType"]) {
    $("#" + radioSel + " input[value=" + prefs[radioSel] + "]").prop("checked", true).parent().addClass("active");
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
    console.error(response);
    if (options.webdav) throw(response);
  }
  return response;
}
function sanitizeFilename(filename) {
  filename = filename.match(/(\p{Script=Cyrillic}*\p{Script=Latin}*[-. 0-9_]*)/ug)
    .join("")
    .replace(/[?!"»“”‘’«()\\[\]№—$]*/g, "")
    .replace(/[;:,|/]+/g, " - ")
    .replace(/ +/g, " ")
    .replace(/\.+/g, ".")
    .replace(/\r?\n/g, " - ");
  var bytes = Buffer.byteLength(filename, "utf8");
  var toolong = 200;
  if (bytes > toolong) {
    var fe = filename.split(".").pop();
    var chunks = filename.split(" - ");
    while (bytes > toolong) {
      if (chunks.length > 2) {
        chunks.pop();
        filename = chunks.join(" - ");
      } else {
        filename = filename.substring(0, 90);
        chunks = [filename];
      }
      bytes = Buffer.byteLength(filename + "." + fe, "utf8");
    }
    filename = chunks.join(" - ") + "." + fe;
    bytes = Buffer.byteLength(filename, "utf8");
  }
  filename = filename.trim();
  filename = path.basename(filename, path.extname(filename)) + path.extname(filename).toLowerCase();
  return filename;
}
async function setMediaLang() {
  if (prefs.lang) {
    try {
      $("#songPicker").empty();
      for (let sjj of (await getMediaLinks("sjjm", null, null, "MP4")).reverse()) {
        $("#songPicker").append($("<option>", {
          value: sjj.url,
          text: sjj.title
        }));
      }
    } catch (err) {
      $("label[for=typeSong]").removeClass("active").addClass("disabled");
      $("label[for=typeFile]").click().addClass("active");
    }
  }
}
function setVars(isDryrun) {
  perf("setVars", "start");
  try {
    downloadStats = {};
    meetingMedia = {};
    jwpubDbs = {};
    paths.media = path.join(prefs.localOutputPath, prefs.lang);
    if (!isDryrun) mkdirSync(paths.media);
    paths.pubs = path.join(paths.app, "Publications", prefs.lang);
  } catch (err) {
    notifyUser("error", "errorSetVars", paths.media, true, err);
  }
  perf("setVars", "stop");
}
function showModal(isVisible, header, headerContent, bodyContent, footer, footerButtonEnabled) {
  if (isVisible) {
    $("#staticBackdrop .modal-header").html(header ? "<h5 class='modal-title'>" + headerContent + "</h5>" : "").toggle(header);
    $("#staticBackdrop .modal-body").html(bodyContent);
    $("#staticBackdrop .modal-footer button").prop("disabled", (footer ? !footerButtonEnabled : false));
    $("#staticBackdrop .modal-footer").toggle(footer);
    modal.show();
  } else {
    modal.hide();
  }
}
function showReleaseNotes() {
  showModal(true, true, i18n.__("whatsNew"), i18n.__("whatsNewDetails"), true, true);
}
async function startMediaSync(isDryrun) {
  perf("total", "start");
  dryrun = !!isDryrun;
  if (!dryrun) $("#statusIcon").toggleClass("text-primary text-muted");
  stayAlive = false;
  if (!dryrun) $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(fadeDelay, 0);
  await setVars(isDryrun);
  for (let folder of glob.sync(path.join(paths.media, "*/"))) {
    if (!dryrun && (dayjs(path.basename(folder), "YYYY-MM-DD").isValid() && dayjs(path.basename(folder), "YYYY-MM-DD").isBefore(now) || !(dayjs(path.basename(folder), "YYYY-MM-DD").isValid()))) await rm([folder]);
  }
  perf("getJwOrgMedia", "start");
  await Promise.all([
    getMwMediaFromDb(),
    getWeMediaFromDb()
  ]);
  perf("getJwOrgMedia", "stop");
  createMediaNames();
  if (webdavIsAGo) await getCongMedia();
  if (!dryrun) {
    await Promise.all([
      syncCongMedia(),
      syncJwOrgMedia(),
    ]);
    if (prefs.localAdditionalMediaPrompt) await additionalMedia();
    if (prefs.enableMp4Conversion) await mp4Convert();
    if (prefs.autoOpenFolderWhenDone) shell.openPath(paths.media);
    $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(fadeDelay, 1);
    setTimeout(() => {
      $(".alertIndicators").addClass("alert-primary").removeClass("alert-success");
      $("#statusIcon").toggleClass("text-muted text-primary");
    }, 2000);
  }
  perf("total", "stop");
  perfPrint();
}
async function syncCongMedia() {
  let congSyncMeetingMedia = Object.fromEntries(Object.entries(meetingMedia).filter(([key]) => key !== "Recurring"));
  if (webdavIsAGo) {
    perf("syncCongMedia", "start");
    updateStatus("cloud");
    try {
      totals.cong = {
        total: 0,
        current: 1
      };
      for (let parts of Object.values(congSyncMeetingMedia)) {
        for (let part of parts.filter(part => part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden).length > 0)) {
          totals.cong.total = totals.cong.total + part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden).length;
        }
      }
      for (let datedFolder of await glob.sync(path.join(paths.media, "*/"))) {
        if (congSyncMeetingMedia[path.basename(datedFolder)]) for (let jwOrCongFile of await glob.sync(path.join(datedFolder, "*"))) {
          if (!congSyncMeetingMedia[path.basename(datedFolder)].map(part => part.media.filter(media => !media.hidden).map(media => media.safeName)).flat().includes(path.basename(jwOrCongFile))) await rm(jwOrCongFile);
        }
      }
      progressSet(totals.cong.current, totals.cong.total, "specificCong");
      console.log("%cCONGREGATION MEDIA", "background-color: #d1ecf1; color: #0c5460; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
      for (let [meeting, parts] of Object.entries(congSyncMeetingMedia)) {
        console.log("%c[" + meeting + "]", "background-color: #d1ecf1; color: #0c5460; padding: 0 1em; font-size: 125%;");
        for (let part of parts) {
          for (var mediaItem of part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden)) {
            console.log("%c" + mediaItem.safeName, "background-color: #d1ecf1; color: #0c5460; padding: 0 2em;");
            await webdavGet(mediaItem);
            totals.cong.current++;
            progressSet(totals.cong.current, totals.cong.total, "specificCong");
          }
        }
      }
      updateStatus("photo-video");
      updateTile("specificCong", "success", "fas fa-check-circle");
    } catch (err) {
      notifyUser("error", "errorSyncCongMedia", null, true, err);
      updateTile("specificCong", "danger", "fas fa-times-circle");
      progressSet(0, 100, "specificCong");
    }
    perf("syncCongMedia", "stop");
  }
}
async function syncJwOrgMedia() {
  perf("syncJwOrgMedia", "start");
  updateTile("syncJwOrgMedia", "warning", "fas fa-circle-notch fa-spin");
  totals.jw = {
    total: 0,
    current: 1
  };
  for (let meeting of Object.values(meetingMedia)) {
    for (let part of meeting) {
      totals.jw.total = totals.jw.total + part.media.filter(mediaItem => !mediaItem.congSpecific).length;
    }
  }
  progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
  console.log("%cJW.org MEDIA", "background-color: #cce5ff; color: #004085; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    console.log("%c[" + Object.keys(meetingMedia)[h] + "]", "background-color: #cce5ff; color: #004085; padding: 0 1em; font-size: 125%;");
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      var partMedia = meeting[i].media.filter(mediaItem => !mediaItem.congSpecific);
      for (var j = 0; j < partMedia.length; j++) { // media
        if (!partMedia[j].hidden && !partMedia[j].congSpecific && !dryrun) {
          if (!partMedia[j].filesize) {
            console.log("%c[WARN]  Skipping missing media! Try running the sync at a later date.", "background-color: #cce5ff; color: #004085; padding: 0 2em;");
          } else {
            console.log("%c" + partMedia[j].safeName, "background-color: #cce5ff; color: #004085; padding: 0 2em;");
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
  updateStatus("photo-video");
  updateTile("syncJwOrgMedia", "success", "fas fa-check-circle");
  perf("syncJwOrgMedia", "stop");
}
function toggleScreen(screen, forceShow) {
  return new Promise((resolve) => {
    if (screen === "overlaySettings" && !$("#" + screen).is(":visible")) $("#" + screen + " .accordion-collapse").each(function() {
      $(this).collapse($(this).find(".is-invalid").length > 0 ? "show" : "hide");
    });
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
    notifyUser("warning", "warnUnknownLastVersion", null, false, err);
  } finally {
    if (lastRunVersion !== remote.app.getVersion()) {
      setVars();
      rm([paths.media]);
      fs.writeFileSync(paths.lastRunVersion, remote.app.getVersion());
      if (lastRunVersion !== 0) {
        let somePrefWasUpdated = false;
        for (var updatedPref of [["additionalMediaPrompt", "localAdditionalMediaPrompt"], ["betaMp4Gen", "enableMp4Conversion"], ["outputPath", "localOutputPath"], ["openFolderWhenDone", "autoOpenFolderWhenDone"]]) {
          if (updatedPref[0] in prefs) {
            prefs[updatedPref[1]] = prefs[updatedPref[0]];
            delete prefs[updatedPref[0]];
            prefsInitialize();
            somePrefWasUpdated = true;
          }
        }
        if (!prefs.localAppLang) {
          prefs.localAppLang = jsonLangs.filter(item => item.langcode === prefs.lang)[0].symbol;
          somePrefWasUpdated = true;
          prefsInitialize();
          setAppLang();
        }
        validateConfig(somePrefWasUpdated);
        showReleaseNotes();
      }
    }
  }
}
function updateStatus(icon) {
  if (!dryrun) $("#statusIcon").removeClass($("#statusIcon").attr("class").split(" ").filter(el => el.includes("fa-")).join(" ")).addClass("fa-fw fa-3x fa-" + icon);
}
function updateTile(tile, color, icon) {
  if (!dryrun) $("#" + tile).removeClass($("#" + tile).attr("class").split(" ").filter(el => el.includes("alert-")).join(" ")).addClass("alert-" + color).find("i").removeClass().addClass(icon);
}
function validateConfig(changed) {
  let configIsValid = true;
  $(".alertIndicators").removeClass("meeting").find("i").addClass("far fa-circle").removeClass("fas fa-check-circle");
  if (prefs.localOutputPath === "false" || !fs.existsSync(prefs.localOutputPath)) $("#localOutputPath").val("");
  let mandatoryFields = ["localOutputPath", "localAppLang", "lang", "mwDay", "weDay", "maxRes"];
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    if (prefs.enableMusicButton && prefs.enableMusicFadeOut && prefs.musicFadeOutType === "smart") mandatoryFields.push(timeField);
    else $("#" + timeField + ", .timePicker[data-target='" + timeField + "']").removeClass("is-invalid");
  }
  for (var setting of mandatoryFields) {
    if (setting.includes("Day")) $("#day" + prefs[setting]).addClass("meeting");
    $("#" + setting + ", .timePicker[data-target='" + setting + "']").toggleClass("is-invalid", !prefs[setting]);
    $("#" + setting).next(".select2").toggleClass("is-invalid", !prefs[setting]);
    $("#" + setting + " label.btn").toggleClass("btn-outline-dark", !!prefs[setting]).toggleClass("btn-outline-danger", !prefs[setting]);
    $("#" + setting).closest("div.row").find("label").toggleClass("text-danger", !prefs[setting]);
    if (!prefs[setting]) configIsValid = false;
  }
  $("#enableMusicFadeOut").closest(".row").toggle(!!prefs.enableMusicButton);
  $(".relatedToFadeOut").toggle(!!prefs.enableMusicButton && !!prefs.enableMusicFadeOut);
  $("#enableMusicFadeOut").closest(".row").find("label").first().toggleClass("col-11", prefs.enableMusicButton && !prefs.enableMusicFadeOut);
  if (prefs.enableMusicButton && prefs.enableMusicFadeOut) {
    if (!prefs.musicFadeOutTime) $("#musicFadeOutTime").val(5).change();
    if (!prefs.musicFadeOutType) $("label[for=musicFadeOutSmart]").click();
  }
  $("#musicFadeOutType label span").text(prefs.musicFadeOutTime);
  $("#mp4Convert").toggleClass("d-flex", prefs.enableMp4Conversion);
  $("#btnMeetingMusic").toggle(prefs.enableMusicButton && $("#btnStopMeetingMusic:visible").length === 0);
  $(".btn-home").toggleClass("btn-dark", configIsValid).toggleClass("btn-danger", !configIsValid);
  $("#mediaSync, .btn-home").prop("disabled", !configIsValid);
  if (!configIsValid) {
    toggleScreen("overlaySettings", true);
  } else if (changed) {
    fs.writeFileSync(paths.prefs, JSON.stringify(Object.keys(prefs).sort().reduce((acc, key) => ({...acc, [key]: prefs[key]}), {}), null, 2));
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
    fs.writeFileSync(localFile, new Buffer((await request("https://" + prefs.congServer + ":" + prefs.congServerPort + file.url, {
      webdav: true,
      isFile: true
    })).data));
    downloadStat("cong", "live", file);
  } else {
    downloadStat("cong", "cache", file);
  }
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
async function webdavLs(dir, force) {
  let items = [],
    congUrl = "https://" + prefs.congServer + ":" + prefs.congServerPort + dir;
  try {
    if (webdavIsAGo || force) {
      await webdavMkdir(dir);
      let listing = xmlParser.parse((await request(congUrl, {
        method: "PROPFIND",
        responseType: "text",
        headers: {
          Accept: "text/plain",
          Depth: "1"
        },
        webdav: true
      })).data, {
        arrayMode: false,
        ignoreNameSpace: true
      });
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
async function webdavPut(file, destFolder, destName) {
  let destFile = path.posix.join("https://" + prefs.congServer + ":" + prefs.congServerPort, destFolder, (await sanitizeFilename(destName)));
  try {
    if (webdavIsAGo && file && destFolder && destName) {
      await webdavMkdir(destFolder);
      await request(destFile, {
        method: "PUT",
        data: file,
        headers: {
          "Content-Type": "application/octet-stream"
        },
        webdav: true
      });
    }
    return true;
  } catch (err) {
    notifyUser("error", "errorWebdavPut", destFile, true, err);
    return false;
  }
}
async function webdavRm(path) {
  let deleteFile = "https://" + prefs.congServer + ":" + prefs.congServerPort + path;
  try {
    if (webdavIsAGo && path && await webdavExists(path)) {
      await request(deleteFile, {
        method: "DELETE",
        webdav: true
      });
    }
    return true;
  } catch (err) {
    notifyUser("error", "errorWebdavRm", deleteFile, true, err);
    return false;
  }
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
            if (prefs.localAdditionalMediaPrompt) $("#localAdditionalMediaPrompt").prop("checked", false).change();
            enforcePrefs();
            disableGlobalPref("localAdditionalMediaPrompt");
          }
        }
      }
    }
  }
  $("#btn-upload").toggle(congServerEntered).prop("disabled", congServerEntered && !webdavDirIsValid).toggleClass("btn-primary", !congServerEntered || (congServerEntered && webdavLoginSuccessful && webdavDirIsValid)).toggleClass("btn-danger", congServerEntered && !(webdavDirIsValid && webdavLoginSuccessful));
  $("#webdavStatus").toggleClass("text-success text-warning text-muted", webdavDirIsValid).toggleClass("text-danger", congServerEntered && !webdavDirIsValid);
  $(".webdavHost").toggleClass("is-valid", congServerHeartbeat).toggleClass("is-invalid", congServerEntered && !congServerHeartbeat);
  $(".webdavCreds").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && !webdavLoginSuccessful));
  $("#congServerDir").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && !webdavDirIsValid));
  $("#webdavFolderList").fadeTo(fadeDelay, webdavDirIsValid);
  $("#specificCong").toggleClass("d-flex", congServerEntered).toggleClass("alert-danger", congServerEntered && !(congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid));
  $("#btn-settings, #headingCongSync button").toggleClass("in-danger", congServerEntered && !webdavDirIsValid);
  webdavIsAGo = (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
  $("#localAdditionalMediaPrompt").closest(".row").toggle(!webdavIsAGo);
  $("#btnForcedPrefs").prop("disabled", !webdavIsAGo);
  if (!webdavIsAGo) enablePreviouslyForcedPrefs();
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
$("#autoRunAtBoot").on("change", function() {
  remote.app.setLoginItemSettings({
    openAtLogin: prefs.autoRunAtBoot
  });
});
$("#baseDate").on("click", ".dropdown-item", function() {
  baseDate = dayjs($(this).val()).startOf("isoWeek");
  $("#baseDate .dropdown-item.active").removeClass("active");
  $(this).addClass("active");
  $("#baseDate > button").text($(this).text());
  $(".alertIndicators").find("i").addClass("far fa-circle").removeClass("fas fa-check-circle");
  dateFormatter();
});
$("#btnCancelUpload").on("click", () => {
  toggleScreen("overlayUploadFile");
  $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
  $("#fileList, #filePicker, #jwpubPicker, .enterPrefixInput").val("").empty().change();
  $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
  removeEventListeners();
});
$("#btnForcedPrefs").on("click", () => {
  getForcedPrefs().then(currentForcedPrefs => {
    let html = "<h6>" + i18n.__("settingsLockedWhoAreYou") + "</h6>";
    html += "<p>" + i18n.__("settingsLockedExplain") + "</p>";
    html += "<div id='forcedPrefs' class='card'><div class='card-body'>";
    for (var pref of Object.keys(prefs).filter(pref => !pref.startsWith("cong") && !pref.startsWith("auto") && !pref.startsWith("local") && !pref.includes("UpdatedLast")).sort((a, b) => a[0].localeCompare(b[0]))) {
      html += "<div class='form-check form-switch'><input class='form-check-input' type='checkbox' id='forcedPref-" + pref + "' " + (pref in currentForcedPrefs ? "checked" : "") + "> <label class='form-check-label' for='forcedPref-" + pref + "'><code>" + pref + "</code> <i class='fas fa-question-circle text-muted' title='\"" + $("#" + pref).closest(".row").find("label").first().find("span").last().html() + "\"' data-bs-toggle='tooltip' data-bs-html='true'></i></label></div>";
    }
    html += "</div></div>";
    showModal(true, true, i18n.__("settingsLocked"), html, true, true);
    $("#staticBackdrop #forcedPrefs i").tooltip();
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
$("#btnMeetingMusic").on("click", async function() {
  if (prefs.enableMusicFadeOut) {
    let timeBeforeFade;
    let rightNow = dayjs();
    if (prefs.musicFadeOutType == "smart") {
      if ((now.day() - 1) == prefs.mwDay || (now.day() - 1) == prefs.weDay) {
        let todaysMeetingStartTime = prefs[((now.day() - 1) == prefs.mwDay ? "mw" : "we") + "StartTime"].split(":");
        let timeToStartFading = now.clone().hour(todaysMeetingStartTime[0]).minute(todaysMeetingStartTime[1]).millisecond(rightNow.millisecond()).subtract(prefs.musicFadeOutTime, "s");
        timeBeforeFade = timeToStartFading.diff(rightNow);
      }
    } else {
      timeBeforeFade = prefs.musicFadeOutTime * 1000 * 60;
    }
    if (timeBeforeFade >= 0) {
      pendingMusicFadeOut.endTime = timeBeforeFade + rightNow.valueOf();
      pendingMusicFadeOut.id = setTimeout(function () {
        $("#btnStopMeetingMusic").click();
      }, timeBeforeFade);
    } else {
      pendingMusicFadeOut.endTime = 0;
    }
  } else {
    pendingMusicFadeOut.id = null;
  }
  $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").parent().prop("title", "...");
  $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
  var songs = (await getMediaLinks("sjjm", null, null, "MP3")).sort(() => .5 - Math.random());
  var iterator = 0;
  function createAudioElem(iterator) {
    $("body").append($("<audio id='meetingMusic' autoplay>").data("track", songs[iterator].track).on("ended", function() {
      $("#meetingMusic").remove();
      iterator = (iterator < songs.length - 1 ? iterator + 1 : 0);
      createAudioElem(iterator);
    }).on("loadstart", function() {
      $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").parent().prop("title", "...");
      displayMusicRemaining();
    }).on("canplay", function() {
      $("#btnStopMeetingMusic i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin").parent().prop("title", songs[iterator].title);
      displayMusicRemaining();
    }).on("timeupdate", function() {
      displayMusicRemaining();
    }).append("<source src='"+ songs[iterator].url + "' type='audio/mpeg'>"));
  }
  createAudioElem(iterator);
});
$(".btn-home, #btn-settings").on("click", function() {
  toggleScreen("overlaySettings");
});
$("#btnStopMeetingMusic").on("click", function() {
  clearTimeout(pendingMusicFadeOut.id);
  $("#btnStopMeetingMusic").toggleClass("btn-warning btn-danger").prop("disabled", true);
  $("#meetingMusic").animate({volume: 0}, fadeDelay * 30, () => {
    $("#meetingMusic").remove();
    $("#btnStopMeetingMusic").hide().toggleClass("btn-warning btn-danger").prop("disabled", false);
    $("#musicRemaining").empty();
    if (prefs.enableMusicButton) {
      $("#btnMeetingMusic").show();
    }
  });
});
$("#btnUpload").on("click", async () => {
  try {
    $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-save");
    $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", true);
    if ($("input#typeSong:checked").length > 0) {
      let songFile = new Buffer((await request($("#fileToUpload").val(), {isFile: true})).data);
      let songFileName = sanitizeFilename(prefix + " - " + $("#songPicker option:selected").text() + ".mp4");
      if (currentStep == "additionalMedia") {
        fs.writeFileSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), songFileName), songFile);
      } else {
        await webdavPut(songFile, path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), songFileName);
      }
    } else if ($("input#typeJwpub:checked").length > 0) {
      for (var tempMedia of tempMediaArray) {
        if (tempMedia.url) tempMedia.contents = new Buffer((await request(tempMedia.url, {isFile: true})).data);
        let jwpubFileName = sanitizeFilename(prefix + " - " + tempMedia.filename);
        if (currentStep == "additionalMedia") {
          if (tempMedia.contents) {
            fs.writeFileSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), jwpubFileName), tempMedia.contents);
          } else {
            fs.copyFileSync(tempMedia.localpath, path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), jwpubFileName));
          }
        } else {
          await webdavPut((tempMedia.contents ? tempMedia.contents : fs.readFileSync(tempMedia.localpath)), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), jwpubFileName);
        }
      }
      tempMediaArray = [];
    } else {
      for (var splitLocalFile of $("#fileToUpload").val().split(" -//- ")) {
        let splitFileToUploadName = sanitizeFilename(prefix + " - " + path.basename(splitLocalFile));
        if (currentStep == "additionalMedia") {
          fs.copyFileSync(splitLocalFile, path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), splitFileToUploadName));
        } else {
          await webdavPut(fs.readFileSync(splitLocalFile), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), splitFileToUploadName);
        }
      }
    }
  } catch (err) {
    notifyUser("error", "errorAdditionalMedia", $("#fileToUpload").val(), true, err);
  }
  await executeDryrun();
  $("#btnUpload").prop("disabled", false).find("i").addClass("fa-save").removeClass("fa-circle-notch fa-spin");
  $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", false);
  $("#chooseMeeting input:checked").change();
});
$("#btn-upload").on("click", async function() {
  $(".relatedToUpload, .relatedToUploadType").fadeTo(fadeDelay, 0);
  $("#btnDoneUpload").fadeOut(fadeDelay);
  $("#btnCancelUpload").fadeIn(fadeDelay);
  currentStep = "uploadFile";
  await executeDryrun(true);
  await toggleScreen("overlayUploadFile");
  overlay(false);
  $(".alertIndicators").find("i").addClass("far fa-circle").removeClass("fas fa-check-circle");
  $("#chooseMeeting").empty();
  for (var meeting of [prefs.mwDay, prefs.weDay, "Recurring"]) {
    let meetingDate = (isNaN(meeting) ? meeting : baseDate.add(meeting, "d").format("YYYY-MM-DD"));
    $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-" + (isNaN(meeting) ? "info" : "dark" ) + "' for='" + meetingDate + "'" + (isNaN(meeting) || Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + (isNaN(meeting) ? i18n.__("recurring") : meetingDate) + "</label>");
  }
});
$("#chooseUploadType input").on("change", function() {
  $("#songPicker:visible").select2("destroy");
  $("#songPicker, #jwpubPicker, #filePicker").hide();
  $(".enterPrefixInput").val("").empty();
  $("#fileToUpload").val("").change();
  if ($("input#typeSong:checked").length > 0) {
    $(".enterPrefixInput").slice(0, 4).val(0).last().change();
    $("#songPicker").val([]).prop("disabled", false).show().select2();
  } else if ($("input#typeFile:checked").length > 0) {
    $("#filePicker").val("").prop("disabled", false).show();
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val([]).prop("disabled", false).show();
  }
  getPrefix();
});
$(".enterPrefixInput, #congServerPort").on("keypress", function(e){ // cmd/ctrl || arrow keys || delete key || numbers
  return e.metaKey || e.which <= 0 || e.which === 8 || /[0-9]/.test(String.fromCharCode(e.which));
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
    let itemsWithMultimedia = await executeStatement(contents, "SELECT DISTINCT " + tableMultimedia + ".DocumentId, Document.Title FROM Document INNER JOIN " + tableMultimedia + " ON Document.DocumentId = " + tableMultimedia + ".DocumentId " + (tableMultimedia === "DocumentMultimedia" ? "INNER JOIN Multimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId " : "") + "WHERE (Multimedia.CategoryType = 8 OR Multimedia.CategoryType = -1)" + (suppressZoomExists ? " AND Multimedia.SuppressZoom = 0" : "") + " ORDER BY " + tableMultimedia + ".DocumentId");
    let tempModal = {};
    if (itemsWithMultimedia.length > 0) {
      var docList = $("<div id='docSelect' class='list-group'>");
      for (var item of itemsWithMultimedia) {
        $(docList).append("<button class='d-flex list-group-item list-group-item-action' data-docid='" + item.DocumentId + "'><div class='flex-fill'> " + item.Title + "</div><div><i class='far fa-circle'></i></div></li>");
      }
      tempModal.header = i18n.__("selectDocument");
      tempModal.body = docList;
    } else {
      tempModal.body = i18n.__("noDocumentsFound");
      $(this).val("");
      $("#fileToUpload").val("").change();
    }
    showModal(true, itemsWithMultimedia.length > 0, tempModal.header, tempModal.body, itemsWithMultimedia.length === 0, true);
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
      filename: (i + 1).toString().padStart(2, "0") + " - " + (multimediaItem.queryInfo.FilePath ? multimediaItem.queryInfo.FilePath : multimediaItem.queryInfo.KeySymbol + "." + (multimediaItem.queryInfo.MimeType.includes("video") ? "mp4" : "mp3"))
    };
    if (multimediaItem.queryInfo.CategoryType !== -1) {
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
  $("#mediaSync, #baseDate-dropdown").prop("disabled", true);
  await startMediaSync();
  await overlay(true, "smile-beam text-primary", (prefs.autoQuitWhenDone ? "door-open" : null), "stay-alive");
  await delay(3);
  if (prefs.autoQuitWhenDone && !stayAlive) {
    remote.app.exit();
  } else {
    overlay(false);
    $(".btn-home, #btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? " #btn-upload" : "")).fadeTo(fadeDelay, 1);
    $("#mediaSync, #baseDate-dropdown").prop("disabled", false);
  }
});
$("#localOutputPath").on("mousedown", function(event) {
  $(this).val(remote.dialog.showOpenDialogSync({ properties: ["openDirectory"] })).change();
  event.preventDefault();
});
$("#overlaySettings").on("click", ".btn-clean-up", function() {
  $(this).toggleClass("btn-success btn-warning").prop("disabled", true);
  setVars();
  rm([paths.media, paths.langs, paths.pubs]);
  setTimeout(() => {
    $(".btn-clean-up").toggleClass("btn-success btn-warning").prop("disabled", false);
  }, 3000);
});
$("#overlayUploadFile").on("change", "#chooseMeeting input", function() {
  removeEventListeners();
  document.addEventListener("drop", dropHandler);
  document.addEventListener("dragover", dragoverHandler);
  document.addEventListener("dragenter", dragenterHandler);
  document.addEventListener("dragleave", dragleaveHandler);
  $("#chooseUploadType input").prop("checked", false).change();
  $("#chooseUploadType label.active").removeClass("active");
  $(".relatedToUploadType").fadeTo(fadeDelay, 1);
});
$("#overlayUploadFile").on("change", "#chooseMeeting input, #chooseUploadType input", function() {
  $(".relatedToUpload").fadeTo(fadeDelay, ($("#chooseMeeting input:checked").length === 0 || $("#chooseUploadType input:checked").length === 0 ? 0 : 1));
});
$("#fileList").on("click", "li .fa-minus-circle", function() {
  $(this).parent().addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
  setTimeout(() => {
    $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
  }, 3000);
});
$("#fileList").on("click", "li .fa-exclamation-circle", async function() {
  let successful = true;
  if (currentStep == "additionalMedia") {
    rm(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), $(this).parent().data("url")));
  } else {
    successful = await webdavRm($(this).parent().data("url"));
  }
  if (successful) {
    $(this).parent().fadeOut(fadeDelay, function(){
      $(this).remove();
    });
    meetingMedia[$("#chooseMeeting input:checked").prop("id")].splice(meetingMedia[$("#chooseMeeting input:checked").prop("id")].findIndex(item => item.media.find(mediaItem => mediaItem.url === $(this).parent().data("url"))), 1);
  }
});
$("#fileList").on("click", ".canHide", async function() {
  if (await webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).data("safename"))) {
    $(this).removeClass("canHide").addClass("wasHidden").find("i.fa-check-square").removeClass("fa-check-square").addClass("fa-square");
    executeDryrun();
  }
});
$("#fileList").on("click", ".wasHidden", async function() {
  if (await webdavRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id"), $(this).data("safename")))) {
    $(this).removeClass("wasHidden").addClass("canHide").find("i.fa-square").removeClass("fa-square").addClass("fa-check-square");
    executeDryrun();
  }
});
$("#overlayUploadFile").on("change", ".enterPrefixInput, #chooseMeeting input, #fileToUpload", function() {
  try {
    if ($("#chooseMeeting input:checked").length > 0) {
      $(".relatedToUpload *:not(.enterPrefixInput):enabled").prop("disabled", true).addClass("fileListLoading");
      $("#fileList").stop().fadeTo(fadeDelay, 0, () => {
        var weekMedia = [];
        if (currentStep == "additionalMedia") {
          fs.readdirSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"))).map(function(item) {
            weekMedia.push({
              title: item,
              media: [{
                safeName: item,
                url: item
              }]
            });
          });
        } else {
          if (!meetingMedia[$("#chooseMeeting input:checked").prop("id")]) meetingMedia[$("#chooseMeeting input:checked").prop("id")] = [];
          weekMedia = meetingMedia[$("#chooseMeeting input:checked").prop("id")].filter(mediaItem => mediaItem.media.length > 0);
        }
        var newFiles = [];
        let newFileChosen = $("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0;
        if (newFileChosen) {
          for (var splitFileToUpload of $("input#typeSong:checked").length > 0 ? [$("#songPicker option:selected").text() + ".mp4"] : $("#fileToUpload").val().split(" -//- ")) {
            newFiles.push({
              title: "New file!",
              media: [{
                safeName: sanitizeFilename(prefix + " - " + path.basename(splitFileToUpload)).trim(),
                newFile: true,
                recurring: false,
              }]
            });
          }
          weekMedia = weekMedia.concat(newFiles);
        }
        var newList = [];
        for (var weekMediaItem of weekMedia) {
          newList = newList.concat(weekMediaItem.media);
        }
        newList = newList.sort((a, b) => a.safeName.localeCompare(b.safeName));
        $("#fileList").empty();
        for (var file of newList) {
          let html = $("<li title='" + file.safeName + "' data-url='" + file.url + "' data-safename='" + file.safeName + "'>" + file.safeName + "</li>");
          if (file.congSpecific && file.recurring) html.prepend("<i class='fas fa-fw fa-sync-alt'></i>").addClass("recurring text-info");
          if ((currentStep == "additionalMedia" && !file.newFile) || (file.congSpecific && !file.recurring)) html.prepend("<i class='fas fa-fw fa-minus-circle'></i>").addClass("canDelete");
          if (currentStep !== "additionalMedia" && (!file.congSpecific || file.recurring) && !file.hidden && !file.newFile) html.addClass("canHide").prepend("<i class='far fa-fw fa-check-square'></i>");
          if (file.newFile) html.addClass("new-file").prepend("<i class='fas fa-fw fa-plus'></i>");
          if (!file.newFile && newFiles.filter(item => item.media.filter(mediaItem => mediaItem.safeName.includes(file.safeName)).length > 0).length > 0) html.addClass("duplicated-file");
          if (file.hidden) html.addClass("wasHidden").prepend("<i class='far fa-fw fa-square'></i>");
          if (file.safeName.includes(".mp4")) html.addClass("video");
          $("#fileList").append(html);
        }
        $("#fileList").css("column-count", Math.ceil($("#fileList li").length / 8));
        $("#btnUpload").toggle(newFileChosen);
        $("#" + (currentStep == "additionalMedia" ? "btnDoneUpload" : "btnCancelUpload")).toggle(!newFileChosen);
        $("#fileList").stop().fadeTo(fadeDelay, 1, () => {
          $(".fileListLoading").prop("disabled", false).removeClass("fileListLoading");
        });
      });
    }
  } catch (err) {
    notifyUser("error", "errorAdditionalMediaList", null, true, err);
  }
});
$("#overlayUploadFile").on("keyup", ".enterPrefixInput", getPrefix);
$("#overlayUploadFile").on("mousedown", "input#filePicker, input#jwpubPicker", function(event) {
  let thisId = $(this).prop("id");
  let options = {
    properties: ["multiSelections", "openFile"]
  };
  if (thisId.includes("jwpub")) options = {
    filters: [
      { name: "JWPUB", extensions: ["jwpub"] }
    ]
  };
  let path = remote.dialog.showOpenDialogSync(options);
  $(this).val((typeof path !== "undefined" ? (thisId.includes("file") ? path.join(" -//- ") : path) : "")).change();
  event.preventDefault();
});
$("#songPicker").on("change", function() {
  if ($(this).val()) $("#fileToUpload").val($(this).val()).change();
});
$("#overlaySettings").on("click", "#version:not(.bg-danger)", showReleaseNotes);
$("#webdavProviders a").on("click", function() {
  for (let i of Object.entries($(this).data())) {
    let name = "cong" + (i[0][0].toUpperCase() + i[0].slice(1));
    prefs[name] = i[1];
    $("#" + name).val(i[1]);
  }
  $("#congServer").change();
});
