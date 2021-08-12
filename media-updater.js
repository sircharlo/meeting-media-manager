const animationDuration = 200,
  isPortReachable = require("is-port-reachable"),
  remoteApp = require("@electron/remote").app,
  remoteDialog = require("@electron/remote").dialog,
  {shell} = require("electron"),
  $ = require("jquery");
async function checkInternet() {
  try {
    let jwOrg = await isPortReachable(443, {
      host: "www.jw.org"
    });
    if (jwOrg) {
      require("electron").ipcRenderer.send("autoUpdate");
    } else {
      require("electron").ipcRenderer.send("noInternet");
    }
  } catch (err) {
    console.error(err);
  }
}

checkInternet();

require("electron").ipcRenderer.on("checkInternet", () => {
  checkInternet();
});

require("electron").ipcRenderer.on("hideThenShow", (event, message) => {
  $("#overlay" + message[1]).fadeIn(animationDuration, () => {
    $("#overlay" + message[0]).stop().hide();
  });
});

require("electron").ipcRenderer.on("macUpdate", () => {
  $("#bg-mac-update").fadeIn();
  $("#btn-settings").addClass("in-danger");
  $("#version").addClass("bg-danger in-danger").removeClass("bg-secondary").append(" <i class=\"fas fa-mouse-pointer\"></i>").click(function() {
    shell.openExternal("https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest");
  });
});

require("electron").ipcRenderer.on("goAhead", () => {
  $("#overlayPleaseWait").fadeIn(animationDuration, () => {
    $("#overlayUpdateCheck").stop().hide();
    goAhead();
  });
});

const axios = require("axios"),
  bootstrap = require("bootstrap"),
  { createClient } = require("webdav"),
  dayjs = require("dayjs"),
  ffmpeg = require("fluent-ffmpeg"),
  fs = require("graceful-fs"),
  glob = require("glob"),
  i18n = require("i18n"),
  os = require("os"),
  path = require("path"),
  sizeOf = require("image-size"),
  sqljs = require("sql.js"),
  zipper = require("adm-zip");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));

var baseDate = dayjs().startOf("isoWeek"),
  currentStep,
  dryrun = false,
  hdRes = [],
  jsonLangs = {},
  jwpubDbs = {},
  meetingMedia,
  myModal = new bootstrap.Modal(document.getElementById("staticBackdrop"), {
    backdrop: "static",
    keyboard: false
  }),
  now = dayjs().hour(0).minute(0).second(0).millisecond(0),
  paths = {},
  prefix,
  prefs = {},
  tempMediaArray = [],
  totals = {},
  webdavIsAGo = false,
  stayAlive,
  webdavClient;
paths.app = remoteApp.getPath("userData");
paths.langs = path.join(paths.app, "langs.json");
paths.lastRunVersion = path.join(paths.app, "lastRunVersion.json");
paths.prefs = path.join(paths.app, "prefs.json");

