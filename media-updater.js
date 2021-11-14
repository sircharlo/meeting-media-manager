const animationDuration = 200,
  axios = require("axios"),
  net = require("net"),
  remote = require("@electron/remote"),
  {shell} = require("electron"),
  $ = require("jquery");
function checkInternet(online) {
  if (online) {
    $("#overlayInternetCheck").fadeIn(animationDuration, () => {
      $("#overlayInternetFail").stop().hide();
    });
    require("electron").ipcRenderer.send("autoUpdate");
  } else {
    $("#overlayInternetFail").fadeIn(animationDuration, () => {
      $("#overlayInternetCheck").stop().hide();
    });
    setTimeout(updateOnlineStatus, 1000);
  }
}
const updateOnlineStatus = async () => {
  checkInternet((await isReachable("www.jw.org", 443)));
};
updateOnlineStatus();
require("electron").ipcRenderer.on("hideThenShow", (event, message) => {
  $("#overlay" + message[1]).fadeIn(animationDuration, () => {
    $("#overlay" + message[0]).stop().hide();
  });
});
require("electron").ipcRenderer.on("macUpdate", () => {
  $("#bg-mac-update").fadeIn(animationDuration);
  $("#btn-settings").addClass("in-danger");
  $("#version").addClass("bg-danger in-danger").removeClass("bg-primary").append(" <i class='fas fa-mouse-pointer'></i>").click(function() {
    shell.openExternal("https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest");
  });
});
require("electron").ipcRenderer.on("goAhead", () => {
  $("#overlayPleaseWait").fadeIn(animationDuration, () => {
    $("#overlayUpdateCheck").stop().hide();
    goAhead();
  });
});

const aspect = require("aspectratio"),
  bootstrap = require("bootstrap"),
  dayjs = require("dayjs"),
  ffmpeg = require("fluent-ffmpeg"),
  fs = require("graceful-fs"),
  fullHd = [1280, 720],
  // fullHd = [1920, 1080], // will enable this once Zoom fixes their HD MP4 bug; should be around 2021.12
  glob = require("glob"),
  hme = require("h264-mp4-encoder"),
  datetime = require("flatpickr"),
  i18n = require("i18n"),
  os = require("os"),
  path = require("path"),
  sizeOf = require("image-size"),
  sqljs = require("sql.js"),
  xmlParser = require("fast-xml-parser"),
  zipper = require("adm-zip");

dayjs.extend(require("dayjs/plugin/isoWeek"));
dayjs.extend(require("dayjs/plugin/isBetween"));
dayjs.extend(require("dayjs/plugin/isSameOrBefore"));
dayjs.extend(require("dayjs/plugin/customParseFormat"));
dayjs.extend(require("dayjs/plugin/duration"));

