// Global constants
const constants = require("./../constants");

// Internal modules
const { get} = require("./store");
const { log } = require("./log");
const { getRemoteYearText } = require("./requests");
const { translate } = require("./lang");

// External modules
const $ = require("jquery");
const remote = require("@electron/remote");
const bootstrap = require("bootstrap");
const glob = require("fast-glob");
const path = require("upath");

let modal = new bootstrap.Modal(document.getElementById("staticBackdrop"), {
  backdrop: "static",
  keyboard: false
});

function progressSet(current, total, blockId) {
  if (!get("dryrun") || !blockId) {
    let percent = current / total * 100;
    if (percent > 100 || (!blockId && percent === 100)) percent = 0;
    remote.getCurrentWindow().setProgressBar(percent / 100);
    $("#" + (blockId ? blockId + " .progress-bar" : "globalProgress")).width(percent + "%");
  }
} 

function unconfirm(el) {
  clearTimeout($(el).data("popover-timeout-id"));
  let currentDangerClass = $(el).attr("class").split(" ").filter(el => el.includes("-danger"));
  if ($(el).hasClass("wasWarningBefore")) $(el).addClass(currentDangerClass.join(" ").replace("-danger", "-warning"));
  let currentColorClasses = $(el).attr("class").split(" ").filter(el => el.includes("-danger") || el.includes("-warning") || el.includes("-primary") || el.includes("-info") || el.includes("-secondary"));
  if (currentColorClasses.length > 1) $(el).removeClass($(el).hasClass("wasWarningBefore") ? currentDangerClass.join(" ") : "btn-warning");
  $(el).removeClass("wasWarningBefore confirmed").blur();
}

function overlay(show, topIcon, bottomIcon, action) {
  return new Promise((resolve) => {
    if (!show) {
      if (!topIcon || (topIcon && $("#overlayMaster i.fa-" + topIcon).length > 0)) $("#overlayMaster").stop().fadeOut(constants.FADE_DELAY, () => resolve());
    } else {
      if ($("#overlayMaster #topIcon i.fa-" + topIcon).length === 0) $("#overlayMaster #topIcon i").removeClass().addClass("fas fa-fw fa-" + topIcon);
      $("#overlayMaster #bottomIcon i").removeClass().unwrap("button");
      $("#overlayMaster #bottomIcon .action-countdown").html("");
      if (bottomIcon) {
        $("#overlayMaster #bottomIcon i").addClass("fas fa-fw fa-" + bottomIcon + (action ? " " + action : "")).unwrap("button");
        if (action) $("#overlayMaster #bottomIcon i").next("span").addBack().wrapAll("<button type='button' class='btn btn-danger btn-action-" + action + " position-relative'></button>");
      }
      $("#overlayMaster").stop().fadeIn(constants.FADE_DELAY, () => resolve());
    }
  });
}

const delay = s => new Promise(res => {
  let finalTimeout = setTimeout(res, s * 1000);
  let secsRemaining = s;
  $("button .action-countdown").html(secsRemaining);
  const timeinterval = setInterval(function() {
    secsRemaining--;
    if (secsRemaining < 1) {
      secsRemaining = "";
      $("button .action-countdown").html();
      clearInterval(timeinterval);
      clearTimeout(finalTimeout);
      res();
    }
    $("button .action-countdown").html(secsRemaining);
  }, 1000);
  $("#bottomIcon button").on("click", function() {
    window[$(this).attr("class").split(" ")
      .filter(el => el.includes("btn-action-"))
      .join(" ").split("-").splice(2).join("-").toLowerCase()
      .replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""))] = true;
    clearInterval(timeinterval);
    clearTimeout(finalTimeout);
    res();
  });
});

function showModal(isVisible, header, headerContent, bodyContent, footer, footerButtonEnabled) {
  if (isVisible) {
    $("#staticBackdrop .modal-header").html(header ? "<h5 class='modal-title'>" + headerContent + "</h5>" : "").toggle(header);
    $("#staticBackdrop .modal-body").html(bodyContent);
    if (footer) $("#staticBackdrop .modal-footer").html($("<button type='button' class='btn btn-primary' data-bs-dismiss='modal'><i class='fas fa-fw fa-check'></i></button>").prop("disabled", !footerButtonEnabled));
    $("#staticBackdrop .modal-footer").toggle(footer);
    modal.show();
  } else {
    modal.hide();
  }
}

