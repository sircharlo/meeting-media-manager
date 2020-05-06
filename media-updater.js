/*jshint esversion: 8, node: true */

/*    TODO:
      Fix style and labels
      Alphabetize functions and vars when possible
      Implement clean-up function

*/

const isElectron = (process.versions['electron'] ? true : false);
const async = require('async');
const axios = require('axios');
const fs = require("graceful-fs");
const glob = require("glob");
const log = console.log;
//const md5 = require("md5-file");
const moment = require("moment");
const os = require("os");
const path = require("path");
const sqlite3 = require('better-sqlite3');
const extract = require('extract-zip');

const outputPath = path.join(os.homedir(), "Desktop", "Meeting Media");
mkdirSync(outputPath);

const pubs = {
  wt: "w",
  mwb: "mwb"
};

var progress = {
  main: {
    current: 0,
    total: 7
  },
  filesDownloaded: {
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
  }
};

var prefs = {
  lang: $("#lang").val(),
  mwDay: $("#mwDay").val(),
  weDay: $("#mwDay").val()
};
const prefsFile = outputPath + "/prefs.json";
if (fs.existsSync(prefsFile)) {
  prefs = JSON.parse(fs.readFileSync(prefsFile));
  $("#lang").val(prefs.lang);
  $("#mwDay").val(prefs.mwDay).change();
  $("#weDay").val(prefs.weDay).change();
} else {
  fs.writeFileSync(prefsFile, JSON.stringify(prefs));
}

$("#lang, #mwDay, #weDay").on('change', function() {
  prefs = {
    lang: $("#lang").val(),
    mwDay: $("#mwDay").val(),
    weDay: $("#weDay").val()
  };
  fs.writeFileSync(prefsFile, JSON.stringify(prefs));
});

var mwMediaForWeek, baseDate, weekMediaFilesCopied = [];

if (isElectron) {
  $("#mediaSync").on('click', async function() {
    $("#mediaSync").addClass('disabled');
    var buttonLabel = $("#mediaSync").html();
    $("#mediaSync").html("Update in progress...");
    $("div.progress div.progress-bar").addClass("progress-bar-striped progress-bar-animated");

    await setVars();
    await updateSongs();
    await updateWeMeeting();
    await updateMwMeeting();
    await cleanUp();

    progressReset();
    $("div.progress div.progress-bar").removeClass("progress-bar-striped progress-bar-animated");
    $("#mediaSync").html(buttonLabel);
    $("#mediaSync").removeClass('disabled');
  });
} else {
  nodeStart();
}

async function nodeStart() {
  await setVars();
  await updateSongs();
  await updateWeMeeting();
  await updateMwMeeting();
  await cleanUp();
}

async function setVars() {
  baseDate = moment().startOf('isoWeek');
  chosenLang = prefs.lang;
  langPath = outputPath + "/" + chosenLang;
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

function status(dest, message) {
  if (isElectron) {
    $("#" + dest + "Status").html(message);
  }
}

const downloadFile = async url => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    var data;
    data = response.data;
    return data;
  } catch (error) {
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
    $(progressAlert).html(percentage + " - " + progress[bar].current + "/" + progress[bar].total);
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
    }
    progressIncrement("main", "total", 7);
  }
}

function progressIncrement(bar, type, amount) {
  if (!amount) {
    var amount = 1;
  }
  progress[bar][type] = progress[bar][type] + amount;
  progressUpdate(bar);
}

async function getJson(opts) {
  if (opts.url) {
    var jsonUrl = opts.url;
  } else {
    if (opts.pub == "w" && parseInt(opts.issue) >= 20080801 && opts.issue.slice(-2) == "01") {
      opts.pub = "wp";
    }
    var jsonUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=json&pub=" + opts.pub + "&fileformat=" + opts.filetype + "&langwritten=" + chosenLang + (opts.issue ? "&issue=" + opts.issue : "") + (opts.track ? "&track=" + opts.track : "");
  }
  let payload = null;
  try {
    payload = await axios.get(jsonUrl);
    payload = payload.data;
  } catch (err) {
    //log(err, payload);
  } finally {
    return payload;
  }
}

async function downloadRequired(remoteOpts, destFile, method) {
  if (fs.existsSync(destFile)) {
    //if (method == "md5") {
    //  var localHash = md5.sync(destFile);
    //} else {
    var localHash = fs.statSync(destFile).size;
    //}
    if (remoteOpts.json) {
      var json = remoteOpts.json;
      if (remoteOpts.track) {
        var remoteHash = json.filter(function(item) {
          return item.track == remoteOpts.track;
        });
      } else if (!remoteOpts.onlyFile) {
        var remoteHash = json.files[chosenLang][remoteOpts.type];
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
      var remoteHash = json.files[chosenLang][remoteOpts.type];
    }
    //if (method == "md5") {
    //  remoteHash = remoteHash.file.checksum;
    //} else {
    remoteHash = remoteHash.filesize;
    //}
    if (remoteHash == localHash) {
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
}


async function updateSongs() {
  var pub = "sjjm";
  for (var filetype of ["MP4", "MP3"]) {
    progress.main.current++;
    status("main", "Checking for updated " + filetype + " songs...");
    var songs = await getJson({
      pub: pub,
      issue: "0",
      filetype: filetype
    });
    if (songs) {
      mkdirSync(songsPath + "/" + filetype);
      songs = songs.files[chosenLang][filetype].filter(function(item) {
        if (filetype == "MP4") {
          return item.track > 0 && item.label == "720p";
        } else if (filetype == "MP3") {
          return item.track > 0;
        }
      });
      progressIncrement("filesDownloaded", "total", songs.length);
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
            log(song.file.url);
            var file = await downloadFile(song.file.url);
            await writeFile({
              bar: "filesSaved",
              sync: true,
              file: new Buffer(file),
              destFile: destFile
            });
          }
        }
        progressIncrement("filesDownloaded", "current");
      }
    }
  }
}

