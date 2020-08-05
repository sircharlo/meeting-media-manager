/*jshint esversion: 8, node: true */
const ping = require('ping');

async function checkInternet() {
  try {
    let res = await ping.promise.probe("www.google.com");
    if (res.alive) {
      require('electron').ipcRenderer.send('autoUpdate');
    } else {
      require('electron').ipcRenderer.send('noInternet');
    }
  } catch (err) {
    console.log(err);
  }
}

checkInternet();

require('electron').ipcRenderer.on('checkInternet', () => {
  checkInternet();
});

require('electron').ipcRenderer.on('hideThenShow', (event, message) => {
  $("#overlay" + message[1]).fadeIn(400, () => {
    $("#overlay" + message[0]).fadeOut();
  });
});

require('electron').ipcRenderer.on('updateDownloadProgress', (event, message) => {
  $("#updatePercent").html(message[0].toFixed(0) + "% done (about " + message[1] + " second" + (message[1] !== "1" ? "s" : "") + " left)");
});

require('electron').ipcRenderer.on('goAhead', () => {
  $("#overlay" + "PleaseWait").fadeIn(400, () => {
    $("#overlay" + "UpdateCheck").fadeOut();
    goAhead();
  });
});

function decode(e) {
  return new Buffer(e, "base64").toString("ascii");
}

