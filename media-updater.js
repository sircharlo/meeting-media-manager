/*jshint esversion: 8, node: true */

/*    TODO:
      Alphabetize functions and vars when possible
      Fix congregation fetch logic
*/

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
    console.log(err)
  }
}

checkInternet();

require('electron').ipcRenderer.on('checkInternet', () => {
  checkInternet();
})

require('electron').ipcRenderer.on('hideThenShow', (event, message) => {
  $("#overlay" + message[0]).fadeOut(400, () => {
    $("#overlay" + message[1]).fadeIn();
  });
})

require('electron').ipcRenderer.on('updateDownloadProgress', (event, message) => {
  $("#updatePercent").html(message[0].toFixed(0) + "% done (about " + message[1] + " second" + (message[1] !== "1" ? "s" : "") + " left)");
})

require('electron').ipcRenderer.on('goAhead', () => {
  goAhead();
})

function goAhead() {
  const moment = require("moment")
  const isElectron = (process.versions['electron'] ? true : false);
  const axios = require('axios');
  const fs = require("graceful-fs");
  const glob = require("glob");
  const os = require("os");
  const path = require("path");
  const sqlite3 = require('better-sqlite3');
  const extract = require('extract-zip');
  const sftpConfig = {
    host: 'sircharlo.hopto.org',
    port: '43234',
    username: 'plex',
    password: 'plex',
    keepaliveInterval: 2000,
    keepaliveCountMax: 20
  };
  const sftpRootDir = "/media/plex/Media-Linux/Public/files/MW-Media-Fetcher/U/";

  const outputPath = path.join(os.homedir(), "Desktop", "Meeting Media");
  mkdirSync(outputPath);

  const pubs = {
    wt: "w",
    mwb: "mwb"
  };

  var progress = {
    /*main: {
      current: 0,
      total: 7
    },*/
    tasksToDo: {
      current: 0,
      total: 0
    },
    download: {}
    /*filesDownloaded: {
      current: 0,
      total: 0
    },
    filesSaved: {
      current: 0,
      total: 0
    },
    db: {
      current: 0,
      total: 0
    }*/
  };

  var prefs = {};
  const prefsFile = outputPath + "/prefs.json";
  const langsFile = outputPath + "/langs.json";

  function prefsInitialize() {
    for (var pref of ["lang", "mwDay", "weDay", "cong", "autoStartUpdate", "autoRunAtBoot", "autoQuitWhenDone"]) {
      if (!(Object.keys(prefs).includes(pref))) {
        prefs[pref] = false;
      }
    }
  }

  if (fs.existsSync(prefsFile)) {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsFile));
    } catch {
      //prefsInitialize();
    }
    if (isElectron) {
      prefsInitialize();
      $("#lang").val(prefs.lang);
      $("#mwDay").val(prefs.mwDay).change();
      $("#weDay").val(prefs.weDay).change();
      $("#cong").val(prefs.cong).change();
      $("#autoStartUpdate").val(prefs.autoStartUpdate.toString()).change();
      $("#autoRunAtBoot").val(prefs.autoRunAtBoot.toString()).change();
      $("#autoQuitWhenDone").val(prefs.autoQuitWhenDone.toString()).change();
      if (!$("#lang").val() || !$("#mwDay").val() || !$("#weDay").val()) {
        settingsRequired();
      }
    }
  } else {
    if (isElectron) {
      settingsRequired();
    }
  }

  if (!isElectron) {
    var args = process.argv.slice(2);
    if ((!args[0] || !args[1] || !args[2]) && (!prefs.lang || !prefs.weDay || !prefs.mwDay)) {
      throw ("insufficient args (LANG MWDAY WEDAY CONG)")
    } else if (!prefs.lang || !prefs.weDay || !prefs.mwDay) {
      prefs = {
        lang: args[0],
        mwDay: args[1],
        weDay: args[2],
        cong: args[3]
      };
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    }
  }

  async function congFetch() {
    var congs = await sftpLs("Congregations");
    $.each(congs, function(index, cong) {
      $('#congSelect').append($("<option>", {
        value: cong,
        text: cong
      }));
    });
    $('#congSelect').val($('#cong').val());
    $('#congSelect').select2();
  }

  async function getLanguages() {
    if ((!fs.existsSync(langsFile)) || (!prefs.langUpdatedLast) || moment(prefs.langUpdatedLast).isSameOrBefore(moment().subtract(6, "months"))) {
      await $.getJSON("https://www.jw.org/en/languages/", null, function(jsonData) {
        fs.writeFileSync(langsFile, JSON.stringify(jsonData.languages, null, 2));
      });
      prefs.langUpdatedLast = moment();
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    }
    var jsonLangs = JSON.parse(fs.readFileSync(langsFile));
    $.each(jsonLangs, function(index, lang) {
      if (lang.hasWebContent) {
        $('#langSelect').append($("<option>", {
          value: lang.langcode,
          text: lang.name
        }));
      }
    });
    $('#langSelect').val($('#lang').val());
    $('#langSelect').select2();
  }

  async function getInitialData() {
    await getLanguages();
    $("#version span.badge").html("Version " + window.require('electron').remote.app.getVersion());
    //if (!prefs.cong) {
    await congFetch();
    //}
    $('#mwDay').select2();
    $('#weDay').select2();
    $('#autoStartUpdate').select2();
    $('#autoRunAtBoot').select2();
    $('#autoQuitWhenDone').select2();
    $(".select2-container").addClass("pt-1");
    $(".select2-selection").each(function() {
      if ($(this).text().trim() == "") {
        $(this).addClass("invalid");
      } else {
        $(this).removeClass("invalid");
      }
    });
    $("#overlay, #overlayPleaseWait").fadeOut();
  }

  var mwMediaForWeek, baseDate, weekMediaFilesCopied = [];

  function settingsRequired(bool) {
    if (bool == false) {
      $("#mediaSync").prop("disabled", false);
      $("#mediaSync").removeClass("btn-secondary");
      $("#Settings-tab").removeClass("text-danger");
      $("#home-tab").removeClass("disabled");
    } else {
      $("#mediaSync").prop("disabled", true);
      $("#mediaSync").addClass("btn-secondary");
      $("#Settings-tab").addClass("text-danger").tab('show');
      $("#home-tab").addClass("disabled");
    }
  }

  if (isElectron) {
    getInitialData();
    $("#settings *").on('change', function() {
      $(".select2-selection").each(function() {
        if ($(this).text().trim() == "") {
          $(this).addClass("invalid");
        } else {
          $(this).removeClass("invalid");
        }
      });
      $("#lang").val($("#langSelect").val());
      $("#cong").val($("#congSelect").val());
      prefs.lang = $("#langSelect").val();
      prefs.mwDay = $("#mwDay").val();
      prefs.weDay = $("#weDay").val();
      prefs.cong = $("#congSelect").val();
      prefs.autoStartUpdate = ($("#autoStartUpdate").val() === "false" ? false : true);
      prefs.autoRunAtBoot = ($("#autoRunAtBoot").val() === "false" ? false : true);
      prefs.autoQuitWhenDone = ($("#autoQuitWhenDone").val() === "false" ? false : true);
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
      window.require('electron').remote.app.setLoginItemSettings({
        openAtLogin: prefs.autoRunAtBoot
      });
      if (!$("#langSelect").val() || !$("#mwDay").val() || !$("#weDay").val()) {
        settingsRequired();
      } else {
        settingsRequired(false);
      }
    });
    $("#mediaSync").on('click', async function() {
      var stayAlive = false;
      $("#mediaSync").prop("disabled", true);
      $("#mediaSync").addClass("btn-secondary");
      $("#Settings-tab").addClass("disabled");
      var buttonLabel = $("#mediaSync").html();
      $("#mediaSync").html('Update in progress... <span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>');
      $("div.progress div.progress-bar").addClass("progress-bar-striped progress-bar-animated");
      $("div.progress").parent().css('visibility', 'visible').hide().fadeIn();
      await progressInitialize();
      await startMediaUpdate();
      await progressReset();
      if ($("#stayAlive").length !== 0) {
        $("#stayAlive").remove();
      }
      if (prefs.autoQuitWhenDone) {
        $("#overlayComplete").append('<div class="align-self-center pt-3" id="stayAlive" role="status"><button class="btn btn-warning btn-sm" id="btnStayAlive" type="button">Wait, don\'t close automatically!</button></div>');
      }
      $("#btnStayAlive").on("click", function() {
        stayAlive = true;
        $("#btnStayAlive").removeClass("btn-warning").addClass("btn-success");
      });
      $("#overlay").fadeIn();
      $("#overlayComplete").fadeIn().delay(3000).fadeOut(400, () => {
        if (prefs.autoQuitWhenDone && !stayAlive) {
          window.require('electron').remote.app.quit();
        }
        $("#overlay").fadeOut();
      });
      $("div.progress").parent().fadeOut(400, function() {
        $(this).css('visibility', 'hidden').css("display", "block");
      })
      $("div.progress div.progress-bar").removeClass("progress-bar-striped progress-bar-animated");
      $("#mediaSync").html(buttonLabel);
      $("#mediaSync").prop("disabled", false);
      $("#mediaSync").removeClass("btn-secondary");
      $("#Settings-tab").removeClass("disabled");
      status("main", "Currently inactive")
    });
    if (prefs.autoStartUpdate && $("#langSelect").val() && $("#mwDay").val() && $("#weDay").val()) {
      $("#mediaSync").click();
    }
  } else {
    startMediaUpdate();
  }

  async function startMediaUpdate() {
    await setVars();
    await updateSongs();
    await updateWeMeeting();
    await updateMwMeeting();
    await updateCongSpecific();
    await cleanUp();
  }

  async function updateCongSpecific() {
    var congSpecificFolders = await sftpLs("Congregations/" + prefs.cong + "/" + moment().year());
    var dirs = [];
    congSpecificFolders.forEach((folder, f) => {
      dirs.push([sftpRootDir + "Congregations/" + prefs.cong + "/Media/" + folder, mediaPath + "/" + folder])
    });
    sftpDownloadDirs(dirs);
  }

  async function setVars() {
    baseDate = moment().startOf('isoWeek');
    langPath = outputPath + "/" + prefs.lang;
    mkdirSync(langPath);
    songsPath = langPath + "/Songs";
    mkdirSync(songsPath);
    pubsPath = langPath + "/Publications";
    mkdirSync(pubsPath);
    mediaPath = langPath + "/Media";
    mkdirSync(mediaPath);
    progressReset();
  }

  function mkdirSync(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  async function sftpLs(dir) {
    var result = [];
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    await sftp.connect(sftpConfig).then(() => {
      return sftp.list(sftpRootDir + dir);
    }).then(await
      function(data) {
        data.filter(function(el) {
          result.push(el.name)
        });
      }).then(await
      function() {
        return sftp.end();
      }).catch(err => {
      console.log(err, 'catch error');
    });
    return result
  }

  async function sftpDownloadDirs(dirs) {
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    await sftp.connect(sftpConfig);
    //dirs.forEach(function(dir, d) {
    for (var d = 0; d < dirs.length; d++) {
      let rslt = await sftp.downloadDir(dirs[d][0], dirs[d][1])
      //let rslt = dir
      console.log(rslt);
    }
    sftp.end();
    //});
  }

  function status(dest, message) {
    if (isElectron) {
      $("#" + dest + "Status").html(message);
    }
  }

  const downloadFile = async url => {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        onDownloadProgress: function(progressEvent) {
          var percent = progressEvent.loaded / progressEvent.total * 100;
          progressSet("download", percent);
        }
      });
      progressIncrement("tasksToDo", "current");
      var data;
      data = response.data;
      return data;
    } catch (error) {
      progressIncrement("tasksToDo", "current");
      console.log(error);
      return error;
    }
  };

  function progressUpdate(bar) {
    if (isElectron) {
      var progressBar = "#" + bar + "Progress div";
      var percentage = Math.round((progress[bar].current * 100) / progress[bar].total * 10) / 10 + "%";
      $(progressBar).html(percentage + " - " + progress[bar].current + "/" + progress[bar].total);
      $(progressBar).width(percentage);
      var progressAlert = "#" + bar + "Status";
      //$(progressAlert).html(percentage + " - " + progress[bar].current + "/" + progress[bar].total);
    }
  }

  function progressSet(bar, percent) {
    if (isElectron) {
      var progressBar = "#" + bar + "Progress div";
      //var percentage = Math.round((progress[bar].current * 100) / progress[bar].total * 10) / 10 + "%";
      $(progressBar).html(percent.toFixed(2) + "%");
      $(progressBar).width(percent + "%");
      //var progressAlert = "#" + bar + "Status";
      //$(progressAlert).html(percentage + " - " + progress[bar].current + "/" + progress[bar].total);
    }
  }

  function progressInitialize() {
    if (isElectron) {
      for (var bar of Object.keys(progress)) {
        progress[bar].initialStatus = $("#" + bar + "Status").html();
      }
    }
  }

  function progressReset() {
    if (isElectron) {
      for (var bar of Object.keys(progress)) {
        progress[bar].current = 0;
        progress[bar].total = 0;
        var element = "#" + bar + "Progress div";
        $(element).html("");
        $(element).width("0%");
        element = "#" + bar + "Status";
        $(element).html(progress[bar].initialStatus);
      }
    }
  }

  function progressIncrement(bar, type) {
    progress[bar][type] = progress[bar][type] + 1;
    progressUpdate(bar);
  }

  async function getJson(opts) {
    if (opts.url) {
      var jsonUrl = opts.url;
    } else {
      if (opts.pub == "w" && parseInt(opts.issue) >= 20080801 && opts.issue.slice(-2) == "01") {
        opts.pub = "wp";
      }
      var jsonUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=json&pub=" + opts.pub + "&fileformat=" + opts.filetype + "&langwritten=" + prefs.lang + (opts.issue ? "&issue=" + opts.issue : "") + (opts.track ? "&track=" + opts.track : "");
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

  async function downloadRequired(remoteOpts, destFile, method) {
    if (fs.existsSync(destFile)) {
      var localHash = fs.statSync(destFile).size;
      if (remoteOpts.json) {
        var json = remoteOpts.json;
        if (remoteOpts.track) {
          var remoteHash = json.filter(function(item) {
            return item.track == remoteOpts.track;
          });
        } else if (!remoteOpts.onlyFile) {
          var remoteHash = json.files[prefs.lang][remoteOpts.type];
        } else {
          var remoteHash = json;
        }
        remoteHash = remoteHash[0];
      } else {
        var json = await getJson({
          pub: remoteOpts.pub,
          issue: remoteOpts.issue,
          filetype: remoteOpts.type,
          track: remoteOpts.track
        });
        var remoteHash = json.files[prefs.lang][remoteOpts.type];
      }
      remoteHash = remoteHash.filesize;
      if (remoteHash == localHash) {
        return false;
      } else {
        progressIncrement("tasksToDo", "total");
        return true;
      }
    } else {
      progressIncrement("tasksToDo", "total");
      return true;
    }
  }


  async function updateSongs() {
    var pub = "sjjm";
    for (var filetype of ["MP4", "MP3"]) {
      //progress.main.current++;
      status("main", "Checking for updated " + filetype + " songs...");
      var songs = await getJson({
        pub: pub,
        issue: "0",
        filetype: filetype
      });
      if (songs) {
        mkdirSync(songsPath + "/" + filetype);
        songs = songs.files[prefs.lang][filetype].filter(function(item) {
          if (filetype == "MP4") {
            return item.track > 0 && item.label == "720p";
          } else if (filetype == "MP3") {
            return item.track > 0;
          }
        });
        for (var song of songs) {
          if (song.track > 0 && (filetype == "MP3" || song.label == "720p")) {
            var filename = song.file.url.split("/").pop();
            var destFile = songsPath + "/" + filetype + "/" + filename;
            if (await downloadRequired({
                json: songs,
                pub: pub,
                type: filetype,
                track: song.track
              }, destFile)) {
              var file = await downloadFile(song.file.url);
              await writeFile({
                //bar: "filesDownloaded",
                sync: true,
                file: new Buffer(file),
                destFile: destFile
              });
            }
          }
        }
      }
    }
  }

  function writeFile(opts) {
    opts.bar = "tasksToDo";
    if (!opts.type) {
      progressIncrement(opts.bar, "total");
      if (!opts.sync) {
        fs.writeFile(opts.destFile, opts.file, function(err) {
          if (err) throw err;
          progressIncrement(opts.bar, "current");
        });
      } else {
        fs.writeFileSync(opts.destFile, opts.file);
        progressIncrement(opts.bar, "current");
      }
    } else { // it's a copy
      if ((fs.existsSync(opts.destFile) && fs.existsSync(opts.file) && fs.statSync(opts.destFile).size !== fs.statSync(opts.file).size) || !fs.existsSync(opts.destFile)) {
        progressIncrement(opts.bar, "total");
        if (!opts.sync) {
          fs.copyFile(opts.file, opts.destFile, function(err) {
            if (err) throw err;
            progressIncrement(opts.bar, "current");
          });
        } else {
          fs.copyFileSync(opts.file, opts.destFile);
          progressIncrement(opts.bar, "current");
        }
      }
    }
  }

  async function getDocumentExtract(opts) {
    progressIncrement("tasksToDo", "total");
    var statement = "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + opts.docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal";
    var extractItems = opts.db.prepare(statement).all();
    for (var extractItem of extractItems) {
      mkdirSync(pubsPath + "/" + extractItem.UndatedSymbol);
      mkdirSync(pubsPath + "/" + extractItem.UndatedSymbol + "/" + extractItem.IssueTagNumber);
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
    progressIncrement("tasksToDo", "current");
  }

  async function getDocumentMultimedia(opts) {
    progressIncrement("tasksToDo", "total");
    try {
      var tableDocumentMultimedia = Object.values(opts.db.prepare("SELECT EXISTS (SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia')").get())[0];
      var tableMultimedia = "Multimedia";
      if (tableDocumentMultimedia == 1) {
        tableMultimedia = "DocumentMultimedia";
      }
      var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType='video/mp4' OR Multimedia.MimeType='audio/mpeg') " + (tableMultimedia == "DocumentMultimedia" ? "AND NOT Multimedia.KeySymbol='sjj' AND NOT Multimedia.KeySymbol='th'" : "") + ") OR (Multimedia.MimeType='image/jpeg' AND Multimedia.CategoryType <> 9" + (opts.pub == "th" ? " AND Multimedia.Width <> ''" : "") + "))";
      var mediaItems = opts.db.prepare(statement).all();
      if (mediaItems) {
        for (media of mediaItems) {
          media.FileType = media.FilePath.split(".").pop();
          if ((media.MimeType.includes("audio") || media.MimeType.includes("video")) && media.KeySymbol !== "sjjm") {
            if (media.KeySymbol == null) {
              media.JsonUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=json&docid=" +
                media.MepsDocumentId + "&langwritten=" + prefs.lang;
            } else {
              media.JsonUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=json&pub=" + media.KeySymbol + "&langwritten=" + prefs.lang + "&issue=" + media.IssueTagNumber + "&track=" + media.Track;
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
            media.KeySymbol = opts.db.prepare("SELECT UndatedSymbol FROM Publication").get().UndatedSymbol;
            media.IssueTagNumber = opts.db.prepare("SELECT IssueTagNumber FROM Publication").get().IssueTagNumber;
          }
          if (media.KeySymbol == "sjjm") {
            delete media.JsonUrl;
            media.Filename = "sjjm_" + prefs.lang + "_" + media.Track.toString().padStart(3, '0') + "_r720P.mp4";
            media.LocalPath = songsPath + "/MP4/" + media.Filename;
          } else if (!media.JsonUrl) {
            media.LocalPath = pubsPath + "/" + media.KeySymbol + "/" + media.IssueTagNumber + "/JWPUB/contents-decompressed/" + media.FilePath;
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
          media.DestPath = mediaPath + "/" + moment(opts.week, "YYYYMMDD").format("YYYY-MM-DD") + "/" + media.FileName;
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
    progressIncrement("tasksToDo", "current");
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

  async function getDbFromJwpub(opts) {
    var json = await getJson({
      pub: opts.pub,
      issue: opts.issue,
      filetype: "JWPUB"
    });
    if (json) {
      var url = json.files[prefs.lang].JWPUB[0].file.url;
      var basename = path.basename(url);
      var workingDirectory = pubsPath + "/" + opts.pub + "/" + opts.issue + "/";
      var workingUnzipDirectory = workingDirectory + "JWPUB/contents-decompressed/";
      if (await downloadRequired({
          json: json,
          pub: opts.pub,
          issue: opts.issue,
          type: "JWPUB"
        }, workingDirectory + basename) || !glob.sync(workingUnzipDirectory + "/*.db")[0]) {
        var file = await downloadFile(url);
        await writeFile({
          //bar: "filesDownloaded",
          sync: true,
          file: new Buffer(file),
          destFile: workingDirectory + basename
        });
        mkdirSync(workingDirectory + "JWPUB");
        await extract(glob.sync(workingDirectory + "/*.jwpub")[0], {
          dir: workingDirectory + "JWPUB"
        });
        mkdirSync(workingUnzipDirectory);
        await extract(workingDirectory + "JWPUB/contents", {
          dir: workingUnzipDirectory
        });
      }
      return sqlite3(glob.sync(workingUnzipDirectory + "/*.db")[0]);
    }
  }

  async function updateWeMeeting(weDate) {
    var weDates = [baseDate.clone().subtract(2, "months"), baseDate.clone().subtract(1, "months")];
    for (var weDate of weDates) {
      status("main", "Retrieving the " + weDate.format("MMMM YYYY") + " Watchtower...");
      mkdirSync(pubsPath + "/" + pubs.wt);
      var issue = weDate.format("YYYYMM") + "00";
      mkdirSync(pubsPath + "/" + pubs.wt + "/" + issue);
      var db = await getDbFromJwpub({
        pub: pubs.wt,
        issue: issue
      });
      var qryWeeks = db.prepare("SELECT FirstDateOffset FROM DatedText").all();
      var qryDocuments = db.prepare("SELECT Document.DocumentId FROM Document WHERE Document.Class=40").all();
      var weeks = [];
      for (var line of qryWeeks) {
        weeks.push(line.FirstDateOffset);
      }
      for (var w = 0; w < weeks.length; w++) {
        var week = weeks[w];
        var studyDate = moment(week, "YYYYMMDD").add(prefs.weDay, "days");
        if (studyDate.isSameOrAfter(moment(), "day")) {
          status("main", "Weekend meeting: " + moment(studyDate).format("YYYY-MM-DD"))
          var weekPath = mediaPath + "/" + studyDate.format("YYYY-MM-DD");
          mkdirSync(weekPath);
          var qryLocalMedia = db.prepare("SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + qryDocuments[w].DocumentId + " AND Multimedia.CategoryType <> 9").all();
          var qrySongs = db.prepare("SELECT * FROM Extract INNER JOIN DocumentExtract ON DocumentExtract.ExtractId = Extract.ExtractId WHERE DocumentId = " + qryDocuments[w].DocumentId + " and Caption LIKE '%sjj%' ORDER BY BeginParagraphOrdinal").all();
          for (var s = 0; s < qrySongs.length; s++) {
            var song = qrySongs[s];
            song.SongNumber = song.Caption.replace(/\D/g, "");
            song.Filename = "sjjm_" + prefs.lang + "_" + song.SongNumber.toString().padStart(3, '0') + "_r720P.mp4";
            var songPath = songsPath + "/MP4/" + song.Filename;
            song.Filename = ((s + 1) * 50).toString().padStart(3, '0') + " " + song.Filename;
            song.LocalPath = songPath;
            song.DestPath = mediaPath + "/" + studyDate.format("YYYY-MM-DD") + "/" + song.Filename;
            song.SourceDocumentId = qryDocuments[w].DocumentId;
            song.KeySymbol = "sjjm";
            song.bar = "local";
            writeFile({
              sync: true,
              //bar: "filesSaved",
              file: song.LocalPath,
              destFile: song.DestPath,
              type: "copy"
            });
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
            localMedia.LocalPath = pubsPath + "/" + pubs.wt + "/" + issue + "/JWPUB/contents-decompressed/" + localMedia.FilePath;
            localMedia.FileName = sanitizeFilename((l + 1 + 50).toString().padStart(3, '0') + " " + localMedia.FileName);
            localMedia.DestPath = mediaPath + "/" + studyDate.format("YYYY-MM-DD") + "/" + localMedia.FileName;
            localMedia.SourceDocumentId = qryDocuments[w].DocumentId;
            writeFile({
              //bar: "filesSaved",
              sync: true,
              file: localMedia.LocalPath,
              destFile: localMedia.DestPath,
              type: "copy"
            });
          });
        }
      }
    }
  }

  async function updateMwMeeting() {
    var mwDates = [baseDate, baseDate.clone().add(1, "months")];
    for (var mwDate of mwDates) {
      status("main", "Retrieving the " + mwDate.format("MMMM YYYY") + " Meeting Workbook...");
      mkdirSync(pubsPath + "/" + pubs.mwb);
      var issue = mwDate.format("YYYYMM") + "00";
      mkdirSync(pubsPath + "/" + pubs.mwb + "/" + issue);
      var db = await getDbFromJwpub({
        pub: pubs.mwb,
        issue: issue
      });
      var qryWeeks = db.prepare("SELECT FirstDateOffset FROM DatedText").all();
      var weeks = [];
      for (var line of qryWeeks) {
        weeks.push(line.FirstDateOffset);
      }
      for (w = 0; w < weeks.length; w++) {
        var week = weeks[w];
        var weekDay = moment(weeks[w], "YYYYMMDD").add(prefs.mwDay, "day");
        mwMediaForWeek = {}, weekMediaFilesCopied = [];
        if (moment(week, "YYYYMMDD").isSameOrAfter(baseDate, "day") && moment(week, "YYYYMMDD").isSameOrBefore(baseDate.clone().add(1, "week"), "day")) {
          status("main", "Midweek meeting: " + moment(weeks[w], "YYYYMMDD").format("YYYY-MM-DD"))
          var docId = db.prepare("SELECT DocumentId FROM DatedText WHERE FirstDateOffset = " + week + "").get().DocumentId;
          var weekPath = mediaPath + "/" + weekDay.format("YYYY-MM-DD");
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
          var internalRefs = db.prepare("SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = " + docId + " AND Document.Class <> 94").all();
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
              } else if (weekMediaItem.KeySymbol == "sjjm") {
                weekMediaItem.FileName = weekMediaItem.Filename;
              }
              weekMediaItem.FileName = sanitizeFilename((wM + 1).toString().padStart(2, '0') + "-" + (wMI + 1).toString().padStart(2, '0') + " " + weekMediaItem.FileName);
              weekMediaItem.DestPath = path.dirname(weekMediaItem.DestPath) + "/" + weekMediaItem.FileName;
              if (weekMediaItem.Json) {
                if (await downloadRequired({
                    json: weekMediaItem.Json,
                    onlyFile: true
                  }, weekMediaItem.DestPath)) {
                  var file = await downloadFile(weekMediaItem.Json[0].file.url);
                  writeFile({
                    //bar: "filesDownloaded",
                    sync: true,
                    file: new Buffer(file),
                    destFile: weekMediaItem.DestPath
                  });
                }
              } else {
                writeFile({
                  //  bar: "filesSaved",
                  sync: true,
                  file: weekMediaItem.LocalPath,
                  destFile: weekMediaItem.DestPath,
                  type: "copy"
                });
              }
            }
          }
        }
      }
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
      var deleteMediaSubDir = moment(mediaSubDir).isBefore(baseDate.clone().subtract(1, "week"));
      if (deleteMediaSubDir) {
        status("main", "Cleaing up: " + mediaSubDir);
        var deleteDir = path.join(mediaPath, mediaSubDir);
        fs.rmdirSync(deleteDir, {
          recursive: true
        });
      }
    }
  }
}