function writeFile(opts) {
  progressIncrement(opts.bar, "total");
  if (!opts.type) {
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
  progressIncrement("db", "total");
  var statement = "SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.DocumentId,Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UndatedSymbol,IssueTagNumber FROM DocumentExtract INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId WHERE DocumentExtract.DocumentId = " + opts.docId + " AND NOT UndatedSymbol = 'sjj' AND NOT UndatedSymbol = 'mwbr' ORDER BY DocumentExtract.BeginParagraphOrdinal";
  var extractItems = opts.db.prepare(statement).all();
  progressIncrement("db", "current");
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
}

async function getDocumentMultimedia(opts) {
  progressIncrement("db", "total");
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
              media.MepsDocumentId + "&langwritten=" + chosenLang;
          } else {
            media.JsonUrl = "https://apps.jw.org/GETPUBMEDIALINKS?output=json&pub=" + media.KeySymbol + "&langwritten=" + chosenLang + "&issue=" + media.IssueTagNumber + "&track=" + media.Track;
          }
          if (media.MimeType.includes("video")) {
            media.JsonUrl = media.JsonUrl + "&fileformat=MP4";
          } else if (media.MimeType.includes("audio")) {
            media.JsonUrl = media.JsonUrl + "&fileformat=MP3";
          }
          var json = await getJson({
            url: media.JsonUrl
          });
          media.Json = Object.values(json.files[chosenLang])[0];
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
          media.Filename = "sjjm_" + chosenLang + "_" + media.Track.toString().padStart(3, '0') + "_r720P.mp4";
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
        //log(opts.week, media.KeySymbol, media.IssueTagNumber, media.MultimediaId)
        if (!weekMediaFilesCopied.includes(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId)) {
          mwMediaForWeek[media.BeginParagraphOrdinal].push(media);
          weekMediaFilesCopied.push(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId);
        }
      }
    }
  } catch (err) {
    //log(err, opts);
  }
  progressIncrement("db", "current");
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
    var url = json.files[chosenLang].JWPUB[0].file.url;
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
        bar: "filesSaved",
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
  progressIncrement("main", "current");
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
        var weekPath = mediaPath + "/" + studyDate.format("YYYY-MM-DD");
        mkdirSync(weekPath);
        var qryLocalMedia = db.prepare("SELECT DocumentMultimedia.MultimediaId,Document.DocumentId,Multimedia.CategoryType,DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption FROM DocumentMultimedia INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId WHERE Document.DocumentId = " + qryDocuments[w].DocumentId + " AND Multimedia.CategoryType <> 9").all();
        var qrySongs = db.prepare("SELECT * FROM Extract INNER JOIN DocumentExtract ON DocumentExtract.ExtractId = Extract.ExtractId WHERE DocumentId = " + qryDocuments[w].DocumentId + " and Caption LIKE '%sjj%' ORDER BY BeginParagraphOrdinal").all();
        for (var s = 0; s < qrySongs.length; s++) {
          var song = qrySongs[s];
          song.SongNumber = song.Caption.replace(/\D/g, "");
          song.Filename = "sjjm_" + chosenLang + "_" + song.SongNumber.toString().padStart(3, '0') + "_r720P.mp4";
          var songPath = songsPath + "/MP4/" + song.Filename;
          song.Filename = ((s + 1) * 50).toString().padStart(3, '0') + " " + song.Filename;
          song.LocalPath = songPath;
          song.DestPath = mediaPath + "/" + studyDate.format("YYYY-MM-DD") + "/" + song.Filename;
          song.SourceDocumentId = qryDocuments[w].DocumentId;
          song.KeySymbol = "sjjm";
          song.bar = "local";
          writeFile({
            bar: "filesSaved",
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
            bar: "filesSaved",
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
  progressIncrement("main", "current");
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
      mwMediaForWeek = {};
      if (moment(week, "YYYYMMDD").isSameOrAfter(baseDate, "day") && moment(week, "YYYYMMDD").isSameOrBefore(baseDate.clone().add(1, "week"), "day")) {
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
                  bar: "filesSaved",
                  file: new Buffer(file),
                  destFile: weekMediaItem.DestPath
                });
              }
            } else {
              writeFile({
                bar: "filesSaved",
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
  log("cleanUp()");
  progressIncrement("main", "current");
}