function goAhead() {
  const axios = require('axios');
  const bcrypt = require('bcryptjs');
  const extract = require('extract-zip');
  const fs = require("graceful-fs");
  const glob = require("glob");
  const moment = require("moment");
  const os = require("os");
  const path = require("path");
  const sqljs = require('sql.js');

  const jwGetPubMediaLinks = "https://apps.jw.org/GETPUBMEDIALINKS?output=json";

  const congSpecificServer = {
    host: decode("c2lyY2hhcmxvLmhvcHRvLm9yZw=="),
    port: decode("NDMyMzQ=")
  };
  const pubs = {
    wt: "w",
    mwb: "mwb"
  };
  var sftpConfig = {};
  const congHash = "$2b$10$Kc4.iOKBP9KXfwQAHUJ0Ieyg0m8EC8nrhPaMigeGPonQ85EMaCJv6";
  const sftpRootDir = decode("L21lZGlhL3BsZXgvTWVkaWEtTGludXgvUHVibGljL2ZpbGVzL01XLU1lZGlhLUZldGNoZXIvVS8=");
  var prefs = {};

  const appPath = require('electron').remote.app.getPath("userData");
  const langsFile = path.join(appPath, "langs.json");
  const prefsFile = path.join(appPath, "prefs.json");

  if (!fs.existsSync(prefsFile)) {
    doMaintenance();
  }

  function prefsInitialize() {
    for (var pref of ["lang", "mwDay", "weDay", "cong", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath"]) {
      if (!(Object.keys(prefs).includes(pref))) {
        prefs[pref] = false;
      }
    }
  }

  if (fs.existsSync(prefsFile)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsFile));
    } catch (err) {
      console.log(err);
    }
    if (!prefs.lastMaintenance) {
      doMaintenance();
    }
    prefsInitialize();
    $("#lang").val(prefs.lang);
    $("#outputPath").val(prefs.outputPath);
    $("#mwDay").val(prefs.mwDay).change();
    $("#weDay").val(prefs.weDay).change();
    $("#cong").val(prefs.cong).change();
    $("#congPass").val(prefs.congPass);
    $("#autoStartSync").prop("checked", prefs.autoStartSync).change();
    $("#autoRunAtBoot").prop("checked", prefs.autoRunAtBoot).change();
    $("#autoQuitWhenDone").prop("checked", prefs.autoQuitWhenDone).change();
    $(".btn-group button input:checked").parent().addClass("text-success");
    $(".btn-group button input:not(:checked)").parent().removeClass("text-success");
    $(".btn-group button input:checked").parent().find("i").addClass("fa-toggle-on").removeClass("fa-toggle-off");
    $(".btn-group button input:not(:checked)").parent().find("i").addClass("fa-toggle-off").removeClass("fa-toggle-on");

  } else {
    configIsValid();
  }

  async function congFetch() {
    if ($('#congPass').val().length > 0 && bcrypt.compareSync($('#congPass').val(), congHash)) {
      $('#congPass').addClass("valid");
      $('#congs').fadeIn(400, function() {
        $('#congs').css("visibility", "visible");
        $('#congsSpinner').fadeIn(400, async function() {
          sftpConfig = {
            host: congSpecificServer.host,
            port: congSpecificServer.port,
            username: $('#congPass').val(),
            password: $('#congPass').val(),
            keepaliveInterval: 2000,
            keepaliveCountMax: 20
          };
          var congs = await sftpLs(path.posix.join(sftpRootDir, "Congregations"));
          for (var cong of congs) {
            $('#congSelect').append($("<option>", {
              value: cong.name,
              text: cong.name
            }));
          }
          $('#congSelect').val($('#cong').val());
          $('#congSelect').select2();
          $('#congsSpinner').fadeOut(400, () => {
            $("#congContainer").fadeIn();
          });
          configIsValid();
        });
      });
    } else {
      if ($('#congPass').val().length == 0) {
        $('#congPass').removeClass("invalid valid");
      } else {
        $('#congPass').addClass("invalid");
      }
      $('#congs').fadeOut(400, () => {
        $('#congs').css("visibility", "hidden");
        $('#congSelect option[value!="None"]').remove();
        $("#congContainer").fadeOut();
        $('#congSelect').prop("selectedIndex", 0).change();
      });
    }
  }

  async function getInitialData() {
    await getLanguages();
    $("#version span.badge").html("Version " + window.require('electron').remote.app.getVersion());
    await congFetch();
    $('#mwDay').select2();
    $('#weDay').select2();
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
    if (prefs.cong.length > 0 && prefs.cong !== "None") {
      $("#specificCong").addClass("d-flex").html(prefs.cong);
    }
    $(".select2-selection").each(function() {
      if ($(this).text().trim() == "") {
        $(this).addClass("invalid");
      } else {
        $(this).removeClass("invalid");
      }
    });
    if (prefs.autoStartSync && configIsValid()) {
      var cancelSync = false;
      $("#btnCancelSync").on("click", function() {
        cancelSync = true;
        $("#btnCancelSync").removeClass("btn-warning").addClass("btn-success");
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
  }

  async function getLanguages() {
    if ((!fs.existsSync(langsFile)) || (!prefs.langUpdatedLast) || moment(prefs.langUpdatedLast).isSameOrBefore(moment().subtract(6, "months"))) {
      var jwLangs = await getJson({
        url: "https://www.jw.org/en/languages/"
      });
      let cleanedJwLangs = jwLangs.languages.filter(lang => lang.hasWebContent).map(lang => ({
        name: lang.name,
        langcode: lang.langcode
      }));
      fs.writeFileSync(langsFile, JSON.stringify(cleanedJwLangs, null, 2));
      prefs.langUpdatedLast = moment();
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    }
    var jsonLangs = JSON.parse(fs.readFileSync(langsFile));
    for (var lang of jsonLangs) {
      $('#langSelect').append($("<option>", {
        value: lang.langcode,
        text: lang.name
      }));
    }
    $('#langSelect').val($('#lang').val());
    $('#langSelect').select2();
  }

  function configIsValid() {
    $("#overlaySettings .select2-selection").each(function() {
      if ($(this).text().trim() == "") {
        $(this).addClass("invalid");
      } else {
        $(this).removeClass("invalid");
      }
    });
    if ($("#outputPath").val().length == 0 || !$("#outputPath").val() || $("#outputPath").val() == "false" || !fs.existsSync($("#outputPath").val())) {
      $("#outputPath").val("");
      $("#outputPath").addClass("invalid");
    } else {
      $("#outputPath").removeClass("invalid");
    }
    if (!$("#lang").val() || !$("#mwDay").val() || !$("#weDay").val() || ($("#congPass").val().length > 0 && (!$("#cong").val() || !bcrypt.compareSync($('#congPass').val(), congHash))) || !$("#outputPath").val()) {
      $("#mediaSync, .btn-settings").prop("disabled", true);
      $("#mediaSync").addClass("btn-secondary").removeClass("btn-primary");
      $(".btn-settings").addClass("btn-danger").removeClass("btn-primary");
      settingsScreen(true);
      return false;
    } else {
      $("#mediaSync, .btn-settings").prop("disabled", false);
      $("#mediaSync").addClass("btn-primary").removeClass("btn-secondary");
      $(".btn-settings").addClass("btn-primary").removeClass("btn-danger");
      return true;
    }
  }

  var mwMediaForWeek, baseDate, weekMediaFilesCopied = [];

  getInitialData();
  $("#outputPath").on('click', function() {
    var path = require('electron').remote.dialog.showOpenDialogSync({
      properties: ['openDirectory']
    });
    $(this).val(path).change();
  });
  $(".btn-settings").on('click', function() {
    settingsScreen();
  });
  $("#overlaySettings *").on('change', function() {
    $("#lang").val($("#langSelect").val());
    $("#cong").val($("#congSelect").val());
    $(".btn-group button input:checked").parent().addClass("text-success");
    $(".btn-group button input:not(:checked)").parent().removeClass("text-success");
    $(".btn-group button input:checked").parent().find("i").addClass("fa-toggle-on").removeClass("fa-toggle-off");
    $(".btn-group button input:not(:checked)").parent().find("i").addClass("fa-toggle-off").removeClass("fa-toggle-on");
    prefs.lang = $("#langSelect").val();
    prefs.mwDay = $("#mwDay").val();
    prefs.weDay = $("#weDay").val();
    prefs.congPass = $("#congPass").val();
    prefs.cong = $("#congSelect").val();
    prefs.outputPath = $("#outputPath").val();
    prefs.autoStartSync = $("#autoStartSync").prop("checked");
    prefs.autoRunAtBoot = $("#autoRunAtBoot").prop("checked");
    prefs.autoQuitWhenDone = $("#autoQuitWhenDone").prop("checked");
    $(".day, .congregation").removeClass("meeting bg-success");
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
    $("#specificCong").html(prefs.cong);
    if (prefs.cong.length > 0 && prefs.cong !== "None") {
      $("#specificCong").addClass("d-flex");
    } else {
      $("#specificCong").removeClass("d-flex")
    }
    fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    window.require('electron').remote.app.setLoginItemSettings({
      openAtLogin: prefs.autoRunAtBoot
    });
    configIsValid();
  });

  $("#overlaySettings #congPass").on('change', async function() {
    await congFetch();
  });
  $("#mediaSync").on('click', async function() {
    var stayAlive = false;
    $("#mediaSync").prop("disabled", true);
    $("#mediaSync").addClass("btn-secondary").removeClass("btn-primary");
    $(".btn-settings").fadeOut();
    var buttonLabel = $("#mediaSync").html();
    $("#mediaSync").addClass("loading").html('Sync in progress<span>.</span><span>.</span><span>.</span>');
    await startMediaSync();
    if (prefs.autoQuitWhenDone) {
      $("#stayAlive").show();
    }
    $("#btnStayAlive").on("click", function() {
      stayAlive = true;
      $("#btnStayAlive").removeClass("btn-warning").addClass("btn-success");
    });
    $("#overlayComplete").fadeIn(400, () => {
      $("#home, .btn-settings").fadeTo(400, 0);
    }).delay(3000).fadeOut(400, () => {
      if (prefs.autoQuitWhenDone && !stayAlive) {
        window.require('electron').remote.app.quit();
      }
      $("#home, .btn-settings").fadeTo(400, 1);
      $("#btnStayAlive").removeClass("btn-success").addClass("btn-warning");
    });
    $("#mediaSync").html(buttonLabel);
    $("#mediaSync").prop("disabled", false);
    $("#mediaSync").addClass("btn-primary").removeClass("btn-secondary loading");
    $(".btn-settings").fadeIn();
    status("main", "Push the big blue button!");
  });

  async function startMediaSync() {
    await setVars();
    await cleanUp();
    await syncMwMeeting();
    await syncWeMeeting();
    await syncCongSpecific();
  }

  // Main functions

  function setVars() {
    outputPath = path.join(prefs.outputPath);
    mkdirSync(outputPath);
    baseDate = moment().startOf('isoWeek');
    langPath = path.join(outputPath, prefs.lang);
    mkdirSync(langPath);
    pubsPath = path.join(langPath, "Publications");
    mkdirSync(pubsPath);
    mediaPath = path.join(langPath, "Media");
    mkdirSync(mediaPath);
  }

  async function syncWeMeeting() {
    status("main", "Retrieving media for the weekend meeting...");
    $("#day" + prefs.weDay).addClass("bg-info in-progress");
    var weDates = [baseDate.clone().subtract(2, "months"), baseDate.clone().subtract(1, "months")];
    for (var weDate of weDates) {
      mkdirSync(path.join(pubsPath, pubs.wt));
      var issue = weDate.format("YYYYMM") + "00";
      mkdirSync(path.join(pubsPath, pubs.wt, issue));
      var db = await getDbFromJwpub({
        pub: pubs.wt,
        issue: issue
      });
      var qryWeeks = await executeStatement(db, "SELECT FirstDateOffset FROM DatedText");
      var qryDocuments = await executeStatement(db, "SELECT Document.DocumentId FROM Document WHERE Document.Class=40");
      var weeks = [];
      for (var line of qryWeeks) {
        weeks.push(line.FirstDateOffset);
      }
      for (var w = 0; w < weeks.length; w++) {
        var week = weeks[w];
        var studyDate = moment(week, "YYYYMMDD").add(prefs.weDay, "days");
        if (studyDate.isSameOrAfter(baseDate, "day") && studyDate.isSameOrBefore(baseDate.clone().add(1, "week"), "day")) {
          var weekPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"));
          mkdirSync(weekPath);
          var qryLocalMedia = await executeStatement(db, "SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + qryDocuments[w].DocumentId + " AND Multimedia.CategoryType <> 9");
          var qrySongs = await executeStatement(db, "SELECT * FROM Extract INNER JOIN DocumentExtract ON DocumentExtract.ExtractId = Extract.ExtractId WHERE DocumentId = " + qryDocuments[w].DocumentId + " and Caption LIKE '%sjj%' ORDER BY BeginParagraphOrdinal");
          for (var s = 0; s < qrySongs.length; s++) {
            var song = qrySongs[s];
            song.SongNumber = song.Caption.replace(/\D/g, "");
            song.DestPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"));
            song.FileOrder = s;
            await getSong(song);
          }
          qryLocalMedia.forEach(function(localMedia, l) {
            localMedia.FileType = localMedia.FilePath.split(".").pop();
            localMedia.FileName = localMedia.Caption;
            if (localMedia.Label.length == 0 && localMedia.Caption.length == 0) {
              localMedia.FileName = "Media";
            } else if (localMedia.Label.length > localMedia.Caption.length) {
              localMedia.FileName = localMedia.Label;
            }
            localMedia.FileName = localMedia.FileName + "." + localMedia.FileType;
            localMedia.LocalPath = path.join(pubsPath, pubs.wt, issue, "JWPUB", "contents-decompressed", localMedia.FilePath);
            localMedia.FileName = sanitizeFilename((l + 1 + 50).toString().padStart(3, '0') + " " + localMedia.FileName);
            localMedia.DestPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"), localMedia.FileName);
            localMedia.SourceDocumentId = qryDocuments[w].DocumentId;
            writeFile({
              sync: true,
              file: localMedia.LocalPath,
              destFile: localMedia.DestPath,
              type: "copy"
            });
          });
          $("#day" + prefs.weDay).addClass("bg-success").removeClass("bg-info in-progress");
        }
      }
    }
  }

  async function syncMwMeeting() {
    status("main", "Retrieving media for the midweek meeting...");
    $("#day" + prefs.mwDay).addClass("bg-info in-progress");
    var mwDates = [baseDate, baseDate.clone().add(1, "months")];
    for (var mwDate of mwDates) {
      mkdirSync(path.join(pubsPath, pubs.mwb));
      var issue = mwDate.format("YYYYMM") + "00";
      mkdirSync(path.join(pubsPath, pubs.mwb, issue));
      var db = await getDbFromJwpub({
        pub: pubs.mwb,
        issue: issue
      });
      var qryWeeks = await executeStatement(db, "SELECT FirstDateOffset FROM DatedText");
      var weeks = [];
      for (var line of qryWeeks) {
        weeks.push(line.FirstDateOffset);
      }
      for (w = 0; w < weeks.length; w++) {
        var week = weeks[w];
        var weekDay = moment(weeks[w], "YYYYMMDD").add(prefs.mwDay, "day");
        mwMediaForWeek = {};
        weekMediaFilesCopied = [];
        if (moment(week, "YYYYMMDD").isSameOrAfter(baseDate, "day") && moment(week, "YYYYMMDD").isBefore(baseDate.clone().add(1, "week"), "day")) {
          var docId = await executeStatement(db, "SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + week + "");
          docId = docId[0].DocumentId;
          var weekPath = path.join(mediaPath, weekDay.format("YYYY-MM-DD"));
          mkdirSync(weekPath);
          var mediaExternal = await getDocumentMultimedia({
            week: weekDay.format("YYYYMMDD"),
            db: db,
            destDocId: docId
          });
          var mediaReferenced = await getDocumentExtract({
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
              weekMediaItem.FileName = sanitizeFilename((wM + 1).toString().padStart(2, '0') + "-" + (wMI + 1).toString().padStart(2, '0') + " " + weekMediaItem.FileName);
              weekMediaItem.DestPath = path.join(path.dirname(weekMediaItem.DestPath), weekMediaItem.FileName);
              if (weekMediaItem.Json) {
                if (await downloadRequired({
                    json: weekMediaItem.Json,
                    onlyFile: true
                  }, weekMediaItem.DestPath)) {
                  var file = await downloadFile(weekMediaItem.Json[0].file.url);
                  writeFile({
                    sync: true,
                    file: new Buffer(file),
                    destFile: weekMediaItem.DestPath
                  });
                }
              } else {
                writeFile({
                  sync: true,
                  file: weekMediaItem.LocalPath,
                  destFile: weekMediaItem.DestPath,
                  type: "copy"
                });
              }
            }
          }
          $("#day" + prefs.mwDay).addClass("bg-success").removeClass("bg-info in-progress");
        }
      }
    }
  }

  async function syncCongSpecific() {
    if (prefs.cong !== "None") {
      status("main", "Retrieving any congregation-specific files...");
      $("#specificCong").addClass("bg-info in-progress");
      try {
        var congSpecificFolders = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media"));
        var dirs = [];
        congSpecificFolders.forEach((folder, f) => {
          dirs.push([path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media", folder.name), path.join(mediaPath, folder.name)]);
        });
        await sftpDownloadDirs(dirs);
      } catch (err) {
        console.log(err);
      }
      $("#specificCong").addClass("bg-success").removeClass("bg-info in-progress");
    }
  }

  function cleanUp() {
    const getDirectories = source =>
      fs.readdirSync(source, {
        withFileTypes: true
      })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    var mediaSubDirs = getDirectories(mediaPath);
    for (var mediaSubDir of mediaSubDirs) {
      if (moment(mediaSubDir, "YYYY-MM-DD").isValid() && moment(mediaSubDir, "YYYY-MM-DD").isBefore(baseDate)) {
        status("main", "Cleaning up older media...");
        var deleteDir = path.join(mediaPath, mediaSubDir);
        fs.rmdirSync(deleteDir, {
          recursive: true
        });
      }
    }
  }

  // Support functions

  function doMaintenance() {
    // 2020.07.28 one-time maintenance start
    if (!prefs.lastMaintenance || moment(prefs.lastMaintenance).isBefore(moment("2020-07-28", "YYYY-MM-DD"))) {
      status("main", "Performing one-time maintenance functions...");
      var oldOutputPath = path.join(os.homedir(), "Desktop", "Meeting Media");
      $("#outputPath").val(oldOutputPath).change();
      try {
        for (var file of ["langs.json", "prefs.json"]) {
          fs.renameSync(path.join(oldOutputPath, file), path.join(appPath, file));
        }
      } catch (err) {
        console.log(err);
      }
      prefs.outputPath = oldOutputPath;
      prefs.lastMaintenance = moment();
      prefs.langUpdatedLast = moment().subtract(1, "year");
      status("main", "Push the big blue button!");
    }
    // 2020.07.28 one-time maintenance end
  }

  const downloadFile = async url => {
    try {
      $(".progress-container").fadeTo(400, 1);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        onDownloadProgress: function(progressEvent) {
          var percent = progressEvent.loaded / progressEvent.total * 100;
          progressSet(percent, path.basename(url));
        }
      });
      var data;
      data = response.data;
      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  };

  async function downloadRequired(remoteOpts, destFile, method) {
    if (fs.existsSync(destFile)) {
      var localHash = fs.statSync(destFile).size;
      var remoteHash, json;
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
      if (remoteHash == localHash) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  async function executeStatement(db, statement) {
    var vals = await db.exec(statement)[0];
    var valObj = [];
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
          await writeFile({
            sync: true,
            file: new Buffer(file),
            destFile: workingDirectory + basename
          });
          mkdirSync(path.join(workingDirectory, "JWPUB"));
          await extract(glob.sync(path.join(workingDirectory, "*.jwpub"))[0], {
            dir: path.join(workingDirectory, "JWPUB")
          });
          mkdirSync(workingUnzipDirectory);
          await extract(path.join(workingDirectory, "JWPUB", "contents"), {
            dir: workingUnzipDirectory
          });
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
    var statement = "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + opts.docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal";
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
          pub: extractItem.UndatedSymbol
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
      var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType='video/mp4' OR Multimedia.MimeType='audio/mpeg') " + (tableMultimedia == "DocumentMultimedia" ? "AND NOT Multimedia.KeySymbol='sjj' AND NOT Multimedia.KeySymbol='th'" : "") + ") OR (Multimedia.MimeType='image/jpeg' AND Multimedia.CategoryType <> 9" + (opts.pub == "th" ? " AND Multimedia.Width <> ''" : "") + "))";
      var mediaItems = await executeStatement(opts.db, statement);
      if (mediaItems) {
        for (var media of mediaItems) {
          media.FileType = media.FilePath.split(".").pop();
          if ((media.MimeType.includes("audio") || media.MimeType.includes("video"))) {
            if (media.KeySymbol == null) {
              media.JsonUrl = jwGetPubMediaLinks + "&docid=" +
                media.MepsDocumentId + "&langwritten=" + prefs.lang;
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
            media.BeginParagraphOrdinal = opts.srcParId;
          }
          if (opts.srcKeySymbol) {
            media.KeySymbol = opts.srcKeySymbol;
          } else if (media.KeySymbol == null) {
            media.KeySymbol = await executeStatement(opts.db, "SELECT UndatedSymbol FROM Publication");
            media.KeySymbol = media.KeySymbol[0].UndatedSymbol;
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
          media.DestPath = path.join(mediaPath, moment(opts.week, "YYYYMMDD").format("YYYY-MM-DD"), media.FileName);
          if (!mwMediaForWeek[media.BeginParagraphOrdinal]) {
            mwMediaForWeek[media.BeginParagraphOrdinal] = [];
          }
          if (!weekMediaFilesCopied.includes(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId)) {
            mwMediaForWeek[media.BeginParagraphOrdinal].push(media);
            weekMediaFilesCopied.push(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId);
          }
        }
      }
    } catch (err) {
      console.log(err, opts);
    }
  }

  async function getJson(opts) {
    var jsonUrl = "";
    if (opts.url) {
      jsonUrl = opts.url;
    } else {
      if (opts.pub == "w" && parseInt(opts.issue) >= 20080801 && opts.issue.slice(-2) == "01") {
        opts.pub = "wp";
      }
      jsonUrl = jwGetPubMediaLinks + "&pub=" + opts.pub + "&fileformat=" + opts.filetype + "&langwritten=" + prefs.lang + (opts.issue ? "&issue=" + opts.issue : "") + (opts.track ? "&track=" + opts.track : "");
    }
    let payload = null;
    try {
      payload = await axios.get(jsonUrl);
      payload = payload.data;
    } catch (err) {
      console.log(err, payload);
    } finally {
      return payload;
    }
  }

  async function getSong(song) {
    var ks = "sjjm";
    song.JsonUrl = jwGetPubMediaLinks + "&pub=" + ks + "&langwritten=" + prefs.lang + "&track=" + song.SongNumber + "&fileformat=MP4";
    song.Json = await getJson({
      url: song.JsonUrl
    });
    song.Json = Object.values(song.Json.files[prefs.lang])[0].filter(function(item) {
      return item.label == "720p";
    });
    song.Filename = ((song.FileOrder + 1) * 50).toString().padStart(3, '0') + " " + song.Json[0].title + ".mp4";
    song.DestPath = path.join(song.DestPath, song.Filename);
    if (await downloadRequired({
        json: song.Json,
        onlyFile: true
      }, song.DestPath)) {
      var file = await downloadFile(song.Json[0].file.url);
      writeFile({
        sync: true,
        file: new Buffer(file),
        destFile: song.DestPath
      });
    }
  }

  function mkdirSync(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  function progressSet(percent, filename) {
    if (percent == 100) {
      $(".progress-container").fadeTo(400, 0);
      $("#downloadProgress div").html("").width("0%");
      $("#downloadFilename").html("&nbsp;");
    } else {
      $("#downloadProgress div").width(percent + "%");
      $("#downloadFilename").html(filename);
    }
  }

  function sanitizeFilename(filename) {
    filename = filename.replace(/[?!"»«\(\)\\\[\]№—\$]*/g, "").replace(/[;:,|/]+/g, " - ").replace(/ +/g, " ").replace(/\.+/g, ".").replace(/\r?\n/g, " - ");
    var bytes = Buffer.byteLength(filename, 'utf8');
    var toolong = 230;
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
        bytes = Buffer.byteLength(filename + "." + fe, 'utf8');
      }
      filename = chunks.join(" - ") + "." + fe;
      bytes = Buffer.byteLength(filename, 'utf8');
    }
    return filename;
  }

  function settingsScreen(forceShow) {
    var visible = $("#overlaySettings").is(":visible");
    if (!visible || forceShow) {
      $("#overlaySettings").slideDown("fast");
    } else {
      $("#overlaySettings").slideUp("fast");
      $(".btn-settings i").removeClass("fa-home").addClass("fa-cog");
    }
  }

  async function sftpDownloadDirs(dirs) {
    try {
      let Client = require('ssh2-sftp-client');
      let sftpDownloadDir = new Client();
      await sftpDownloadDir.connect(sftpConfig);
      for (var d = 0; d < dirs.length; d++) {
        var files = await sftpLs(dirs[d][0]);
        for (var file of files) {
          var downloadNeeded = true;
          if (!fs.existsSync(dirs[d][1])) {
            downloadNeeded = false;
          } else if (fs.existsSync(path.join(dirs[d][1], file.name))) {
            var localSize = fs.statSync(path.join(dirs[d][1], file.name)).size;
            var remoteSize = file.size;
            if (remoteSize == localSize) {
              downloadNeeded = false;
            }
          }
          if (downloadNeeded) {
            $(".progress-container").fadeTo(400, 1);
            await sftpDownloadDir.fastGet(path.posix.join(dirs[d][0], file.name), path.join(dirs[d][1], file.name), {
              step: function(totalTransferred, chunk, total) {
                var percent = totalTransferred / total * 100;
                progressSet(percent, file.name);
              }
            });
          }
        }
      }
      await sftpDownloadDir.end();
    } catch (err) {
      console.log(err);
    }
  }

  async function sftpLs(dir) {
    try {
      var result = [];
      let Client = require('ssh2-sftp-client');
      let sftp = new Client();
      await sftp.connect(sftpConfig).then(() => {
        return sftp.list(dir);
      }).then(await
        function(data) {
          data.filter(function(el) {
            result.push(el);
          });
        }).then(await
        function() {
          return sftp.end();
        }).catch(err => {
        console.log(err);
      });
      return result;
    } catch (err) {
      console.log(err);
    }
  }

  function status(dest, message) {
    $("#" + dest + "Status").html(message);
  }

  function writeFile(opts) {
    if (!opts.type) {
      if (!opts.sync) {
        fs.writeFile(opts.destFile, opts.file, function(err) {
          if (err) throw err;
        });
      } else {
        fs.writeFileSync(opts.destFile, opts.file);
      }
    } else {
      if ((fs.existsSync(opts.destFile) && fs.existsSync(opts.file) && fs.statSync(opts.destFile).size !== fs.statSync(opts.file).size) || !fs.existsSync(opts.destFile)) {
        if (!opts.sync) {
          fs.copyFile(opts.file, opts.destFile, function(err) {
            if (err) throw err;
          });
        } else {
          fs.copyFileSync(opts.file, opts.destFile);
        }
      }
    }
  }
}