function goAhead() {
  if (fs.existsSync(paths.prefs)) {
    try {
      prefs = JSON.parse(fs.readFileSync(paths.prefs));
    } catch (err) {
      console.error(err);
    }
    prefsInitialize();
  }
  updateCleanup();
  getInitialData();
  dateFormatter();
  $("#overlaySettings input, #overlaySettings select, #overlayWebdav input, #overlayWebdav select").on("change", function() {
    if ($(this).prop("tagName") == "INPUT") {
      if ($(this).prop("type") == "checkbox") {
        prefs[$(this).prop("id")] = $(this).prop("checked");
      } else if ($(this).prop("type") == "radio") {
        prefs[$(this).closest("div").prop("id")] = $(this).closest("div").find("input:checked").val();
      } else if ($(this).prop("type") == "text" || $(this).prop("type") == "password") {
        prefs[$(this).prop("id")] = $(this).val();
      }
    } else if ($(this).prop("tagName") == "SELECT") {
      prefs[$(this).prop("id")] = $(this).find("option:selected").val();
    }
    fs.writeFileSync(paths.prefs, JSON.stringify(prefs, null, 2));
    if ($(this).prop("id").includes("lang")) {
      dateFormatter();
    }
    if ($(this).prop("id") == "congServer" && $(this).val() == "") {
      $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #webdavFolderList").val("").empty().change();
    }
    if ($(this).prop("id").includes("cong")) {
      webdavSetup();
    }
    if ($(this).prop("id").includes("lang")) {
      getTranslations();
    }
    setVars();
    if ($(this).prop("id").includes("cong") || $(this).prop("name").includes("Day")) {
      cleanUp([paths.media], "brutal");
    }
    configIsValid();
  });
  $("#autoRunAtBoot").on("change", function() {
    remoteApp.setLoginItemSettings({
      openAtLogin: prefs.autoRunAtBoot
    });
  });
  $("#mwDay input, #weDay input").on("change", function() {
    $(".alertIndicators").removeClass("meeting").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
  });
}
function additionalMedia() {
  if (!dryrun && prefs.additionalMediaPrompt) {
    currentStep = "additionalMedia";
    return new Promise((resolve)=>{
      $("#chooseMeeting").empty();
      for (var meeting of [prefs.mwDay, prefs.weDay]) {
        let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
        $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-primary' for='" + meetingDate + "'" + (Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + meetingDate + "</label>");
      }
      $(".relatedToUpload, .relatedToUploadType, #btnCancelUpload").fadeTo(animationDuration, 0);
      $("#btnDoneUpload").fadeTo(animationDuration, 1);
      $("#overlayUploadFile").fadeIn();
      $("#btnDoneUpload").on("click", function() {
        $("#overlayUploadFile").slideUp(animationDuration);
        $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
        $("#fileList, #fileToUpload, #jwpubPicker, #enterPrefix input").val("").empty().change();
        $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
        document.removeEventListener("drop", dropHandler);
        document.removeEventListener("dragover", dragoverHandler);
        document.removeEventListener("dragenter", dragenterHandler);
        document.removeEventListener("dragleave", dragleaveHandler);
        resolve();
      });
    });
  }
}
function addMediaItemToPart (date, paragraph, media) {
  if (!meetingMedia[date]) meetingMedia[date] = [];
  if (meetingMedia[date].filter(part => part.title == paragraph).length == 0) {
    meetingMedia[date].push({
      title: paragraph,
      media: []
    });
  }
  media.folder = date;
  meetingMedia[date].find(part => part.title == paragraph).media.push(media);
  meetingMedia[date] = meetingMedia[date].sort((a, b) => a.title > b.title && 1 || -1);
}
function cleanUp(dirs, type) {
  for (var lookinDir of dirs) {
    $("#statusIcon").addClass("fa-broom").removeClass("fa-photo-video");
    try {
      if (fs.existsSync(lookinDir)) {
        if (type == "brutal") {
          fs.rmSync(lookinDir, {
            recursive: true
          });
        } else {
          for (var mediaSubDir of glob.sync(path.join(lookinDir, "*"))) {
            if (dayjs(path.basename(mediaSubDir), "YYYY-MM-DD").isValid() && !dayjs(path.basename(mediaSubDir), "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
              var deleteDir = path.join(lookinDir, path.basename(mediaSubDir));
              fs.rmdirSync(deleteDir, {
                recursive: true
              });
            }
          }
        }
      }
    } catch(err) {
      console.error(err);
    }
    $("#statusIcon").addClass("fa-photo-video").removeClass("fa-broom");
  }
}
function configIsValid() {
  $("#lang").next(".select2").find(".select2-selection").removeClass("invalid");
  $("#mwDay, #weDay, #outputPath").removeClass("invalid is-invalid");
  $("#overlaySettings .btn-outline-danger").addClass("btn-outline-primary").removeClass("btn-outline-danger");
  $("#overlaySettings label.text-danger").removeClass("text-danger");
  var configIsValid = true;
  if ($("#lang option:selected").length == 0) {
    $("#lang").next(".select2").find(".select2-selection").addClass("invalid");
    configIsValid = false;
  }
  for (var elem of ["mwDay", "weDay", "maxRes"]) {
    if ($("#" + elem + " input:checked").length == 0) {
      $("#" + elem + " .btn-outline-primary").addClass("btn-outline-danger").removeClass("btn-outline-primary");
      configIsValid = false;
    }
  }
  if ($("#outputPath").val() == "false" || !fs.existsSync($("#outputPath").val())) {
    $("#outputPath").val("");
  }
  if (!$("#outputPath").val()) {
    $("#outputPath").addClass("is-invalid");
    configIsValid = false;
  }
  if (prefs.maxRes) {
    var maxResX = parseInt(prefs.maxRes.replace(/\D/g, ""));
    if (maxResX == 720) {
      hdRes = [1280, maxResX];
    } else if (maxResX == 480) {
      hdRes = [720, maxResX];
    } else if (maxResX == 360) {
      hdRes = [480, maxResX];
    } else {
      hdRes = [426, maxResX];
    }
  }
  if (prefs.betaMp4Gen) {
    $("#zoomRender").addClass("d-flex").find("i").removeClass("fa-check-circle").addClass("fa-spinner");
  } else {
    $("#zoomRender").removeClass("d-flex");
  }
  if (prefs.enableMusicButton && $("#btnStopMeetingMusic:visible").length == 0) {
    $("#btnMeetingMusic").fadeIn();
  } else {
    $("#btnMeetingMusic").fadeOut();
  }
  $("#overlaySettings .invalid, #overlaySettings .is-invalid, #overlaySettings .btn-outline-danger").each(function() {
    $(this).closest("div.flex-row").find("label:nth-child(1)").addClass("text-danger");
  });
  if (configIsValid) {
    $("#mediaSync, .btn-settings").prop("disabled", false);
    $(".btn-settings").addClass("btn-dark").removeClass("btn-danger");
    $("#settingsIcon").addClass("text-muted").removeClass("text-danger");
    return true;
  } else {
    $("#mediaSync, .btn-settings").prop("disabled", true);
    $(".btn-settings").addClass("btn-danger").removeClass("btn-dark");
    $("#settingsIcon").addClass("text-danger").removeClass("text-muted");
    toggleScreen("overlaySettings", true);
    return false;
  }
}
function convertPdf(mediaFile) {
  return new Promise((resolve)=>{
    var pdfjsLib = require("pdfjs-dist/build/pdf.js");
    var pdfjsLibWorker = require("pdfjs-dist/build/pdf.worker.entry.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsLibWorker;
    pdfjsLib.getDocument(mediaFile).promise.then(async function(pdf) {
      for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        await pdfRender(mediaFile, pdf, pageNum);
      }
      fs.rmSync(mediaFile);
      resolve();
    });
  });
}
function convertSvg(mediaFile) {
  return new Promise((resolve)=>{
    var mediaFileConverted = path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + ".png");
    var svgFile = window.URL.createObjectURL(new Blob([fs.readFileSync(mediaFile, "utf8").replace(/(<svg[ a-zA-Z=":/.0-9%]*)(width="[0-9%]*")([ a-zA-Z=":/.0-9%]*>)/gm, "$1height=\"" + hdRes[1] + "\"$3")], {type:"image/svg+xml;charset=utf-8"}));
    $("body").append("<div id='svg' style='position: absolute; top: 0;'>");
    $("div#svg").hide().append("<img id='svgImg'>").append("<canvas id='svgCanvas'></canvas>");
    $("img#svgImg").on("load", function() {
      var canvas = $("#svgCanvas")[0],
        image = $("img#svgImg")[0];
      canvas.height = image.height;
      canvas.width  = image.width;
      canvas.getContext("2d").drawImage(image, 0, 0);
      fs.writeFileSync(mediaFileConverted, new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
      fs.rmSync(mediaFile);
      $("div#svg").remove();
      return resolve();
    });
    $("img#svgImg").hide().prop("src", svgFile);
  });
}
async function convertUnusableFiles() {
  for (var mediaFile of glob.sync(path.join(paths.media, "*", "*{pdf,svg}"))) {
    try {
      var mediaFileExt = path.extname(mediaFile).toLowerCase();
      if (mediaFileExt == ".svg") {
        await convertSvg(mediaFile);
      } else if (mediaFileExt == ".pdf") {
        await convertPdf(mediaFile);
      }
    } catch(err) {
      console.error(err);
    }
  }
}
function createMediaNames() {
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      for (var j = 0; j < meeting[i].media.length; j++) { // media
        var fileExt = (meeting[i].media[j].filetype ? meeting[i].media[j].filetype : path.extname((meeting[i].media[j].url ? meeting[i].media[j].url : meeting[i].media[j].filepath)));
        meeting[i].media[j].safeName = sanitizeFilename((i + 1).toString().padStart(2, "0") + "-" + (j + 1).toString().padStart(2, "0") + " - " + meeting[i].media[j].title + "." + fileExt);
      }
    }
  }
}
function createVideoSync(mediaDir, media){
  return new Promise((resolve)=>{
    var mediaName = path.basename(media, path.extname(media));
    if (path.extname(media).includes("mp3")) {
      ffmpeg(path.join(paths.media, mediaDir, media))
        .on("end", function() {
          return resolve();
        })
        .on("error", function(err) {
          console.error(err.message);
          return resolve();
        })
        .noVideo()
        .save(path.join(paths.zoom, mediaDir, mediaName + ".mp4"));
    } else {
      var dimensionsString = "";
      try {
        var imageDimesions = sizeOf(path.join(paths.media, mediaDir, media));
        if (hdRes[1] / hdRes[0] > imageDimesions.height / imageDimesions.width) { // image wider than target ratio
          if (imageDimesions.width > hdRes[0]) { // image wider than target res width
            dimensionsString = hdRes[0] + "x?";
          } else { // image not as wide as or equal to target res width
            dimensionsString = imageDimesions.width + "x?";
          }
        } else { // image taller than or equal to target ratio
          if (imageDimesions.height > hdRes[1]) { // image taller than target res height
            dimensionsString = "?x" + hdRes[1];
          } else { // image not as tall as or equal to target res height
            dimensionsString = "?x" + imageDimesions.height;
          }
        }
      } catch (err) {
        console.error("Unable to get dimensions for:", path.join(paths.media, mediaDir, media), "Setting manually...", err);
        dimensionsString = hdRes.join("x");
      }
      var outputFPS = 30, loop = 1;
      ffmpeg(path.join(paths.media, mediaDir, media))
        .inputFPS(1)
        .outputFPS(outputFPS)
        .on("end", function() {
          return resolve();
        })
        .on("error", function(err) {
          console.error(err.message);
          return resolve();
        })
        .videoCodec("libx264")
        .noAudio()
        .size(dimensionsString)
        .loop(loop)
        .outputOptions("-pix_fmt yuv420p")
        .save(path.join(paths.zoom, mediaDir, mediaName + ".mp4"));
    }
  });
}
function dateFormatter() {
  var locale = "en";
  try {
    locale = jsonLangs.filter(lang => lang.langcode == prefs.lang)[0].symbol;
    locale !== "en" && require("dayjs/locale/" + locale);
  } catch(err) {
    console.error("Date locale " + locale + " not found, falling back to \"en\"");
  }
  $(".today").removeClass("today");
  for (var d = 0; d < 7; d++) {
    $("#day" + d + " .dayLongDate .dayOfWeek").html(baseDate.clone().add(d, "days").locale(locale).format("ddd"));
    $("#day" + d + " .dayLongDate .dayOfWeekLong").html(baseDate.clone().add(d, "days").locale(locale).format("dddd"));
    $("#day" + d + " .dayLongDate .dateOfMonth .date").html(baseDate.clone().add(d, "days").locale(locale).format("DD"));
    $("#day" + d + " .dayLongDate .dateOfMonth .month").html(baseDate.clone().add(d, "days").locale(locale).format("MMM"));
    $("#mwDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    $("#weDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    if (baseDate.clone().add(d, "days").isBefore(now)) {
      $("#day" + d).addClass("alert-secondary").removeClass("alert-primary").find("i").addClass("fa-history").removeClass("fa-spinner");
    } else {
      $("#day" + d).addClass("alert-primary").removeClass("alert-secondary").find("i").addClass("fa-spinner").removeClass("fa-history");
    }
    if (baseDate.clone().add(d, "days").isSame(now)) $("#day" + d).addClass("today");
  }
}
async function downloadIfRequired(file) {
  file.downloadRequired = true;
  file.localDir = file.pub ? path.join(paths.pubs, file.pub, file.issue) : path.join(paths.media, file.folder);
  file.localFile = path.join(file.localDir, file.pub ? path.basename(file.url) : file.safeName);
  if (fs.existsSync(file.localFile)) {
    file.localSize = fs.statSync(file.localFile).size;
    if (file.filesize == file.localSize) {
      file.downloadRequired = false;
    }
  }
  if (file.downloadRequired) {
    mkdirSync(file.localDir);
    file.contents = await get(file.url, true);
    fs.writeFileSync(file.localFile, new Buffer(file.contents));
  }
  if (path.extname(file.localFile) == ".jwpub") extractJwpub(file.localFile, file.localDir);
}
async function extractJwpub(jwpubFile, destinationFolder) {
  var jwpubContents = await new zipper(jwpubFile).readFile("contents");
  await new zipper(jwpubContents).extractAllTo(destinationFolder);
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
async function ffmpegConvert() {
  $("#statusIcon").addClass("fa-microchip").removeClass("fa-photo-video");
  $("#zoomRender").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
  await convertUnusableFiles();
  var osType = os.type();
  var targetOs;
  if (osType == "Windows_NT") {
    targetOs = "win-64";
  } else if (osType == "Darwin") {
    targetOs = "osx-64";
  } else {
    targetOs = "linux-64";
  }
  var ffmpegVersions = await get("https://api.github.com/repos/vot/ffbinaries-prebuilt/releases/latest");
  var ffmpegVersion = ffmpegVersions.assets.filter(a => a.name.includes(targetOs) && a.name.includes("ffmpeg"))[0];
  var ffmpegZipPath = path.join(paths.app, "ffmpeg", "zip", ffmpegVersion.name);
  if (!fs.existsSync(ffmpegZipPath) || fs.statSync(ffmpegZipPath).size !== ffmpegVersion.size) {
    cleanUp([path.join(paths.app, "ffmpeg", "zip")], "brutal");
    mkdirSync(path.join(paths.app, "ffmpeg", "zip"));
    var ffmpegZipFile = await get(ffmpegVersion.browser_download_url, true);
    fs.writeFileSync(ffmpegZipPath, new Buffer(ffmpegZipFile));
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
  var filesToProcess = glob.sync(path.join(paths.media, "*", "*"));
  totals.ffmpeg = {
    total: filesToProcess.length
  };
  for (var mediaDir of glob.sync(path.join(paths.media, "*"))) {
    mkdirSync(path.join(paths.zoom, path.basename(mediaDir)));
  }
  totals.ffmpeg.current = 1;
  for (var mediaFile of filesToProcess) {
    progressSet(totals.ffmpeg.current, totals.ffmpeg.total, "zoomRender");
    if (path.extname(mediaFile) !== ".mp4") {
      await createVideoSync(path.basename(path.dirname(mediaFile)), path.basename(mediaFile));
    } else {
      fs.copyFileSync(mediaFile, path.join(paths.zoom, path.basename(path.dirname(mediaFile)), path.basename(mediaFile)));
    }
    totals.ffmpeg.current++;
    progressSet(totals.ffmpeg.current, totals.ffmpeg.total, "zoomRender");
  }
  $("#zoomRender").removeClass("alert-warning").addClass("alert-success").find("i").addClass("fa-check-circle").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-microchip");
}
async function get(url, isFile) {
  let response = null,
    payload = null;
  try {
    var options = {};
    if (isFile) {
      options.responseType = "arraybuffer";
      options.onDownloadProgress = function(progressEvent) {
        progressSet(progressEvent.loaded, progressEvent.total);
      };
    }
    if (url.includes("jw.org")) {
      options.adapter = require("axios/lib/adapters/http");
    }
    payload = await axios.get(url, options);
    response = payload.data;
  } catch (err) {
    console.error(url, err, payload);
  }
  return response;
}
async function getCongMedia() {
  try {
    var congSpecificFolders = await webdavLs(path.posix.join(prefs.congServerDir, "Media"));
    totals.cong = {
      total: 0,
      current: 1
    };
    for (var congSpecificFolder of congSpecificFolders) {
      let remoteDir = await webdavLs(path.posix.join(prefs.congServerDir, "Media", congSpecificFolder.basename));
      for (let remoteFile of remoteDir) {
        var congSpecificFile = {
          "title": "Congregation-specific",
          media: [{
            safeName: remoteFile.basename,
            congSpecific: true,
            filesize: remoteFile.size,
            folder: congSpecificFolder.basename,
            url: remoteFile.filename
          }]
        };
        if (dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isValid() && dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(congSpecificFolder.basename, "YYYY-MM-DD"))) {
          if (!meetingMedia[congSpecificFolder.basename]) {
            meetingMedia[congSpecificFolder.basename] = [];
          }
          meetingMedia[congSpecificFolder.basename].push(congSpecificFile);
        } else if (!dayjs(congSpecificFolder.basename, "YYYY-MM-DD").isValid()) {
          for (var meeting of Object.keys(meetingMedia)) {
            const v8 = require("v8");
            var repeatFile = v8.deserialize(v8.serialize(congSpecificFile));
            repeatFile.media[0].recurring = true;
            repeatFile.media[0].folder = meeting;
            meetingMedia[meeting].push(repeatFile);
          }
        }
      }
    }
    for (var hiddenFilesFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Hidden"))).filter(hiddenFilesFolder => dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isValid() && dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(hiddenFilesFolder.basename, "YYYY-MM-DD"))).sort((a, b) => (a.basename > b.basename) ? 1 : -1)) {
      for (var hiddenFile of await webdavLs(path.posix.join(prefs.congServerDir, "Hidden", hiddenFilesFolder.basename))) {
        meetingMedia[hiddenFilesFolder.basename].filter(part => part.media.filter(mediaItem => mediaItem.safeName == hiddenFile.basename).map(function (mediaItem) {
          mediaItem.hidden = true;
          console.log("%cFile will be skipped [" + hiddenFilesFolder.basename + "]: " + hiddenFile.basename, "background-color: #fff3cd; color: #856404;");
        }));
      }
    }
  } catch (err) {
    console.error(err);
    $("#specificCong").addClass("alert-danger").find("i").addClass("fa-times-circle");
  }
}
async function getDbFromJwpub(pub, issue, localpath) {
  try {
    var SQL = await sqljs();
    if (localpath) {
      var jwpubContents = await new zipper(localpath).readFile("contents");
      var jwpubDbEntry = (await new zipper(jwpubContents).getEntries()).filter(entry => path.extname(entry.name) == ".db")[0];
      var tempDb = new SQL.Database(await new zipper(jwpubContents).readFile(jwpubDbEntry.entryName));
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
    console.error(err);
  }
}
async function getDocumentExtract(opts) {
  var statement = "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber,Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + opts.docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal";
  var extractItems = await executeStatement(opts.db, statement);
  var extractMultimediaItems = [];
  for (var extractItem of extractItems) {
    var db = await getDbFromJwpub(extractItem.UndatedSymbol, extractItem.IssueTagNumber);
    if (db) {
      var extractMediaFiles = await getDocumentMultimedia({
        db: db,
        destMepsId: extractItem.RefMepsDocumentId
      });
      extractMultimediaItems = extractMultimediaItems.concat(extractMediaFiles.filter(extractMediaFile => extractItem.RefBeginParagraphOrdinal <= extractMediaFile.BeginParagraphOrdinal && extractMediaFile.BeginParagraphOrdinal <= extractItem.RefEndParagraphOrdinal).map(extractMediaFile => {
        extractMediaFile.BeginParagraphOrdinal = extractItem.BeginParagraphOrdinal;
        return extractMediaFile;
      }));
    }
  }
  return extractMultimediaItems;
}
async function getDocumentMultimedia(opts) {
  var tableMultimedia = ((await executeStatement(opts.db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length == 0 ? "Multimedia" : "DocumentMultimedia");
  var suppressZoomExists = (await executeStatement(opts.db, "SELECT COUNT(*) AS CNTREC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'")).map(function(item) {
    return (item.CNTREC > 0 ? true : false);
  })[0];
  var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId," + (suppressZoomExists ? " Multimedia.SuppressZoom," : "") + " Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')) OR (Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10" + (suppressZoomExists ? " AND Multimedia.SuppressZoom <> 1" : "") + "))" + (tableMultimedia == "DocumentMultimedia" ? " ORDER BY BeginParagraphOrdinal" : "");
  var multimedia = await executeStatement(opts.db, statement);
  var multimediaItems = [];
  for (var multimediaItem of multimedia) {
    try {
      if ((multimediaItem.MimeType.includes("audio") || multimediaItem.MimeType.includes("video"))) {
        var json = (await getMediaLinks(multimediaItem.KeySymbol, multimediaItem.Track, multimediaItem.IssueTagNumber, null, multimediaItem.MultiMeps))[0];
        if (json) {
          json.BeginParagraphOrdinal = multimediaItem.BeginParagraphOrdinal;
          multimediaItems.push(json);
        }
      } else {
        if (multimediaItem.KeySymbol == null) {
          multimediaItem.KeySymbol = (await executeStatement(opts.db, "SELECT UniqueEnglishSymbol FROM Publication"))[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
          multimediaItem.IssueTagNumber = (await executeStatement(opts.db, "SELECT IssueTagNumber FROM Publication"))[0].IssueTagNumber;
          multimediaItem.LocalPath = path.join(paths.pubs, multimediaItem.KeySymbol, multimediaItem.IssueTagNumber, multimediaItem.FilePath);
        }
        multimediaItem.FileName = (multimediaItem.Caption.length > multimediaItem.Label.length ? multimediaItem.Caption : multimediaItem.Label);
        var picture = {
          BeginParagraphOrdinal: multimediaItem.BeginParagraphOrdinal,
          title: multimediaItem.FileName,
          filepath: multimediaItem.LocalPath,
          filesize: fs.statSync(multimediaItem.LocalPath).size
        };
        multimediaItems.push(picture);
      }
    } catch (err) {
      console.error(err);
    }
  }
  return multimediaItems;
}
async function getInitialData() {
  await getLanguages();
  await getTranslations();
  configIsValid();
  $("#version").html("v" + remoteApp.getVersion());
  await webdavSetup();
  $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
  if (os.platform() == "linux") {
    $(".notLinux").prop("disabled", true);
  }
  if (prefs.autoStartSync && configIsValid()) {
    var cancelSync = false;
    $("#btnCancelSync").on("click", function() {
      cancelSync = true;
      $("#btnCancelSync").addClass("text-danger fa-stop-circle").removeClass("text-warning fa-pause-circle");
    });
    $("#overlayStarting").fadeIn(animationDuration, () => {
      $("#overlayPleaseWait").fadeOut(animationDuration);
    }).delay(3000).fadeOut(animationDuration, () => {
      if (!cancelSync) {
        $("#mediaSync").click();
      }
    });
  } else {
    $("#overlayPleaseWait").stop().fadeOut(animationDuration);
  }
  $("#baseDate button, #baseDate .dropdown-item:eq(0)").html(baseDate.format("YYYY-MM-DD") + " - " + baseDate.clone().add(6, "days").format("YYYY-MM-DD")).val(baseDate.format("YYYY-MM-DD"));
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  for (var a = 1; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class=\"dropdown-item\" value=\"" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "\">" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
  }
}
async function getLanguages() {
  if ((!fs.existsSync(paths.langs)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(dayjs().subtract(3, "months")) || dayjs(prefs.langUpdatedLast).isBefore(dayjs("2021-02-04"))) {
    var jwLangs = await get("https://www.jw.org/en/languages/");
    let cleanedJwLangs = jwLangs.languages.filter(lang => lang.hasWebContent).map(lang => ({
      name: lang.vernacularName + " (" + lang.name + ")",
      langcode: lang.langcode,
      symbol: lang.symbol
    }));
    fs.writeFileSync(paths.langs, JSON.stringify(cleanedJwLangs, null, 2));
    prefs.langUpdatedLast = dayjs();
    fs.writeFileSync(paths.prefs, JSON.stringify(prefs, null, 2));
    jsonLangs = cleanedJwLangs;
  } else {
    jsonLangs = JSON.parse(fs.readFileSync(paths.langs));
  }
  dateFormatter();
  for (var lang of jsonLangs) {
    $("#lang").append($("<option>", {
      value: lang.langcode,
      text: lang.name
    }));
  }
  $("#lang").val(prefs.lang);
  $("#lang").select2();
}
async function getMediaLinks(pub, track, issue, format, docId) {
  var mediaFiles = [];
  try {
    var url = "https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json";
    if (docId) {
      url += "&docid=" + docId;
    } else {
      url += "&pub=" + pub + (track ? "&track=" + track : "") + (issue ? "&issue=" + issue : "");
    }
    url += (format ? "&fileformat=" + format : "") + "&langwritten=" + prefs.lang;
    var result = await get(url);
    if (result) {
      var mediaFileCategories = Object.values(result.files)[0];
      var filetype = result.fileformat[0];
      if ("MP4" in mediaFileCategories) {
        filetype = "MP4";
      }
      for (var mediaFileItem of mediaFileCategories[filetype].reverse()) {
        var videoRes = mediaFileItem.label.replace(/\D/g, "");
        if ((videoRes !== 0 && videoRes > prefs.maxRes.replace(/\D/g, "")) || mediaFiles.filter(mediaFile => mediaFile.title == mediaFileItem.title).length > 0) {
          continue;
        } else {
          mediaFiles.push({
            title: mediaFileItem.title,
            filesize: mediaFileItem.filesize,
            url: mediaFileItem.file.url,
            duration: mediaFileItem.duration
          });
          //break;
        }
      }
    }
  } catch(err) {
    console.error(err);
  }
  return mediaFiles;
}
async function getMwMediaFromDb() {
  var mwDate = baseDate.clone().add(prefs.mwDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(mwDate))) {
    if (!dryrun) $("#day" + prefs.mwDay).addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
    try {
      var issue = baseDate.format("YYYYMM") + "00";
      if (parseInt(baseDate.format("M")) % 2 == 0) {
        issue = baseDate.clone().subtract(1, "months").format("YYYYMM") + "00";
      }
      var db = await getDbFromJwpub("mwb", issue);
      try {
        var docId = (await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + baseDate.format("YYYYMMDD") + ""))[0].DocumentId;
      } catch {
        throw("No MW meeting date!");
      }
      var videos = await getDocumentMultimedia({
        db: db,
        destDocId: docId
      });
      videos.map(video => {
        addMediaItemToPart(mwDate, video.BeginParagraphOrdinal, video);
      });
      var extracted = await getDocumentExtract({
        db: db,
        docId: docId
      });
      extracted.map(extract => {
        addMediaItemToPart(mwDate, extract.BeginParagraphOrdinal, extract);
      });
      var internalRefs = await executeStatement(db, "SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = " + docId + " AND Document.Class <> 94");
      for (var internalRef of internalRefs) {
        var internalRefMediaFiles = await getDocumentMultimedia({
          db: db,
          destDocId: internalRef.DocumentId
        });
        internalRefMediaFiles.map(internalRefMediaFile => {
          addMediaItemToPart(mwDate, internalRef.BeginParagraphOrdinal, internalRefMediaFile);
        });
      }
      if (!dryrun) $("#day" + prefs.mwDay).addClass("alert-success").find("i").addClass("fa-check-circle");
    } catch(err) {
      console.error(err);
      $("#day" + prefs.mwDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
    }
    if (!dryrun) $("#day" + prefs.mwDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
  }
}
function getPrefix() {
  prefix = $("#enterPrefix input").map(function() {
    return $(this).val();
  }).toArray().join("").trim();
  for (var a0 = 0; a0 <= 4; a0++) {
    if ($("#enterPrefix-" + a0).val().length > 0) {
      for (var a1 = a0 + 1; a1 <= 5; a1++) {
        $("#enterPrefix-" + a1).prop("disabled", false);
      }
    } else {
      for (var a2 = a0 + 1; a2 <= 5; a2++) {
        $("#enterPrefix-" + a2).prop("disabled", true);
        $("#enterPrefix-" + a2).val("");
      }
    }
  }
  $(".enterPrefixInput:not(:disabled)").fadeTo(animationDuration, 1);
  $(".enterPrefixInput:disabled").fadeTo(animationDuration, 0);
  $("#enterPrefix-" + prefix.length).focus();
  if (prefix.length % 2) {
    prefix = prefix + 0;
  }
  if (prefix.length > 0) {
    prefix = prefix.match(/.{1,2}/g).join("-");
  }
}
async function getTranslations() {
  var localeLang = (jsonLangs.filter(el => el.langcode == prefs.lang))[0];
  i18n.configure({
    directory: path.join(__dirname, "locales"),
    defaultLocale: "en",
    updateFiles: false,
    retryInDefaultLocale: true
  });
  if (localeLang) {
    i18n.setLocale(localeLang.symbol);
  }
  $(".i18n").each(function() {
    $(this).html(i18n.__($(this).data("i18n-string")));
  });
}
async function getWeMediaFromDb() {
  var weDate = baseDate.clone().add(prefs.weDay, "days").format("YYYY-MM-DD");
  if (now.isSameOrBefore(dayjs(weDate))) {
    if (!dryrun) $("#day" + prefs.weDay).addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
    try {
      var issue = baseDate.clone().subtract(8, "weeks").format("YYYYMM") + "00";
      var db = await getDbFromJwpub("w", issue);
      var weekNumber = (await executeStatement(db, "SELECT FirstDateOffset FROM DatedText")).findIndex(weekItem => dayjs(weekItem.FirstDateOffset.toString(), "YYYYMMDD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]"));
      try {
        var docId = (await executeStatement(db, "SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET " + weekNumber))[0].DocumentId;
      } catch {
        throw("No WE meeting date!");
      }
      var qryLocalMedia = await executeStatement(db, "SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + docId + " AND Multimedia.CategoryType <> 9");
      for (var picture of qryLocalMedia) {
        var LocalPath = path.join(paths.pubs, "w", issue, picture.FilePath);
        var FileName = (picture.Caption.length > picture.Label.length ? picture.Caption : picture.Label);
        var pictureObj = {
          title: FileName,
          filepath: LocalPath,
          filesize: fs.statSync(LocalPath).size
        };
        addMediaItemToPart(weDate, picture.BeginParagraphOrdinal, pictureObj);
      }
      var qrySongs = await executeStatement(db, "SELECT * FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DataType = 2 ORDER BY BeginParagraphOrdinal LIMIT 2 OFFSET " + weekNumber * 2);
      for (var song = 0; song < qrySongs.length; song++) {
        var songObj = (await getMediaLinks(qrySongs[song].KeySymbol, qrySongs[song].Track))[0];
        addMediaItemToPart(weDate, song * 1000, songObj);
      }
      if (!dryrun) $("#day" + prefs.weDay).addClass("alert-success").find("i").addClass("fa-check-circle");
    } catch(err) {
      console.error(err);
      $("#day" + prefs.weDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
    }
    if (!dryrun) $("#day" + prefs.weDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
  }
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
function pdfRender(mediaFile, pdf, pageNum) {
  return new Promise((resolve)=>{
    pdf.getPage(pageNum).then(function(page) {
      var mediaFileConverted = path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + "-" + String(pageNum).padStart(2, "0") + ".png");
      $("body").append("<div id='pdf' style='position: absolute; top: 0;'>");
      $("div#pdf").hide().append("<canvas id='pdfCanvas'></canvas>");
      var scale = hdRes[1] / page.getViewport({scale: 1}).height * 4;
      var viewport = page.getViewport({scale: scale});
      var canvas = $("#pdfCanvas")[0];
      canvas.height = hdRes[1] * 4;
      canvas.width = page.getViewport({scale: scale}).width;
      var context = canvas.getContext("2d");
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      var renderTask = page.render(renderContext);
      renderTask.promise.then(function() {
        fs.writeFileSync(mediaFileConverted, new Buffer(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
        $("div#pdf").remove();
        resolve();
      });
    });
  });
}
function prefsInitialize() {
  for (var pref of ["lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath", "betaMp4Gen", "congServer", "congServerPort", "congServerUser", "congServerPass", "openFolderWhenDone", "additionalMediaPrompt", "maxRes", "enableMusicButton"]) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) {
      prefs[pref] = null;
    }
  }
  for (var field of ["lang", "outputPath", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir"]) {
    $("#" + field).val(prefs[field]).change();
  }
  for (var checkbox of ["autoStartSync", "autoRunAtBoot", "betaMp4Gen", "autoQuitWhenDone", "openFolderWhenDone", "additionalMediaPrompt", "enableMusicButton"]) {
    $("#" + checkbox).prop("checked", prefs[checkbox]).change();
  }
  for (var radioSel of ["mwDay", "weDay", "maxRes"]) {
    $("#" + radioSel + " input[value=" + prefs[radioSel] + "]").prop("checked", true).parent().addClass("active");
  }
}
function progressSet(current, total, blockId) {
  if (!dryrun || !blockId) {
    var percent = current / total * 100;
    if (percent > 100 || (!blockId && percent == 100)) {
      percent = 0;
    }
    if (!blockId) {
      blockId = "#globalProgress";
    } else {
      blockId = "#" + blockId + " .progress-bar";
    }
    $(blockId).width(percent + "%");
  }
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
function setVars() {
  try {
    meetingMedia = {};
    paths.output = path.join(prefs.outputPath);
    mkdirSync(paths.output);
    paths.lang = path.join(paths.output, prefs.lang);
    mkdirSync(paths.lang);
    paths.media = path.join(paths.lang, "Media");
    mkdirSync(paths.media);
    paths.zoom = path.join(paths.lang, "Zoom");
    if (prefs.betaMp4Gen) mkdirSync(paths.zoom);
    paths.pubs = path.join(paths.app, "Publications", prefs.lang);
  } catch (err) {
    console.error(err);
  }
}
async function startMediaSync() {
  console.time("main");
  $("#statusIcon").addClass("text-primary").removeClass("text-muted");
  stayAlive = false;
  $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(animationDuration, 0);
  console.time("setVars");
  await setVars();
  console.timeEnd("setVars");
  console.time("cleanUp");
  await cleanUp([paths.media]);
  await cleanUp([paths.zoom], "brutal");
  console.timeEnd("cleanUp");
  console.time("getJwOrgMedia");
  await getMwMediaFromDb();
  await getWeMediaFromDb();
  //await getMwMediaFromWol();
  //await getWeMediaFromWol();
  console.timeEnd("getJwOrgMedia");
  console.time("createMediaNames");
  createMediaNames();
  console.timeEnd("createMediaNames");
  if (webdavIsAGo) {
    console.time("getCongMedia");
    await getCongMedia();
    console.timeEnd("getCongMedia");
  }
  console.log(meetingMedia);
  if (!dryrun) {
    console.time("syncJwOrgMedia");
    await syncJwOrgMedia();
    console.timeEnd("syncJwOrgMedia");
    if (webdavIsAGo) {
      console.time("syncCongMedia");
      await syncCongMedia();
      console.timeEnd("syncCongMedia");
    }
    console.time("additionalMedia");
    await additionalMedia();
    console.timeEnd("additionalMedia");
    if (prefs.betaMp4Gen) {
      console.time("ffmpegConvert");
      await ffmpegConvert();
      console.timeEnd("ffmpegConvert");
    }
    if (prefs.openFolderWhenDone) {
      var openPath = paths.media;
      if (prefs.betaMp4Gen) openPath = paths.zoom;
      shell.openPath(openPath);
    }
  }
  $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(animationDuration, 1);
  setTimeout(() => {
    $(".alertIndicators").addClass("alert-primary").removeClass("alert-success");
    $("#statusIcon").addClass("text-muted").removeClass("text-primary");
  }, 2000);
  console.timeEnd("main");
}
async function syncCongMedia() {
  $("#statusIcon").addClass("fa-cloud").removeClass("fa-photo-video");
  $("#specificCong").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
  try {
    totals.cong = {
      total: 0,
      current: 1
    };
    for (let meeting of Object.values(meetingMedia)) {
      for (let part of meeting) {
        totals.cong.total = totals.cong.total + part.media.filter(mediaItem => mediaItem.congSpecific).length;
      }
    }
    for (let meeting of Object.keys(meetingMedia)) {
      for (let part of meetingMedia[meeting]) {
        for (var mediaItem of part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden)) {
          await webdavGet(mediaItem);
        }
      }
    }
  } catch (err) {
    console.error(err);
    $("#specificCong").addClass("alert-danger").find("i").addClass("fa-times-circle");
  }
  $("#specificCong").removeClass("alert-warning");
  $("#specificCong").addClass("alert-success").find("i").addClass("fa-check-circle");
  $("#specificCong").find("i").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-cloud");
}
async function syncJwOrgMedia() {
  $("#syncJwOrgMedia").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
  totals.jw = {
    total: 0,
    current: 1
  };
  for (let meeting of Object.values(meetingMedia)) {
    for (let part of meeting) {
      totals.jw.total = totals.jw.total + part.media.filter(mediaItem => !mediaItem.congSpecific).length;
    }
  }
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      var partMedia = meeting[i].media.filter(mediaItem => !mediaItem.congSpecific);
      for (var j = 0; j < partMedia.length; j++) { // media
        progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
        if (!partMedia[j].hidden && !partMedia[j].congSpecific && !dryrun) {
          if (partMedia[j].url) {
            await downloadIfRequired(partMedia[j]);
          } else {
            var destFile = path.join(paths.media, partMedia[j].folder, partMedia[j].safeName);
            if (!fs.existsSync(destFile) || fs.statSync(destFile).size !== partMedia[j].filesize) {
              fs.copyFileSync(partMedia[j].filepath, destFile);
            }
          }
        }
        totals.jw.current++;
        progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
      }
    }
  }
  $("#syncJwOrgMedia").removeClass("alert-warning").addClass("alert-success").find("i").addClass("fa-check-circle").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-microchip");
}
function toggleScreen(screen, forceShow) {
  var visible = $("#" + screen).is(":visible");
  if (!visible || forceShow) {
    $("#" + screen).slideDown(animationDuration);
  } else {
    $("#" + screen).slideUp(animationDuration);
  }
}
function updateCleanup() {
  try { // do some housecleaning after version updates
    var lastRunVersion = (fs.existsSync(paths.lastRunVersion) ? fs.readFileSync(paths.lastRunVersion, "utf8") : 0);
    setVars();
  } catch(err) {
    console.error(err);
  } finally {
    if (lastRunVersion !== remoteApp.getVersion()) {
      cleanUp([paths.lang, paths.pubs], "brutal");
      fs.writeFileSync(paths.lastRunVersion, remoteApp.getVersion());
    }
  }
}
// async function webdavCp(src, dest) {
//   try {
//     if (webdavIsAGo && src && dest) {
//       if (await webdavClient.exists(src)) {
//         await webdavClient.copyFile(src, dest);
//       }
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }
async function webdavGet(file) {
  var downloadRequired = true;
  let localFile = path.join(paths.media, file.folder, file.safeName);
  if (fs.existsSync(localFile)) {
    downloadRequired = !(file.filesize == fs.statSync(localFile).size);
  }
  if (downloadRequired) {
    if (!fs.existsSync(path.join(paths.media, file.folder))) fs.mkdirSync(path.join(paths.media, file.folder));
    file.contents = await webdavClient.getFileContents(file.url);
    fs.writeFileSync(localFile, new Buffer(file.contents));
  }
}
async function webdavLs(dir, force) {
  try {
    if (webdavIsAGo || force) {
      if (await webdavClient.exists(dir) === false) {
        await webdavClient.createDirectory(dir, {
          recursive: true
        });
      }
      return await webdavClient.getDirectoryContents(dir);
    }
  } catch (err) {
    console.error(err);
    throw(err);
  }
}
async function webdavPut(file, destFolder, destName) {
  try {
    if (webdavIsAGo && file && destFolder && destName) {
      destName = await sanitizeFilename(destName);
      if (await webdavClient.exists(destFolder) === false) {
        await webdavClient.createDirectory(destFolder, {
          recursive: true
        });
      }
      await webdavClient.putFileContents(path.posix.join(destFolder, destName), file, {
        contentLength: false,
        onUploadProgress: progressEvent => {
          progressSet(progressEvent.loaded, progressEvent.total);
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
}
async function webdavRm(path) {
  try {
    if (webdavIsAGo && path) {
      if (await webdavClient.exists(path)) {
        await webdavClient.deleteFile(path);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
async function webdavSetup() {
  $(".webdavHost, .webdavCreds, #congServerDir").removeClass("is-valid is-invalid");
  if (prefs.congServer && prefs.congServer.length > 0) {
    $(".webdavHost").addClass("is-invalid");
    var congServerHeartbeat = await isPortReachable(prefs.congServerPort, {
      host: prefs.congServer
    });
    if (prefs.congServerPort && congServerHeartbeat) {
      $("#webdavStatus").removeClass("text-warning text-danger text-muted").addClass("text-success");
      $(".webdavHost").addClass("is-valid").removeClass("is-invalid");
    } else {
      $("#webdavStatus").removeClass("text-success text-warning text-muted").addClass("text-danger");
    }
    if (prefs.congServerPort && prefs.congServerUser && prefs.congServerPass && congServerHeartbeat) {
      $("#webdavStatus").removeClass("text-success text-danger text-muted").addClass("text-warning");
      var webdavLoginSuccessful = false;
      try {
        webdavClient = createClient(
          "https://" + prefs.congServer + ":" + prefs.congServerPort,
          {
            username: prefs.congServerUser,
            password: prefs.congServerPass
          }
        );
        await webdavClient.getDirectoryContents("/");
        webdavLoginSuccessful = true;
        $("#webdavStatus").removeClass("text-warning text-danger text-muted").addClass("text-success");
        $(".webdavCreds").addClass("is-valid");
      } catch(err) {
        console.error(err);
        $("#webdavStatus").removeClass("text-success text-warning text-muted").addClass("text-danger");
        $(".webdavCreds").addClass("is-invalid");
      }
    } else {
      $(".webdavCreds").addClass("is-invalid");
    }
    $("#specificCong").addClass("d-flex");
    $("#btn-upload").fadeIn(animationDuration);
    var webdavDirIsValid = false;
    if (prefs.congServerDir == null || prefs.congServerDir.length == 0) {
      $("#congServerDir").val("/").change();
    }
    if (webdavLoginSuccessful) {
      $("#webdavFolderList").fadeTo(animationDuration, 0);
      try {
        var webdavDestDir = await webdavClient.exists(prefs.congServerDir);
        var showMeTheDirectory = prefs.congServerDir;
        if (webdavDestDir) {
          webdavDirIsValid = true;
        } else {
          showMeTheDirectory = "/";
        }
        $("#webdavFolderList").empty();
        webdavDestDir = await webdavLs(showMeTheDirectory, true);
        webdavDestDir = webdavDestDir.sort((a, b) => a.basename.localeCompare(b.basename));
        for (var item of webdavDestDir) {
          if (item.type == "directory") {
            $("#webdavFolderList").append("<li><i class=\"fas fa-fw fa-folder-open\"></i>" + item.basename + "</li>");
          }
        }
        if (prefs.congServerDir !== "/") {
          $("#webdavFolderList").prepend("<li><i class=\"fas fa-fw fa-chevron-circle-up\"></i> ../ </li>");
        }
        $("#webdavFolderList").css("column-count", Math.ceil($("#webdavFolderList li").length / 8));
      } catch(err) {
        console.error(err);
      }
      $("#webdavFolderList").fadeTo(animationDuration, 1);
      if (webdavDirIsValid) {
        $("#congServerDir").addClass("is-valid").removeClass("is-invalid");
        $("#webdavFolderList li").click(function() {
          $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).change();
        });
      } else {
        $("#congServerDir").addClass("is-invalid").removeClass("is-valid");
        $("#webdavFolderList li").click(function() {
          $("#congServerDir").val(path.posix.join("/", $(this).text().trim())).change();
        });
      }
    } else {
      $("#webdavFolderList").empty();
    }
    if ((webdavLoginSuccessful && webdavDirIsValid) || !prefs.congServer || prefs.congServer.length == 0) {
      $("#btn-settings, #overlaySettings .btn-webdav.btn-danger").removeClass("in-danger");
      $(".btn-webdav, #btn-upload").addClass("btn-primary").removeClass("btn-danger");
      $("#specificCong").removeClass("alert-danger").find("i").removeClass("fa-times-circle").addClass("fa-spinner");
    }
    if (webdavLoginSuccessful && webdavDirIsValid) {
      webdavIsAGo = true;
      $("#btn-upload").fadeTo(animationDuration, 1).prop("disabled", false);
      $("#additionalMediaPrompt").prop("checked", false).prop("disabled", true).change();
    } else {
      $("#btn-upload, .btn-webdav").addClass("btn-danger").removeClass("btn-primary");
      $("#btn-upload").prop("disabled", true);
      $("#specificCong").addClass("alert-danger").find("i").addClass("fa-times-circle").removeClass("fa-spinner fa-check-circle");
      $("#btn-settings, #overlaySettings .btn-webdav.btn-danger").addClass("in-danger");
      webdavIsAGo = false;
      $("#additionalMediaPrompt").prop("disabled", false);
    }
  } else {
    $("#webdavFolderList").fadeTo(animationDuration, 0).empty();
    $(".btn-webdav.btn-warning").addClass("btn-primary").removeClass("btn-danger");
    $("#specificCong").removeClass("d-flex");
    $("#btn-upload").fadeOut(animationDuration);
    $("#additionalMediaPrompt").prop("disabled", false);
  }
}
var dragenterHandler = () => {
  if ($("input#typeFile:checked").length > 0 || $("input#typeJwpub:checked").length > 0) {
    $(".dropzone").css("display", "block");
  }
};
var dragleaveHandler = (event) => {
  if (event.target.id == "dropzone") {
    $(".dropzone").css("display", "none");
  }
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
    $("#fileToUpload").val(filesDropped.join(" -//- ")).change();
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val(filesDropped.filter(filepath => path.extname(filepath) == ".jwpub")[0]).change();
  }
  $(".dropzone").css("display", "none");
};
$(document).on("select2:open", () => {
  document.querySelector(".select2-search__field").focus();
});
$("#baseDate").on("click", ".dropdown-item", function() {
  setVars();
  baseDate = dayjs($(this).val()).startOf("isoWeek");
  cleanUp([paths.media], "brutal");
  $("#baseDate .dropdown-item.active").removeClass("active");
  $(this).addClass("active");
  $("#baseDate > button").html($(this).html());
  $(".alertIndicators").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
  dateFormatter();
});
$("#btnCancelUpload").on("click", () => {
  $("#overlayUploadFile").slideUp(animationDuration);
  $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
  $("#fileList, #fileToUpload, #jwpubPicker, #enterPrefix input").val("").empty().change();
  $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
  dryrun = false;
  document.removeEventListener("drop", dropHandler);
  document.removeEventListener("dragover", dragoverHandler);
  document.removeEventListener("dragenter", dragenterHandler);
  document.removeEventListener("dragleave", dragleaveHandler);
});
$("#btnMeetingMusic").on("click", async function() {
  $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").parent().prop("title", "...");
  $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
  var songs = await getMediaLinks("sjjm", null, null, "MP3");
  songs.sort(() => .5 - Math.random());
  var iterator = 0;
  function createAudioElem(iterator) {
    var audioElem = $("<audio id=\"meetingMusic\" autoplay>").data("track", songs[iterator].track).on("ended", function() {
      $("#meetingMusic").remove();
      if (iterator < songs.length - 1) {
        iterator++;
      } else {
        iterator = 0;
      }
      createAudioElem(iterator);
    }).on("loadstart", function() {
      $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").parent().prop("title", "...");
      $("#musicRemaining").html(new Date(0).toISOString().substr(14, 5));
    }).on("canplay", function() {
      $("#btnStopMeetingMusic i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin").parent().prop("title", songs[iterator].title);
      $("#musicRemaining").html(new Date(songs[iterator].duration * 1000).toISOString().substr(14, 5));
    }).on("timeupdate", function() {
      $("#musicRemaining").html(new Date(($("#meetingMusic")[0].duration - $("#meetingMusic")[0].currentTime) * 1000).toISOString().substr(14, 5));
    }).append("<source src=\""+ songs[iterator].url + "\" type=\"audio/mpeg\">");
    $("body").append(audioElem);
  }
  createAudioElem(iterator);
});
$(".btn-settings, #btn-settings").on("click", function() {
  toggleScreen("overlaySettings");
});
$("#btnStopMeetingMusic").on("click", function() {
  $("#meetingMusic").remove();
  $("#btnStopMeetingMusic").hide();
  $("#musicRemaining").empty();
  if (prefs.enableMusicButton) {
    $("#btnMeetingMusic").show();
  }
});
$(".btn-webdav").on("click", function() {
  webdavSetup();
  toggleScreen("overlayWebdav");
});
$("#btnUpload").on("click", async () => {
  try {
    $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-upload-alt");
    $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", true);
    if ($("input#typeSong:checked").length > 0) {
      var songFile = new Buffer(await get($("#fileToUpload").val(), true));
      if (currentStep == "additionalMedia") {
        fs.writeFileSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), sanitizeFilename(prefix + " " + path.basename($("#fileToUpload").val()))), songFile);
      } else {
        await webdavPut(songFile, path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), sanitizeFilename(prefix + " " + path.basename($("#fileToUpload").val())));
      }
    } else if ($("input#typeJwpub:checked").length > 0) {
      for (var tempMedia of tempMediaArray) {
        if (currentStep == "additionalMedia") {
          console.log(tempMedia);
          if (tempMedia.contents) {
            fs.writeFileSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), sanitizeFilename(prefix + " " + tempMedia.filename)), tempMedia.contents);
          } else {
            fs.copyFileSync(tempMedia.localpath, path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), sanitizeFilename(prefix + " " + tempMedia.filename)));
          }
        } else {
          await webdavPut((tempMedia.contents ? tempMedia.contents : fs.readFileSync(tempMedia.localpath)), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), sanitizeFilename(prefix + " " + tempMedia.filename));
        }
      }
      tempMediaArray = [];
    } else {
      var localFile = $("#fileToUpload").val();
      for (var splitLocalFile of localFile.split(" -//- ")) {
        var splitFileToUploadName = sanitizeFilename(prefix + " " + path.basename(splitLocalFile));
        if (currentStep == "additionalMedia") {
          fs.copyFileSync(splitLocalFile, path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), splitFileToUploadName));
        } else {
          await webdavPut(fs.readFileSync(splitLocalFile), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), splitFileToUploadName);
        }
      }
    }
    $("#overlayDryrun").fadeIn(animationDuration, async () => {
      dryrun = true;
      await startMediaSync();
      $("#chooseMeeting input:checked").change();
      $("#btnUpload").find("i").addClass("fa-cloud-upload-alt").removeClass("fa-circle-notch fa-spin");
      $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", false);
      $("#overlayDryrun").stop().fadeOut(animationDuration);
    });
  } catch (err) {
    console.error(err);
  }
});
$("#btn-upload").on("click", function() {
  $("#overlayDryrun").slideDown(animationDuration, async () => {
    dryrun = true;
    await startMediaSync();
    $(".alertIndicators").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
    $("#chooseMeeting").empty();
    for (var meeting of [prefs.mwDay, prefs.weDay]) {
      let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
      $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-primary' for='" + meetingDate + "'" + (Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + meetingDate + "</label>");
    }
    currentStep = "uploadFile";
    $(".relatedToUpload, .relatedToUploadType, #btnDoneUpload").fadeTo(animationDuration, 0);
    $("#btnCancelUpload").fadeTo(animationDuration, 1);
    $("#overlayUploadFile").fadeIn(animationDuration, () => {
      $("#overlayDryrun").fadeOut(animationDuration);
    });
  });
});
$("#chooseUploadType input").on("change", async function() {
  $(".localOrRemoteFile, .localOrRemoteFileCont, .file-to-upload .select2, #fileToUpload").remove();
  var newElem = "";
  if ($("input#typeSong:checked").length > 0) {
    $(".songsSpinner").show();
    newElem = $("<select class=\"form-control form-control-sm localOrRemoteFile\" id=\"songPicker\" style=\"display: none\">");
    var sjjm = await getMediaLinks("sjjm", null, null, "MP4");
    try {
      for (let sjj of sjjm.reverse()) {
        $(newElem).append($("<option>", {
          value: sjj.url,
          text: sjj.title
        }));
      }
      $(newElem).val([]).on("change", async function() {
        if ($(this).val()) {
          $("#fileToUpload").val($(this).val()).change();
        }
      });
    } catch (err) {
      console.error(err);
      $("label[for=typeSong]").removeClass("active").addClass("disabled");
      $("label[for=typeFile]").click().addClass("active");
    }
    $(".songsSpinner").hide();
  } else if ($("input#typeFile:checked").length > 0) {
    newElem = "<input type=\"text\" class=\"relatedToUpload form-control form-control-sm localOrRemoteFile\" id=\"fileToUpload\" required />";
  } else if ($("input#typeJwpub:checked").length > 0) {
    newElem = "<input type=\"text\" class=\"relatedToUpload form-control form-control-sm localOrRemoteFile\" id=\"jwpubPicker\" required />";
  }
  if ($("#fileToUpload").length == 0) {
    $(".file-to-upload").append(newElem);
    $("#songPicker, #jwpubPicker").change();
    $("select#songPicker, select#jwpubPicker").wrap("<div class='localOrRemoteFileCont'>").select2();
    $("select#songPicker, input#jwpubPicker").after("<input type=\"hidden\" id=\"fileToUpload\" />");
  }
});
$("#enterPrefix input, #congServerPort").on("keypress", function(e){
  return e.metaKey || // cmd/ctrl
      e.which <= 0 || // arrow keys
      e.which == 8 || // delete key
      /[0-9]/.test(String.fromCharCode(e.which)); // numbers
});
$("#overlayUploadFile").on("change", "#jwpubPicker", async function() {
  if ($(this).val().length >0) {
    var contents = await getDbFromJwpub(null, null, $(this).val());
    var itemsWithMultimedia = await executeStatement(contents, "SELECT DISTINCT	Document.DocumentId, Document.Title FROM Document INNER JOIN DocumentMultimedia ON Document.DocumentId = DocumentMultimedia.DocumentId");
    if (itemsWithMultimedia.length > 0) {
      var docList = $("<div id=\"docSelect\" class=\"list-group\">");
      for (var item of itemsWithMultimedia) {
        $(docList).append("<button class=\"list-group-item list-group-item-action\" data-docid=\"" + item.DocumentId + "\">" + item.Title + "</li>");
      }
      $("#staticBackdrop .modal-header").show();
      $("#staticBackdrop .modal-header").html(i18n.__("selectDocument"));
      $("#staticBackdrop .modal-body").html(docList);
      $("#staticBackdrop .modal-footer").hide();
    } else {
      $("#staticBackdrop .modal-header").hide();
      $("#staticBackdrop .modal-body").html(i18n.__("noDocumentsFound"));
      $("#staticBackdrop .modal-footer").show();
      $(this).val("");
      $("#fileToUpload").val("").change();
    }
    myModal.show();
  }
});
$("#staticBackdrop").on("mousedown", "#docSelect button", async function() {
  $("#docSelect button").prop("disabled", true);
  $(this).addClass("active");
  var docId = $(this).data("docid");
  var contents = await getDbFromJwpub(null, null, $("#jwpubPicker").val());
  var multimediaItems = await executeStatement(contents, "SELECT Multimedia.MultimediaId, Multimedia.FilePath, Multimedia.CategoryType FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DocumentMultimedia.DocumentId = " + docId);
  tempMediaArray = [];
  var missingMedia = $("<div id=\"missingMedia\" class=\"list-group\">");
  for (var multimediaItem of multimediaItems) {
    var tempMedia = {
      filename: multimediaItem.FilePath
    };
    console.log(tempMedia);
    if (multimediaItem.CategoryType !== -1) {
      var jwpubContents = await new zipper($("#jwpubPicker").val()).readFile("contents");
      var mediaEntry = (await new zipper(jwpubContents).getEntries()).filter(entry => entry.name == multimediaItem.FilePath)[0];
      var mediaFile = await new zipper(jwpubContents).readFile(mediaEntry.entryName);
      tempMedia.contents = mediaFile;
    } else {
      var missingButtonHtml = $("<button class=\"list-group-item list-group-item-action\" data-filename=\"" + tempMedia.filename + "\">" + tempMedia.filename + "</li>").on("click", function() {
        var missingMediaPath = remoteDialog.showOpenDialogSync({
          title: $(this).data("filename"),
          filters: [
            { name: $(this).data("filename"), extensions: [path.extname($(this).data("filename")).replace(".", "")] }
          ]
        });
        if (typeof missingMediaPath !== "undefined") {
          tempMediaArray.find(item => item.filename == $(this).data("filename")).localpath = missingMediaPath[0];
          $(this).addClass("list-group-item-primary");
        }
        console.log(tempMediaArray, tempMediaArray.filter(item => !item.contents && !item.localpath));
        if (tempMediaArray.filter(item => !item.contents && !item.localpath).length == 0) {
          $("#staticBackdrop .modal-footer button").prop("disabled", false);
          $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).change();
        }
      });
      $(missingMedia).append(missingButtonHtml);
    }
    tempMediaArray.push(tempMedia);
  }
  console.log(tempMediaArray.filter(item => !item.contents && !item.localpath));
  if (tempMediaArray.filter(item => !item.contents && !item.localpath).length > 0) {
    $("#staticBackdrop .modal-header").show();
    $("#staticBackdrop .modal-header").html(i18n.__("selectExternalMedia"));
    $("#staticBackdrop .modal-body").html(missingMedia);
    $("#staticBackdrop .modal-footer button").prop("disabled", true);
    $("#staticBackdrop .modal-footer").show();
  } else {
    $("#fileToUpload").val(tempMediaArray.map(item => item.filename).join(" -//- ")).change();
    myModal.hide();
  }
});