function refreshBackgroundImagePreview(force) {
  try {
    if (get("prefs").enableMediaDisplayButton) {
      let mediaWindowBackgroundImages = glob.sync(path.join(get("paths").app, "media-window-background-image*"));
      if (mediaWindowBackgroundImages.length == 0) {
        getRemoteYearText(force).then((yearText) => {
          $("#fetchedYearText").text($(yearText).text());
          $("#fetchedYearText, #refreshYeartext").toggle(!!yearText);
        }).finally(() => {
          require("electron").ipcRenderer.send("startMediaDisplay", get("paths").prefs);
        });
      } else {
        $("#currentMediaBackground").prop("src", escape(mediaWindowBackgroundImages[0]) + "?" + (new Date()).getTime());
      }
      $("#currentMediaBackground, #deleteBackground").toggle(mediaWindowBackgroundImages.length > 0);
      $("#chooseBackground").toggle(mediaWindowBackgroundImages.length == 0);
    }
  } catch (err) {
    log.error(err);
  }
}

function getMediaWindowDestination() {
  let mediaWindowOpts = {
    destination: null,
    type: "window"
  };
  $("#preferredOutput").closest(".row").hide().find(".display").remove();
  try {
    if (get("prefs").enableMediaDisplayButton) {
      let screenInfo = require("electron").ipcRenderer.sendSync("getScreenInfo");
      screenInfo.otherScreens.map(screen => {
        $("#preferredOutput").append($("<option />", {
          value: screen.id,
          class: "display",
          text: translate("screen") + " " + screen.humanFriendlyNumber + (screen.size && screen.size.width && screen.size.height ? " (" + screen.size.width + "x" + screen.size.height + ") (ID: " + screen.id + ")" : "")
        }));
      });
      if (get("prefs").preferredOutput) $("#preferredOutput").val(get("prefs").preferredOutput);
      $("#preferredOutput").closest(".row").toggle(screenInfo.otherScreens.length > 0);
      if (screenInfo.otherScreens.length > 0) { // at least one external screen
        if (get("prefs").preferredOutput !== "window") { // fullscreen mode
          let preferredDisplay = screenInfo.displays.find(display => display.id == get("prefs").preferredOutput); // try to find preferred display
          if (screenInfo.otherScreens.length > 1) { // more than one external screen
            mediaWindowOpts.destination = preferredDisplay ? preferredDisplay.id : screenInfo.otherScreens[screenInfo.otherScreens.length - 1].id; // try to use preferred display; otherwise use another available one
          }
          mediaWindowOpts.type = "fullscreen";
        }
        if (!mediaWindowOpts.destination) mediaWindowOpts.destination = screenInfo.otherScreens[screenInfo.otherScreens.length - 1].id;
        if (mediaWindowOpts.type == "fullscreen") $("#preferredOutput").val(mediaWindowOpts.destination); // set the display menu to show the selected screen, but don't save it in prefs in case preferred screen comes back
      } else { // no  external screen, use main one
        mediaWindowOpts.destination = screenInfo.displays[0].id;
      }
    }
  } catch(err) {
    log.error(err);
  }
  return mediaWindowOpts;
}

function setMediaWindowPosition() {
  require("electron").ipcRenderer.send("setMediaWindowPosition", getMediaWindowDestination());
}

function toggleScreen(screen, forceShow, sectionToShow) {
  return new Promise((resolve) => {
    if (screen === "overlaySettings" && !$("#" + screen).is(":visible")) {
      $("#" + screen + " .accordion-collapse").each(function() {
        $(this).collapse($(this).find(".is-invalid").length > 0 || $(this).prop("id") == sectionToShow ? "show" : "hide");
      });
    }
    if (forceShow) {
      $("#" + screen).slideDown(constants.FADE_DELAY, () => resolve() );
    } else {
      $("#" + screen).slideToggle(constants.FADE_DELAY, () => resolve() );
    }
  });
}

module.exports = {
  progressSet,
  overlay,
  toggleScreen,
  unconfirm,
  delay,
  showModal,
  refreshBackgroundImagePreview,
  getMediaWindowDestination,
  setMediaWindowPosition
};