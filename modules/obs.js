// Internal packages
const { log, notifyUser } = require('./log')

// External packages
const remote = require("@electron/remote")
const OBSWebSocket = require("obs-websocket-js")

// Variables
let obs = {}
let dynamicShortcuts = {}

function getObs() {
  return obs
}

function setObs(o) {
  obs = o
}

async function obsConnect(prefs) {
  try {
    if (!prefs.enableObs && obs._connected) {
      await obs.disconnect();
      log.info("OBS disconnected.");
      obs = {};
    } else if (!obs._connected && prefs.enableObs && prefs.obsPort && prefs.obsPassword) {
      obs = new OBSWebSocket();
      obs.on("error", err => {
        notifyUser("error", "errorObs", null, false, err);
      });
      obs.on("SwitchScenes", function(newScene) {
        try {
          if (newScene && newScene.sceneName && newScene.sceneName !== prefs.obsMediaScene) $("#obsTempCameraScene").val(newScene.sceneName).change();
        } catch (err) {
          log.error(err);
        }
      });
      obs.on("ConnectionOpened", () => {
        log.info("OBS success! Connected & authenticated.");
      });
      await obs.connect({ address: "localhost:" + prefs.obsPort, password: prefs.obsPassword }).catch(err => {
        notifyUser("error", "errorObs", null, false, err);
      });
    }
  } catch (err) {
    notifyUser("error", "errorObs", null, false, err);
  }
  $(".relatedToObsScenes").toggle(!!obs._connected);
  $(".relatedToObsLogin input").toggleClass("is-invalid", !!prefs.enableObs && !obs._connected).toggleClass("is-valid", !!prefs.enableObs && !!obs._connected);
  return !!obs._connected;
}
function shortcutSet(shortcut, destination, fn) {
  let ret = null, alreadyExists = false;
  try {
    if (dynamicShortcuts[destination] && dynamicShortcuts[destination].includes(shortcut)) {
      alreadyExists = true;
    } else if (!dynamicShortcuts[destination] || (Array.isArray(dynamicShortcuts[destination]) && !dynamicShortcuts[destination].includes(shortcut))) ret = remote.globalShortcut.register(shortcut, fn);
    if (ret) {
      if (!dynamicShortcuts[destination]) dynamicShortcuts[destination] = [];
      dynamicShortcuts[destination].push(shortcut);
    }
    if (!(ret || alreadyExists)) {
      notifyUser("info", "infoShortcutSetFail", shortcut);
    }
  } catch (err) {
    log.error(err);
  }
  return ret;
}
function shortcutsUnset(domain) {
  if (domain && dynamicShortcuts[domain]) for (let i = dynamicShortcuts[domain].length - 1; i >= 0; i--) {
    try {
      remote.globalShortcut.unregister(dynamicShortcuts[domain][i]);
      dynamicShortcuts[domain].splice(i, 1);
    } catch (err) {
      log.error(err);
    }
  }
}
async function obsGetScenes(currentOnly, validateConfig, prefs) {
  try {
    let connectionAttempt = await obsConnect(prefs);
    return (connectionAttempt ? await obs.send("GetSceneList").then(data => {
      if (currentOnly) {
        return data.currentScene;
      } else {
        $("#overlaySettings .obs-scenes .loaded-scene").remove();
        data.scenes.map(scene => scene.name).forEach(scene => {
          $("#overlaySettings .obs-scenes").append($("<option>", {
            class: "loaded-scene",
            text: scene,
            value: scene
          }));
        });
        for (var pref of ["obsCameraScene", "obsMediaScene"]) {
          if ($("#" + pref + " option[value='" + prefs[pref] + "']").length == 0) {
            prefs[pref] = null;
            validateConfig();
          } else {
            $("#" + pref).val(prefs[pref]);
          }
        }
        $(".modal-footer .left").append("<select class='form-select form-select-lg ms-3 obs-scenes w-auto' id='obsTempCameraScene'></select>");
        shortcutsUnset("obsScenes");
        let cameraScenes = [];
        $("#obsCameraScene").children().clone().filter(function (i, el) {
          return $(el).val() && $(el).val() !== prefs.obsMediaScene;
        }).each((i, el) => {
          try {
            let sceneNum = (i < 10 ? (i + 1).toString().slice(-1) : null);
            let shortcutSetSuccess = false;
            if ((i + 1) < 10) {
              shortcutSetSuccess = shortcutSet("Alt+" + sceneNum, "obsScenes", function() {
                $("#obsTempCameraScene").val($(el).val()).change();
              });
            }
            cameraScenes.push({
              id: $(el).val(),
              text: (shortcutSetSuccess ? "<kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>Alt</kbd> <kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>" + sceneNum + "</kbd> - " : "") + $(el).val(),
              html: (shortcutSetSuccess ? "<kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>Alt</kbd> <kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>" + sceneNum + "</kbd> - " : "") + $(el).val(),
              title: $(el).val(),
            });
          } catch (err) {
            log.error(err);
          }
        });
        $("#obsTempCameraScene").select2({
          selectionCssClass: "obsTempCameraSceneSelect",
          dropdownParent: $("#staticBackdrop"),
          data: cameraScenes,
          escapeMarkup: function(markup) {
            return markup;
          },
          templateResult: function(data) {
            return data.html;
          },
          templateSelection: function(data) {
            return data.text;
          }
        });
        $("#obsTempCameraScene").val(data.currentScene == prefs.obsMediaScene ? prefs.obsCameraScene : data.currentScene).change();
        return data;
      }
    }).catch(err => {
      notifyUser("error", "errorObs", null, false, err);
    }) : false);
  } catch (err) {
    if (obs._connected) notifyUser("error", "errorObs", null, false, err);
    return false;
  }
}
async function obsSetScene(scene, prefs) {
  try {
    if (await obsConnect(prefs) && scene) obs.send("SetCurrentScene", { "scene-name": scene }).catch(err => {
      notifyUser("error", "errorObs", null, false, err);
    });
  } catch (err) {
    if (obs._connected) notifyUser("error", "errorObs", null, false, err);
  }
}

module.exports = {
  getObs,
  setObs,
  obsSetScene,
  obsGetScenes,
  shortcutSet,
  shortcutsUnset,
}