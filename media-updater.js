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
    $("#overlay" + message[0]).fadeOut(animationDuration);
  });
});

require("electron").ipcRenderer.on("updateDownloadProgress", (event, message) => {
  var dotsDone = Math.floor(parseFloat(message[0]) / 10);
  $("#updatePercent i:nth-of-type(" + dotsDone + ")").addClass("fa-circle text-primary").removeClass("fa-dot-circle");
});

require("electron").ipcRenderer.on("macUpdate", () => {
  $("#btn-mac-update").fadeIn(animationDuration).click(function() {
    shell.openExternal("https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest");
  });
});

require("electron").ipcRenderer.on("goAhead", () => {
  $("#overlayPleaseWait").fadeIn(animationDuration, () => {
    $("#overlayUpdateCheck").fadeOut(animationDuration);
    goAhead();
  });
});

function goAhead() {
  const axios = require("axios"),
    { createClient } = require("webdav"),
    dayjs = require("dayjs"),
    ffmpeg = require("fluent-ffmpeg"),
    fs = require("graceful-fs"),
    glob = require("glob"),
    i18n = require("i18n"),
    os = require("os"),
    path = require("path"),
    sqljs = require("sql.js"),
    zipper = require("zip-local"),
    appPath = remoteApp.getPath("userData"),
    jwGetPubMediaLinks = "https://app.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json",
    langsFile = path.join(appPath, "langs.json"),
    prefsFile = path.join(appPath, "prefs.json"),
    pubs = {
      mwb: "mwb",
      thv: "thv",
      wt: "w"
    };

  dayjs.extend(require("dayjs/plugin/isoWeek"));
  dayjs.extend(require("dayjs/plugin/isBetween"));
  dayjs.extend(require("dayjs/plugin/customParseFormat"));

  var baseDate = dayjs().startOf("isoWeek"),
    dryrun = false,
    dryrunResults = {},
    hdRes = [],
    jsonLangs = {},
    langPath,
    mediaPath,
    mwMediaForWeek,
    outputPath,
    pubsPath,
    prefix,
    prefs = {},
    webdavIsAGo = false,
    stayAlive,
    webdavClient,
    weekMediaFilesCopied = [],
    zoomPath;

  if (fs.existsSync(prefsFile)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsFile));
    } catch (err) {
      console.error(err);
    }
    prefsInitialize();
  }
  getInitialData();
  dateFormatter();
  if (os.platform() == "linux") {
    $(".notLinux").prop("disabled", true);
  }
  $("#outputPath").on("mousedown", function(event) {
    var path = remoteDialog.showOpenDialogSync({
      properties: ["openDirectory"]
    });
    $(this).val(path).change();
    event.preventDefault();
  });
  $(".btn-settings, #btn-settings").on("click", function() {
    toggleScreen("overlaySettings");
  });
  $(".btn-webdav").on("click", function() {
    webdavSetup();
    toggleScreen("overlayWebdav");
  });
  $("#baseDate").on("click", ".dropdown-item", function() {
    setVars();
    baseDate = dayjs($(this).val()).startOf("isoWeek");
    cleanUp([mediaPath], "brutal");
    $("#baseDate .dropdown-item.active").removeClass("active");
    $(this).addClass("active");
    $("#baseDate > button").html($(this).html());
    dateFormatter();
  });
  $("#overlaySettings").on("click", ".btn-clean-up", function() {
    $(this).addClass("btn-success").removeClass("btn-danger").prop("disabled", true);
    setVars();
    cleanUp([pubsPath, mediaPath, zoomPath], "brutal");
    setTimeout(() => {
      $(".btn-clean-up").removeClass("btn-success").addClass("btn-danger").prop("disabled", false);
    }, 3000);
  });
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
    fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
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
    if ($(this).prop("id").includes("cong") || $(this).prop("id") == "includeTeaching" || $(this).prop("name").includes("Day")) {
      cleanUp([mediaPath], "brutal");
    }
    configIsValid();
  });
  $("#autoRunAtBoot").on("change", function() {
    remoteApp.setLoginItemSettings({
      openAtLogin: prefs.autoRunAtBoot
    });
  });
  $("#mwDay input, #weDay input").on("change", function() {
    $("div.meeting").removeClass("meeting");
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
  });
  $("#mediaSync").on("click", async function() {
    dryrun = false;
    var buttonLabel = $("#mediaSync").html();
    $("#baseDate-dropdown").addClass("disabled");
    $("#mediaSync").prop("disabled", true).addClass("loading").find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-download-alt");
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
  $("#btnMeetingMusic").on("click", async function() {
    var sjjm = await getJson({
      "pub": "sjjm",
      "filetype": "MP3"
    });
    var songs = sjjm.files[prefs.lang][sjjm.fileformat[0]];
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
        $("#btnStopMeetingMusic i").addClass("fa-circle-notch fa-spin").removeClass("fa-stop").prop("title", "...");
      }).on("canplay", function() {
        $("#btnStopMeetingMusic i").addClass("fa-stop").removeClass("fa-circle-notch fa-spin").prop("title", songs[iterator].title);
      }).append("<source src=\""+ songs[iterator].file.url + "\" type=\"audio/mpeg\">");
      $("body").append(audioElem);
    }
    createAudioElem(iterator);
    $("#btnMeetingMusic, #btnStopMeetingMusic").toggle();
  });
  $("#btnStopMeetingMusic").on("click", function() {
    $("#meetingMusic").remove();
    $("#btnStopMeetingMusic").hide();
    if (prefs.enableMusicButton) {
      $("#btnMeetingMusic").show();
    }
  });
  function additionalMedia() {
    if (!dryrun && prefs.additionalMediaPrompt) {
      return new Promise((resolve)=>{
        $("#overlayAdditionalFilesPrompt").fadeIn(animationDuration);
        $("#btnNoAdditionalMedia, #btnAdditionalMedia").click(function() {
          $("#overlayAdditionalFilesPrompt").fadeOut(animationDuration);
        });
        $("#btnAdditionalMedia").click(function() {
          $("#overlayAdditionalFilesWaiting").fadeIn(animationDuration);
          shell.openPath(mediaPath);
        });
        $("#btnAdditionalMediaDone").click(function() {
          $("#overlayAdditionalFilesWaiting").fadeOut(animationDuration);
        });
        $("#btnAdditionalMediaDone, #btnNoAdditionalMedia").click(function() {
          resolve();
        });
      });
    }
  }
  function cleanUp(dirs, type) {
    for (var lookinDir of dirs) {
      if (fs.existsSync(lookinDir)) {
        $("#statusIcon").addClass("fa-broom").removeClass("fa-photo-video");
        if (type == "brutal") {
          fs.rmdirSync(lookinDir, {
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
        $("#statusIcon").addClass("fa-photo-video").removeClass("fa-broom");
      }
    }
  }
  function configIsValid() {
    $("#lang").next(".select2").find(".select2-selection").removeClass("invalid");
    $("#mwDay, #weDay, #outputPath").removeClass("invalid");
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
      $("#outputPath").addClass("invalid");
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
      $("#zoomRender").addClass("d-flex");
      $("#additionalMediaPrompt").prop("disabled", false);
    } else {
      $("#zoomRender").removeClass("d-flex");
      $("#additionalMediaPrompt").prop("disabled", true);
    }
    if (prefs.enableMusicButton) {
      $("#btnMeetingMusic").fadeIn();
    } else {
      $("#btnMeetingMusic").fadeOut();
    }
    $("#overlaySettings .invalid, #overlaySettings .btn-outline-danger").each(function() {
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
      var pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");
      var pdfjsLibWorker = require("pdfjs-dist/es5/build/pdf.worker.entry.js");
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
    if (!dryrun && prefs.betaMp4Gen) {
      for (var mediaFile of glob.sync(path.join(mediaPath, "*", "*"))) {
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
  }
  function createVideoSync(mediaDir, media){
    return new Promise((resolve)=>{
      var mediaName = path.basename(media, path.extname(media));
      $("#downloadProgressContainer").fadeTo(animationDuration, 1);
      if (path.extname(media).includes("mp3")) {
        ffmpeg(path.join(mediaPath, mediaDir, media))
          .on("end", function() {
            return resolve();
          })
          .on("error", function(err) {
            console.error(err.message);
            return resolve();
          })
          .noVideo()
          .save(path.join(zoomPath, mediaDir, mediaName + ".mp4"));
      } else {
        var outputFPS = 30, loop = 1;
        ffmpeg(path.join(mediaPath, mediaDir, media))
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
          .size(hdRes[0] + "x" + hdRes[1])
          .autopad()
          .loop(loop)
          .outputOptions("-pix_fmt yuv420p")
          .save(path.join(zoomPath, mediaDir, mediaName + ".mp4"));
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
    for (var d = 0; d < 7; d++) {
      $("#day" + d + " .dateOfMonth").html(baseDate.clone().add(d, "days").format("DD"));
      $("#day" + d + " .dateOfMonth").prev().html(baseDate.clone().add(d, "days").locale(locale).format("dd"));
      $("#mwDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
      $("#weDay label:eq(" + d + ")").text(baseDate.clone().add(d, "days").locale(locale).format("dd"));
    }
    if (parseInt($("#day" + (dayjs().isoWeekday() - 1) + " .dateOfMonth").html()) == new Date().getDate() && dayjs().isBetween(baseDate, baseDate.clone().add(7, "days"), null, "[)")) {
      $("#day" + (dayjs().isoWeekday() - 1)).addClass("today");
    } else {
      $(".today").removeClass("today");
    }
  }
  async function downloadFile(url, type) {
    if (!type) {
      type = "download";
    }
    $("#" + type + "ProgressContainer").stop().fadeTo(animationDuration, 1);
    try {
      var response = await axios.get(url, {
        responseType: "arraybuffer",
        onDownloadProgress: function(progressEvent) {
          var percent = progressEvent.loaded / progressEvent.total * 100;
          progressSet(percent, path.basename(url), type);
        }
      });
      if (parseInt(response.headers["content-length"]) !== response.data.byteLength) {
        throw("ERROR", path.basename(url), "WRONG SIZE");
      }
      return response.data;
    } catch (err) {
      console.error(err);
      return err;
    }
  }
  async function downloadRequired(remoteOpts, destFile) {
    var returnValue = true;
    if (fs.existsSync(destFile)) {
      var localHash = fs.statSync(destFile).size,
        remoteHash, json;
      if (remoteOpts.external) {
        var remoteHead = await axios.head(remoteOpts.external);
        remoteHash = remoteHead.headers["content-length"];
      } else {
        if (remoteOpts.json) {
          json = remoteOpts.json;
          if (remoteOpts.track) {
            remoteHash = json.filter(function(item) {
              return item.track == remoteOpts.track;
            });
          } else if (!remoteOpts.onlyFile) {
            remoteHash = json.files[prefs.lang][remoteOpts.type];
          } else {
            remoteHash = json;
          }
          remoteHash = remoteHash[0];
        } else {
          json = await getJson({
            pub: remoteOpts.pub,
            issue: remoteOpts.issue,
            filetype: remoteOpts.type,
            track: remoteOpts.track
          });
          remoteHash = json.files[prefs.lang][remoteOpts.type];
        }
        remoteHash = remoteHash.filesize;
      }
      if (remoteHash == localHash) {
        returnValue = false;
      }
    }
    return returnValue;
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
    if (!dryrun && prefs.betaMp4Gen) {
      $("#statusIcon").addClass("fa-microchip").removeClass("fa-photo-video");
      $("#zoomRender").addClass("bg-warning in-progress");
      var osType = os.type();
      var targetOs;
      if (osType == "Windows_NT") {
        targetOs = "windows-64";
      } else if (osType == "Darwin") {
        targetOs = "osx-64";
      } else {
        targetOs = "linux-64";
      }
      var ffmpegVersions = await getJson({url: "https://api.github.com/repos/vot/ffbinaries-prebuilt/releases/latest"});
      var ffmpegUrls = await getJson({url: "https://ffbinaries.com/api/v1/version/latest"});
      var remoteFfmpegZipSize = ffmpegVersions.assets.filter(a => a.name == path.basename(ffmpegUrls.bin[targetOs].ffmpeg))[0].size;
      var ffmpegZipPath = path.join(appPath, "ffmpeg", "zip", path.basename(ffmpegUrls.bin[targetOs].ffmpeg));
      if (!fs.existsSync(ffmpegZipPath) || fs.statSync(ffmpegZipPath).size !== remoteFfmpegZipSize) {
        cleanUp([path.join(appPath, "ffmpeg", "zip")], "brutal");
        mkdirSync(path.join(appPath, "ffmpeg", "zip"));
        var ffmpegZipFile = await downloadFile(ffmpegUrls.bin[targetOs].ffmpeg);
        fs.writeFileSync(ffmpegZipPath, new Buffer(ffmpegZipFile));
      }
      zipper.sync.unzip(ffmpegZipPath).save(path.join(appPath, "ffmpeg"));
      var ffmpegPath = glob.sync(path.join(appPath, "ffmpeg", "ffmpeg*"))[0];
      fs.chmodSync(ffmpegPath, "777");
      ffmpeg.setFfmpegPath(ffmpegPath);
      var filesToProcess = glob.sync(path.join(mediaPath, "*", "*"));
      var filesToRender = filesToProcess.length, filesRendering = 0;
      for (var mediaDir of glob.sync(path.join(mediaPath, "*"))) {
        mkdirSync(path.join(zoomPath, path.basename(mediaDir)));
      }
      for (var mediaFile of glob.sync(path.join(mediaPath, "*", "*"))) {
        filesRendering = filesRendering + 1;
        if (path.extname(mediaFile) !== ".mp4") {
          await createVideoSync(path.basename(path.dirname(mediaFile)), path.basename(mediaFile));
        } else {
          fs.copyFileSync(mediaFile, path.join(zoomPath, path.basename(path.dirname(mediaFile)), path.basename(mediaFile)));
        }
        await progressSet(filesRendering / filesToRender * 100, path.basename(mediaFile));
      }
      $("#zoomRender").removeClass("bg-warning in-progress").addClass("bg-primary");
      $("#statusIcon").addClass("fa-photo-video").removeClass("fa-microchip");
    }
  }
  async function getDbFromJwpub(opts) {
    var json = await getJson({
      pub: opts.pub,
      issue: opts.issue,
      filetype: "JWPUB"
    });
    try {
      if (json) {
        var url = json.files[prefs.lang].JWPUB[0].file.url;
        var basename = path.basename(url);
        var workingDirectory = path.join(pubsPath, opts.pub, opts.issue);
        var workingUnzipDirectory = path.join(workingDirectory, "JWPUB", "contents-decompressed");
        if (await downloadRequired({
          json: json,
          pub: opts.pub,
          issue: opts.issue,
          type: "JWPUB"
        }, path.join(workingDirectory, basename)) || !glob.sync(path.join(workingUnzipDirectory, "*.db"))[0]) {
          var file = await downloadFile(url);
          fs.writeFileSync(path.join(workingDirectory, basename), new Buffer(file));
          mkdirSync(path.join(workingDirectory, "JWPUB"));
          zipper.sync.unzip(glob.sync(path.join(workingDirectory, "*.jwpub"))[0]).save(path.join(workingDirectory, "JWPUB"));
          mkdirSync(workingUnzipDirectory);
          zipper.sync.unzip(path.join(workingDirectory, "JWPUB", "contents")).save(workingUnzipDirectory);
        }
        var SQL = await sqljs();
        var sqldb = new SQL.Database(fs.readFileSync(glob.sync(path.join(workingUnzipDirectory, "*.db"))[0]));
        return sqldb;
      }
    } catch (err) {
      console.error(err, opts, json);
    }
  }
  async function getDocumentExtract(opts) {
    var statement = "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber,Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + opts.docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal";
    var extractItems = await executeStatement(opts.db, statement);
    for (var extractItem of extractItems) {
      mkdirSync(path.join(pubsPath, extractItem.UndatedSymbol));
      mkdirSync(path.join(pubsPath, extractItem.UndatedSymbol, extractItem.IssueTagNumber));
      var db = await getDbFromJwpub({
        pub: extractItem.UndatedSymbol,
        issue: extractItem.IssueTagNumber
      });
      if (db) {
        await getDocumentMultimedia({
          db: db,
          destMepsId: extractItem.RefMepsDocumentId,
          srcDocId: extractItem.DocumentId,
          srcParId: extractItem.BeginParagraphOrdinal,
          week: opts.week,
          pub: extractItem.UndatedSymbol,
          refParStart: extractItem.RefBeginParagraphOrdinal,
          refParEnd: extractItem.RefEndParagraphOrdinal
        });
      }
    }
  }
  async function getDocumentMultimedia(opts) {
    try {
      var tableDocumentMultimedia = await executeStatement(opts.db, "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'");
      var tableMultimedia = "";
      if (tableDocumentMultimedia.length == 0) {
        tableMultimedia = "Multimedia";
      } else {
        tableMultimedia = "DocumentMultimedia";
      }
      var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')) OR (Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 9" + (opts.pub == "th" ? " AND Multimedia.Width <> ''" : "") + "))" + (tableMultimedia == "DocumentMultimedia" ? " ORDER BY BeginParagraphOrdinal" : "");
      var mediaItems = await executeStatement(opts.db, statement);
      if (mediaItems) {
        for (var media of mediaItems) {
          try {
            media.FileType = media.FilePath.split(".").pop();
            if ((media.MimeType.includes("audio") || media.MimeType.includes("video"))) {
              if (media.KeySymbol == null) {
                media.JsonUrl = jwGetPubMediaLinks + "&docid=" + media.MultiMeps + "&langwritten=" + prefs.lang;
              } else {
                media.JsonUrl = jwGetPubMediaLinks + "&pub=" + media.KeySymbol + "&langwritten=" + prefs.lang + "&issue=" + media.IssueTagNumber + "&track=" + media.Track;
              }
              if (media.MimeType.includes("video")) {
                media.JsonUrl = media.JsonUrl + "&fileformat=MP4";
              } else if (media.MimeType.includes("audio")) {
                media.JsonUrl = media.JsonUrl + "&fileformat=MP3";
              }
              var json = await getJson({
                url: media.JsonUrl
              });
              media.Json = Object.values(json.files[prefs.lang])[0];
              if (media.MimeType.includes("video")) {
                for (var mI of media.Json.reverse()) {
                  var videoRes = mI.label.replace(/\D/g, "");
                  if (videoRes > prefs.maxRes.replace(/\D/g, "")) {
                    continue;
                  } else {
                    media.Json = [mI];
                    break;
                  }
                }
              }
            }
            if (opts.srcDocId) {
              media.SourceDocumentId = opts.srcDocId;
            } else {
              media.SourceDocumentId = opts.destDocId;
            }
            if (opts.srcParId) {
              media.srcParId = opts.srcParId;
            } else {
              media.srcParId = media.BeginParagraphOrdinal;
            }
            if (opts.srcKeySymbol) {
              media.KeySymbol = opts.srcKeySymbol;
            } else if (media.KeySymbol == null) {
              media.KeySymbol = await executeStatement(opts.db, "SELECT UniqueEnglishSymbol FROM Publication");
              media.KeySymbol = media.KeySymbol[0].UniqueEnglishSymbol.replace(/[0-9]*/g, "");
              media.IssueTagNumber = await executeStatement(opts.db, "SELECT IssueTagNumber FROM Publication");
              media.IssueTagNumber = media.IssueTagNumber[0].IssueTagNumber;
            }
            if (!media.JsonUrl) {
              media.LocalPath = path.join(pubsPath, media.KeySymbol, media.IssueTagNumber, "JWPUB", "contents-decompressed", media.FilePath);
            }
            media.FileType = media.FilePath.split(".").pop();
            media.FileName = media.Caption;
            if (media.Label.length == 0 && media.Caption.length == 0) {
              media.FileName = "Media";
            } else if (media.Label.length > media.Caption.length) {
              media.FileName = media.Label;
            }
            media.FileName = media.FileName + "." + media.FileType;
            media.FileName = sanitizeFilename(media.FileName);
            media.DestPath = path.join(mediaPath, dayjs(opts.week, "YYYYMMDD").format("YYYY-MM-DD"), media.FileName);
            media.relevant = true;
            if (opts.refParStart && opts.refParEnd) {
              media.relevant = false;
              if ((media.BeginParagraphOrdinal >= opts.refParStart && media.EndParagraphOrdinal <= opts.refParEnd) || (media.BeginParagraphOrdinal == 1 && opts.refParStart <= 5)) {
                media.relevant = true;
              }
            }
            if (!prefs.includeTeaching && media.KeySymbol == pubs.thv) {
              media.relevant = false;
            }
            if (!mwMediaForWeek[media.srcParId]) {
              mwMediaForWeek[media.srcParId] = [];
            }
            if (!weekMediaFilesCopied.includes(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId) && media.relevant) {
              mwMediaForWeek[media.srcParId].push(media);
              weekMediaFilesCopied.push(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId);
            }
            if (!dryrun) {
              console.log("%cInclude referenced media from [" + media.KeySymbol + "]: " + media.relevant, (media.relevant ? "background-color: #d4edda; color: #155724;" : "background-color: #f8d7da; color: #721c24;"), "(", media.BeginParagraphOrdinal, media.EndParagraphOrdinal, "/", opts.refParStart, opts.refParEnd, ")", media);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    } catch (err) {
      console.error(err, opts);
    }
  }
  async function getInitialData() {
    await getLanguages();
    await getTranslations();
    configIsValid();
    $("#version").html("v" + remoteApp.getVersion());
    await webdavSetup(true);
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
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
      $("#overlayPleaseWait").fadeOut(animationDuration);
    }
    $("#baseDate button, #baseDate .dropdown-item:eq(0)").html(baseDate.format("YYYY-MM-DD") + " - " + baseDate.clone().add(6, "days").format("YYYY-MM-DD")).val(baseDate.format("YYYY-MM-DD"));
    $("#baseDate .dropdown-item:eq(0)").addClass("active");
    for (var a = 1; a <= 4; a++) {
      $("#baseDate .dropdown-menu").append("<button class=\"dropdown-item\" value=\"" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "\">" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
    }
  }
  async function getJson(opts) {
    var jsonUrl = "";
    if (opts.url) {
      jsonUrl = opts.url;
    } else {
      if (opts.pub == "w" && parseInt(opts.issue) >= 20080101 && opts.issue.slice(-2) == "01") {
        opts.pub = "wp";
      }
      jsonUrl = jwGetPubMediaLinks + "&pub=" + opts.pub + "&fileformat=" + opts.filetype + "&langwritten=" + prefs.lang + ((opts.issue && parseInt(opts.issue) > 0) ? "&issue=" + opts.issue : "") + (opts.track ? "&track=" + opts.track : "");
    }
    let response = null,
      payload = null;
    try {
      payload = await axios.get(jsonUrl);
      response = payload.data;
    } catch (err) {
      console.error(jsonUrl, err, payload);
    }
    return response;
  }
  async function getLanguages() {
    if ((!fs.existsSync(langsFile)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(dayjs().subtract(3, "months")) || dayjs(prefs.langUpdatedLast).isBefore(dayjs("2021-02-04"))) {
      var jwLangs = await getJson({
        url: "https://www.jw.org/en/languages/"
      });
      let cleanedJwLangs = jwLangs.languages.filter(lang => lang.hasWebContent).map(lang => ({
        name: lang.vernacularName + " (" + lang.name + ")",
        langcode: lang.langcode,
        symbol: lang.symbol
      }));
      fs.writeFileSync(langsFile, JSON.stringify(cleanedJwLangs, null, 2));
      prefs.langUpdatedLast = dayjs();
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
      jsonLangs = cleanedJwLangs;
    } else {
      jsonLangs = JSON.parse(fs.readFileSync(langsFile));
    }
    for (var lang of jsonLangs) {
      $("#lang").append($("<option>", {
        value: lang.langcode,
        text: lang.name
      }));
    }
    $("#lang").val(prefs.lang);
    $("#lang").select2();
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
    $("#enterPrefix-" + prefix.length).focus();
    if (prefix.length % 2) {
      prefix = prefix + 0;
    }
    if (prefix.length > 0) {
      prefix = prefix.match(/.{1,2}/g).join("-");
    }
  }
  async function getSong(song) {
    song.JsonUrl = jwGetPubMediaLinks + "&pub=" + song.SongPub + "&langwritten=" + prefs.lang + "&track=" + song.SongNumber;
    song.Json = await getJson({
      url: song.JsonUrl
    });
    song.JsonFiles = [];
    try {
      for (var songs of Object.values(song.Json.files[prefs.lang])) {
        song.JsonFiles = song.JsonFiles.concat(songs);
      }
      for (var mI of Object.values(song.JsonFiles).reverse()) {
        var videoRes = mI.label.replace(/\D/g, "");
        if (videoRes > prefs.maxRes.replace(/\D/g, "")) {
          continue;
        } else {
          song.Json = [mI];
          break;
        }
      }
      song.Filename = sanitizeFilename(((song.FileOrder + 1) * 5).toString().padStart(2, "0") + "-00 " + song.Json[0].title + path.extname(song.Json[0].file.url));
      song.DestPath = path.join(song.DestPath, song.Filename);
      if (song.pureDownload) {
        return song;
      }
      if (dryrun) {
        if (!dryrunResults[path.basename(path.dirname(song.DestPath))]) {
          dryrunResults[path.basename(path.dirname(song.DestPath))] = [];
        }
        dryrunResults[path.basename(path.dirname(song.DestPath))].push({
          basename: song.Filename,
          congSpecific: false,
          recurring: false
        });
      } else {
        if (await downloadRequired({
          json: song.Json,
          onlyFile: true
        }, song.DestPath)) {
          var file = await downloadFile(song.Json[0].file.url);
          fs.writeFileSync(song.DestPath, new Buffer(file));
        }
      }
    } catch(err) {
      console.error(err);
    }
  }
  async function getTranslations() {
    var localeLang = jsonLangs.filter(function (el) {
      return el.langcode == prefs.lang;
    });
    localeLang = localeLang[0];
    i18n.configure({
      directory: path.join(__dirname, "locales"),
      defaultLocale: "en",
      retryInDefaultLocale: true
    });
    if (localeLang) {
      i18n.setLocale(localeLang.symbol);
    }
    $(".i18n").each(function() {
      $(this).html(i18n.__($(this).data("i18n-string")));
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
  function pdfRender(mediaFile, pdf, pageNum) {
    return new Promise((resolve)=>{
      pdf.getPage(pageNum).then(function(page) {
        var mediaFileConverted = path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + "-" + String(pageNum).padStart(2, "0") + ".png");
        $("body").append("<div id='pdf' style='position: absolute; top: 0;'>");
        $("div#pdf").hide().append("<canvas id='pdfCanvas'></canvas>");
        var scale = hdRes[1] / page.getViewport({scale: 1}).height * 2;
        var viewport = page.getViewport({scale: scale});
        var canvas = $("#pdfCanvas")[0];
        canvas.height = hdRes[1] * 2;
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
    for (var pref of ["lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath", "betaMp4Gen", "congServer", "congServerPort", "congServerUser", "congServerPass", "includeTeaching", "openFolderWhenDone", "additionalMediaPrompt", "maxRes", "enableMusicButton"]) {
      if (!(Object.keys(prefs).includes(pref)) || !prefs[pref]) {
        prefs[pref] = null;
      }
    }
    for (var field of ["lang", "outputPath", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir"]) {
      $("#" + field).val(prefs[field]).change();
    }
    for (var checkbox of ["autoStartSync", "autoRunAtBoot", "betaMp4Gen", "autoQuitWhenDone", "includeTeaching", "openFolderWhenDone", "additionalMediaPrompt", "enableMusicButton"]) {
      $("#" + checkbox).prop("checked", prefs[checkbox]).change();
    }
    for (var radioSel of ["mwDay", "weDay", "maxRes"]) {
      $("#" + radioSel + " input[value=" + prefs[radioSel] + "]").prop("checked", true).parent().addClass("active");
    }
  }
  function progressSet(percent, filename, bar) {
    if (!bar) {
      bar = "download";
    }
    if (percent == 100) {
      $("#" + bar + "ProgressContainer").stop().fadeTo(animationDuration, 0);
      $("#" + bar + "Progress div").html("").width("0%");
      $("#" + bar + "Filename").html("&nbsp;");
    } else {
      $("#" + bar + "ProgressContainer").stop().fadeTo(animationDuration, 1);
      $("#" + bar + "Progress div").width(percent + "%");
      $("#" + bar + "Filename").html(filename);
    }
  }
  async function removeHiddenMedia() {
    if (webdavIsAGo && !dryrun) {
      var hiddenFilesFolders = await webdavLs(path.posix.join(prefs.congServerDir, "Hidden"));
      for (var hiddenFilesFolder of hiddenFilesFolders) {
        if (dayjs(path.basename(hiddenFilesFolder.basename), "YYYY-MM-DD").isValid() && dayjs(path.basename(hiddenFilesFolder.basename), "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
          var hiddenFiles = await webdavLs(path.posix.join(prefs.congServerDir, "Hidden", hiddenFilesFolder.basename));
          for (var hiddenFile of hiddenFiles) {
            try {
              fs.unlinkSync(path.join(mediaPath, hiddenFilesFolder.basename, hiddenFile.basename));
              console.log("%cFile deleted [" + hiddenFilesFolder.basename + "]: " + hiddenFile.basename, "background-color: #fff3cd; color: #856404;");
            } catch(err) {
              console.error(err);
            }
          }
        }
      }
    }
  }
  function sanitizeFilename(filename) {
    filename = filename.match(/(\p{Script=Cyrillic}*\p{Script=Latin}*[-. 0-9]*)/ug)
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
        if (chunks.length > 1) {
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
    return filename;
  }
  function setVars() {
    try {
      outputPath = path.join(prefs.outputPath);
      mkdirSync(outputPath);
      langPath = path.join(outputPath, prefs.lang);
      mkdirSync(langPath);
      pubsPath = path.join(langPath, "Publications");
      mkdirSync(pubsPath);
      mediaPath = path.join(langPath, "Media");
      mkdirSync(mediaPath);
      zoomPath = path.join(langPath, "Zoom");
      mkdirSync(zoomPath);
    } catch (err) {
      console.error(err);
    }
  }
  async function webdavCp(src, dest) {
    try {
      if (webdavIsAGo && src && dest) {
        if (await webdavClient.exists(src)) {
          await webdavClient.copyFile(src, dest);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  async function webdavDownloadDir(dir, destDir) {
    try {
      if (webdavIsAGo) {
        var files = await webdavLs(dir);
        for (var file of files) {
          var downloadNeeded = true;
          if (!fs.existsSync(destDir) && !dryrun) {
            mkdirSync(destDir);
          } else if (fs.existsSync(path.join(destDir, file.basename)) && !dryrun) {
            var localSize = fs.statSync(path.join(destDir, file.basename)).size;
            var remoteSize = file.size;
            if (remoteSize == localSize) {
              downloadNeeded = false;
            }
          }
          if (downloadNeeded) {
            if (dryrun) {
              if (!dryrunResults[path.basename(dir)]) {
                dryrunResults[path.basename(dir)] = [];
              }
              dryrunResults[path.basename(dir)].push({
                basename: file.basename,
                congSpecific: true,
                recurring: path.basename(dir) == "Recurring" ? true : false
              });
            } else {
              var remoteFile = new Buffer(await webdavClient.getFileContents(path.posix.join(dir, file.basename)), {
                onDownloadProgress: progressEvent => {
                  var percent = progressEvent.loaded / progressEvent.total * 100;
                  progressSet(percent, file.basename);
                }
              });
              fs.writeFileSync(path.join(destDir, file.basename), remoteFile);
              if (file.size !== fs.statSync(path.join(destDir, file.basename)).size) {
                throw("ERROR", file.basename, "WRONG SIZE");
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
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
        var result = await webdavClient.getDirectoryContents(dir);
        return result;
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
            var percent = progressEvent.loaded / progressEvent.total * 100;
            progressSet(percent, destName, "upload");
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  async function webdavRm(dir, file) {
    try {
      if (webdavIsAGo && dir && file) {
        if (await webdavClient.exists(path.posix.join(dir, file))) {
          await webdavClient.deleteFile(path.posix.join(dir, file));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  async function webdavSetup(initialCheck) {
    $(".webdavHost, .webdavCreds, #congServerDir").removeClass("valid invalid notValidYet");
    $("#webdavStatus").removeClass("text-success text-warning text-danger");
    if (prefs.congServer && prefs.congServer.length > 0) {
      $("#webdavSpinner").parent().fadeTo(animationDuration, 1);
      $(".webdavHost").addClass("notValidYet");
      $("#webdavStatus").removeClass("text-muted").addClass("text-warning");
      var congServerHeartbeat = await isPortReachable(prefs.congServerPort, {
        host: prefs.congServer
      });
      if (prefs.congServerPort && congServerHeartbeat) {
        $("#webdavStatus").addClass("text-success");
      } else {
        $(".webdavHost").addClass("invalid");
        $("#webdavStatus").addClass("text-danger");
      }
      $(".webdavHost").removeClass("notValidYet");
      $(".webdavCreds").addClass("notValidYet");
      if (prefs.congServerPort && prefs.congServerUser && prefs.congServerPass && congServerHeartbeat) {
        $("#webdavStatus").removeClass("text-success text-danger").addClass("text-warning");
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
          $("#webdavStatus").addClass("text-success");
        } catch(err) {
          console.error(err);
          $("#webdavStatus").addClass("text-danger");
          $(".webdavCreds").addClass("invalid");
        }
        $("#webdavStatus").removeClass("text-warning");
        $(".webdavCreds").removeClass("notValidYet");
      }
      $("#specificCong").addClass("d-flex");
      $("#btn-upload").fadeIn(animationDuration);
      var webdavDirIsValid = false;
      if (prefs.congServerDir == null || prefs.congServerDir.length == 0) {
        $("#congServerDir").val("/").change();
      }
      if (webdavLoginSuccessful && !initialCheck) {
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
            $("#webdavFolderList").append("<li>" + (item.type == "directory" ? "<i class=\"fas fa-fw fa-folder-open\"></i> " : "") + item.basename + "</li>");
          }
          if (prefs.congServerDir !== "/") {
            $("#webdavFolderList").prepend("<li><i class=\"fas fa-fw fa-chevron-circle-up\"></i> ../ </li>");
          }
          $("#webdavFolderList").css("column-count", Math.ceil($("#webdavFolderList li").length / 4));
        } catch(err) {
          console.error(err);
        }
        $("#webdavFolderList").fadeTo(animationDuration, 1);
        if (webdavDirIsValid) {
          $("#congServerDir").removeClass("invalid");
          $("#webdavFolderList li").click(function() {
            $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).change();
          });
        } else {
          $("#congServerDir").addClass("invalid");
          $("#webdavFolderList li").click(function() {
            $("#congServerDir").val(path.posix.join("/", $(this).text().trim())).change();
          });
        }
      }
      if ((webdavLoginSuccessful && webdavDirIsValid) || !prefs.congServer || prefs.congServer.length == 0) {
        $(".btn-webdav, #btn-upload").addClass("btn-primary").removeClass("btn-warning");
        $("#specificCong").removeClass("bg-warning");
      }
      if (webdavLoginSuccessful && (initialCheck || webdavDirIsValid)) {
        webdavIsAGo = true;
        $("#btn-upload").fadeTo(animationDuration, 1).prop("disabled", false);
      } else {
        $("#btn-upload, .btn-webdav").addClass("btn-warning").removeClass("btn-primary");
        $("#btn-upload").prop("disabled", true);
        $("#specificCong").addClass("bg-warning");
        webdavIsAGo = false;
      }
      $("#webdavSpinner").parent().fadeTo(animationDuration, 0);
    } else {
      $("#webdavFolderList").fadeTo(animationDuration, 0).empty();
      $(".btn-webdav.btn-warning").addClass("btn-primary").removeClass("btn-warning");
      $("#specificCong").removeClass("d-flex");
      $("#btn-upload").fadeOut(animationDuration);
    }
  }
  async function startMediaSync() {
    $("#statusIcon").addClass("text-primary").removeClass("text-muted");
    stayAlive = false;
    $("#btn-settings, #btn-upload").fadeOut(animationDuration);
    $("#spinnerContainer").fadeTo(animationDuration, 1);
    await setVars();
    await cleanUp([mediaPath]);
    await cleanUp([zoomPath], "brutal");
    await syncMwMeeting();
    await syncWeMeeting();
    await syncCongSpecific();
    await additionalMedia();
    await convertUnusableFiles();
    await ffmpegConvert();
    if (prefs.openFolderWhenDone && !dryrun) {
      var openPath = mediaPath;
      if (prefs.betaMp4Gen) {
        openPath = zoomPath;
      }
      shell.openPath(openPath);
    }
    $("#btn-settings, #btn-upload").fadeIn(animationDuration);
    $("#spinnerContainer").fadeTo(animationDuration, 0);
    setTimeout(() => {
      $(".day, .congregation, .zoom").removeClass("bg-primary bg-danger");
      $("#statusIcon").addClass("text-muted").removeClass("text-primary");
    }, 2000);
  }
  async function syncWeMeeting() {
    $("#day" + prefs.weDay).addClass("bg-warning in-progress");
    try {
      mkdirSync(path.join(pubsPath, pubs.wt));
      var issue = baseDate.clone().subtract(8, "weeks").format("YYYYMM") + "00";
      mkdirSync(path.join(pubsPath, pubs.wt, issue));
      var db = await getDbFromJwpub({
        pub: pubs.wt,
        issue: issue
      });
      var qryWeeks = await executeStatement(db, "SELECT FirstDateOffset FROM DatedText");
      var qryDocuments = await executeStatement(db, "SELECT Document.DocumentId FROM Document WHERE Document.Class=40");
      var weeks = [],
        studyDate, w;
      for (var tempW = 0; tempW < qryWeeks.length; tempW++) {
        studyDate = dayjs(qryWeeks[tempW].FirstDateOffset.toString(), "YYYYMMDD").add(prefs.weDay, "days");
        if (studyDate.isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
          weeks.push(qryWeeks[tempW].FirstDateOffset.toString());
          w = tempW;
        }
      }
      var week = weeks[0];
      if (!week) {
        throw("No WE meeting date!");
      }
      studyDate = dayjs(week, "YYYYMMDD").add(prefs.weDay, "days");
      if (!dryrun) mkdirSync(path.join(mediaPath, studyDate.format("YYYY-MM-DD")));
      var qryLocalMedia = await executeStatement(db, "SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + qryDocuments[w].DocumentId + " AND Multimedia.CategoryType <> 9");
      var qrySongPub = await executeStatement(db, "SELECT EnglishSymbol FROM RefPublication WHERE RefPublicationId = 1");
      qrySongPub = qrySongPub[0].EnglishSymbol;
      var qrySongs = await executeStatement(db, "SELECT * FROM Extract INNER JOIN DocumentExtract ON DocumentExtract.ExtractId = Extract.ExtractId WHERE DocumentId = " + qryDocuments[w].DocumentId + " and Caption LIKE '%" + qrySongPub + "%' ORDER BY BeginParagraphOrdinal");
      var qrySongPubMedia = await executeStatement(db, "SELECT KeySymbol FROM Multimedia Where KeySymbol LIKE '%" + qrySongPub + "%' LIMIT 1");
      qrySongPubMedia = qrySongPubMedia[0].KeySymbol;
      for (var s = 0; s < qrySongs.length; s++) {
        var song = qrySongs[s];
        song.SongNumber = song.Caption.replace(/\D/g, "");
        song.DestPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"));
        song.FileOrder = s;
        song.SongPub = qrySongPubMedia;
        await getSong(song);
      }
      for (var l = 0; l < qryLocalMedia.length; l++) {
        var localMedia = qryLocalMedia[l];
        localMedia.FileType = localMedia.FilePath.split(".").pop();
        if ((localMedia.MimeType.includes("audio") || localMedia.MimeType.includes("video"))) {
          if (localMedia.KeySymbol == null) {
            localMedia.JsonUrl = jwGetPubMediaLinks + "&docid=" + localMedia.MultiMeps + "&langwritten=" + prefs.lang;
          } else {
            localMedia.JsonUrl = jwGetPubMediaLinks + "&pub=" + localMedia.KeySymbol + "&langwritten=" + prefs.lang + "&issue=" + localMedia.IssueTagNumber + "&track=" + localMedia.Track;
          }
          if (localMedia.MimeType.includes("video")) {
            localMedia.JsonUrl = localMedia.JsonUrl + "&fileformat=MP4";
          } else if (localMedia.MimeType.includes("audio")) {
            localMedia.JsonUrl = localMedia.JsonUrl + "&fileformat=MP3";
          }
          var json = await getJson({
            url: localMedia.JsonUrl
          });
          localMedia.Json = Object.values(json.files[prefs.lang])[0];
          if (localMedia.MimeType.includes("video")) {
            for (var mI of localMedia.Json.reverse()) {
              var videoRes = mI.label.replace(/\D/g, "");
              if (videoRes > prefs.maxRes.replace(/\D/g, "")) {
                continue;
              } else {
                localMedia.Json = [mI];
                break;
              }
            }
          }
        }
        localMedia.FileType = localMedia.FilePath.split(".").pop();
        localMedia.FileName = localMedia.Caption;
        if (localMedia.Label.length == 0 && localMedia.Caption.length == 0) {
          localMedia.FileName = "Media";
        } else if (localMedia.Label.length > localMedia.Caption.length) {
          localMedia.FileName = localMedia.Label;
        }
        localMedia.FileName = localMedia.FileName + "." + localMedia.FileType;
        if (!localMedia.JsonUrl) {
          localMedia.LocalPath = path.join(pubsPath, pubs.wt, issue, "JWPUB", "contents-decompressed", localMedia.FilePath);
        }
        localMedia.FileName = await sanitizeFilename("05-" + (l + 1).toString().padStart(2, "0") + " " + localMedia.FileName);
        if (localMedia.Json) {
          localMedia.FileName = "05-" + (l + 1).toString().padStart(2, "0") + " " + localMedia.Json[0].title + "." + path.extname(localMedia.Json[0].file.url);
        }
        localMedia.DestPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"), localMedia.FileName);
        localMedia.SourceDocumentId = qryDocuments[w].DocumentId;
        if (dryrun) {
          if (!dryrunResults[studyDate.format("YYYY-MM-DD")]) {
            dryrunResults[studyDate.format("YYYY-MM-DD")] = [];
          }
          dryrunResults[studyDate.format("YYYY-MM-DD")].push({
            basename: localMedia.FileName,
            congSpecific: false,
            recurring: false
          });
        } else {
          if (localMedia.Json) {
            if (await downloadRequired({
              json: localMedia.Json,
              onlyFile: true
            }, localMedia.DestPath)) {
              var file = await downloadFile(localMedia.Json[0].file.url);
              fs.writeFileSync(localMedia.DestPath, new Buffer(file));
            }
          } else {
            copyFile({
              file: localMedia.LocalPath,
              destFile: localMedia.DestPath,
              type: "copy"
            });
          }
        }
      }
      if (!dryrun) {
        $("#day" + prefs.weDay).addClass("bg-primary");
      }
    } catch(err) {
      console.error(err);
      $("#day" + prefs.weDay).addClass("bg-danger");
    }
    $("#day" + prefs.weDay).removeClass("in-progress bg-warning");
  }
  async function syncMwMeeting() {
    $("#day" + prefs.mwDay).addClass("bg-warning in-progress");
    try{
      mkdirSync(path.join(pubsPath, pubs.mwb));
      var issue = baseDate.format("YYYYMM") + "00";
      if (parseInt(baseDate.format("M")) % 2 == 0) {
        issue = baseDate.clone().subtract(1, "months").format("YYYYMM") + "00";
      }
      mkdirSync(path.join(pubsPath, pubs.mwb, issue));
      var db = await getDbFromJwpub({
        pub: pubs.mwb,
        issue: issue
      });
      var qryWeeks = await executeStatement(db, "SELECT FirstDateOffset FROM DatedText");
      var weeks = [];
      for (var line of qryWeeks) {
        if (dayjs(line.FirstDateOffset.toString(), "YYYYMMDD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
          weeks.push(line.FirstDateOffset.toString());
        }
      }
      var week = weeks[0];
      if (!week) {
        throw("No WE meeting date!");
      }
      var weekDay = dayjs(week, "YYYYMMDD").add(prefs.mwDay, "days");
      mwMediaForWeek = {};
      weekMediaFilesCopied = [];
      var docId = await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + week + "");
      docId = docId[0].DocumentId;
      if (!dryrun) mkdirSync(path.join(mediaPath, weekDay.format("YYYY-MM-DD")));
      await getDocumentMultimedia({
        week: weekDay.format("YYYYMMDD"),
        db: db,
        destDocId: docId
      });
      await getDocumentExtract({
        week: weekDay.format("YYYYMMDD"),
        db: db,
        docId: docId
      });
      var internalRefs = await executeStatement(db, "SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = " + docId + " AND Document.Class <> 94");
      for (var internalRef of internalRefs) {
        await getDocumentMultimedia({
          week: weekDay.format("YYYYMMDD"),
          db: db,
          destDocId: internalRef.DocumentId,
          srcDocId: internalRef.SourceDocumentId,
          srcParId: internalRef.BeginParagraphOrdinal
        });
      }
      for (var wM = 0; wM < Object.keys(mwMediaForWeek).length; wM++) {
        for (var wMI = 0; wMI < Object.values(mwMediaForWeek)[wM].length; wMI++) {
          var weekMediaItem = Object.values(mwMediaForWeek)[wM][wMI];
          if (weekMediaItem.Json) {
            weekMediaItem.FileName = weekMediaItem.Json[0].title + "." + path.extname(weekMediaItem.Json[0].file.url);
          }
          weekMediaItem.FileName = sanitizeFilename((wM + 1).toString().padStart(2, "0") + "-" + (wMI + 1).toString().padStart(2, "0") + " " + weekMediaItem.FileName);
          weekMediaItem.DestPath = path.join(path.dirname(weekMediaItem.DestPath), weekMediaItem.FileName);
          if (dryrun) {
            if (!dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))]) {
              dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))] = [];
            }
            if (!dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))].some(e => e.basename === weekMediaItem.FileName)) {
              dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))].push({
                basename: weekMediaItem.FileName,
                congSpecific: false,
                recurring: false
              });
            }
          } else {
            if (weekMediaItem.Json) {
              if (await downloadRequired({
                json: weekMediaItem.Json,
                onlyFile: true
              }, weekMediaItem.DestPath)) {
                var file = await downloadFile(weekMediaItem.Json[0].file.url);
                fs.writeFileSync(weekMediaItem.DestPath, new Buffer(file));
              }
            } else {
              copyFile({
                file: weekMediaItem.LocalPath,
                destFile: weekMediaItem.DestPath,
                type: "copy"
              });
            }
          }
        }
      }
      if (!dryrun) {
        $("#day" + prefs.mwDay).addClass("bg-primary");
      }
    } catch(err) {
      console.error(err);
      $("#day" + prefs.mwDay).addClass("bg-danger");
    }
    $("#day" + prefs.mwDay).removeClass("in-progress bg-warning");
  }
  async function syncCongSpecific() {
    if (webdavIsAGo) {
      $("#statusIcon").addClass("fa-cloud").removeClass("fa-photo-video");
      $("#specificCong").addClass("bg-warning in-progress");
      try {
        var congSpecificFolders = await webdavLs(path.posix.join(prefs.congServerDir, "Media"));
        for (var folder of congSpecificFolders) {
          var congSpecificFoldersParent = mediaPath;
          var goOn = true;
          if (folder.basename == "Recurring") {
            congSpecificFoldersParent = pubsPath;
          }
          if (dayjs(folder.basename, "YYYY-MM-DD").isValid() && (dayjs(folder.basename, "YYYY-MM-DD").isBefore(baseDate) || dayjs(folder.basename, "YYYY-MM-DD").isAfter(baseDate.clone().add(6, "days")))) {
            goOn = false;
          }
          if (goOn) {
            await webdavDownloadDir(path.posix.join(prefs.congServerDir, "Media", folder.basename), path.join(congSpecificFoldersParent, folder.basename));
          }
        }
        if (fs.existsSync(path.join(pubsPath, "Recurring")) && !dryrun) {
          var recurringFiles = await webdavLs(path.posix.join(prefs.congServerDir, "Media", "Recurring"));
          for (var localRecurringFile of fs.readdirSync(path.join(pubsPath, "Recurring"))) {
            if (recurringFiles.filter(file => file.basename == localRecurringFile).length == 0) {
              fs.unlinkSync(path.join(pubsPath, "Recurring", localRecurringFile));
            }
          }
          for (var recurringFile of fs.readdirSync(path.join(pubsPath, "Recurring"))) {
            for (var meetingDate of fs.readdirSync(path.join(mediaPath))) {
              copyFile({
                file: path.join(pubsPath, "Recurring", recurringFile),
                destFile: path.join(mediaPath, meetingDate, recurringFile),
                type: "copy"
              });
            }
          }
        }
        await removeHiddenMedia();
      } catch (err) {
        console.error(err);
        $("#specificCong").addClass("bg-danger");
      }
      $("#specificCong").removeClass("in-progress bg-warning");
      if (!dryrun) {
        $("#specificCong").addClass("bg-primary");
      }
      $("#statusIcon").addClass("fa-photo-video").removeClass("fa-cloud");
    }
  }
  function toggleScreen(screen, forceShow) {
    var visible = $("#" + screen).is(":visible");
    if (!visible || forceShow) {
      $("#" + screen).slideDown(animationDuration);
    } else {
      $("#" + screen).slideUp(animationDuration);
    }
  }
  function copyFile(opts) {
    if ((fs.existsSync(opts.destFile) && fs.existsSync(opts.file) && fs.statSync(opts.destFile).size !== fs.statSync(opts.file).size) || !fs.existsSync(opts.destFile)) {
      fs.copyFileSync(opts.file, opts.destFile);
      if (fs.statSync(opts.file).size !== fs.statSync(opts.destFile).size) {
        throw("ERROR", opts.destFile, "WRONG SIZE");
      }
    }
  }
  var dropHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    var filesDropped = [];
    for (const f of event.dataTransfer.files) {
      filesDropped.push(f.path);
    }
    if ($("input#typeFile:checked").length > 0) {
      $("#fileToUpload").val(filesDropped.join(" -//- ")).change();
    }
    $(".dropzone").css("display", "none");
  };
  var dragoverHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  var dragenterHandler = () => {
    if ($("input#typeFile:checked").length > 0) {
      $(".dropzone").css("display", "block");
    }
  };
  var dragleaveHandler = (event) => {
    if (event.target.id == "dropzone") {
      $(".dropzone").css("display", "none");
    }
  };
  $("#btnCancelUpload").on("click", () => {
    $("#overlayUploadFile").slideUp(animationDuration);
    $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
    $("#fileList, #fileToUpload, #enterPrefix input").val("").empty().change();
    $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
    dryrun = false;
    document.removeEventListener("drop", dropHandler);
    document.removeEventListener("dragover", dragoverHandler);
    document.removeEventListener("dragenter", dragenterHandler);
    document.removeEventListener("dragleave", dragleaveHandler);
  });
  $("#enterPrefix input, #congServerPort").on("keypress", function(e){
    return e.metaKey || // cmd/ctrl
        e.which <= 0 || // arrow keys
        e.which == 8 || // delete key
        /[0-9]/.test(String.fromCharCode(e.which)); // numbers
  });
  $("#chooseUploadType input").on("change", async function() {
    $(".localOrRemoteFile, .localOrRemoteFileCont, .file-to-upload .select2, #fileToUpload").remove();
    var newElem = "";
    if ($("input#typeSong:checked").length > 0) {
      $(".songsSpinner").show();
      newElem = $("<select class=\"form-control form-control-sm localOrRemoteFile\" id=\"songPicker\" style=\"display: none\">");
      var sjjm = await getJson({
        "pub": "sjjm",
        "filetype": "MP4"
      });
      try {
        var sjjmFiltered = [];
        for (var mI of sjjm.files[prefs.lang].MP4) {
          var videoRes = mI.label.replace(/\D/g, "");
          if (videoRes > prefs.maxRes.replace(/\D/g, "")) {
            continue;
          } else {
            sjjmFiltered.push(mI);
          }
        }
        sjjm = [];
        for (let sjj of sjjmFiltered.reverse()) {
          if(sjjm.filter(function(item) {
            return item.track == sjj.track;
          }).length == 0) {
            sjjm.push(sjj);
          } else {
            continue;
          }
        }
        for (let sjj of sjjm.reverse()) {
          $(newElem).append($("<option>", {
            value: sanitizeFilename(sjj.title) + ".mp4",
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
    } else if ($("input#typeS34:checked").length > 0) {
      $(".songsSpinner").show();
      newElem = $("<select class=\"form-control form-control-sm localOrRemoteFile\" id=\"s34Picker\">");
      var s34Talks = await webdavLs(path.posix.join(prefs.congServerDir, "S-34"));
      if (s34Talks.length == 0) {
        $("label[for=typeS34]").removeClass("active").addClass("disabled");
        $("label[for=typeFile]").click().addClass("active");
        console.error("S-34 path appears unreachable:", path.posix.join(prefs.congServerDir, "S-34"));
      } else {
        s34Talks = s34Talks.sort((a, b) => a.basename.replace(/\D/g,"").localeCompare(b.basename.replace(/\D/g,"")));
        for (var s34Talk of s34Talks) {
          $(newElem).append($("<option>", {
            value: sanitizeFilename(s34Talk.basename),
            text: s34Talk.basename
          }));
        }
        $(newElem).val([]).on("change", async function() {
          var s34Talk = $(this).val();
          if (s34Talk) {
            var s34TalkFiles = await webdavLs(path.posix.join(prefs.congServerDir, "S-34", s34Talk)),
              s34Filenames = [];
            for (var s34TalkFile of s34TalkFiles) {
              s34Filenames.push(s34TalkFile.basename);
            }
            $("#fileToUpload").val(s34Filenames.sort().join(" -//- ")).change();
          }
        });
      }
      $(".songsSpinner").hide();
    }
    if ($("#fileToUpload").length == 0) {
      $(".file-to-upload").append(newElem);
      $("#songPicker, #s34Picker").change();
      $("select#songPicker, select#s34Picker").wrap("<div class='localOrRemoteFileCont'>").select2();
      $("select#s34Picker, select#songPicker").after("<input type=\"hidden\" id=\"fileToUpload\" />");
    }
  });
  var hiddenFiles= [];
  $("#overlayUploadFile").on("change", "#chooseMeeting input", async function() {
    if ($("#chooseMeeting input:checked").length > 0) {
      hiddenFiles = await webdavLs(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")));
    }
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
    if ($("#chooseMeeting input:nth-child(3):checked").length > 0) {
      $("#chooseUploadType input").prop("checked", false).change();
      $("#chooseUploadType label.active").removeClass("active");
      $("input#typeS34, input#typeSong").prop("disabled", false);
      $("label[for=typeS34], label[for=typeSong]").removeClass("disabled").fadeIn(animationDuration);
    } else {
      $("#chooseUploadType input:checked").change();
      $("input#typeS34, input#typeSong").prop("disabled", true);
      $("label[for=typeS34], label[for=typeSong]").fadeOut(animationDuration).addClass("disabled");
      $("label[for=typeFile]").click().addClass("active");
    }
    $(".relatedToUploadType").fadeTo(animationDuration, 1);
  });
  $("#overlayUploadFile").on("keyup", "#enterPrefix input", function() {
    getPrefix();
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
          if (!dryrunResults[$("#chooseMeeting input:checked").prop("id")]) {
            dryrunResults[$("#chooseMeeting input:checked").prop("id")] = [];
          }
          var newList = dryrunResults[$("#chooseMeeting input:checked").prop("id")];
          var newFiles = [];
          if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
            for (var splitFileToUpload of $("#fileToUpload").val().split(" -//- ")) {
              newFiles.push({
                basename: sanitizeFilename(prefix + " " + path.basename(splitFileToUpload)).trim(),
                congSpecific: "soon",
                recurring: false
              });
            }
            newList = newList.concat(newFiles);
          }
          if ("Recurring" in dryrunResults) {
            newList = newList.concat(dryrunResults.Recurring);
          }
          newList = newList.sort((a, b) => a.basename.localeCompare(b.basename));
          $("#fileList").empty();
          for (var file of newList) {
            $("#fileList").append("<li title='" + file.basename + "'>" + file.basename + "</li>");
          }
          $("#fileList").css("column-count", Math.ceil($("#fileList li").length / 8));
          $("#fileList li:contains(mp4)").addClass("video");
          if (newList.some(e => e.congSpecific === true)) {
            for (var a of newList.filter(e => e.congSpecific === true && e.recurring === true)) {
              $("#fileList li").filter(function () {
                var text = $(this).text();
                return text === a.basename;
              }).prepend("<i class='fas fa-fw fa-sync-alt'></i>").addClass("recurring");
            }
            for (var b of newList.filter(e => e.congSpecific === true && e.recurring === false)) {
              $("#fileList li:not(:has(.fa-minus-circle))").filter(function () {
                var text = $(this).text();
                return text === b.basename;
              }).prepend("<i class='fas fa-fw fa-minus-circle'></i>").addClass("canDelete");
            }
            $("#fileList li").on("click", ".fa-minus-circle", function() {
              $(this).parent().addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
              setTimeout(() => {
                $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
              }, 3000);
            });
            $("#fileList li").on("click", ".fa-exclamation-circle", function() {
              webdavRm(path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), $(this).parent().text());
              cleanUp([mediaPath], "brutal");
              $(this).parent().fadeOut(animationDuration, function(){
                $(this).remove();
              });
              for (var elem = 0; elem < dryrunResults[$("#chooseMeeting input:checked").prop("id")].length; elem++) {
                if (dryrunResults[$("#chooseMeeting input:checked").prop("id")][elem].basename == $(this).parent().text()) {
                  dryrunResults[$("#chooseMeeting input:checked").prop("id")].splice(elem, 1);
                }
              }
            });
          }
          for (var c of newList.filter(e => e.congSpecific === false || e.recurring === true)) {
            $("#fileList li:not(:has(.fa-check-square))").filter(function () {
              var text = $(this).text();
              return text === c.basename;
            }).prepend("<i class='far fa-fw fa-check-square'></i>").wrapInner("<span class='canHide'></span>");
          }
          $("#fileList").on("click", ".canHide", function() {
            webdavPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).text().trim());
            $(this).parent()
              .find("span.canHide").contents().unwrap().parent()
              .prepend("<i class='far fa-fw fa-square'></i>")
              .wrapInner("<del class='wasHidden'></del>")
              .find("i.fa-check-square").remove();
          });
          $("#fileList").on("click", ".wasHidden", function() {
            webdavRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).text().trim());
            $(this).parent()
              .find("del.wasHidden").contents().unwrap().parent()
              .prepend("<i class='far fa-fw fa-check-square'></i>")
              .wrapInner("<span class='canHide'></del>")
              .find("i.fa-square").remove();
          });
          for (var hiddenFile of hiddenFiles) {
            $("#fileList li").filter(function () {
              var text = $(this).text();
              return text === hiddenFile.basename;
            }).find("span.canHide").contents().unwrap().parent()
              .prepend("<i class='far fa-fw fa-square'></i>")
              .wrapInner("<del class='wasHidden'></del>")
              .find("i.fa-check-square").remove();
          }
          if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
            for (var newFile of newFiles) {
              $("#fileList li:not(.canDelete):contains(" + sanitizeFilename(newFile.basename) + ")")
                .addClass("new-file")
                .prepend("<i class='fas fa-fw fa-plus'></i>");
              $("#fileList li.canDelete:contains(" + sanitizeFilename(newFile.basename) + ")")
                .addClass("duplicated-file");
            }
            $("#btnUpload").prop("disabled", false);
          } else {
            $("#btnUpload").prop("disabled", true);
          }
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
  $("#btnUpload").on("click", async () => {
    try {
      $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-upload-alt");
      $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", true);
      $("#uploadSpinnerContainer").fadeTo(animationDuration, 1);
      $("#uploadProgressContainer").fadeTo(animationDuration, 1);
      if ($("input#typeS34:checked").length > 0) {
        var s34TalkFiles = await webdavLs(path.posix.join(prefs.congServerDir, "S-34", $("#s34Picker option:selected").val()));
        for (var i = 0; i < s34TalkFiles.length; i++) {
          await webdavCp(s34TalkFiles[i].filename, path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id"), sanitizeFilename(prefix + " " + s34TalkFiles[i].basename).trim()));
          progressSet(((i + 1) / s34TalkFiles.length), s34TalkFiles[i].basename, "upload");
        }
      } else if ($("input#typeSong:checked").length > 0) {
        var meetingSong = {
          "SongNumber": $("#songPicker").val().split(".")[0],
          "DestPath": "",
          "pureDownload": true,
          "SongPub": "sjjm"
        };
        var songData = await getSong(meetingSong);
        var songUrl = songData.Json[0].file.url;
        var songFile = await downloadFile(songUrl, "upload");
        await webdavPut(new Buffer(songFile), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), sanitizeFilename(prefix + " " + $("#songPicker").val()).trim());
      } else {
        var localFile = $("#fileToUpload").val();
        for (var splitLocalFile of localFile.split(" -//- ")) {
          var splitFileToUploadName = sanitizeFilename(prefix + " " + path.basename(splitLocalFile)).trim();
          await webdavPut(fs.readFileSync(splitLocalFile), path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), splitFileToUploadName);
        }
      }
      $("#overlayDryrun").fadeIn(animationDuration, async () => {
        dryrun = true;
        dryrunResults = {};
        await startMediaSync();
        dryrun = false;
        $("#chooseMeeting input:checked").change();
        progressSet(100, null, "upload");
        $("#uploadSpinnerContainer").fadeTo(animationDuration, 0);
        $("#btnUpload").find("i").addClass("fa-cloud-upload-alt").removeClass("fa-circle-notch fa-spin");
        $("#btnCancelUpload, #chooseMeeting input, .relatedToUploadType input, .relatedToUpload select, .relatedToUpload input").prop("disabled", false);
        $("#overlayDryrun").fadeOut(animationDuration);
      });
    } catch (err) {
      console.error(err);
    }
  });
  $("#btn-upload").on("click", function() {
    $("#overlayDryrun").slideDown(animationDuration, async () => {
      dryrun = true;
      dryrunResults = {};
      await startMediaSync();
      dryrun = false;
      $("#chooseMeeting").empty();
      for (var meeting of [prefs.mwDay, prefs.weDay]) {
        let meetingDate = baseDate.add(meeting, "d").format("YYYY-MM-DD");
        $("#chooseMeeting").append("<input type='radio' class='btn-check' name='chooseMeeting' id='" + meetingDate + "' autocomplete='off'><label class='btn btn-outline-primary' for='" + meetingDate + "'>" + meetingDate + "</label>");
      }
      $(".relatedToUpload, .relatedToUploadType").fadeTo(animationDuration, 0);
      $("#overlayUploadFile").fadeIn(animationDuration, () => {
        $("#overlayDryrun").fadeOut(animationDuration);
      });
    });
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
}
