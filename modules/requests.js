// Global constants
const constants = require("./../constants");

// Internal modules
const { log, notifyUser } = require("./log");
const { get, set } = require("./store");

// External modules
const $ = require("jquery");
const remote = require("@electron/remote");
const axios = require("axios");
const net = require("net");
const fs = require("fs-extra");
const path = require("upath");

function progressSet(current, total, blockId) {
  if (!get("dryrun") || !blockId) {
    let percent = current / total * 100;
    if (percent > 100 || (!blockId && percent === 100)) percent = 0;
    remote.getCurrentWindow().setProgressBar(percent / 100);
    $("#" + (blockId ? blockId + " .progress-bar" : "globalProgress")).width(percent + "%");
  }
} 

function perf(func, op) {
  const perfStats = get("perfStats");
  if (!perfStats[func]) perfStats[func] = {};
  perfStats[func][op] = performance.now();
  set("perfStats", perfStats);
}

function perfPrint() {
  for (var perfItem of Object.entries(get("perfStats")).sort((a, b) => a[1].stop - b[1].stop)) {
    log.info("%c[perf] [" + perfItem[0] + "] " + (perfItem[1].stop - perfItem[1].start).toFixed(1) + "ms", "background-color: #e2e3e5; color: #41464b;");
  }
  for (let downloadSource of Object.entries(get("downloadStats"))) {
    log.info("%c[perf] [" + downloadSource[0] + "Fetch] " + Object.entries(downloadSource[1]).sort((a,b) => a[0].localeCompare(b[0])).map(downloadOrigin => "from " + downloadOrigin[0] + ": " + (downloadOrigin[1].map(source => source.filesize).reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1) + "MB").join(", "), "background-color: #fbe9e7; color: #000;");
  }
}

async function getRemoteYearText(force) {
  let yearText = null;
  try {
    if (!fs.existsSync(get("paths").yearText) || force) {
      await axios.get(constants.YEARTEXT(get("prefs").lang), {
        adapter: require("axios/lib/adapters/http")
      }).then(result => {
        fs.ensureDirSync(path.join(get("paths").yearText, "../"));
        if (result && result.data && result.data.content) {
          fs.writeFileSync(get("paths").yearText, JSON.parse(JSON.stringify(result.data.content)));
          yearText = JSON.parse(JSON.stringify(result.data.content));
        }
      }).catch(err => {
        log.error(err);
      });
    } else {
      yearText = fs.readFileSync(get("paths").yearText, "utf8");
    }
  } catch (err) {
    log.error(err);
  }
  return yearText;
}

function downloadStat(origin, source, file) {
  const downloadStats = get("downloadStats");
  if (!downloadStats[origin]) downloadStats[origin] = {};
  if (!downloadStats[origin][source]) downloadStats[origin][source] = [];
  downloadStats[origin][source].push(file);
  set("downloadStats", downloadStats);
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

async function request(url, opts = null) {
  let response = null,
    payload,
    options = opts ?? {};
  try {
    if (options.webdav) options.auth = {
      username: get("prefs").congServerUser,
      password: get("prefs").congServerPass
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
    // if (!options.timeout) options.timeout = 1800000;
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

module.exports = {
  request,
  getMediaLinks,
  isReachable,
  downloadStat,
  getRemoteYearText,
  perf,
  perfPrint
};