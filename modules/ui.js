// Internal modules
const { get} = require("./store");

// External modules
const $ = require("jquery");
const remote = require("@electron/remote");

function progressSet(current, total, blockId) {
  if (!get("dryrun") || !blockId) {
    let percent = current / total * 100;
    if (percent > 100 || (!blockId && percent === 100)) percent = 0;
    remote.getCurrentWindow().setProgressBar(percent / 100);
    $("#" + (blockId ? blockId + " .progress-bar" : "globalProgress")).width(percent + "%");
  }
} 

module.exports = {
  progressSet
};