// External packages
const dayjs = require("dayjs");
const path = require("upath");
const fs = require("fs-extra");

async function mp4Convert(perf, updateStatus, updateTile, glob, progressSet, createVideoSync, totals) {
  perf("mp4Convert", "start");
  updateStatus("file-video");
  updateTile("mp4Convert", "warning");
  var filesToProcess = glob.sync(path.join(paths.media, "*"), {
    onlyDirectories: true
  }).map(folderPath => path.basename(folderPath)).filter(folder => dayjs(folder, prefs.outputFolderDateFormat).isValid() && dayjs(folder, prefs.outputFolderDateFormat).isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]") && now.isSameOrBefore(dayjs(folder, prefs.outputFolderDateFormat))).map(folder => glob.sync(path.join(paths.media, folder, "*"), {
    ignore: ["!**/(*.mp4|*.xspf)"]
  })).flat();
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
  updateTile("mp4Convert", "success");
  perf("mp4Convert", "stop");
}

function convertPdf(mediaFile, rm) {
  return new Promise((resolve)=>{
    var pdfjsLib = require("pdfjs-dist/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.entry.js");
    pdfjsLib.getDocument({
      url: mediaFile,
      verbosity: 0
    }).promise.then(async function(pdf) {
      for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        await convertPdfPage(mediaFile, pdf, pageNum, notifyUser);
      }
      await rm(mediaFile);
    }).catch((err) => {
      notifyUser("warn", "warnPdfConversionFailure", path.basename(mediaFile), true, err);
    }).then(() => {
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
        fs.writeFileSync(path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + "-" + String(pageNum).padStart(2, "0") + ".png"), Buffer.from(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
        $("div#pdf").remove();
      }).catch((err) => {
        notifyUser("warn", "warnPdfConversionFailure", path.basename(mediaFile), true, err);
      }).finally(() => {
        resolve();
      });
    });
  });
}
function convertSvg(mediaFile, rm) {
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
      fs.writeFileSync(path.join(path.dirname(mediaFile), path.basename(mediaFile, path.extname(mediaFile)) + ".png"), Buffer.from(canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""), "base64"));
      rm(mediaFile);
      $("div#svg").remove();
      return resolve();
    });
    $("img#svgImg").on("error", function() {
      notifyUser("warn", "warnSvgConversionFailure", path.basename(mediaFile), true);
      return resolve();
    });
    $("img#svgImg").prop("src", escape(mediaFile));
  });
}

async function convertUnusableFiles(glob, rm) {
  for (let pdfFile of glob.sync(path.join(paths.media, "**", "*pdf"), {
    ignore: [path.join(paths.media, "Recurring")]
  })) {
    await convertPdf(pdfFile, rm);
  }
  for (let svgFile of glob.sync(path.join(paths.media, "**", "*svg"), {
    ignore: [path.join(paths.media, "Recurring")]
  })) {
    await convertSvg(svgFile, rm);
  }
}

module.exports = {
  mp4Convert,
  convertUnusableFiles,
};
