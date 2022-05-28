// Internal modules
const { log } = require("./log");
const { get } = require("./store");
const { progressSet } = require("./ui");

// External modules
const axios = require("axios");

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
  request
};