$("#mediaSync").on("click", async function() {
  var buttonLabel = $("#mediaSync").html();
  $("#baseDate-dropdown").addClass("disabled");
  $("#mediaSync").prop("disabled", true).addClass("loading").find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-download-alt");
  dryrun = false;
  await startMediaSync();
  if (prefs.autoQuitWhenDone) {
    $("#btnStayAlive").fadeTo(animationDuration, 1);
  }
  $("#btnStayAlive").on("click", function() {
    stayAlive = true;
    $("#btnStayAlive").removeClass("btn-primary").addClass("btn-success");
  });
  $("#overlayComplete").fadeIn().delay(3000).fadeOut(animationDuration, () => {
    if (prefs.autoQuitWhenDone) {
      if (stayAlive) {
        toggleScreen("overlaySettings");
        $("#btnStayAlive").removeClass("btn-success").addClass("btn-primary").fadeTo(animationDuration, 0);
      } else {
        remoteApp.quit();
      }
    }
    $("#home, .btn-settings, #btn-settings").fadeTo(animationDuration, 1);
    if (prefs.congServer && prefs.congServer.length > 0) {
      $("#btn-upload").fadeTo(animationDuration, 1);
    }
  });
  $("#mediaSync").html(buttonLabel).prop("disabled", false).removeClass("loading");
  $("#baseDate-dropdown").removeClass("disabled");
});
$("#outputPath").on("mousedown", function(event) {
  var path = remoteDialog.showOpenDialogSync({
    properties: ["openDirectory"]
  });
  $(this).val(path).change();
  event.preventDefault();
});
$("#overlaySettings").on("click", ".btn-clean-up", function() {
  $(this).addClass("btn-success").removeClass("btn-warning").prop("disabled", true);
  setVars();
  cleanUp([paths.lang, paths.langs, paths.pubs], "brutal");
  setTimeout(() => {
    $(".btn-clean-up").removeClass("btn-success").addClass("btn-warning").prop("disabled", false);
  }, 3000);
});
$("#overlayUploadFile").on("change", "#chooseMeeting input", function() {
  document.removeEventListener("drop", dropHandler);
  document.removeEventListener("dragover", dragoverHandler);
  document.removeEventListener("dragenter", dragenterHandler);
  document.removeEventListener("dragleave", dragleaveHandler);
  document.addEventListener("drop", dropHandler);
  document.addEventListener("dragover", dragoverHandler);
  document.addEventListener("dragenter", dragenterHandler);
  document.addEventListener("dragleave", dragleaveHandler);
  // if ($("#chooseMeeting input:nth-child(3):checked").length > 0) {
  $("#chooseUploadType input").prop("checked", false).change();
  $("#chooseUploadType label.active").removeClass("active");
  // $("input#typeSong").prop("disabled", false);
  // $("label[for=typeSong]").removeClass("disabled").fadeIn(animationDuration);
  // } else {
  // $("#chooseUploadType input:checked").change();
  // $("input#typeSong").prop("disabled", true);
  // $("label[for=typeSong]").fadeOut(animationDuration).addClass("disabled");
  //$("label[for=typeFile]").click().addClass("active");
  // }
  $(".relatedToUploadType").fadeTo(animationDuration, 1);
});
$("#overlayUploadFile").on("change", "#chooseMeeting input, #chooseUploadType input", function() {
  $("#enterPrefix input").val("").empty().change();
  getPrefix();
  if ($("#chooseMeeting input:checked").length == 0 || $("#chooseUploadType input:checked").length == 0) {
    $(".relatedToUpload").fadeTo(animationDuration, 0);
  } else {
    $(".relatedToUpload").fadeTo(animationDuration, 1);
  }
});
$("#overlayUploadFile").on("change", "#enterPrefix input, #chooseMeeting input, #fileToUpload", function() {
  try {
    if ($("#chooseMeeting input:checked").length > 0) {
      $(".relatedToUpload *:not(.enterPrefixInput):enabled").prop("disabled", true).addClass("fileListLoading");
      $(".songsSpinner").fadeIn(animationDuration);
      $("#fileList").stop().fadeTo(animationDuration, 0, () => {
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
          if (!meetingMedia[$("#chooseMeeting input:checked").prop("id")]) {
            meetingMedia[$("#chooseMeeting input:checked").prop("id")] = [];
          }
          weekMedia = meetingMedia[$("#chooseMeeting input:checked").prop("id")].filter(mediaItem => mediaItem.media.length > 0);
          if ("Recurring" in meetingMedia) {
            weekMedia = weekMedia.concat(meetingMedia.Recurring);
          }
        }
        var newFiles = [];
        if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
          for (var splitFileToUpload of $("#fileToUpload").val().split(" -//- ")) {
            newFiles.push({
              title: "New file!",
              media: [{
                safeName: sanitizeFilename(prefix + " " + path.basename(splitFileToUpload)).trim(),
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
          let html = $("<li title=\"" + file.safeName + "\" data-url=\"" + file.url + "\" data-safename=\"" + file.safeName + "\">" + file.safeName + "</li>");
          if (file.congSpecific && file.recurring) html.prepend("<i class='fas fa-fw fa-sync-alt'></i>").addClass("recurring");
          if ((currentStep == "additionalMedia" && !file.newFile) || (file.congSpecific && !file.recurring)) html.prepend("<i class='fas fa-fw fa-minus-circle'></i>").addClass("canDelete");
          if (currentStep !== "additionalMedia" && (!file.congSpecific || file.recurring) && !file.hidden && !file.newFile) html.prepend("<i class='far fa-fw fa-check-square'></i>").wrapInner("<span class='canHide'></span>");
          if (file.newFile) html.addClass("new-file").prepend("<i class='fas fa-fw fa-plus'></i>");
          if (!file.newFile && newFiles.filter(item => item.media.filter(mediaItem => mediaItem.safeName.includes(file.safeName)).length > 0).length > 0) html.addClass("duplicated-file");
          if (file.hidden) html.prepend("<i class='far fa-fw fa-square'></i>").wrapInner("<del class='wasHidden'></del>");
          $("#fileList").append(html);
        }
        $("#fileList").css("column-count", Math.ceil($("#fileList li").length / 8));
        $("#fileList li:contains(mp4)").addClass("video");
        $("#fileList li").on("click", ".fa-minus-circle", function() {
          $(this).parent().addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
          setTimeout(() => {
            $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
          }, 3000);
        });
        $("#fileList li").on("click", ".fa-exclamation-circle", function() {
          if (currentStep == "additionalMedia") {
            fs.rmSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), $(this).parent().data("url")));
          } else {
            webdavRm($(this).parent().data("url"));
            cleanUp([paths.media], "brutal");
          }
          $(this).parent().fadeOut(animationDuration, function(){
            $(this).remove();
          });
          meetingMedia[$("#chooseMeeting input:checked").prop("id")].splice(meetingMedia[$("#chooseMeeting input:checked").prop("id")].findIndex(item => item.media.find(mediaItem => mediaItem.url === $(this).parent().data("url"))), 1);
        });
        $("#fileList").on("click", ".canHide", function() {
          webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).parent().data("safename"));
          $(this).parent()
            .find("span.canHide").contents().unwrap().parent()
            .prepend("<i class='far fa-fw fa-square'></i>")
            .wrapInner("<del class='wasHidden'></del>")
            .find("i.fa-check-square").remove();
        });
        $("#fileList").on("mouseup", ".wasHidden", function() {
          webdavRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id"), $(this).parent().data("safename")));
          $(this).parent()
            .find("del.wasHidden").contents().unwrap().parent()
            .prepend("<i class='far fa-fw fa-check-square'></i>")
            .wrapInner("<span class='canHide'></del>")
            .find("i.fa-square").remove();
        });
        $("#btnUpload").prop("disabled", !($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0));
        $("#btnDoneUpload, #btnCancelUpload").prop("disabled", ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0));
        $("#fileList").stop().fadeTo(animationDuration, 1, () => {
          $(".fileListLoading").prop("disabled", false).removeClass("fileListLoading");
          $(".songsSpinner").fadeOut(animationDuration);
        });
      });
    }
  } catch (err) {
    console.error(err);
  }
});
$("#overlayUploadFile").on("keyup", "#enterPrefix input", function() {
  getPrefix();
});
$("#overlayUploadFile").on("mousedown", "input#fileToUpload", function(event) {
  var path = remoteDialog.showOpenDialogSync({
    properties: ["multiSelections"]
  });
  if (typeof path !== "undefined") {
    $(this).val(path.join(" -//- ")).change();
  } else {
    $(this).val("");
  }
  event.preventDefault();
});
$("#overlayUploadFile").on("mousedown", "input#jwpubPicker", function(event) {
  var path = remoteDialog.showOpenDialogSync({
    filters: [
      { name: "JWPUB", extensions: ["jwpub"] }
    ]
  });
  if (typeof path !== "undefined") {
    $(this).val(path).change();
  } else {
    $(this).val("");
  }
  event.preventDefault();
});

