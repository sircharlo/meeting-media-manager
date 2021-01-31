const axios = require("axios");
const isPortReachable = require("is-port-reachable");
const $ = require("jquery");

var pubMediaServer, pubsPath, mediaPath, stayAlive, outputPath, langPath, zoomPath;

const congSpecificServer = {
  host: decode("c2lyY2hhcmxvLmhvcHRvLm9yZw=="),
  port: decode("NDMyMzQ="),
  alive: false
};
async function checkInternet() {
  try {
    let jwOrg = await isPortReachable(443, {
      host: "www.jw.org"
    });
    if (jwOrg) {
      let congServer = await isPortReachable(congSpecificServer.port, {
        host: congSpecificServer.host
      });
      if (congServer) {
        congSpecificServer.alive = true;
      }
      pubMediaServer = "https://app.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS";
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
  $("#updatePercent").html(message[0].toFixed(0) + "% done (about " + message[1] + " second" + (message[1] !== "1" ? "s" : "") + " left)");
});

require("electron").ipcRenderer.on("goAhead", () => {
  $("#overlay" + "PleaseWait").fadeIn(400, () => {
    $("#overlay" + "UpdateCheck").fadeOut();
    goAhead();
  });
});

function decode(e) {
  return new Buffer(e, "base64").toString("ascii");
}

function goAhead() {
  const bcrypt = require("bcryptjs");
  const fs = require("graceful-fs");
  const glob = require("glob");
  const dayjs = require("dayjs");
  dayjs.extend(require("dayjs/plugin/isoWeek"));
  dayjs.extend(require("dayjs/plugin/isBetween"));
  dayjs.extend(require("dayjs/plugin/customParseFormat"));
  const os = require("os");
  const path = require("path");
  const sqljs = require("sql.js");
  const zipper = require("zip-local");

  const jwGetPubMediaLinks = pubMediaServer + "?output=json";

  const pubs = {
    wt: "w",
    mwb: "mwb"
  };
  var sftpConfig = {};
  const congHash = "$2b$10$Kc4.iOKBP9KXfwQAHUJ0Ieyg0m8EC8nrhPaMigeGPonQ85EMaCJv6";
  const sftpRootDir = decode("L21lZGlhL3BsZXgvTWVkaWEtTGludXgvUHVibGljL2ZpbGVzL01XLU1lZGlhLUZldGNoZXIvVS8=");
  var prefs = {};

  const appPath = require("electron").remote.app.getPath("userData");
  const langsFile = path.join(appPath, "langs.json");
  const prefsFile = path.join(appPath, "prefs.json");

  var currentWeekDates = [];

  function prefsInitialize() {
    for (var pref of ["lang", "mwDay", "weDay", "cong", "autoStartSync", "autoRunAtBoot", "autoQuitWhenDone", "outputPath", "betaMp4Gen"]) {
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

    prefsInitialize();
    $("#lang").val(prefs.lang);
    $("#outputPath").val(prefs.outputPath);
    $("#mwDay input[value=" + prefs.mwDay + "]").prop("checked", true).parent().addClass("active");
    $("#weDay input[value=" + prefs.weDay + "]").prop("checked", true).parent().addClass("active");
    $("#cong").val(prefs.cong).change();
    $("#congPass").val(prefs.congPass);
    $("#autoStartSync").prop("checked", prefs.autoStartSync).change();
    $("#autoRunAtBoot").prop("checked", prefs.autoRunAtBoot).change();
    $("#betaMp4Gen").prop("checked", prefs.betaMp4Gen).change();
    $("#autoQuitWhenDone").prop("checked", prefs.autoQuitWhenDone).change();
    $(".btn-group button input:checked").parent().addClass("text-success").find("i").addClass("fa-toggle-on").removeClass("fa-toggle-off");
    $(".btn-group button input:not(:checked)").parent().removeClass("text-success").find("i").addClass("fa-toggle-off").removeClass("fa-toggle-on");
  } else {
    configIsValid();
  }

  async function congFetch() {
    if (congSpecificServer.alive) {
      if ($("#congPass").val().length > 0 && bcrypt.compareSync($("#congPass").val(), congHash)) {
        $("#congPass").removeClass("invalid").addClass("valid");
        $("#congs").fadeIn(400, function() {
          $("#congs").css("visibility", "visible");
          $("#congsSpinner").fadeIn(400, async function() {
            sftpConfig = {
              host: congSpecificServer.host,
              port: congSpecificServer.port,
              username: $("#congPass").val(),
              password: $("#congPass").val(),
              keepaliveInterval: 2000,
              keepaliveCountMax: 20
            };
            var congs = await sftpLs(path.posix.join(sftpRootDir, "Congregations"));
            for (var cong of congs) {
              $("#congSelect").append($("<option>", {
                value: cong.name,
                text: cong.name
              }));
            }
            $("#congSelect").val($("#cong").val());
            $("#congSelect").select2();
            $("#congsSpinner").fadeOut(400, () => {
              $("#congContainer").fadeIn();
            });
            configIsValid();
          });
        });
      } else {
        if ($("#congPass").val().length == 0) {
          $("#congPass").removeClass("invalid valid");
        } else {
          $("#congPass").removeClass("valid").addClass("invalid");
        }
        $("#congs").fadeOut(400, () => {
          $("#congs").css("visibility", "hidden");
          $("#congSelect option[value!=\"None\"]").remove();
          $("#congContainer").fadeOut();
          $("#congSelect").prop("selectedIndex", 0).change();
        });
      }
    } else {
      $("#congs").css("visibility", "hidden");
      $("#congPass").prop("disabled", true);
    }
  }

  async function getInitialData() {
    await getLanguages();
    $("#version span.badge").html("Version " + window.require("electron").remote.app.getVersion());
    await congFetch();
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
    if (prefs.cong.length > 0 && prefs.cong !== "None") {
      $("#specificCong").addClass("d-flex").html(prefs.cong);
      $("#btn-upload").fadeIn();
    }
    if (!congSpecificServer.alive) {
      $("#specificCong, #btn-upload").addClass("bg-warning");
    }
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
    var jsonLangs = {};
    if ((!fs.existsSync(langsFile)) || (!prefs.langUpdatedLast) || dayjs(prefs.langUpdatedLast).isBefore(dayjs().subtract(6, "months"))) {
      var jwLangs = await getJson({
        url: "https://www.jw.org/en/languages/"
      });
      let cleanedJwLangs = jwLangs.languages.filter(lang => lang.hasWebContent).map(lang => ({
        name: lang.name,
        langcode: lang.langcode
      }));
      fs.writeFileSync(langsFile, JSON.stringify(cleanedJwLangs, null, 2));
      prefs.langUpdatedLast = dayjs();
      fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
      jsonLangs = cleanedJwLangs;
    } else {
      jsonLangs = JSON.parse(fs.readFileSync(langsFile));
    }
    for (var lang of jsonLangs) {
      $("#langSelect").append($("<option>", {
        value: lang.langcode,
        text: lang.name
      }));
    }
    $("#langSelect").val($("#lang").val());
    $("#langSelect").select2();
  }

  function configIsValid() {
    $("#overlaySettings .select2-selection").each(function() {
      if ($(this).text().trim() == "") {
        $(this).addClass("invalid");
      } else {
        $(this).removeClass("invalid");
      }
    });
    if ($("#mwDay input:checked").length == 0) {
      $("#mwDay").addClass("invalid");
    } else {
      $("#mwDay").removeClass("invalid");
    }
    if ($("#weDay input:checked").length == 0) {
      $("#weDay").addClass("invalid");
    } else {
      $("#weDay").removeClass("invalid");
    }
    if ($("#outputPath").val().length == 0 || !$("#outputPath").val() || $("#outputPath").val() == "false" || !fs.existsSync($("#outputPath").val())) {
      $("#outputPath").val("");
      $("#outputPath").addClass("invalid");
    } else {
      $("#outputPath").removeClass("invalid");
    }
    if (!$("#lang").val() || $("#mwDay input:checked").length == 0 || $("#weDay input:checked").length == 0 || ($("#congPass").val().length > 0 && (!$("#cong").val() || !bcrypt.compareSync($("#congPass").val(), congHash))) || !$("#outputPath").val()) {
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

  var mwMediaForWeek, baseDate, weekMediaFilesCopied = [],
    dryrun = false,
    dryrunResults = {};
  baseDate = dayjs().startOf("isoWeek");
  $("#baseDate button, #baseDate .dropdown-item:eq(0)").html(baseDate.format("YYYY-MM-DD") + " - " + baseDate.clone().add(6, "days").format("YYYY-MM-DD")).val(baseDate.format("YYYY-MM-DD"));
  for (var d = 0; d < 7; d++) {
    $("#day" + d + " .dateOfMonth").html(baseDate.clone().add(d, "days").format("D"));
  }
  $("#baseDate .dropdown-item:eq(0)").addClass("active");
  for (var a = 1; a <= 4; a++) {
    $("#baseDate .dropdown-menu").append("<button class=\"dropdown-item\" value=\"" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + "\">" + baseDate.clone().add(a, "week").format("YYYY-MM-DD") + " - " + baseDate.clone().add(a, "week").add(6, "days").format("YYYY-MM-DD") + "</button>");
  }
  var currentWeekday = (new Date()).getDay();
  if (currentWeekday == 0) {
    currentWeekday = currentWeekday + 6;
  } else {
    currentWeekday = currentWeekday - 1;
  }
  if ($("#day" + currentWeekday + " .dateOfMonth").html() == new Date().getDate().toString()) {
    $("#day" + currentWeekday).addClass("today");
  } else {
    $(".today").removeClass("today");
  }
  getInitialData();
  $("#outputPath").on("click", function() {
    var path = require("electron").remote.dialog.showOpenDialogSync({
      properties: ["openDirectory"]
    });
    $(this).val(path).change();
  });
  $(".btn-settings, #btn-settings").on("click", function() {
    settingsScreen();
  });
  var origCleanupText = $(".btn-clean-up:not(.btn-confirmed):not(.btn-success)").html();
  $("#overlaySettings").on("click", ".btn-clean-up:not(.btn-confirmed)", function() {
    $(".btn-clean-up:not(.btn-confirmed)").addClass("btn-danger btn-confirmed").removeClass("btn-warning").html("Are you sure?");
    setTimeout(() => {
      $(".btn-clean-up.btn-confirmed").removeClass("btn-danger btn-confirmed").addClass("btn-warning").html(origCleanupText);
    }, 3000);
  });
  $("#baseDate").on("click", ".dropdown-item", function() {
    setVars();
    baseDate = dayjs($(this).val()).startOf("isoWeek");
    cleanUp();
    $("#baseDate .dropdown-item.active").removeClass("active");
    $(".day.bg-success, .congregation.bg-success").removeClass("bg-success");
    $(this).addClass("active");
    $("#baseDate > button").html($(this).html());
    for (var d = 0; d < 7; d++) {
      $("#day" + d + " .dateOfMonth").html(baseDate.clone().add(d, "days").format("D"));
    }
    if ($("#day" + currentWeekday + " .dateOfMonth").html() == new Date().getDate().toString() && dayjs().isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
      $("#day" + currentWeekday).addClass("today");
    } else {
      $(".today").removeClass("today");
    }
  });
  $("#overlaySettings").on("click", ".btn-clean-up.btn-confirmed", function() {
    setVars();
    for (var dir of [pubsPath, mediaPath, zoomPath]) {
      fs.rmdirSync(dir, {
        recursive: true
      });
    }
    $(this).addClass("btn-success").removeClass("btn-danger btn-confirmed btn-clean-up").html("Clean-up completed!").prop("disabled", true);
  });
  $("#overlaySettings *").on("change", function() {
    $("#lang").val($("#langSelect").val());
    $("#cong").val($("#congSelect").val());
    $(".btn-group button input:checked").parent().addClass("text-success").find("i").addClass("fa-toggle-on").removeClass("fa-toggle-off");
    $(".btn-group button input:not(:checked)").parent().removeClass("text-success").find("i").addClass("fa-toggle-off").removeClass("fa-toggle-on");
    prefs.lang = $("#langSelect").val();
    prefs.mwDay = $("#mwDay input:checked").val();
    prefs.weDay = $("#weDay input:checked").val();
    prefs.congPass = $("#congPass").val();
    prefs.cong = $("#congSelect").val();
    prefs.outputPath = $("#outputPath").val();
    prefs.autoStartSync = $("#autoStartSync").prop("checked");
    prefs.autoRunAtBoot = $("#autoRunAtBoot").prop("checked");
    prefs.autoQuitWhenDone = $("#autoQuitWhenDone").prop("checked");
    prefs.betaMp4Gen = $("#betaMp4Gen").prop("checked");
    $(".day, .congregation").removeClass("meeting bg-success");
    $("#day" + prefs.mwDay + ", #day" + prefs.weDay).addClass("meeting");
    $("#specificCong").html(prefs.cong);
    if (prefs.cong.length > 0 && prefs.cong !== "None") {
      $("#specificCong").addClass("d-flex");
      $("#btn-upload").fadeIn();
    } else {
      $("#specificCong").removeClass("d-flex");
      $("#btn-upload").fadeOut();
    }
    fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    window.require("electron").remote.app.setLoginItemSettings({
      openAtLogin: prefs.autoRunAtBoot
    });
    configIsValid();
  });

  $("#overlaySettings #congPass").on("change", async function() {
    await congFetch();
  });
  $("#mediaSync").on("click", async function() {
    dryrun = false;
    var buttonLabel = $("#mediaSync").html();
    $("#baseDate-dropdown").addClass("disabled");
    $("#mediaSync").prop("disabled", true).addClass("btn-secondary loading").removeClass("btn-primary").html("Sync in progress<span>.</span><span>.</span><span>.</span>");
    await startMediaSync();
    if (prefs.autoQuitWhenDone) {
      $("#stayAlive").show();
    }
    $("#btnStayAlive").on("click", function() {
      stayAlive = true;
      $("#btnStayAlive").removeClass("btn-warning").addClass("btn-success");
    });
    $("#overlayComplete").fadeIn(400, () => {
      $("#home, .btn-settings, #btn-settings, #btn-upload").fadeTo(400, 0);
    }).delay(3000).fadeOut(400, () => {
      if (prefs.autoQuitWhenDone && !stayAlive) {
        window.require("electron").remote.app.quit();
      }
      $("#home, .btn-settings, #btn-settings, #btn-upload").fadeTo(400, 1);
      $("#btnStayAlive").removeClass("btn-success").addClass("btn-warning");
    });
    $("#mediaSync").html(buttonLabel).prop("disabled", false).addClass("btn-primary").removeClass("btn-secondary loading");
    $("#baseDate-dropdown").removeClass("disabled");
    status("Push the big blue button!");
  });
  if (congSpecificServer.alive) {
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
        $("#overlayUploadFile").fadeOut();
        $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
        $("#fileList, #fileToUpload, #enterPrefix input").val("").empty().change();
        $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
        dryrun = false;
        document.removeEventListener("drop", dropHandler);
        document.removeEventListener("dragover", dragoverHandler);
        document.removeEventListener("dragenter", dragenterHandler);
        document.removeEventListener("dragleave", dragleaveHandler);
      });
      $("#overlayDryrun").fadeIn(400, async () => {
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
          $(".localOrRemoteFile").remove();
          var newElem = "";
          if ($("#chooseUploadType label:nth-child(1) input:checked").length > 0) {
            $(".songsSpinner").show();
            newElem = $("<select class=\"form-control form-control-sm half localOrRemoteFile\" id=\"fileToUpload\">");
            var sjjm = await getJson({
              "pub": "sjjm",
              "filetype": "MP4"
            });
            sjjm = sjjm.files[prefs.lang].MP4.filter(function(item) {
              return item.label == "720p";
            });
            for (var sjj of sjjm) {
              $(newElem).append($("<option>", {
                value: sjj.title + ".mp4",
                text: sjj.title
              }));
            }
            $(newElem).val([]);
            $(".songsSpinner").hide();
          } else {
            newElem = "<input type=\"text\" class=\"relatedToUpload form-control form-control-sm half localOrRemoteFile\" id=\"fileToUpload\" required readonly />";
          }
          if ($("#fileToUpload").length == 0) {
            $(".file-to-upload").append(newElem);
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
          if (prefs.cong !== "None" && congSpecificServer.alive) {
            hiddenFiles = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Hidden", $("#chooseMeeting input:checked").prop("id")));
          }
        });

        $("#overlayUploadFile").on("change", "#chooseMeeting input", function() {
          document.addEventListener("drop", dropHandler);
          document.addEventListener("dragover", dragoverHandler);
          document.addEventListener("dragenter", dragenterHandler);
          document.addEventListener("dragleave", dragleaveHandler);
          $("#chooseUploadType label input").prop("checked", false);
          $("#fileToUpload").val("").change();
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
        $("#overlayUploadFile").on("change", "#enterPrefix input, #chooseMeeting input, #chooseUploadType input, #fileToUpload", function() {
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
                  $("#fileList").append("<li>" + file.name + "</li>");
                }
                $("#fileList").css("column-count", Math.ceil($("#fileList li").length / 5));
                $("#fileList li:contains(mp4)").addClass("video");
                if (newList.some(e => e.congSpecific === true)) {
                  for (var a of newList.filter(e => e.congSpecific === true && e.recurring === true)) {
                    $("#fileList li").filter(function () {
                      var text = $(this).text();
                      return text === a.name;
                    }).prepend("<i class='fa fa-refresh'></i>");
                  }
                  for (var b of newList.filter(e => e.congSpecific === true && e.recurring === false)) {
                    $("#fileList li").filter(function () {
                      var text = $(this).text();
                      return text === b.name;
                    }).prepend("<i class='fa fa-minus-circle'></i>");
                  }
                  $(".fa-minus-circle").click(function() {
                    var parentLi = $(this).parent();
                    if (parentLi.hasClass("confirmDelete")) {
                      sftpRm(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media", $("#chooseMeeting input:checked").prop("id")), parentLi.text());
                      $("#btnCancelUpload").click();
                    } else {
                      parentLi.addClass("confirmDelete").find(".fa-minus-circle").removeClass("fa-minus-circle").addClass("fa-exclamation-circle");
                      setTimeout(() => {
                        $(".confirmDelete").removeClass("confirmDelete").find(".fa-exclamation-circle").removeClass("fa-exclamation-circle").addClass("fa-minus-circle");
                      }, 3000);
                    }
                  });
                }
                if (prefs.cong !== "None" && congSpecificServer.alive) {
                  for (var c of newList.filter(e => e.congSpecific === false && e.recurring === false)) {
                    $("#fileList li").filter(function () {
                      var text = $(this).text();
                      return text === c.name;
                    }).prepend("<i class='fa fa-eye canHide'></i>");
                  }
                  $("#fileList").on("click", ".canHide", function() {
                    if($(this).parent().text().trim().length > 0) {
                      $(this).parent().prepend("<i class='fa fa-eye-slash wasHidden'></i>");
                      sftpPut(Buffer.from("hide", "utf-8"), path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).parent().text().trim());
                      $(this).parent().wrap("<del></del>").addClass("text-secondary");
                      $(this).remove();
                    }
                  });
                  $("#fileList").on("click", ".wasHidden", function() {
                    if($(this).parent().text().trim().length > 0) {
                      $(this).parent().prepend("<i class='fa fa-eye canHide'></i>");
                      sftpRm(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Hidden", $("#chooseMeeting input:checked").prop("id")), $(this).parent().text().trim());
                      $(this).parent().unwrap().removeClass("text-secondary");
                      $(this).remove();
                    }
                  });
                  for (var hiddenFile of hiddenFiles) {
                    $("#fileList li").filter(function () {
                      var text = $(this).text();
                      return text === hiddenFile.name;
                    }).prepend("<i class='fa fa-eye-slash wasHidden'></i>").wrap("<del></del>").addClass("text-secondary").find(".fa-eye").remove();
                  }
                }
                if ($("#fileToUpload").val() !== null && $("#fileToUpload").val() !== undefined && $("#fileToUpload").val().length > 0) {
                  for (var newFile of newFiles) {
                    $("#fileList li:contains(" + newFile.name + ")").addClass("text-primary new-file");
                  }
                  $("#btnUpload").prop("disabled", false).addClass("btn-success").removeClass("btn-secondary");
                } else {
                  $("#btnUpload").prop("disabled", true).removeClass("btn-success").addClass("btn-secondary");
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
          $("#btnUpload").prop("disabled", true).addClass("btn-secondary loading").removeClass("btn-primary").html("Uploading<span>.</span><span>.</span><span>.</span>");
          $("#btnCancelUpload").prop("disabled", true);
          $("#uploadSpinnerContainer").fadeTo(400, 1);
          var localOrRemoteFile = $("#fileToUpload").val();
          if ($("#chooseUploadType label:nth-child(1) input:checked").length > 0) {
            var meetingSong = {
              "SongNumber": $("#fileToUpload").val().split(".")[0],
              "DestPath": "",
              "pureDownload": true
            };
            localOrRemoteFile = await getSong(meetingSong);
            var remoteUrl = localOrRemoteFile.Json[0].file.url;
            localOrRemoteFile = await downloadFile(remoteUrl);
            var tmpSong = path.join(os.tmpdir(), $("#fileToUpload").val() + ".mp4");
            writeFile({
              file: new Buffer(localOrRemoteFile),
              destFile: tmpSong
            });
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
            await sftpUpload(splitFileToUpload, path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media", $("#chooseMeeting input:checked").prop("id")), (prefix + " " + path.basename(splitFileToUpload)).trim());
          }
          $("#uploadSpinnerContainer").fadeTo(400, 0);
          $("#btnUpload").prop("disabled", false).removeClass("btn-secondary loading").addClass("btn-primary").html("Upload!");
          $("#btnCancelUpload").prop("disabled", false);
          $("#chooseMeeting input:checked, #chooseUploadType input:checked").prop("checked", false);
          $("#fileList, #fileToUpload, #enterPrefix input").val("").empty().change();
          $("#chooseMeeting .active, #chooseUploadType .active").removeClass("active");
          dryrun = false;
          $("#overlayUploadFile").fadeOut();
          document.removeEventListener("drop", dropHandler);
          document.removeEventListener("dragover", dragoverHandler);
          document.removeEventListener("dragenter", dragenterHandler);
          document.removeEventListener("dragleave", dragleaveHandler);
        } catch (err) {
          console.log(err);
        }
      });
    });
  }

  async function startMediaSync() {
    stayAlive = false;
    $("#btn-settings, #btn-upload").fadeOut();
    $("#spinnerContainer").fadeTo(400, 1);
    await setVars();
    await cleanUp();
    await syncMwMeeting();
    await syncWeMeeting();
    await syncCongSpecific();
    await removeHiddenMedia();
    await ffmpegConvert();
    $("#btn-settings, #btn-upload").fadeIn();
    $("#spinnerContainer").fadeTo(400, 0);
  }

  // Main functions

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

  async function syncWeMeeting() {
    status("Retrieving media for the weekend meeting<span>.</span><span>.</span><span>.</span>");
    $("#day" + prefs.weDay).addClass("bg-info in-progress");
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
    var qrySongs = await executeStatement(db, "SELECT * FROM Extract INNER JOIN DocumentExtract ON DocumentExtract.ExtractId = Extract.ExtractId WHERE DocumentId = " + qryDocuments[w].DocumentId + " and Caption LIKE '%sjj%' ORDER BY BeginParagraphOrdinal");
    for (var s = 0; s < qrySongs.length; s++) {
      var song = qrySongs[s];
      song.SongNumber = song.Caption.replace(/\D/g, "");
      song.DestPath = path.join(mediaPath, studyDate.format("YYYY-MM-DD"));
      song.FileOrder = s;
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
            writeFile({
              file: new Buffer(file),
              destFile: localMedia.DestPath
            });
          }
        } else {
          writeFile({
            file: localMedia.LocalPath,
            destFile: localMedia.DestPath,
            type: "copy"
          });
        }
      }
    }
    $("#day" + prefs.weDay).removeClass("in-progress bg-info");
    if (!dryrun) {
      $("#day" + prefs.weDay).addClass("bg-success");
    }
  }

  async function syncMwMeeting() {
    status("Retrieving media for the midweek meeting<span>.</span><span>.</span><span>.</span>");
    $("#day" + prefs.mwDay).addClass("bg-info in-progress");
    mkdirSync(path.join(pubsPath, pubs.mwb));
    var issue = baseDate.format("YYYYMM") + "00";
    if (/*baseDate.isAfter("2020-12-31") &&*/ parseInt(baseDate.format("M")) % 2 == 0) {
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
              writeFile({
                file: new Buffer(file),
                destFile: weekMediaItem.DestPath
              });
            }
          } else {
            writeFile({
              file: weekMediaItem.LocalPath,
              destFile: weekMediaItem.DestPath,
              type: "copy"
            });
          }
        }
      }
    }
    $("#day" + prefs.mwDay).removeClass("in-progress bg-info");
    if (!dryrun) {
      $("#day" + prefs.mwDay).addClass("bg-success");
    }
  }

  const ffmpeg = require("fluent-ffmpeg");
  async function ffmpegConvert() {
    if (!dryrun && prefs.betaMp4Gen) {
      status("Rendering media for Zoom sharing<span>.</span><span>.</span><span>.</span>");
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
        mkdirSync(path.join(appPath, "ffmpeg", "zip"));
        var ffmpegZipFile = await downloadFile(ffmpegUrls.bin[targetOs].ffmpeg);
        await writeFile({
          file: new Buffer(ffmpegZipFile),
          destFile: ffmpegZipPath
        });
      }
      zipper.sync.unzip(ffmpegZipPath).save(path.join(appPath, "ffmpeg"));
      var ffmpegPath = glob.sync(path.join(appPath, "ffmpeg", "ffmpeg*"))[0];
      fs.chmodSync(ffmpegPath, "777");
      ffmpeg.setFfmpegPath(ffmpegPath);
      var filesToRender = 0, filesRendering = 0;
      for (var dir of getDirectories(mediaPath)) {
        filesToRender = filesToRender + getFiles(path.join(mediaPath, dir)).length;
      }
      for (var mediaDir of getDirectories(mediaPath)) {
        mkdirSync(path.join(zoomPath, mediaDir));
        for (var imageFile of getFiles(path.join(mediaPath, mediaDir)).filter(function(name) {
          name = name.toLowerCase();
          return name.includes(".jpg") || name.includes(".jpeg") || name.includes(".png");
        })) {
          filesRendering = filesRendering + 1;
          progressSet(filesRendering / filesToRender * 100, path.basename(imageFile));
          await createVideoSync(mediaDir, imageFile);
        }
        for (var nonImageFile of getFiles(path.join(mediaPath, mediaDir)).filter(function(name) {
          name = name.toLowerCase();
          return !name.includes(".jpg") && !name.includes(".jpeg") && !name.includes(".png");
        })) {
          filesRendering = filesRendering + 1;
          progressSet(filesRendering / filesToRender * 100, path.basename(imageFile));
          fs.copyFileSync(path.join(mediaPath, mediaDir, nonImageFile), path.join(zoomPath, mediaDir, nonImageFile));
        }
      }
    }
  }

  function createVideoSync(mediaDir, vid){
    return new Promise((resolve,reject)=>{
      var imageName = path.basename(vid, path.extname(vid));
      var outputFPS = 30, loop = 10;
      ffmpeg(path.join(mediaPath, mediaDir, vid))
        .inputFPS(1)
        .outputFPS(outputFPS)
        .on("start", function() {
          $("#downloadProgressContainer").fadeTo(400, 1);
        })
        .on("end", function() {
          return resolve();
        })
        .on("error", function(err) {
          console.log("an error happened: " + err.message);
          return reject(err);
        })
        .videoCodec("libx264")
        .noAudio()
        .size("1280x720")
        .loop(loop)
        .outputOptions("-pix_fmt yuv420p")
        .save(path.join(zoomPath, mediaDir, imageName + ".mp4"));
    });
  }

  async function removeHiddenMedia() {
    if (prefs.cong !== "None" && congSpecificServer.alive && !dryrun) {
      var hiddenFilesFolders = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Hidden"));
      for (var hiddenFilesFolder of hiddenFilesFolders) {
        var hiddenFiles = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Hidden", hiddenFilesFolder.name));
        for (var hiddenFile of hiddenFiles) {
          try {
            console.log("Hidden file to delete:", path.join(mediaPath, hiddenFilesFolder.name, hiddenFile.name));
            fs.unlinkSync(path.join(mediaPath, hiddenFilesFolder.name, hiddenFile.name));
          } catch(err) {
            console.log(err);
          }
        }
      }
    }
  }

  async function syncCongSpecific() {
    if (prefs.cong !== "None" && congSpecificServer.alive) {
      status("Retrieving any congregation-specific files<span>.</span><span>.</span><span>.</span>");
      $("#specificCong").addClass("bg-info in-progress");
      try {
        var congSpecificFolders = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media"));
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
            dirs.push([path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media", folder.name), path.join(congSpecificFoldersParent, folder.name)]);
          }
        });
        if (fs.existsSync(path.join(pubsPath, "Recurring"))) {
          var recurringFiles = await sftpLs(path.posix.join(sftpRootDir, "Congregations", prefs.cong, "Media", "Recurring"));
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
              writeFile({
                file: path.join(pubsPath, "Recurring", recurringFile),
                destFile: path.join(meetingDate, recurringFile),
                type: "copy"
              });
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
      $("#specificCong").removeClass("in-progress bg-info");
      if (!dryrun) {
        $("#specificCong").addClass("bg-success");
      }
    }
  }

  const getDirectories = source =>
    fs.readdirSync(source, {
      withFileTypes: true
    })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  const getFiles = source =>
    fs.readdirSync(source, {
      withFileTypes: true
    })
      .filter(dirent => !dirent.isDirectory())
      .map(dirent => dirent.name);

  function cleanUp() {
    for (var lookinDir of [mediaPath, zoomPath]) {
      var mediaSubDirs = getDirectories(lookinDir);
      for (var mediaSubDir of mediaSubDirs) {
        if (dayjs(mediaSubDir, "YYYY-MM-DD").isValid() && !dayjs(mediaSubDir, "YYYY-MM-DD").isBetween(baseDate, baseDate.clone().add(6, "days"), null, "[]")) {
          var oldStatus = $("#mainStatus").html();
          status("Cleaning up irrelevant media<span>.</span><span>.</span><span>.</span>");
          var deleteDir = path.join(lookinDir, mediaSubDir);
          fs.rmdirSync(deleteDir, {
            recursive: true
          });
          status(oldStatus);
        }
      }
    }
  }

  // Support functions

  const downloadFile = async url => {
    try {
      $("#downloadProgressContainer").fadeTo(400, 1);
      const response = await axios.get(url, {
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
  };

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
            file: new Buffer(file),
            destFile: path.join(workingDirectory, basename)
          });
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
      var statement = "SELECT " + tableMultimedia + ".DocumentId, " + tableMultimedia + ".MultimediaId, " + (tableMultimedia == "DocumentMultimedia" ? tableMultimedia + ".BeginParagraphOrdinal, " + tableMultimedia + ".EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MultimediaId, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber, " : "Multimedia.CategoryType, ") + "Multimedia.MimeType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType FROM " + tableMultimedia + (tableMultimedia == "DocumentMultimedia" ? " INNER JOIN Multimedia ON Multimedia.MultimediaId = " + tableMultimedia + ".MultimediaId" : "") + " INNER JOIN Document ON " + tableMultimedia + ".DocumentId = Document.DocumentId WHERE " + (opts.destDocId ? tableMultimedia + ".DocumentId = " + opts.destDocId : "Document.MepsDocumentId = " + opts.destMepsId) + " AND (((Multimedia.MimeType='video/mp4' OR Multimedia.MimeType='audio/mpeg')) OR (Multimedia.MimeType='image/jpeg' AND Multimedia.CategoryType <> 9" + (opts.pub == "th" ? " AND Multimedia.Width <> ''" : "") + "))";
      var mediaItems = await executeStatement(opts.db, statement);
      if (mediaItems) {
        for (var media of mediaItems) {
          try {
            if (!(opts.pub && media.KeySymbol)) {
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
              media.DestPath = path.join(mediaPath, dayjs(opts.week, "YYYYMMDD").format("YYYY-MM-DD"), media.FileName);
              media.relevant = true;
              if (opts.refParStart && opts.refParEnd) {
                media.relevant = false;
                if ((media.BeginParagraphOrdinal >= opts.refParStart && media.EndParagraphOrdinal <= opts.refParEnd) || (media.BeginParagraphOrdinal == 1 && opts.refParStart < 5)) {
                  media.relevant = true;
                }
                console.log("Include referenced media from " + media.KeySymbol + ":", media.relevant, "(", media.BeginParagraphOrdinal, media.EndParagraphOrdinal, "/", opts.refParStart, opts.refParEnd, ")");
              }
              if (!mwMediaForWeek[media.srcParId]) {
                mwMediaForWeek[media.srcParId] = [];
              }
              if (!weekMediaFilesCopied.includes(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId) && media.relevant) {
                mwMediaForWeek[media.srcParId].push(media);
                weekMediaFilesCopied.push(opts.week + media.KeySymbol + media.IssueTagNumber + media.MultimediaId);
              }
            } else {
              console.log("Additional video skipped:", media.FilePath, "(", media.KeySymbol, opts.pub, ")");
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
      return response;
    } catch (err) {
      console.log(err, payload);
      return err, payload;
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
    song.Filename = sanitizeFilename(((song.FileOrder + 1) * 5).toString().padStart(2, "0") + "-00 " + song.Json[0].title + ".mp4");
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
        writeFile({
          file: new Buffer(file),
          destFile: song.DestPath
        });
      }
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

  function sanitizeFilename(filename) {
    filename = filename.replace(/[?!"»“«()\\[\]№—$]*/g, "").replace(/[;:,|/]+/g, " - ").replace(/ +/g, " ").replace(/\.+/g, ".").replace(/\r?\n/g, " - ");
    var bytes = Buffer.byteLength(filename, "utf8");
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
        bytes = Buffer.byteLength(filename + "." + fe, "utf8");
      }
      filename = chunks.join(" - ") + "." + fe;
      bytes = Buffer.byteLength(filename, "utf8");
    }
    return filename;
  }

  function settingsScreen(forceShow) {
    var visible = $("#overlaySettings").is(":visible");
    if (!visible || forceShow) {
      $("#overlaySettings").slideDown("fast");
    } else {
      $("#overlaySettings").slideUp("fast");
    }
  }

  async function sftpRm(dir, file) {
    try {
      if (congSpecificServer.alive) {
        var result = [];
        let Client = require("ssh2-sftp-client");
        let sftp = new Client();
        await sftp.connect(sftpConfig).then(() => {
          return sftp.delete(path.posix.join(dir, file));
        }).then(await
        function() {
          return sftp.end();
        }).catch(err => {
          console.log(err);
        });
        return result;
      }
    } catch (err) {
      console.log(err);
    }
  }


  async function sftpDownloadDirs(dirs) {
    try {
      if (congSpecificServer.alive) {
        let Client = require("ssh2-sftp-client");
        let sftpDownloadDir = new Client();
        await sftpDownloadDir.connect(sftpConfig);
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
                await sftpDownloadDir.fastGet(path.posix.join(dirs[d][0], file.name), path.join(dirs[d][1], file.name), {
                  step: function(totalTransferred, chunk, total) {
                    var percent = totalTransferred / total * 100;
                    progressSet(percent, file.name);
                  }
                });
              }
            }
          }
        }
        await sftpDownloadDir.end();
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function sftpLs(dir) {
    try {
      if (congSpecificServer.alive) {
        var result = [];
        let Client = require("ssh2-sftp-client");
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
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function sftpUpload(file, destFolder, destName) {
    try {
      if (congSpecificServer.alive) {
        let Client = require("ssh2-sftp-client");
        destName = await sanitizeFilename(destName);
        let sftpUploadFile = new Client();
        await sftpUploadFile.connect(sftpConfig);
        await sftpUploadFile.mkdir(destFolder, true);
        await sftpUploadFile.fastPut(file, path.posix.join(destFolder, destName), {
          step: function(totalTransferred, chunk, total) {
            var percent = totalTransferred / total * 100;
            progressSet(percent, destName, "upload");
          }
        });
        await sftpUploadFile.end();
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function sftpPut(file, destFolder, destName) {
    try {
      if (congSpecificServer.alive) {
        let Client = require("ssh2-sftp-client");
        destName = await sanitizeFilename(destName);
        let sftpUploadFile = new Client();
        await sftpUploadFile.connect(sftpConfig);
        await sftpUploadFile.mkdir(destFolder, true);
        await sftpUploadFile.put(file, path.posix.join(destFolder, destName));
        await sftpUploadFile.end();
      }
    } catch (err) {
      console.log(err);
    }
  }

  function status(message) {
    if (!dryrun) {
      $("#mainStatus").html(message);
    }
  }

  function writeFile(opts) {
    if (!opts.type) {
      fs.writeFileSync(opts.destFile, opts.file);
    } else {
      if ((fs.existsSync(opts.destFile) && fs.existsSync(opts.file) && fs.statSync(opts.destFile).size !== fs.statSync(opts.file).size) || !fs.existsSync(opts.destFile)) {
        fs.copyFileSync(opts.file, opts.destFile);
      }
    }
  }
}
