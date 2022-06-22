// Internal modules
const { request, downloadStat } = require("./requests");
const { get } = require("./store");
const { log, notifyUser } = require("./log");

// External modules
const path = require("upath");
const fs = require("fs-extra");
const { XMLParser } = require("fast-xml-parser");

async function webdavStatus(url) {
  const prefs = get("prefs");
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

async function webdavExists(url) {
  return (await webdavStatus(url)) < 400;
}

async function webdavGet(file) {
  const prefs = get("prefs");
  let localFile = path.join(get("paths").media, file.folder, file.safeName);
  if (!fs.existsSync(localFile) || !(file.filesize == fs.statSync(localFile).size)) {
    fs.ensureDirSync(path.join(get("paths").media, file.folder));
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
    fs.writeFileSync(localFile, Buffer.from(new Uint8Array(remoteFile.data)));
    downloadStat("cong", "live", file);
  } else {
    downloadStat("cong", "cache", file);
  }
}

async function webdavLs(dir, force) {
  const prefs = get("prefs");
  let items = [],
    congUrl = "https://" + prefs.congServer + ":" + prefs.congServerPort + dir;
  try {
    if (get("webdavIsAGo") || force) {
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
  const prefs = get("prefs");
  if (!(await webdavExists(dir))) await request("https://" + prefs.congServer + ":" + prefs.congServerPort + dir, {
    method: "MKCOL",
    webdav: true
  });
}

async function webdavMv(src, dst) {
  const prefs = get("prefs");
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

function sanitizeFilename(filename, isNotFile) {
  let fileExtIfApplicable = (isNotFile ? "" : path.extname(filename).toLowerCase());
  filename = path.basename(filename, (isNotFile ? "" : path.extname(filename))).replace(/["»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1f\x80-\x9f]/g, "").replace(/ *[—?;:|.!?] */g, " - ").replace(/\u00A0/g, " ").trim().replace(/[ -]+$/g, "") + fileExtIfApplicable;
  if (!isNotFile && get("paths").media) {
    let maxCharactersInPath = 245,
      projectedPathCharLength = path.join(get("paths").media, "9999-99-99", filename).length;
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

async function webdavPut(file, destFolder, destName) {
  const prefs = get("prefs");
  let destFile = path.posix.join("https://" + prefs.congServer + ":" + prefs.congServerPort, destFolder, (await sanitizeFilename(destName)));
  try {
    if (get("webdavIsAGo") && file && destFolder && destName) {
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
  const prefs = get("prefs");
  if (pathsToDel.length == 0) pathsToDel = null;
  if (!Array.isArray(pathsToDel)) pathsToDel = [pathsToDel];
  let returnVal = true;
  for (var pathToDel of pathsToDel) {
    let deleteFile = "https://" + prefs.congServer + ":" + prefs.congServerPort + pathToDel;
    try {
      if (get("webdavIsAGo") && pathToDel && await webdavExists(pathToDel)) {
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

module.exports = {
  webdavGet,
  webdavLs,
  webdavMv,
  webdavPut,
  webdavRm,
  webdavExists,
  webdavStatus
};