var baseDate = dayjs().startOf("isoWeek"),
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
      console.error(err);
    }
    prefsInitialize();
  }
  getInitialData();
  dateFormatter();
  $("#overlaySettings input:not(.timePicker), #overlaySettings select, #overlayWebdav input, #overlayWebdav select").on("change", function() {
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
    fs.writeFileSync(paths.prefs, JSON.stringify(Object.keys(prefs).sort().reduce((acc, key) => ({...acc, [key]: prefs[key]}), {}), null, 2));
    if ($(this).prop("id").includes("lang")) dateFormatter();
    if ($(this).prop("id") == "congServer" && $(this).val() == "") $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #webdavFolderList").val("").empty().change();
    if ($(this).prop("id").includes("cong")) webdavSetup();
    setVars();
    if ($(this).prop("id").includes("lang")) {
      getTranslations();
      updateSongs();
    }
    if ($(this).prop("id").includes("cong") || $(this).prop("name").includes("Day")) rm([paths.media]);
    validateConfig();
  });
}
function additionalMedia() {
  perf("additionalMedia", "start");
  currentStep = "additionalMedia";
  return new Promise((resolve)=>{
    $("#chooseMeeting").empty();
    for (var meeting of [prefs.mwDay, prefs.weDay]) {
      let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
      $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-primary' for='" + meetingDate + "'" + (Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + meetingDate + "</label>");
    }
    $(".relatedToUpload, .relatedToUploadType, #btnCancelUpload").fadeOut(animationDuration);
    $("#btnDoneUpload").on("click", function() {
      $("#overlayUploadFile").slideUp(animationDuration);
      $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
      $("#fileList, #filePicker, #jwpubPicker, .enterPrefixInput").val("").empty().change();
      $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
      removeEventListeners();
      perf("additionalMedia", "stop");
      resolve();
    }).fadeIn(animationDuration);
    $("#overlayUploadFile").fadeIn(animationDuration);
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
    $("img#svgImg").prop("src", mediaFile);
  });
}
async function convertUnusableFiles() {
  for (let pdfFile of glob.sync(path.join(paths.media, "*", "*pdf"))) {
    try {
      await convertPdf(pdfFile);
    } catch(err) {
      console.error(err);
    }
  }
  for (let svgFile of glob.sync(path.join(paths.media, "*", "*svg"))) {
    try {
      await convertSvg(svgFile);
    } catch(err) {
      console.error(err);
    }
  }
}
function createMediaNames() {
  perf("createMediaNames", "start");
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      for (var j = 0; j < meeting[i].media.length; j++) { // media
        meeting[i].media[j].safeName = sanitizeFilename((i + 1).toString().padStart(2, "0") + "-" + (j + 1).toString().padStart(2, "0") + " - " + meeting[i].media[j].title + "." + (meeting[i].media[j].filetype ? meeting[i].media[j].filetype : path.extname((meeting[i].media[j].url ? meeting[i].media[j].url : meeting[i].media[j].filepath))));
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
            console.error(err.message);
            return resolve();
          }).noVideo().save(path.join(outputFilePath));
        });
      } else {
        var convertedImageDimesions = [];
        var imageDimesions = sizeOf(mediaFile);
        if (imageDimesions.orientation && imageDimesions.orientation >= 5) {
          [imageDimesions.width, imageDimesions.height] = [imageDimesions.height, imageDimesions.width];
        }
        convertedImageDimesions = aspect.resize(imageDimesions.width, imageDimesions.height, (fullHd[1] / fullHd[0] > imageDimesions.height / imageDimesions.width ? (imageDimesions.width > fullHd[0] ? fullHd[0] : imageDimesions.width) : null), (fullHd[1] / fullHd[0] > imageDimesions.height / imageDimesions.width ? null : (imageDimesions.height > fullHd[1] ? fullHd[1] : imageDimesions.height)));
        // We'll remove this next bit when Zoom fixes their 1080p MP4 bug
        if (convertedImageDimesions.toString() == fullHd.toString() || convertedImageDimesions.toString() == [Math.round(parseInt(prefs.maxRes.replace(/\D/g, "")) * 16 / 9), parseInt(prefs.maxRes.replace(/\D/g, ""))].toString()) convertedImageDimesions = convertedImageDimesions.map(function (dimension) {
          return dimension - 1;
        });
        $("body").append("<div id='convert' style='display: none;'>");
        $("div#convert").append("<img id='imgToConvert'>").append("<canvas id='imgCanvas'></canvas>");
        hme.createH264MP4Encoder().then(function (encoder) {
          $("img#imgToConvert").on("load", function() {
            var canvas = $("#imgCanvas")[0],
              image = $("img#imgToConvert")[0];
            encoder.quantizationParameter = 10;
            image.width = convertedImageDimesions[0];
            image.height = convertedImageDimesions[1];
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
          $("img#imgToConvert").prop("src", mediaFile);
        });
      }
    } catch (err) {
      console.error(err);
      return resolve();
    }
  });
}
function dateFormatter() {
  let locale = "en";
  try {
    locale = jsonLangs.filter(lang => lang.langcode == prefs.lang)[0].symbol;
    if (locale !== "en") require("dayjs/locale/" + locale);
  } catch(err) {
    console.error("Date locale " + locale + " not found, falling back to 'en'");
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
    $("#day" + d).toggleClass("alert-secondary", meetingInPast).toggleClass("alert-primary", !meetingInPast).find("i").toggleClass("fa-history", meetingInPast).toggleClass("fa-spinner", !meetingInPast);
    if (baseDate.clone().add(d, "days").isSame(now)) $("#day" + d).addClass("today");
  }
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
async function executeDryrun() {
  $("#overlayDryrun").fadeIn(animationDuration);
  dryrun = true;
  await startMediaSync();
  $("#overlayDryrun").fadeOut(animationDuration);
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
    if (options.method === "PUT") options.onUploadProgress = progressEvent => progressSet(progressEvent.loaded, progressEvent.total);
    if (["jw.org", "www.jw.org"].includes((new URL(url)).hostname)) options.adapter = require("axios/lib/adapters/http");
    options.url = url;
    if (!options.method) options.method = "GET";
    payload = await axios.request(options);
    response = payload;
  } catch (err) {
    console.error(url, err, payload);
    response = err.response;
  }
  return response;
}
async function getCongMedia() {
  perf("getCongMedia", "start");
  if (!dryrun) $("#specificCong").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
  try {
    totals.cong = {
      total: 0,
      current: 1
    };
    for (let congSpecificFolder of (await webdavLs(path.posix.join(prefs.congServerDir, "Media")))) {
      for (let remoteFile of (await webdavLs(path.posix.join(prefs.congServerDir, "Media", congSpecificFolder.basename)))) {
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
          if (!meetingMedia[congSpecificFolder.basename]) meetingMedia[congSpecificFolder.basename] = [];
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
    console.error(err);
    $("#specificCong").addClass("alert-danger").find("i").addClass("fa-times-circle");
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
    console.error(err);
  }
}
async function getDocumentExtract(db, docId) {
  var extractMultimediaItems = [];
  for (var extractItem of (await executeStatement(db, "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber,Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal"))) {
    var extractDb = await getDbFromJwpub(extractItem.UndatedSymbol, extractItem.IssueTagNumber);
    if (extractDb) {
      var extractMediaFiles = await getDocumentMultimedia(extractDb, null, extractItem.RefMepsDocumentId);
      extractMultimediaItems = extractMultimediaItems.concat(extractMediaFiles.filter(extractMediaFile => (extractMediaFile.BeginParagraphOrdinal ? extractItem.RefBeginParagraphOrdinal <= extractMediaFile.BeginParagraphOrdinal && extractMediaFile.BeginParagraphOrdinal <= extractItem.RefEndParagraphOrdinal : true)).map(extractMediaFile => {
        extractMediaFile.BeginParagraphOrdinal = extractItem.BeginParagraphOrdinal;
        return extractMediaFile;
      }));
    }
  }
  return extractMultimediaItems;
}
async function getDocumentMultimedia(db, destDocId, destMepsId, memOnly) {
  var tableMultimedia = ((await executeStatement(db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'")).length === 0 ? "Multimedia" : "DocumentMultimedia");
  var suppressZoomExists = (await executeStatement(db, "SELECT COUNT(*) AS CNTREC FROM pragma_table_info('Multimedia') WHERE name='SuppressZoom'")).map(function(item) {
    return (item.CNTREC > 0 ? true : false);
  })[0];
  var multimediaItems = [];
  for (var multimediaItem of (await executeStatement(db, "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId," + (suppressZoomExists ? " Multimedia.SuppressZoom," : "") + " Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (destDocId || destDocId === 0 ? tableMultimedia + ".DocumentId = " + destDocId : "Document.MepsDocumentId = " + destMepsId) + " AND (((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')) OR (Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10" + (suppressZoomExists ? " AND Multimedia.SuppressZoom <> 1" : "") + "))" + (tableMultimedia == "DocumentMultimedia" ? " ORDER BY BeginParagraphOrdinal" : "")))) {
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
          multimediaItem.KeySymbol = (await executeStatement(db, "SELECT UniqueEnglishSymbol FROM Publication"))[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
          multimediaItem.IssueTagNumber = (await executeStatement(db, "SELECT IssueTagNumber FROM Publication"))[0].IssueTagNumber;
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
      console.error(err);
    }
  }
  return multimediaItems;
}
async function getInitialData() {
  await getLanguages();
  await getTranslations();
  await updateSongs();
  updateCleanup();
  validateConfig();
  $("#version").text("v" + remote.app.getVersion());
  await webdavSetup();
  $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
  if (os.platform() == "linux") $(".notLinux").prop("disabled", true);
  if (prefs.autoStartSync && validateConfig()) {
    var cancelSync = false;
    $("#btnCancelSync").on("click", function() {
      cancelSync = true;
      $("#btnCancelSync").addClass("text-danger fa-stop-circle").removeClass("text-warning fa-pause-circle");
    });
    $("#overlayStarting").fadeIn(animationDuration, () => {
      $("#overlayPleaseWait").stop().hide();
    }).delay(3000).fadeOut(animationDuration, () => {
      if (!cancelSync) $("#mediaSync").click();
    });
  } else {
    $("#overlayPleaseWait").stop().fadeOut(animationDuration);
  }
  $("#baseDate button, #baseDate .dropdown-item:eq(0)").text(baseDate.format("YYYY-MM-DD") + " - " + baseDate.clone().add(6, "days").format("YYYY-MM-DD")).val(baseDate.format("YYYY-MM-DD"));
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  for (var a = 1; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class='dropdown-item' value='" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "'>" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
  }
}
async function getLanguages() {
  if ((!fs.existsSync(paths.langs)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(now.subtract(3, "months"))) {
    let cleanedJwLangs = (await request("https://www.jw.org/en/languages/")).data.languages.filter(lang => lang.hasWebContent).map(lang => ({
      name: lang.vernacularName + " (" + lang.name + ")",
      langcode: lang.langcode,
      symbol: lang.symbol
    }));
    fs.writeFileSync(paths.langs, JSON.stringify(cleanedJwLangs, null, 2));
    prefs.langUpdatedLast = dayjs();
    fs.writeFileSync(paths.prefs, JSON.stringify(Object.keys(prefs).sort().reduce((acc, key) => ({...acc, [key]: prefs[key]}), {}), null, 2));
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
  $("#lang").val(prefs.lang).select2();
}
async function getMediaLinks(pub, track, issue, format, docId) {
  let mediaFiles = [];
  try {
    let result = (await request("https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json" + (docId ? "&docid=" + docId : "&pub=" + pub + (track ? "&track=" + track : "") + (issue ? "&issue=" + issue : "")) + (format ? "&fileformat=" + format : "") + "&langwritten=" + prefs.lang)).data;
    if (result) {
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
      if (parseInt(baseDate.format("M")) % 2 === 0) issue = baseDate.clone().subtract(1, "months").format("YYYYMM") + "00";
      var db = await getDbFromJwpub("mwb", issue);
      try {
        var docId = (await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + baseDate.format("YYYYMMDD") + ""))[0].DocumentId;
      } catch {
        throw("No MW meeting date!");
      }
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
      if (!dryrun) $("#day" + prefs.mwDay).addClass("alert-success").find("i").addClass("fa-check-circle");
    } catch(err) {
      console.error(err);
      $("#day" + prefs.mwDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
    }
    if (!dryrun) $("#day" + prefs.mwDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
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
        $("#enterPrefix-" + a2).prop("disabled", true);
        $("#enterPrefix-" + a2).val("");
      }
    }
  }
  $(".enterPrefixInput").each(function() {
    $(this).fadeTo(animationDuration, !$(this).prop("disabled"));
  });
  $("#enterPrefix-" + prefix.length).focus();
  if (prefix.length % 2) prefix = prefix + 0;
  if (prefix.length > 0) prefix = prefix.match(/.{1,2}/g).join("-");
}
async function getTranslations() {
  var localeLang = (jsonLangs.filter(el => el.langcode == prefs.lang))[0];
  i18n.configure({
    directory: path.join(__dirname, "locales"),
    defaultLocale: "en",
    updateFiles: false,
    retryInDefaultLocale: true
  });
  if (localeLang) i18n.setLocale(localeLang.symbol);
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
      for (var picture of (await executeStatement(db, "SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + docId + " AND Multimedia.CategoryType <> 9"))) {
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
      if (!dryrun) $("#day" + prefs.weDay).addClass("alert-success").find("i").addClass("fa-check-circle");
    } catch(err) {
      console.error(err);
      $("#day" + prefs.weDay).addClass("alert-danger").find("i").addClass("fa-times-circle");
    }
    if (!dryrun) $("#day" + prefs.weDay).removeClass("alert-warning").find("i").removeClass("fa-spinner fa-pulse");
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
      client.on("error", function(e) {
        console.error(e);
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
  $("#statusIcon").addClass("fa-microchip").removeClass("fa-photo-video");
  $("#mp4Convert").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
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
  $("#mp4Convert").removeClass("alert-warning").addClass("alert-success").find("i").addClass("fa-check-circle").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-microchip");
  perf("mp4Convert", "stop");
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
  for (var pref of ["lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath", "betaMp4Gen", "congServer", "congServerPort", "congServerUser", "congServerPass", "openFolderWhenDone", "additionalMediaPrompt", "maxRes", "enableMusicButton", "enableMusicFadeOut", "musicFadeOutTime", "musicFadeOutType", "mwStartTime", "weStartTime"]) {
    if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) prefs[pref] = null;
  }
  for (let field of ["lang", "outputPath", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir", "musicFadeOutTime", "mwStartTime", "weStartTime"]) {
    $("#" + field).val(prefs[field]).change();
  }
  for (let timeField of ["mwStartTime", "weStartTime"]) {
    $(".timePicker").filter("[data-target='" + timeField + "']").val($("#" + timeField).val());
  }
  for (let dtPicker of datepickers) {
    dtPicker.setDate($(dtPicker.element).val());
  }
  for (let checkbox of ["autoStartSync", "autoRunAtBoot", "betaMp4Gen", "autoQuitWhenDone", "openFolderWhenDone", "additionalMediaPrompt", "enableMusicButton", "enableMusicFadeOut"]) {
    $("#" + checkbox).prop("checked", prefs[checkbox]).change();
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
  perf("setVars", "start");
  try {
    downloadStats = {};
    meetingMedia = {};
    jwpubDbs = {};
    paths.output = path.join(prefs.outputPath);
    mkdirSync(paths.output);
    paths.lang = path.join(paths.output, prefs.lang);
    mkdirSync(paths.lang);
    paths.media = path.join(paths.lang, "Media");
    mkdirSync(paths.media);
    paths.pubs = path.join(paths.app, "Publications", prefs.lang);
  } catch (err) {
    console.error(err);
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
async function startMediaSync() {
  perf("total", "start");
  if (!dryrun) $("#statusIcon").addClass("text-primary").removeClass("text-muted");
  stayAlive = false;
  if (!dryrun) $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(animationDuration, 0);
  await setVars();
  for (let folder of glob.sync(path.join(paths.media, "*/"))) {
    if (!dryrun && (dayjs(path.basename(folder), "YYYY-MM-DD").isValid() && dayjs(path.basename(folder), "YYYY-MM-DD").isBefore(now) || !(dayjs(path.basename(folder), "YYYY-MM-DD").isValid()))) await rm([folder]);
  }
  perf("getJwOrgMedia", "start");
  await getMwMediaFromDb();
  await getWeMediaFromDb();
  perf("getJwOrgMedia", "stop");
  createMediaNames();
  if (webdavIsAGo) await getCongMedia();
  if (!dryrun) {
    await syncJwOrgMedia();
    if (webdavIsAGo) await syncCongMedia();
    if (prefs.additionalMediaPrompt) await additionalMedia();
    if (prefs.betaMp4Gen) await mp4Convert();
    if (prefs.openFolderWhenDone) shell.openPath(paths.media);
    $("#btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? ", #btn-upload" : "")).fadeTo(animationDuration, 1);
    setTimeout(() => {
      $(".alertIndicators").addClass("alert-primary").removeClass("alert-success");
      $("#statusIcon").addClass("text-muted").removeClass("text-primary");
    }, 2000);
  }
  perf("total", "stop");
  perfPrint();
}
async function syncCongMedia() {
  perf("syncCongMedia", "start");
  $("#statusIcon").addClass("fa-cloud").removeClass("fa-photo-video");
  $("#specificCong").addClass("alert-warning").removeClass("alert-primary").find("i").removeClass("fa-check-circle").addClass("fa-spinner fa-pulse");
  try {
    totals.cong = {
      total: 0,
      current: 1
    };
    for (let parts of Object.values(meetingMedia)) {
      for (let part of parts.filter(part => part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden).length > 0)) {
        totals.cong.total = totals.cong.total + part.media.filter(mediaItem => mediaItem.congSpecific && !mediaItem.hidden).length;
      }
    }
    for (let datedFolder of glob.sync(path.join(paths.media, "*/"))) {
      if (meetingMedia[path.basename(datedFolder)]) for (let jwOrCongFile of glob.sync(path.join(datedFolder, "*"))) {
        if (!meetingMedia[path.basename(datedFolder)].map(part => part.media.map(media => media.safeName)).flat().includes(path.basename(jwOrCongFile))) await rm(jwOrCongFile);
      }
    }
    progressSet(totals.cong.current, totals.cong.total, "specificCong");
    console.log("%cCONGREGATION MEDIA", "background-color: #d1ecf1; color: #0c5460; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
    for (let [meeting, parts] of Object.entries(meetingMedia)) {
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
  } catch (err) {
    console.error(err);
    $("#specificCong").addClass("alert-danger").find("i").addClass("fa-times-circle");
  }
  $("#specificCong").removeClass("alert-warning").addClass("alert-success").find("i").addClass("fa-check-circle").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-cloud");
  perf("syncCongMedia", "stop");
}
async function syncJwOrgMedia() {
  perf("syncJwOrgMedia", "start");
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
  progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
  console.log("%cJW.org MEDIA", "background-color: #cce5ff; color: #004085; padding: 0.5em 1em; font-weight: bold; font-size: 150%;");
  for (var h = 0; h < Object.values(meetingMedia).length; h++) { // meetings
    console.log("%c[" + Object.keys(meetingMedia)[h] + "]", "background-color: #cce5ff; color: #004085; padding: 0 1em; font-size: 125%;");
    var meeting = Object.values(meetingMedia)[h];
    for (var i = 0; i < meeting.length; i++) { // parts
      var partMedia = meeting[i].media.filter(mediaItem => !mediaItem.congSpecific);
      for (var j = 0; j < partMedia.length; j++) { // media
        if (!partMedia[j].hidden && !partMedia[j].congSpecific && !dryrun) {
          console.log("%c" + partMedia[j].safeName, "background-color: #cce5ff; color: #004085; padding: 0 2em;");
          if (partMedia[j].url) {
            await downloadIfRequired(partMedia[j]);
          } else {
            mkdirSync(path.join(paths.media, partMedia[j].folder));
            var destFile = path.join(paths.media, partMedia[j].folder, partMedia[j].safeName);
            if (!fs.existsSync(destFile) || fs.statSync(destFile).size !== partMedia[j].filesize) fs.copyFileSync(partMedia[j].filepath, destFile);
          }
        }
        totals.jw.current++;
        progressSet(totals.jw.current, totals.jw.total, "syncJwOrgMedia");
      }
    }
  }
  $("#syncJwOrgMedia").removeClass("alert-warning").addClass("alert-success").find("i").addClass("fa-check-circle").removeClass("fa-spinner fa-pulse");
  $("#statusIcon").addClass("fa-photo-video").removeClass("fa-microchip");
  perf("syncJwOrgMedia", "stop");
}
function toggleScreen(screen, forceShow) {
  if (!($("#" + screen).is(":visible")) || forceShow) {
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
    if (lastRunVersion !== remote.app.getVersion()) {
      rm([paths.lang, paths.pubs]);
      fs.writeFileSync(paths.lastRunVersion, remote.app.getVersion());
      if (lastRunVersion !== 0) showReleaseNotes();
    }
  }
}
async function updateSongs() {
  try {
    $("#songPicker").empty();
    for (let sjj of (await getMediaLinks("sjjm", null, null, "MP4")).reverse()) {
      $("#songPicker").append($("<option>", {
        value: sjj.url,
        text: sjj.title
      }));
    }
  } catch (err) {
    console.error(err);
    $("label[for=typeSong]").removeClass("active").addClass("disabled");
    $("label[for=typeFile]").click().addClass("active");
  }
}
function validateConfig() {
  $("#lang").next(".select2").find(".select2-selection").removeClass("invalid");
  $("#mwDay, #weDay, #outputPath, .timePicker").removeClass("invalid is-invalid");
  $("#overlaySettings .btn-outline-danger").addClass("btn-outline-primary").removeClass("btn-outline-danger");
  $("#overlaySettings label.text-danger").removeClass("text-danger");
  let configIsValid = true;
  if (!prefs.lang) {
    $("#lang").next(".select2").find(".select2-selection").addClass("invalid");
    configIsValid = false;
  }
  $(".alertIndicators").removeClass("meeting").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
  for (var elem of ["mwDay", "weDay", "maxRes"]) {
    if (!prefs[elem]) {
      $("#" + elem + " .btn-outline-primary").addClass("btn-outline-danger").removeClass("btn-outline-primary");
      configIsValid = false;
    } else if (elem.includes("Day")) $("#day" + prefs[elem]).addClass("meeting");
  }
  if (prefs.outputPath === "false" || !fs.existsSync(prefs.outputPath)) $("#outputPath").val("");
  let mandatoryFields = ["outputPath"];
  if (prefs.enableMusicFadeOut && prefs.musicFadeOutType === "smart") mandatoryFields.push("mwStartTime", "weStartTime");
  for (var setting of mandatoryFields) {
    if (!prefs[setting]) {
      $("#" + setting + ":visible, .timePicker[data-target='" + setting + "']").addClass("is-invalid");
      configIsValid = false;
    }
  }
  if (!prefs.musicFadeOutTime) $("#musicFadeOutTime").val(5).change();
  $("#musicFadeOutType label span").text(prefs.musicFadeOutTime);
  $(".relatedToFadeOut, #enableMusicFadeOut").prop("disabled", !prefs.enableMusicButton);
  if (prefs.enableMusicButton) $(".relatedToFadeOut").prop("disabled", !prefs.enableMusicFadeOut);
  if (prefs.enableMusicButton && prefs.enableMusicFadeOut && !prefs.musicFadeOutType) $("label[for=musicFadeOutSmart]").click();
  $("#mp4Convert").toggleClass("d-flex", prefs.betaMp4Gen);
  $("#btnMeetingMusic").toggle(prefs.enableMusicButton && $("#btnStopMeetingMusic:visible").length === 0);
  $("#overlaySettings .invalid, #overlaySettings .is-invalid, #overlaySettings .btn-outline-danger").each(function() {
    $(this).closest("div.flex-row").find("label:nth-child(1)").addClass("text-danger");
  });
  $(".btn-settings").toggleClass("btn-dark", configIsValid).toggleClass("btn-danger", !configIsValid);
  $("#settingsIcon").toggleClass("text-muted", configIsValid).toggleClass("text-danger", !configIsValid);
  $("#mediaSync, .btn-settings").prop("disabled", !configIsValid);
  if (!configIsValid) toggleScreen("overlaySettings", true);
  return configIsValid;
}
async function webdavExists(url) {
  return (await webdavHead(url)).status < 400;
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
async function webdavHead(url) {
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
    response = err.response;
  }
  return response;
}
async function webdavLs(dir, force) {
  try {
    if (webdavIsAGo || force) {
      await webdavMkdir(dir);
      let listing = xmlParser.parse((await request("https://" + prefs.congServer + ":" + prefs.congServerPort + dir, {
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
      let items = [];
      if (Array.isArray(listing.multistatus.response)) {
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
      return (items);
    }
  } catch (err) {
    console.error(err);
    throw(err);
  }
}
async function webdavMkdir(dir) {
  if (!(await webdavExists(dir))) await request("https://" + prefs.congServer + ":" + prefs.congServerPort + dir, {
    method: "MKCOL",
    webdav: true
  });
}
async function webdavPut(file, destFolder, destName) {
  try {
    if (webdavIsAGo && file && destFolder && destName) {
      await webdavMkdir(destFolder);
      await request(path.posix.join("https://" + prefs.congServer + ":" + prefs.congServerPort, destFolder, (await sanitizeFilename(destName))), {
        method: "PUT",
        data: file,
        headers: {
          "Content-Type": "application/octet-stream"
        },
        webdav: true
      });
    }
  } catch (err) {
    console.error(err);
  }
}
async function webdavRm(path) {
  try {
    if (webdavIsAGo && path && await webdavExists(path)) {
      await request("https://" + prefs.congServer + ":" + prefs.congServerPort + path, {
        method: "DELETE",
        webdav: true
      });
    }
  } catch (err) {
    console.error(err);
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
        try {
          if (prefs.congServerDir == null || prefs.congServerDir.length === 0) {
            $("#congServerDir").val("/").change();
          } else {
            let webdavStatusCode = (await webdavHead(prefs.congServerDir)).status;
            if (webdavStatusCode === 200) {
              webdavLoginSuccessful = true;
              webdavDirIsValid = true;
            }
            if (!([401, 403, 405, 429].includes(webdavStatusCode))) {
              webdavLoginSuccessful = true;
            }
            if (webdavStatusCode !== 404) {
              webdavDirIsValid = true;
            }
            if (congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid) {
              if (prefs.congServerDir !== "/") $("#webdavFolderList").append("<li><i class='fas fa-fw fa-chevron-circle-up'></i> ../ </li>");
              for (var item of (await webdavLs(prefs.congServerDir, true))) {
                if (item.type == "directory") $("#webdavFolderList").append("<li><i class='fas fa-fw fa-folder-open'></i>" + item.basename + "</li>");
              }
              $("#webdavFolderList").css("column-count", Math.ceil($("#webdavFolderList li").length / 8));
              $("#webdavFolderList li").click(function() {
                $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).change();
              });
              $("#additionalMediaPrompt").prop("checked", false).change();
            }
          }
        } catch(err) {
          console.error(err);
          if (err.response) {
            console.error(err.response);
            if (err.response.status === 401 || err.response.status === 405) {
              webdavLoginSuccessful = false;
            } else if (err.response.status !== 404) {
              congServerHeartbeat = false;
            }
          }
        }
      }
    }
  }
  $("#btn-upload").toggle(congServerEntered).prop("disabled", congServerEntered && !webdavDirIsValid);
  $(".btn-webdav, #btn-upload").toggleClass("btn-primary", !congServerEntered || (congServerEntered && webdavLoginSuccessful && webdavDirIsValid)).toggleClass("btn-danger", congServerEntered && !(webdavDirIsValid && webdavLoginSuccessful));
  $("#webdavStatus").toggleClass("text-success text-warning text-muted", webdavDirIsValid).toggleClass("text-danger", congServerEntered && !webdavDirIsValid);
  $(".webdavHost").toggleClass("is-valid", congServerHeartbeat).toggleClass("is-invalid", congServerEntered && !congServerHeartbeat);
  $(".webdavCreds").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && !webdavLoginSuccessful));
  $("#congServerDir").toggleClass("is-valid", congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid).toggleClass("is-invalid", (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && !webdavDirIsValid));
  $("#webdavFolderList").fadeTo(animationDuration, webdavDirIsValid);
  $("#additionalMediaPrompt").prop("disabled", congServerEntered && webdavDirIsValid);
  $("#specificCong").toggleClass("d-flex", congServerEntered).toggleClass("alert-danger", congServerEntered && !(congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid));
  $("#btn-settings, #overlaySettings .btn-webdav").toggleClass("in-danger", congServerEntered && !webdavDirIsValid);
  webdavIsAGo = (congServerEntered && congServerHeartbeat && webdavLoginSuccessful && webdavDirIsValid);
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
  setVars();
  baseDate = dayjs($(this).val()).startOf("isoWeek");
  $("#baseDate .dropdown-item.active").removeClass("active");
  $(this).addClass("active");
  $("#baseDate > button").text($(this).text());
  $(".alertIndicators").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
  dateFormatter();
});
$("#btnCancelUpload").on("click", () => {
  $("#overlayUploadFile").fadeOut(animationDuration);
  $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
  $("#fileList, #filePicker, #jwpubPicker, .enterPrefixInput").val("").empty().change();
  $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
  dryrun = false;
  removeEventListeners();
});
$("#btnMeetingMusic").on("click", async function() {
  if (prefs.enableMusicButton) $(".relatedToFadeOut, #enableMusicFadeOut, #enableMusicButton").prop("disabled", true);
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
$(".btn-settings, #btn-settings").on("click", function() {
  toggleScreen("overlaySettings");
});
$("#btnStopMeetingMusic").on("click", function() {
  clearTimeout(pendingMusicFadeOut.id);
  $("#btnStopMeetingMusic").toggleClass("btn-warning btn-danger").prop("disabled", true);
  $("#meetingMusic").animate({volume: 0}, animationDuration * 30, () => {
    $("#meetingMusic").remove();
    $("#btnStopMeetingMusic").hide().toggleClass("btn-warning btn-danger").prop("disabled", false);
    $("#musicRemaining").empty();
    if (prefs.enableMusicButton) {
      $("#btnMeetingMusic").show();
      $("#enableMusicFadeOut, #enableMusicButton").prop("disabled", false);
      if (prefs.enableMusicFadeOut) $(".relatedToFadeOut").prop("disabled", false);
    }
  });
});
$(".btn-webdav").on("click", function() {
  webdavSetup();
  toggleScreen("overlayWebdav");
});
$("#btnUpload").on("click", async () => {
  try {
    $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-save");
    $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", true);
    if ($("input#typeSong:checked").length > 0) {
      var songFile = new Buffer((await request($("#fileToUpload").val(), {isFile: true})).data);
      if (currentStep == "additionalMedia") {
        fs.writeFileSync(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), sanitizeFilename(prefix + " " + path.basename($("#fileToUpload").val()))), songFile);
      } else {
        await webdavPut(songFile, path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), sanitizeFilename(prefix + " " + path.basename($("#fileToUpload").val())));
      }
    } else if ($("input#typeJwpub:checked").length > 0) {
      for (var tempMedia of tempMediaArray) {
        if (tempMedia.url) tempMedia.contents = new Buffer((await request(tempMedia.url, {isFile: true})).data);
        if (currentStep == "additionalMedia") {
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
      for (var splitLocalFile of $("#fileToUpload").val().split(" -//- ")) {
        var splitFileToUploadName = sanitizeFilename(prefix + " " + path.basename(splitLocalFile));
        if (currentStep == "additionalMedia") {
          fs.copyFileSync(splitLocalFile, path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), splitFileToUploadName));
        } else {
          await webdavPut(fs.readFileSync(splitLocalFile), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), splitFileToUploadName);
        }
      }
    }
    await executeDryrun();
    $("#chooseMeeting input:checked").change();
    $("#btnUpload").prop("disabled", false).find("i").addClass("fa-save").removeClass("fa-circle-notch fa-spin");
    $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", false);
  } catch (err) {
    console.error(err);
  }
});
$("#btn-upload").on("click", async function() {
  $(".relatedToUpload, .relatedToUploadType, #btnDoneUpload").hide();
  $("#btnCancelUpload").fadeIn(animationDuration);
  currentStep = "uploadFile";
  await executeDryrun();
  $("#overlayUploadFile").fadeIn(animationDuration);
  $(".alertIndicators").find("i").addClass("fa-spinner").removeClass("fa-check-circle");
  $("#chooseMeeting").empty();
  for (var meeting of [prefs.mwDay, prefs.weDay]) {
    let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
    $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-primary' for='" + meetingDate + "'" + (Object.prototype.hasOwnProperty.call(meetingMedia, meetingDate) ? "" : " style='display: none;'") + ">" + meetingDate + "</label>");
  }
});
$("#chooseUploadType input").on("change", function() {
  $("#songPicker:visible").select2("destroy");
  $("#songPicker, #jwpubPicker, #filePicker").hide();
  $("#fileToUpload").val("").change();
  if ($("input#typeSong:checked").length > 0) {
    $("#songPicker").val([]).prop("disabled", false).show().select2();
  } else if ($("input#typeFile:checked").length > 0) {
    $("#filePicker").val("").prop("disabled", false).show();
  } else if ($("input#typeJwpub:checked").length > 0) {
    $("#jwpubPicker").val([]).prop("disabled", false).show();
  }
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
            $(this).addClass("list-group-item-primary");
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
  dryrun = false;
  await startMediaSync();
  if (prefs.autoQuitWhenDone) $("#btnStayAlive").fadeIn(animationDuration);
  $("#btnStayAlive").on("click", function() {
    stayAlive = true;
    $("#btnStayAlive").removeClass("btn-primary").addClass("btn-success");
  });
  $("#overlayComplete").fadeIn(animationDuration).delay(3000).fadeOut(animationDuration, () => {
    if (prefs.autoQuitWhenDone) {
      if (stayAlive) {
        toggleScreen("overlaySettings");
        $("#btnStayAlive").removeClass("btn-success").addClass("btn-primary").fadeOut(animationDuration);
      } else {
        remote.app.quit();
      }
    }
    $(".btn-settings, #btn-settings" + (prefs.congServer && prefs.congServer.length > 0 ? " #btn-upload" : "")).fadeTo(animationDuration, 1);
  });
  $("#mediaSync, #baseDate-dropdown").prop("disabled", false);
});
$("#outputPath").on("mousedown", function(event) {
  $(this).val(remote.dialog.showOpenDialogSync({
    properties: ["openDirectory"]
  })).change();
  event.preventDefault();
});
$("#overlaySettings").on("click", ".btn-clean-up", function() {
  $(this).addClass("btn-success").removeClass("btn-warning").prop("disabled", true);
  setVars();
  rm([paths.lang, paths.langs, paths.pubs]);
  setTimeout(() => {
    $(".btn-clean-up").removeClass("btn-success").addClass("btn-warning").prop("disabled", false);
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
  $(".relatedToUploadType").fadeIn(animationDuration);
});
$("#overlayUploadFile").on("change", "#chooseMeeting input, #chooseUploadType input", function() {
  $(".enterPrefixInput").val("").empty().change();
  getPrefix();
  $(".relatedToUpload").fadeTo(animationDuration, ($("#chooseMeeting input:checked").length === 0 || $("#chooseUploadType input:checked").length === 0 ? 0 : 1));
});
$("#fileList").on("click", "li .fa-minus-circle", function() {
  $(this).parent().addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
  setTimeout(() => {
    $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
  }, 3000);
});
$("#fileList").on("click", "li .fa-exclamation-circle", function() {
  if (currentStep == "additionalMedia") {
    rm(path.join(paths.media, $("#chooseMeeting input:checked").prop("id"), $(this).parent().data("url")));
  } else {
    webdavRm($(this).parent().data("url"));
  }
  $(this).parent().fadeOut(animationDuration, function(){
    $(this).remove();
  });
  meetingMedia[$("#chooseMeeting input:checked").prop("id")].splice(meetingMedia[$("#chooseMeeting input:checked").prop("id")].findIndex(item => item.media.find(mediaItem => mediaItem.url === $(this).parent().data("url"))), 1);
});
$("#fileList").on("click", ".canHide", async function() {
  webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).data("safename"));
  $(this).removeClass("canHide").addClass("wasHidden").find("i.fa-check-square").removeClass("fa-check-square").addClass("fa-square");
  executeDryrun();
});
$("#fileList").on("click", ".wasHidden", function() {
  webdavRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id"), $(this).data("safename")));
  $(this).removeClass("wasHidden").addClass("canHide").find("i.fa-square").removeClass("fa-square").addClass("fa-check-square");  executeDryrun();
});
$("#overlayUploadFile").on("change", ".enterPrefixInput, #chooseMeeting input, #fileToUpload", function() {
  try {
    if ($("#chooseMeeting input:checked").length > 0) {
      $(".relatedToUpload *:not(.enterPrefixInput):enabled").prop("disabled", true).addClass("fileListLoading");
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
          if (!meetingMedia[$("#chooseMeeting input:checked").prop("id")]) meetingMedia[$("#chooseMeeting input:checked").prop("id")] = [];
          weekMedia = meetingMedia[$("#chooseMeeting input:checked").prop("id")].filter(mediaItem => mediaItem.media.length > 0);
          if ("Recurring" in meetingMedia) weekMedia = weekMedia.concat(meetingMedia.Recurring);
        }
        var newFiles = [];
        let newFileChosen = $("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0;
        if (newFileChosen) {
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
          let html = $("<li title='" + file.safeName + "' data-url='" + file.url + "' data-safename='" + file.safeName + "'>" + file.safeName + "</li>");
          if (file.congSpecific && file.recurring) html.prepend("<i class='fas fa-fw fa-sync-alt'></i>").addClass("recurring");
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
        $("#fileList").stop().fadeTo(animationDuration, 1, () => {
          $(".fileListLoading").prop("disabled", false).removeClass("fileListLoading");
        });
      });
    }
  } catch (err) {
    console.error(err);
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
$("#version:not(.bg-danger)").on("click", showReleaseNotes);
$("#webdavProviders a").on("click", function() {
  for (let i of Object.entries($(this).data())) {
    let name = "cong" + (i[0][0].toUpperCase() + i[0].slice(1));
    prefs[name] = i[1];
    $("#" + name).val(i[1]);
  }
  $("#congServer").change();
});