// async function head(url, getRedirect) {
//   let response = null,
//     payload = null;
//   try {
//     payload = await axios.head(url, {
//       adapter: require("axios/lib/adapters/http")
//     });
//     if (getRedirect) {
//       response = payload.request.path;
//     } else {
//       response = payload.headers;
//     }
//   } catch (err) {
//     console.error(url, err, payload);
//   }
//   return response;
// }
// async function getMwMediaFromWol(jsonRefContent) {
//   if (!dryrun) $("#day" + prefs.mwDay).addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
//   try{
//     var mwDate = dayjs(baseDate).add(prefs.mwDay, "days").format("YYYY-MM-DD");
//     totals[mwDate] = {}, meetingMedia[mwDate] = [];
//     let parsedHtml = $(jsonRefContent, newHTMLDocument);
//     var mwItems = parsedHtml.find(".so");
//     totals[mwDate].total = mwItems.length, totals[mwDate].current = 1;
//     for (var i = 0; i < mwItems.length; i++) {
//       progressSet(totals[mwDate].current, totals[mwDate].total, "day" + prefs.mwDay);
//       var mwItem = parsedHtml.find(".so").eq(i);
//       var meetingMediaElement = {};
//       meetingMediaElement.title = mwItem.text();
//       meetingMediaElement.media = [];
//       for (let link of mwItem.find("a")) {
//         var splitUrl = $(link).attr("href").split("/");
//         if (splitUrl.includes("datalink")) {
//           console.log("NOT INCLUDING:", {url: $(link).attr("href")});
//         } else if (splitUrl.includes("https:")) {
//           let url = new URL($(link).data().video);
//           let mediaItem = await getMediaLinks(url.searchParams.get("pub"), url.searchParams.get("track"), url.searchParams.get("issue"), url.searchParams.get("fileformat"));
//           mediaItem[0].folder = mwDate;
//           meetingMediaElement.media.push(mediaItem[0]);
//         } else {
//           var jsonUrl = splitUrl.join("/");
//           let result = await get(wolBase + jsonUrl);
//           var jsonRefItem = result.items[0];
//           if (jsonRefItem.categories.includes("sgbk")) {
//             var track = $(link).text().replace(/\D/g, "");
//             let mediaItem = await getMediaLinks(jsonRefItem.englishSymbol + "m", track);
//             mediaItem[0].folder = mwDate;
//             meetingMediaElement.media.push(mediaItem[0]);
//           } else {
//             let jsonRefItemContent = $(jsonRefItem.content, newHTMLDocument);
//             for (var img of jsonRefItemContent.find("img:not(.suppressZoom):not(.west_left)")) { // not sure about west_left.. trying to avoid the mwb sample conversation pictures
//               var meetingMediaInfo = {
//                 title: $(img).attr("alt"),
//                 url: ($(img).attr("src").includes("https") ? "" : wolBase) + $(img).attr("src")
//               };
//               var imgHeaders = await head(meetingMediaInfo.url);
//               meetingMediaInfo.filesize = parseInt(imgHeaders["content-length"]);
//               meetingMediaInfo.filetype = imgHeaders["content-type"].split("/").slice(-1).pop();
//               meetingMediaInfo.folder = mwDate;
//               meetingMediaElement.media.push(meetingMediaInfo);
//             }
//           }
//         }
//       }
//       meetingMedia[mwDate].push(meetingMediaElement);
//       totals[mwDate].current++;
//       progressSet(totals[mwDate].current, totals[mwDate].total, "day" + prefs.mwDay);
//     }
//     if (!dryrun) {
//       $("#day" + prefs.mwDay).addClass("alert-success").find("i").addClass("fa-check-circle");
//     }
//   } catch(err) {
//     console.error(err);
//     $("#day" + prefs.mwDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
//   }
//   if (!dryrun) $("#day" + prefs.mwDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
// }
// async function getWeMediaFromWol(jsonRefContent) {
//   if (!dryrun) $("#day" + prefs.weDay).addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
//   try {
//     let htmlDoc = $(jsonRefContent, newHTMLDocument);
//     let wtRefContent = await get(wolBase + htmlDoc.find("a").attr("href"));
//     var wtContent = wtRefContent.items[0].content;
//     htmlDoc = $(wtContent, newHTMLDocument);
//     var studyDate = dayjs(baseDate).add(prefs.weDay, "days").format("YYYY-MM-DD");
//     totals[studyDate] = {};
//     meetingMedia[studyDate] = [{
//       title: wtRefContent.items[0].title,
//       media: []
//     }];
//     totals[studyDate].total = htmlDoc.find("img:not(.suppressZoom)").length + htmlDoc.find(".pubRefs a:not(.fn)").length, totals[studyDate].current = 1;
//     for (var img of htmlDoc.find("img:not(.suppressZoom)")) {
//       progressSet(totals[studyDate].current, totals[studyDate].total, "day" + prefs.weDay);
//       var mediaInfo = {
//         title: $(img).attr("alt"),
//         folder: studyDate,
//         url: ($(img).attr("src").includes("https") ? "" : wolBase) + $(img).attr("src")
//       };
//       var imgHeaders = await head(mediaInfo.url);
//       mediaInfo.filesize = parseInt(imgHeaders["content-length"]);
//       mediaInfo.filetype = imgHeaders["content-type"];
//       if (mediaInfo.title == "") {
//         var figcaption = $(img).parent().find(".figcaption").text().trim();
//         if (figcaption.length > 0) mediaInfo.title = figcaption;
//       }
//       meetingMedia[studyDate][0].media.push(mediaInfo);
//       totals[studyDate].current++;
//       progressSet(totals[studyDate].current, totals[studyDate].total, "day" + prefs.weDay);
//     }
//     var firstSong = true;
//     for (var songLink of htmlDoc.find("a:not(.b) > strong")) {
//       songLink = $(songLink).parent();
//       progressSet(totals[studyDate].current, totals[studyDate].total, "day" + prefs.weDay);
//       let songRefContent = await get(wolBase + $(songLink).attr("href"));
//       var songItem = songRefContent.items[0];
//       var track = $(songLink).text().replace(/\D/g, "");
//       let mediaItem = await getMediaLinks(songItem.englishSymbol + "m", track);
//       mediaItem[0].folder = studyDate;
//       if (firstSong) {
//         meetingMedia[studyDate][0].media.splice(0, 0, mediaItem[0]);
//       } else {
//         meetingMedia[studyDate][0].media.push(mediaItem[0]);
//       }
//       firstSong = false;
//       totals[studyDate].current++;
//       progressSet(totals[studyDate].current, totals[studyDate].total, "day" + prefs.weDay);
//     }
//     if (!dryrun) $("#day" + prefs.weDay).addClass("alert-success").find("i").addClass("fa-check-circle");
//   } catch(err) {
//     console.error(err);
//     $("#day" + prefs.weDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
//   }
//   if (!dryrun) $("#day" + prefs.weDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
// }
