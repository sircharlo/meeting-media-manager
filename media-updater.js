const isPortReachable = require("is-port-reachable"),
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
    console.log(err);
  }
}

checkInternet();

require("electron").ipcRenderer.on("checkInternet", () => {
  checkInternet();
});

require("electron").ipcRenderer.on("hideThenShow", (event, message) => {
  $("#overlay" + message[1]).fadeIn(400, () => {
    $("#overlay" + message[0]).fadeOut();
  });
});

require("electron").ipcRenderer.on("updateDownloadProgress", (event, message) => {
  var dotsDone = Math.floor(parseFloat(message[0]) / 10);
  $("#updatePercent i:nth-of-type(" + dotsDone + ")").addClass("fa-circle text-primary").removeClass("fa-dot-circle");
});

require("electron").ipcRenderer.on("goAhead", () => {
  $("#overlayPleaseWait").fadeIn(400, () => {
    $("#overlayUpdateCheck").fadeOut();
    goAhead();
  });
});

function goAhead() {
  const axios = require("axios"),
    bcrypt = require("bcryptjs"),
    Client = require("ssh2-sftp-client"),
    fs = require("graceful-fs"),
    glob = require("glob"),
    dayjs = require("dayjs"),
    ffmpeg = require("fluent-ffmpeg"),
    os = require("os"),
    path = require("path"),
    {shell} = require("electron"),
    sqljs = require("sql.js"),
    zipper = require("zip-local"),
    appPath = require("electron").remote.app.getPath("userData"),
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
    currentWeekDates = [],
    dryrun = false,
    dryrunResults = {},
    jsonLangs = {},
    langPath,
    mediaPath,
    mwMediaForWeek,
    outputPath,
    pubsPath,
    prefs = {},
    sftpConfig = {},
    sftpIsAGo = false,
    sftpClient,
    stayAlive,
    weekMediaFilesCopied = [],
    zoomPath;

  if (fs.existsSync(prefsFile)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsFile));
    } catch (err) {
      console.log(err);
    }
    prefsInitialize();
  }
  getInitialData();
  dateFormatter();
  $("#outputPath").on("click", function() {
    var path = require("electron").remote.dialog.showOpenDialogSync({
      properties: ["openDirectory"]
    });
    $(this).val(path).change();
  });
  $(".btn-settings, #btn-settings").on("click", function() {
    toggleScreen("overlaySettings");
  });
  $(".btn-sftp").on("click", function() {
    toggleScreen("overlaySftp");
  });
  $("#overlaySettings").on("click", ".btn-clean-up:not(.btn-confirmed)", function() {
    $(".btn-clean-up:not(.btn-confirmed)").addClass("btn-danger btn-confirmed").removeClass("btn-warning").find("i").addClass("fa-exclamation-triangle").removeClass("fa-broom");
    setTimeout(() => {
      $(".btn-clean-up.btn-confirmed").removeClass("btn-danger btn-confirmed").addClass("btn-warning").find("i").addClass("fa-broom").removeClass("fa-exclamation-triangle");
    }, 3000);
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
  $("#overlaySettings").on("click", ".btn-clean-up.btn-confirmed", function() {
    setVars();
    cleanUp([pubsPath, mediaPath, zoomPath], "brutal");
    $(this).addClass("btn-success").removeClass("btn-danger btn-confirmed").prop("disabled", true).find("i").addClass("fa-check-circle").removeClass("fa-exclamation-triangle");
    setTimeout(() => {
      $(".btn-clean-up").removeClass("btn-success").addClass("btn-warning").prop("disabled", false).find("i").addClass("fa-broom").removeClass("fa-check-circle");
    }, 3000);
  });
  $("#overlaySettings input, #overlaySettings select, #overlaySftp input, #overlaySftp select").on("change", function() {
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
      $("#congServerPort, #congServerUser, #congServerPass, #congServerDir, #sftpFolderList").val("").empty().change();
    }
    if ($(this).prop("id").includes("cong")) {
      sftpSetup();
    }
    setVars();
    if ($(this).prop("id").includes("cong") || $(this).prop("id") == "includeTeaching" || $(this).prop("name").includes("Day")) {
      cleanUp([mediaPath], "brutal");
    }
    configIsValid();
  });
  $("#autoRunAtBoot").on("change", function() {
    window.require("electron").remote.app.setLoginItemSettings({
      openAtLogin: prefs.autoRunAtBoot
    });
  });
  $("#mwDay input, #weDay input").on("change", function() {
    $("div.meeting.text-light").removeClass("meeting text-light");
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting text-light");
  });
  $("#mediaSync").on("click", async function() {
    dryrun = false;
    var buttonLabel = $("#mediaSync").html();
    $("#baseDate-dropdown").addClass("disabled");
    $("#mediaSync").prop("disabled", true).addClass("loading").find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-download-alt");
    await startMediaSync();
    if (prefs.autoQuitWhenDone) {
      $("#btnStayAlive").fadeTo(400, 1);
    }
    $("#btnStayAlive").on("click", function() {
      stayAlive = true;
      $("#btnStayAlive").removeClass("text-muted").addClass("text-success");
    });
    $("#overlayComplete").fadeIn(400, () => {
      $("#home, .btn-settings, #btn-settings, #btn-upload").fadeTo(400, 0);
    }).delay(3000).fadeOut(400, () => {
      if (prefs.autoQuitWhenDone && !stayAlive) {
        window.require("electron").remote.app.quit();
      }
      $("#home, .btn-settings, #btn-settings").fadeTo(400, 1);
      if (prefs.congServer && prefs.congServer.length > 0) {
        $("#btn-upload").fadeTo(400, 1);
      }
      $("#btnStayAlive").removeClass("text-success").addClass("text-muted");
    });
    $("#mediaSync").html(buttonLabel).prop("disabled", false).removeClass("loading");
    $("#baseDate-dropdown").removeClass("disabled");
  });
  function additionalMedia() {
    return new Promise((resolve)=>{
      $("#overlayAdditionalFilesPrompt").fadeIn();
      $("#btnNoAdditionalMedia, #btnAdditionalMedia").click(function() {
        $("#overlayAdditionalFilesPrompt").fadeOut();
      });
      $("#btnAdditionalMedia").click(function() {
        $("#overlayAdditionalFilesWaiting").fadeIn();
        shell.openPath(mediaPath);
      });
      $("#btnAdditionalMediaDone").click(function() {
        $("#overlayAdditionalFilesWaiting").fadeOut();
      });
      $("#btnAdditionalMediaDone, #btnNoAdditionalMedia").click(function() {
        resolve();
      });
    });
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
    $("#overlaySettings label.text-danger").removeClass("text-danger");
    var configIsValid = true;
    if ($("#lang option:selected").length == 0) {
      $("#lang").next(".select2").find(".select2-selection").addClass("invalid");
      configIsValid = false;
    }
    for (var elem of ["mwDay", "weDay"]) {
      if ($("#" + elem + " input:checked").length == 0) {
        $("#" + elem).addClass("invalid");
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
    if (prefs.betaMp4Gen) {
      $("#zoomRender").addClass("d-flex");
    } else {
      $("#zoomRender").removeClass("d-flex");
    }
    $("#overlaySettings .invalid").each(function() {
      $(this).closest("div.flex-row").find("label").addClass("text-danger");
    });
    if (configIsValid) {
      $("#mediaSync, .btn-settings").prop("disabled", false);
      $(".btn-settings").addClass("btn-primary").removeClass("btn-danger");
      $("#settingsIcon").addClass("text-muted").removeClass("text-danger");
      return true;
    } else {
      $("#mediaSync, .btn-settings").prop("disabled", true);
      $(".btn-settings").addClass("btn-danger").removeClass("btn-primary");
      $("#settingsIcon").addClass("text-danger").removeClass("text-muted");
      toggleScreen("overlaySettings", true);
      return false;
    }
  }
  function createVideoSync(mediaDir, media){
    return new Promise((resolve,reject)=>{
      var mediaName = path.basename(media, path.extname(media));
      $("#downloadProgressContainer").fadeTo(400, 1);
      if (path.extname(media).includes("mp3")) {
        ffmpeg(path.join(mediaPath, mediaDir, media))
          .on("end", function() {
            return resolve();
          })
          .on("error", function(err) {
            console.log(err.message);
            return reject(err);
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
            console.log(err.message);
            return reject(err);
          })
          .videoCodec("libx264")
          .noAudio()
          .size("?x720")
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
      console.log("Date locale " + locale + " not found, falling back to \"en\"");
    }
    for (var d = 0; d < 7; d++) {
      $("#day" + d + " .dateOfMonth").html(baseDate.clone().add(d, "days").format("DD"));
      $("#day" + d + " .dateOfMonth").prev().html(baseDate.clone().add(d, "days").locale(locale).format("dd"));
      $("#mwDay label:eq(" + d + ")").contents()[2].data = baseDate.clone().add(d, "days").locale(locale).format("dd");
      $("#weDay label:eq(" + d + ")").contents()[2].data = baseDate.clone().add(d, "days").locale(locale).format("dd");
    }
    if (parseInt($("#day" + (dayjs().isoWeekday() - 1) + " .dateOfMonth").html()) == new Date().getDate() && dayjs().isBetween(baseDate, baseDate.clone().add(7, "days"), null, "[)")) {
      $("#day" + (dayjs().isoWeekday() - 1)).addClass("today");
    } else {
      $(".today").removeClass("today");
    }
  }
  async function downloadFile(url) {
    try {
      $("#downloadProgressContainer").fadeTo(400, 1);
      var response = await axios.get(url, {
        responseType: "arraybuffer",
        onDownloadProgress: function(progressEvent) {
          var percent = progressEvent.loaded / progressEvent.total * 100;
          progressSet(percent, path.basename(url));
        }
      });
      return response.data;
    } catch (err) {
      console.log(err);
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
      if (prefs.additionalMediaPrompt) {
        await additionalMedia();
      }
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
      console.log(err, opts, json);
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
      var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType='video/mp4' OR Multimedia.MimeType='audio/mpeg')) OR (Multimedia.MimeType='image/jpeg' AND Multimedia.CategoryType <> 9" + (opts.pub == "th" ? " AND Multimedia.Width <> ''" : "") + "))" + (tableMultimedia == "DocumentMultimedia" ? " ORDER BY BeginParagraphOrdinal" : "");
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
                media.Json = media.Json.filter(function(item) {
                  return item.label == "720p";
                });
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
            console.log(err);
          }
        }
      }
    } catch (err) {
      console.log(err, opts);
    }
  }
  async function getInitialData() {
    await getLanguages();
    configIsValid();
    $("#version span.badge").html("v" + window.require("electron").remote.app.getVersion());
    await sftpSetup();
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting text-light");
    if (prefs.autoStartSync && configIsValid()) {
      var cancelSync = false;
      $("#btnCancelSync").on("click", function() {
        cancelSync = true;
        $("#btnCancelSync").addClass("text-danger fa-stop-circle").removeClass("text-warning fa-pause-circle");
      });
      $("#overlayStarting").fadeIn(400, () => {
        $("#overlayPleaseWait").fadeOut();
      }).delay(3000).fadeOut(400, () => {
        if (!cancelSync) {
          $("#mediaSync").click();
        }
      });
    } else {
      $("#overlayPleaseWait").fadeOut();
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
      console.log(err, payload);
    }
    return response;
  }
  async function getLanguages() {
    if ((!fs.existsSync(langsFile)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(dayjs().subtract(6, "months")) || dayjs(prefs.langUpdatedLast).isBefore(dayjs("2021-02-04"))) {
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
  async function getSong(song) {
    song.JsonUrl = jwGetPubMediaLinks + "&pub=" + song.SongPub + "&langwritten=" + prefs.lang + "&track=" + song.SongNumber;
    song.Json = await getJson({
      url: song.JsonUrl
    });
    var targetLabel = "720p";
    song.JsonFiles = [];
    try {
      for (var songs of Object.values(song.Json.files[prefs.lang])) {
        song.JsonFiles = song.JsonFiles.concat(songs);
      }
      if (Object.values(song.JsonFiles).filter(function(item) {
        return item.label == "720p";
      }).length == 0) {
        targetLabel = "0p";
      }
      song.Json = Object.values(song.JsonFiles).filter(function(item) {
        return item.label == targetLabel;
      });
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
          name: song.Filename,
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
      console.log(err);
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
  function prefsInitialize() {
    for (var pref of ["lang", "mwDay", "weDay", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath", "betaMp4Gen", "congServer", "congServerPort", "congServerUser", "congServerPass", "includeTeaching", "openFolderWhenDone", "additionalMediaPrompt"]) {
      if (!(Object.keys(prefs).includes(pref))) {
        prefs[pref] = null;
      }
    }
    if (prefs.congPass && prefs.congPass.length > 0 && bcrypt.compareSync(prefs.congPass, "$2b$10$Kc4.iOKBP9KXfwQAHUJ0Ieyg0m8EC8nrhPaMigeGPonQ85EMaCJv6")) {
      prefs.congServer = new Buffer("c2lyY2hhcmxvLmhvcHRvLm9yZw==", "base64").toString("ascii");
      prefs.congServerPort = new Buffer("NDMyMzQ=", "base64").toString("ascii");
      prefs.congServerDir = path.posix.join("/", prefs.cong);
      prefs.congServerUser = new Buffer("Y29uZ21lZGlh", "base64").toString("ascii");
      prefs.congServerPass = prefs.congPass;
      delete prefs.congPass;
      delete prefs.cong;
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    }
    for (var field of ["lang", "outputPath", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir"]) {
      $("#" + field).val(prefs[field]).change();
    }
    for (var checkbox of ["autoStartSync", "autoRunAtBoot", "betaMp4Gen", "autoQuitWhenDone", "includeTeaching", "openFolderWhenDone", "additionalMediaPrompt"]) {
      $("#" + checkbox).prop("checked", prefs[checkbox]).change();
    }
    for (var day of ["mwDay", "weDay"]) {
      $("#" + day + " input[value=" + prefs[day] + "]").prop("checked", true).parent().addClass("active");
    }
  }
  function progressSet(percent, filename, bar) {
    if (!bar) {
      bar = "download";
    }
    if (percent == 100) {
      $("#" + bar + "ProgressContainer").fadeTo(400, 0);
      $("#" + bar + "Progress div").html("").width("0%");
      $("#" + bar + "Filename").html("&nbsp;");
    } else {
      $("#" + bar + "Progress div").width(percent + "%");
      $("#" + bar + "Filename").html(filename);
    }
  }
  async function removeHiddenMedia() {
    if (sftpIsAGo && !dryrun) {
      var hiddenFilesFolders = await sftpLs(path.posix.join(prefs.congServerDir, "Hidden"));
      for (var hiddenFilesFolder of hiddenFilesFolders) {
        var hiddenFiles = await sftpLs(path.posix.join(prefs.congServerDir, "Hidden", hiddenFilesFolder.name));
        for (var hiddenFile of hiddenFiles) {
          try {
            fs.unlinkSync(path.join(mediaPath, hiddenFilesFolder.name, hiddenFile.name));
            console.log("%cFile deleted [" + hiddenFilesFolder.name + "]: " + hiddenFile.name, "background-color: #fff3cd; color: #856404;");
          } catch(err) {
            console.log(err);
          }
        }
      }
    }
  }
  function sanitizeFilename(filename) {
    filename = filename.match(/(\p{Script=Cyrillic}*\p{Script=Latin}*[-. 0-9]*)/ug)
      .join("")
      .replace(/[?!"»“«()\\[\]№—$]*/g, "")
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
  }
  async function sftpDownloadDirs(dirs) {
    try {
      if (sftpIsAGo) {
        for (var d = 0; d < dirs.length; d++) {
          var files = await sftpLs(dirs[d][0]);
          for (var file of files) {
            var downloadNeeded = true;
            if (!fs.existsSync(dirs[d][1])) {
              // do nothing
            } else if (fs.existsSync(path.join(dirs[d][1], file.name)) && !dryrun) {
              var localSize = fs.statSync(path.join(dirs[d][1], file.name)).size;
              var remoteSize = file.size;
              if (remoteSize == localSize) {
                downloadNeeded = false;
              }
            }
            if (downloadNeeded) {
              if (dryrun) {
                if (!dryrunResults[path.basename(dirs[d][0])]) {
                  dryrunResults[path.basename(dirs[d][0])] = [];
                }
                dryrunResults[path.basename(dirs[d][0])].push({
                  name: file.name,
                  congSpecific: true,
                  recurring: path.basename(dirs[d][0]) == "Recurring" ? true : false
                });
              } else {
                $("#downloadProgressContainer").fadeTo(400, 1);
                await sftpClient.fastGet(path.posix.join(dirs[d][0], file.name), path.join(dirs[d][1], file.name), {
                  step: function(totalTransferred, chunk, total) {
                    var percent = totalTransferred / total * 100;
                    progressSet(percent, file.name);
                  }
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function sftpLs(dir, force) {
    try {
      if (sftpIsAGo || force == true) {
        if (!await sftpClient.exists(dir)) {
          await sftpClient.mkdir(dir, true);
        }
        var result = await sftpClient.list(dir);
        return result;
      }
    } catch (err) {
      console.log(err);
      throw(err);
    }
  }
  async function sftpPut(file, destFolder, destName) {
    try {
      if (sftpIsAGo) {
        destName = await sanitizeFilename(destName);
        if (!await sftpClient.exists(destFolder)) {
          await sftpClient.mkdir(destFolder, true);
        }
        if (!await sftpClient.exists(path.posix.join(destFolder, destName))) {
          await sftpClient.put(file, path.posix.join(destFolder, destName));
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function sftpRm(dir, file) {
    try {
      if (sftpIsAGo && dir && file) {
        if (await sftpClient.exists(path.posix.join(dir, file))) {
          await sftpClient.delete(path.posix.join(dir, file));
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function sftpSetup() {
    $(".sftpHost, .sftpCreds, #congServerDir").removeClass("valid invalid notValidYet");
    $("#sftpStatus").removeClass("text-success text-warning text-danger");
    if (prefs.congServer && prefs.congServer.length > 0) {
      $("#sftpSpinner").parent().fadeTo(400, 1);
      $(".sftpHost").addClass("notValidYet");
      $("#sftpStatus").removeClass("text-muted").addClass("text-warning");
      var congServerHeartbeat = await isPortReachable(prefs.congServerPort, {
        host: prefs.congServer
      });
      if (prefs.congServerPort && congServerHeartbeat) {
        $("#sftpStatus").addClass("text-success");
      } else {
        $(".sftpHost").addClass("invalid");
        $("#sftpStatus").addClass("text-danger");
      }
      $(".sftpHost").removeClass("notValidYet");
      $(".sftpCreds").addClass("notValidYet");
      if (prefs.congServerPort && prefs.congServerUser && prefs.congServerPass && congServerHeartbeat) {
        $("#sftpStatus").removeClass("text-success text-danger").addClass("text-warning");
        var sftpLoginSuccessful = false;
        sftpConfig = {
          host: prefs.congServer,
          port: prefs.congServerPort,
          username: prefs.congServerUser,
          password: prefs.congServerPass,
          keepaliveInterval: 2000,
          keepaliveCountMax: 20
        };
        try {
          if (typeof sftpClient === "object") {
            sftpClient.end();
          }
          sftpClient = new Client();
          await sftpClient.connect(sftpConfig);
          sftpLoginSuccessful = true;
          $("#sftpStatus").addClass("text-success");
        } catch(err) {
          console.log(err);
          $("#sftpStatus").addClass("text-danger");
          $(".sftpCreds").addClass("invalid");
        }
        $("#sftpStatus").removeClass("text-warning");
        $(".sftpCreds").removeClass("notValidYet");
      }
      $("#specificCong").addClass("d-flex");
      $("#btn-upload").fadeIn();
      var sftpDirIsValid = false;
      if (prefs.congServerDir == null || prefs.congServerDir.length == 0) {
        $("#congServerDir").val("/").change();
      }
      if (sftpLoginSuccessful) {
        $("#sftpFolderList").fadeTo(400, 0);
        try {
          var sftpDestDir = await sftpLs(prefs.congServerDir, true);
          if (sftpDestDir !== undefined) {
            sftpDirIsValid = true;
            $("#sftpFolderList").empty();
            sftpDestDir = sftpDestDir.sort((a, b) => a.name.localeCompare(b.name));
            for (var item of sftpDestDir) {
              $("#sftpFolderList").append("<li>" + (item.type == "d" ? "<i class=\"fas fw fa-folder-open\"></i> " : "") + item.name + "</li>");
            }
            if (prefs.congServerDir !== "/") {
              $("#sftpFolderList").prepend("<li><i class=\"fas fw fa-chevron-circle-up\"></i> ../ </li>");
            }
            $("#sftpFolderList").css("column-count", Math.ceil($("#sftpFolderList li").length / 4));
          }
        } catch(err) {
          console.log(err);
        }
        if (sftpDirIsValid) {
          $("#sftpFolderList").fadeTo(400, 1);
          $("#congServerDir").removeClass("invalid");
          $("#sftpFolderList li").click(function() {
            $("#congServerDir").val(path.posix.join(prefs.congServerDir, $(this).text().trim())).change();
          });
        } else {
          $("#congServerDir").addClass("invalid");
        }
      }
      if ((sftpLoginSuccessful && sftpDirIsValid) || !prefs.congServer || prefs.congServer.length == 0) {
        $(".btn-sftp").addClass("btn-primary").removeClass("btn-warning");
        $("#btn-upload").addClass("btn-light").removeClass("btn-warning");
        $("#specificCong").removeClass("bg-warning");
      }
      if (sftpLoginSuccessful && sftpDirIsValid) {
        sftpIsAGo = true;
        $("#btn-upload").fadeTo(400, 1).prop("disabled", false);
      } else {
        $("#btn-upload, .btn-sftp").addClass("btn-warning").removeClass("btn-dark btn-primary btn-light");
        $("#btn-upload").prop("disabled", true);
        $("#specificCong").addClass("bg-warning");
        sftpIsAGo = false;
      }
      $("#sftpSpinner").parent().fadeTo(400, 0);
    } else {
      $("#sftpFolderList").fadeTo(400, 0).empty();
      $(".btn-sftp.btn-warning").addClass("btn-primary").removeClass("btn-warning");
      $("#specificCong").removeClass("d-flex");
      $("#btn-upload").fadeOut();
    }
  }
  async function sftpUpload(file, destFolder, destName) {
    try {
      if (sftpIsAGo) {
        destName = await sanitizeFilename(destName);
        if (!await sftpClient.exists(destFolder)) {
          await sftpClient.mkdir(destFolder, true);
        }
        await sftpClient.fastPut(file, path.posix.join(destFolder, destName), {
          step: function(totalTransferred, chunk, total) {
            var percent = totalTransferred / total * 100;
            progressSet(percent, destName, "upload");
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function startMediaSync() {
    $("#statusIcon").addClass("text-primary").removeClass("text-muted");
    stayAlive = false;
    $("#btn-settings, #btn-upload").fadeOut();
    $("#spinnerContainer").fadeTo(400, 1);
    await setVars();
    await cleanUp([mediaPath]);
    await cleanUp([zoomPath], "brutal");
    await syncMwMeeting();
    await syncWeMeeting();
    await syncCongSpecific();
    await ffmpegConvert();
    if (prefs.openFolderWhenDone && !dryrun) {
      var openPath = mediaPath;
      if (prefs.betaMp4Gen) {
        openPath = zoomPath;
      }
      shell.openPath(openPath);
    }
    $("#btn-settings, #btn-upload").fadeIn();
    $("#spinnerContainer").fadeTo(400, 0);
    setTimeout(() => {
      $(".day, .congregation, .zoom").removeClass("bg-primary");
      $("#statusIcon").addClass("text-muted").removeClass("text-primary");
    }, 2000);
  }
  async function syncWeMeeting() {
    $("#day" + prefs.weDay).addClass("bg-warning in-progress");
    mkdirSync(path.join(pubsPath, pubs.wt));
    var issue = baseDate.clone().subtract(2, "months").format("YYYYMM") + "00";
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
    studyDate = dayjs(week, "YYYYMMDD").add(prefs.weDay, "days");
    var weekPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"));
    mkdirSync(weekPath);
    currentWeekDates.push(weekPath);
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
          localMedia.Json = localMedia.Json.filter(function(item) {
            return item.label == "720p";
          });
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
          name: localMedia.FileName,
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
    $("#day" + prefs.weDay).removeClass("in-progress bg-warning");
    if (!dryrun) {
      $("#day" + prefs.weDay).addClass("bg-primary");
    }
  }
  async function syncMwMeeting() {
    $("#day" + prefs.mwDay).addClass("bg-warning in-progress");
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
    var weekDay = dayjs(week, "YYYYMMDD").add(prefs.mwDay, "days");
    mwMediaForWeek = {};
    weekMediaFilesCopied = [];
    var docId = await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + week + "");
    docId = docId[0].DocumentId;
    var weekPath = path.join(mediaPath, weekDay.format("YYYY-MM-DD"));
    mkdirSync(weekPath);
    currentWeekDates.push(weekPath);
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
          if (!dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))].some(e => e.name === weekMediaItem.FileName)) {
            dryrunResults[path.basename(path.dirname(weekMediaItem.DestPath))].push({
              name: weekMediaItem.FileName,
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
    $("#day" + prefs.mwDay).removeClass("in-progress bg-warning");
    if (!dryrun) {
      $("#day" + prefs.mwDay).addClass("bg-primary");
    }
  }
  async function syncCongSpecific() {
    if (sftpIsAGo) {
      $("#statusIcon").addClass("fa-network-wired").removeClass("fa-photo-video");
      $("#specificCong").addClass("bg-warning in-progress");
      try {
        var congSpecificFolders = await sftpLs(path.posix.join(prefs.congServerDir, "Media"));
        var dirs = [];
        congSpecificFolders.forEach((folder) => {
          var congSpecificFoldersParent = mediaPath;
          var goOn = true;
          if (folder.name == "Recurring") {
            congSpecificFoldersParent = pubsPath;
          }
          if (dayjs(folder.name, "YYYY-MM-DD").isValid() && (dayjs(folder.name, "YYYY-MM-DD").isBefore(baseDate) || dayjs(folder.name, "YYYY-MM-DD").isAfter(baseDate.clone().add(6, "days")))) {
            goOn = false;
          }
          if (goOn) {
            mkdirSync(path.join(congSpecificFoldersParent, folder.name));
            dirs.push([path.posix.join(prefs.congServerDir, "Media", folder.name), path.join(congSpecificFoldersParent, folder.name)]);
          }
        });
        if (fs.existsSync(path.join(pubsPath, "Recurring"))) {
          var recurringFiles = await sftpLs(path.posix.join(prefs.congServerDir, "Media", "Recurring"));
          for (var localRecurringFile of fs.readdirSync(path.join(pubsPath, "Recurring"))) {
            if (recurringFiles.filter(file => file.name == localRecurringFile).length == 0) {
              fs.unlinkSync(path.join(pubsPath, "Recurring", localRecurringFile));
            }
          }
        }
        await sftpDownloadDirs(dirs);
        if (fs.existsSync(path.join(pubsPath, "Recurring"))) {
          for (var recurringFile of fs.readdirSync(path.join(pubsPath, "Recurring"))) {
            for (var meetingDate of currentWeekDates) {
              copyFile({
                file: path.join(pubsPath, "Recurring", recurringFile),
                destFile: path.join(meetingDate, recurringFile),
                type: "copy"
              });
            }
          }
        }
        await removeHiddenMedia();
      } catch (err) {
        console.log(err);
      }
      $("#specificCong").removeClass("in-progress bg-warning");
      if (!dryrun) {
        $("#specificCong").addClass("bg-primary");
      }
      $("#statusIcon").addClass("fa-photo-video").removeClass("fa-network-wired");
    }
  }
  function toggleScreen(screen, forceShow) {
    var visible = $("#" + screen).is(":visible");
    if (!visible || forceShow) {
      $("#" + screen).slideDown("fast");
    } else {
      $("#" + screen).slideUp("fast");
    }
  }
  function copyFile(opts) {
    if ((fs.existsSync(opts.destFile) && fs.existsSync(opts.file) && fs.statSync(opts.destFile).size !== fs.statSync(opts.file).size) || !fs.existsSync(opts.destFile)) {
      fs.copyFileSync(opts.file, opts.destFile);
    }
  }
  var dropHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    var filesDropped = [];
    for (const f of event.dataTransfer.files) {
      filesDropped.push(f.path);
    }
    if ($("#chooseUploadType label:nth-child(2).active").length > 0) {
      $("#fileToUpload").val(filesDropped.join(" -//- ")).change();
    }
    $(".dropzone").css("display", "none");
  };
  var dragoverHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  var dragenterHandler = () => {
    if ($("#chooseUploadType label:nth-child(2).active").length > 0) {
      $(".dropzone").css("display", "block");
    }
  };
  var dragleaveHandler = (event) => {
    if (event.target.id == "dropzone") {
      $(".dropzone").css("display", "none");
    }
  };
  $("#btn-upload").on("click", function() {
    var prefix = "";
    $("#btnCancelUpload").on("click", () => {
      $("#overlayUploadFile").slideUp();
      $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
      $("#fileList, #fileToUpload, #enterPrefix input").val("").empty().change();
      $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
      dryrun = false;
      document.removeEventListener("drop", dropHandler);
      document.removeEventListener("dragover", dragoverHandler);
      document.removeEventListener("dragenter", dragenterHandler);
      document.removeEventListener("dragleave", dragleaveHandler);
    });
    $("#overlayDryrun").slideDown(400, async () => {
      dryrun = true;
      dryrunResults = {};
      await startMediaSync();
      $("#chooseMeeting").empty();
      for (var meeting of Object.keys(dryrunResults)) {
        if (meeting !== "Recurring") {
          $("#chooseMeeting").append("<label class=\"btn btn-light\"><input type=\"radio\" name=\"chooseMeeting\" id=\"" + meeting + "\" autocomplete=\"off\"> " + meeting + "</label>");
        }
      }
      $(".relatedToUpload, .relatedToUploadType").fadeTo(400, 0);
      $("#enterPrefix input").on("keypress", function(e){
        return e.metaKey || // cmd/ctrl
            e.which <= 0 || // arrow keys
            e.which == 8 || // delete key
            /[0-9]/.test(String.fromCharCode(e.which)); // numbers
      });
      $("#chooseUploadType").on("change", async function() {
        $(".localOrRemoteFile, .localOrRemoteFileCont, .file-to-upload .select2").remove();
        var newElem = "";
        if ($("#chooseUploadType label:nth-child(1) input:checked").length > 0) {
          $(".songsSpinner").show();
          newElem = $("<select class=\"form-control form-control-sm half localOrRemoteFile\" id=\"fileToUpload\">");
          var sjjm = await getJson({
            "pub": "sjjm",
            "filetype": "MP4"
          });
          try {
            sjjm = sjjm.files[prefs.lang].MP4.filter(function(item) {
              return item.label == "720p";
            });
            for (var sjj of sjjm) {
              $(newElem).append($("<option>", {
                value: sanitizeFilename(sjj.title) + ".mp4",
                text: sjj.title
              }));
            }
            $(newElem).val([]);
          } catch (err) {
            $("#chooseUploadType label:nth-child(2)").click();
            $("#chooseUploadType label:nth-child(1)").removeClass("active").addClass("disabled").next().addClass("active");
          }
          $(".songsSpinner").hide();
        } else {
          newElem = "<input type=\"text\" class=\"relatedToUpload form-control form-control-sm half localOrRemoteFile\" id=\"fileToUpload\" required readonly />";
        }
        if ($("#fileToUpload").length == 0) {
          $(".file-to-upload").append(newElem);
          $("#fileToUpload").change();
          $("select#fileToUpload").wrap("<div class='half localOrRemoteFileCont'>").select2();
        }
      });

      function getPrefix() {
        prefix = $("#enterPrefix input").map(function() {
          return $(this).val();
        }).toArray().join("").trim();
        if (prefix.length % 2) {
          prefix = prefix + 0;
        }
        if (prefix.length > 0) {
          prefix = prefix.match(/.{1,2}/g).join("-");
        }
        for (var a0 = 0; a0 <= 4; a0++) {
          if ($("#enterPrefix-" + a0).val().length > 0) {
            for (var a1 = a0 + 1; a1 <= 5; a1++) {
              $("#enterPrefix-" + a1).prop("disabled", false);
            }
            $("#enterPrefix-" + (a0 + 1)).focus();
          } else {
            for (var a2 = a0 + 1; a2 <= 5; a2++) {
              $("#enterPrefix-" + a2).prop("disabled", true);
              $("#enterPrefix-" + a2).val("");
            }
          }
        }
      }
      var hiddenFiles= [];
      $("#overlayUploadFile").on("change", "#chooseMeeting input", async function() {
        hiddenFiles = await sftpLs(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")));
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
        $("#chooseUploadType label input").prop("checked", false);
        $("#fileToUpload").val("");
        if ($("#chooseMeeting label:nth-child(2) input:checked").length > 0) {
          $("#chooseUploadType label.active").removeClass("active");
          $("#chooseUploadType label:nth-child(1) input").prop("disabled", false);
          $("#chooseUploadType label:nth-child(1)").removeClass("disabled").fadeIn();
        } else {
          $("#chooseUploadType label:nth-child(1) input").prop("disabled", true);
          $("#chooseUploadType label:nth-child(1)").fadeOut().addClass("disabled");
          $("#chooseUploadType label:nth-child(2)").click().addClass("active");
        }
        $(".relatedToUploadType").fadeTo(400, 1);
      });
      $("#overlayUploadFile").on("keyup change", "#enterPrefix input", function() {
        getPrefix();
      });
      $("#overlayUploadFile").on("change", "#chooseMeeting input, #chooseUploadType input", function() {
        if ($("#chooseMeeting input:checked").length == 0 || $("#chooseUploadType input:checked").length == 0) {
          $(".relatedToUpload").fadeTo(400, 0);
        } else {
          $(".relatedToUpload").fadeTo(400, 1);
        }
      });
      $("#overlayUploadFile").on("change", "#enterPrefix input, #chooseMeeting input, #fileToUpload", function() {
        try {
          if ($("#chooseMeeting input:checked").length > 0) {
            $("#fileList").fadeTo(400, 0, () => {
              var newList = dryrunResults[$("#chooseMeeting input:checked").prop("id")];
              var newFiles = [];
              if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
                for (var splitFileToUpload of $("#fileToUpload").val().split(" -//- ")) {
                  newFiles.push({
                    name: sanitizeFilename(prefix + " " + path.basename(splitFileToUpload)).trim(),
                    congSpecific: "soon",
                    recurring: false
                  });
                }
                newList = newList.concat(newFiles);
              }
              if ("Recurring" in dryrunResults) {
                newList = newList.concat(dryrunResults.Recurring);
              }
              newList = newList.sort((a, b) => a.name.localeCompare(b.name));
              $("#fileList").empty();
              for (var file of newList) {
                $("#fileList").append("<li title='" + file.name + "'>" + file.name + "</li>");
              }
              $("#fileList").css("column-count", Math.ceil($("#fileList li").length / 4));
              $("#fileList li:contains(mp4)").addClass("video");
              if (newList.some(e => e.congSpecific === true)) {
                for (var a of newList.filter(e => e.congSpecific === true && e.recurring === true)) {
                  $("#fileList li").filter(function () {
                    var text = $(this).text();
                    return text === a.name;
                  }).prepend("<i class='fas fw fa-sync-alt'></i>");
                }
                for (var b of newList.filter(e => e.congSpecific === true && e.recurring === false)) {
                  $("#fileList li").filter(function () {
                    var text = $(this).text();
                    return text === b.name;
                  }).prepend("<i class='fas fw fa-minus-circle'></i>");
                }
                $("#fileList li").on("click", ".fa-minus-circle", function() {
                  $(this).parent().addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
                  setTimeout(() => {
                    $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
                  }, 3000);
                });
                $("#fileList li").on("click", ".fa-exclamation-circle", function() {
                  sftpRm(path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), $(this).parent().text());
                  $(this).parent().fadeOut(300, function(){
                    $(this).remove();
                  });
                  for (var elem = 0; elem < dryrunResults[$("#chooseMeeting input:checked").prop("id")].length; elem++) {
                    if (dryrunResults[$("#chooseMeeting input:checked").prop("id")][elem].name == $(this).parent().text()) {
                      dryrunResults[$("#chooseMeeting input:checked").prop("id")].splice(elem, 1);
                    }
                  }
                });
              }
              for (var c of newList.filter(e => e.congSpecific === false && e.recurring === false)) {
                $("#fileList li").filter(function () {
                  var text = $(this).text();
                  return text === c.name;
                }).prepend("<i class='fas fw fa-eye'></i>").wrapInner("<span class='canHide'></span>");
              }
              $("#fileList").on("click", ".canHide", function() {
                sftpPut(Buffer.from("hide", "utf-8"), path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).text().trim());
                $(this).parent()
                  .find("span.canHide").contents().unwrap().parent()
                  .prepend("<i class='fas fw fa-eye-slash'></i>")
                  .wrapInner("<del class='wasHidden'></del>")
                  .addClass("text-secondary")
                  .find("i.fa-eye").remove();
              });
              $("#fileList").on("click", ".wasHidden", function() {
                sftpRm(path.posix.join(prefs.congServerDir, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).text().trim());
                $(this).parent()
                  .find("del.wasHidden").contents().unwrap().parent()
                  .prepend("<i class='fas fw fa-eye'></i>")
                  .wrapInner("<span class='canHide'></del>")
                  .removeClass("text-secondary")
                  .find("i.fa-eye-slash").remove();
              });
              for (var hiddenFile of hiddenFiles) {
                $("#fileList li").filter(function () {
                  var text = $(this).text();
                  return text === hiddenFile.name;
                }).find("span.canHide").contents().unwrap().parent()
                  .prepend("<i class='fas fw fa-eye-slash'></i>")
                  .wrapInner("<del class='wasHidden'></del>")
                  .addClass("text-secondary")
                  .find("i.fa-eye").remove();
              }
              if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
                for (var newFile of newFiles) {
                  $("#fileList li:contains(" + sanitizeFilename(newFile.name) + ")").addClass("text-primary new-file");
                }
                $("#btnUpload").prop("disabled", false);
              } else {
                $("#btnUpload").prop("disabled", true);
              }
              $("#fileList").fadeTo(400, 1);
            });
          }
        } catch (err) {
          console.log(err);
        }
      });
      $("#overlayUploadFile").fadeIn(400, () => {
        $("#overlayDryrun").fadeOut();
      });
    });
    $("#btnUpload").on("click", async () => {
      try {
        $("#btnUpload").prop("disabled", true).find("i").addClass("fa-circle-notch fa-spin").removeClass("fa-cloud-upload-alt");
        $("#btnCancelUpload").prop("disabled", true);
        $("#uploadSpinnerContainer").fadeTo(400, 1);
        var localOrRemoteFile = $("#fileToUpload").val();
        if ($("#chooseUploadType label:nth-child(1) input:checked").length > 0) {
          var meetingSong = {
            "SongNumber": $("#fileToUpload").val().split(".")[0],
            "DestPath": "",
            "pureDownload": true,
            "SongPub": "sjjm"
          };
          localOrRemoteFile = await getSong(meetingSong);
          var remoteUrl = localOrRemoteFile.Json[0].file.url;
          localOrRemoteFile = await downloadFile(remoteUrl);
          var tmpSong = path.join(os.tmpdir(), $("#fileToUpload").val());
          fs.writeFileSync(tmpSong, new Buffer(localOrRemoteFile));
          localOrRemoteFile = tmpSong;
        }
        $("#uploadProgressContainer").fadeTo(400, 1);
        var localOrRemoteFileOrig = localOrRemoteFile;
        localOrRemoteFile = [];
        if ($("#chooseUploadType label:nth-child(1) input:checked").length == 0) {
          for (var splitLocalOrRemoteFile of localOrRemoteFileOrig.split(" -//- ")) {
            localOrRemoteFile.push(splitLocalOrRemoteFile);
          }
        } else {
          localOrRemoteFile.push(localOrRemoteFileOrig);
        }
        for (var splitFileToUpload of localOrRemoteFile) {
          var splitFileToUploadName = sanitizeFilename(prefix + " " + path.basename(splitFileToUpload)).trim();
          await sftpUpload(splitFileToUpload, path.posix.join(prefs.congServerDir, "Media", $("#chooseMeeting input:checked").prop("id")), splitFileToUploadName);
          $("#fileList li:contains(" + splitFileToUploadName + ")").removeClass("new-file text-primary").prepend("<i class='fas fw fa-minus-circle'></i>");
          dryrunResults[$("#chooseMeeting input:checked").prop("id")].push({
            name: splitFileToUploadName,
            congSpecific: true,
            recurring: false
          });
        }
        $("#uploadSpinnerContainer").fadeTo(400, 0);
        $("#btnUpload").find("i").addClass("fa-cloud-upload-alt").removeClass("fa-circle-notch fa-spin");
        $("#btnCancelUpload").prop("disabled", false);
        $("#fileToUpload, #enterPrefix input").val("").empty();
        $("#chooseUploadType input:checked").prop("checked", false);
        $("#chooseUploadType .active").removeClass("active");
      } catch (err) {
        console.log(err);
      }
    });
  });
  $("#overlayUploadFile").on("click", "input#fileToUpload", function() {
    var path = require("electron").remote.dialog.showOpenDialogSync({
      properties: ["multiSelections"]
    });
    if (typeof path !== "undefined") {
      $(this).val(path.join(" -//- ")).change();
    } else {
      $(this).val("");
    }
  });
}
