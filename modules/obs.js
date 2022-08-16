// Internal modules
const { log, notifyUser } = require("./log");
const { get, set, setPref } = require("./store");

// External modules
const remote = require("@electron/remote");
const $ = require("jquery");
const OBSWebSocket = require("obs-websocket-js");

// Variables
let dynamicShortcuts = {};

async function obsConnect() {
  const prefs = get("prefs");
  try {
    if (!prefs.enableObs && get("obs")._connected) {
      await get("obs").disconnect();
      log.info("OBS disconnected.");
      set("obs", {});
    } else if (!get("obs")._connected && prefs.enableObs && prefs.obsPort && prefs.obsPassword) {
      set("obs", new OBSWebSocket());
      get("obs").on("error", err => {
        notifyUser("error", "errorObs", null, false, err);
      });
      get("obs").on("SwitchScenes", function (newScene) {
        try {
          if (newScene && newScene.sceneName && newScene.sceneName !== prefs.obsMediaScene) $("#obsTempCameraScene").val(newScene.sceneName).trigger("change");
        } catch (err) {
          log.error(err);
        }
      });
      get("obs").on("ConnectionOpened", () => {
        log.info("OBS success! Connected & authenticated.");
      });
      await get("obs").connect({ address: "localhost:" + prefs.obsPort, password: prefs.obsPassword }).catch(err => {
        notifyUser("error", "errorObs", null, false, err);
      });
    }
  } catch (err) {
    notifyUser("error", "errorObs", null, false, err);
  }
  $(".relatedToObsScenes").toggle(!!get("obs")._connected);
  $(".relatedToObsLogin input")
    .toggleClass("is-invalid", !!prefs.enableObs && !get("obs")._connected)
    .toggleClass("is-valid", !!prefs.enableObs && !!get("obs")._connected);
  return !!get("obs")._connected;
}

function shortcutSet(shortcut, destination, fn) {
  let ret = null, alreadyExists = false;
  try {
    if (dynamicShortcuts[destination] && dynamicShortcuts[destination].includes(shortcut)) {
      alreadyExists = true;
    } else if (!dynamicShortcuts[destination] || (Array.isArray(dynamicShortcuts[destination]) && !dynamicShortcuts[destination].includes(shortcut)))
      ret = remote.globalShortcut.register(shortcut, fn);
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

async function obsGetScenes(currentOnly, validateConfig) {
  const prefs = get("prefs");
  try {
    let connectionAttempt = await obsConnect();
    return (connectionAttempt ? await get("obs").send("GetSceneList").then(data => {
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
        for (let pref of ["obsCameraScene", "obsMediaScene"]) {
          if ($("#" + pref + " option[value='" + prefs[pref] + "']").length == 0) {
            setPref(pref, null);
            validateConfig();
          } else {
            $("#" + pref).val(prefs[pref]);
          }
        }
        shortcutsUnset("obsScenes");
        let cameraScenes = [];
        $("#obsCameraScene").children().clone().filter(function (i, el) {
          return $(el).val() && $(el).val() !== prefs.obsMediaScene;
        }).each((i, el) => {
          try {
            let sceneNum = (i < 10 ? (i + 1).toString().slice(-1) : null);
            let shortcutSetSuccess = false;
            if ((i + 1) < 10) {
              shortcutSetSuccess = shortcutSet("Alt+" + sceneNum, "obsScenes", function () {
                $("#obsTempCameraScene").val($(el).val()).trigger("change");
                $(`#obsTempCameraScenePicker :radio[id="${$(el).val()}"]`).prop("checked", true);
              });
            }
            let kbdShortcut = `<kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>Alt</kbd> <kbd class='bg-light border border-1 border-secondary fw-bold text-dark'>${sceneNum}</kbd> - `;
            const txt = (shortcutSetSuccess ? kbdShortcut : "") + $(el).val();

            cameraScenes.push({
              id: $(el).val(),
              text: txt,
              html: txt,
              title: $(el).val(),
              ...(shortcutSetSuccess && { kbdScene: sceneNum }),
            });
          } catch (err) {
            log.error(err);
          }
        });
        if (cameraScenes.length > 6) {
          $(".modal-footer .left").append("<select class='form-select form-select-lg ms-3 obs-scenes w-auto' id='obsTempCameraScene'></select>");
          $("#obsTempCameraScene").select2({
            selectionCssClass: "obsTempCameraSceneSelect",
            dropdownParent: $("#staticBackdrop"),
            data: cameraScenes,
            escapeMarkup: function (markup) {
              return markup;
            },
            templateResult: function (data) {
              return data.html;
            },
            templateSelection: function (data) {
              return data.text;
            }
          });
        } else {
          $(".modal-footer .left").append("<input type='hidden' id='obsTempCameraScene' />");
          if (cameraScenes.length > 1) {
            $(".modal-footer .left").append("<div class='btn-group' role='group' id='obsTempCameraScenePicker'></div>");
            for (var i = 0; i < cameraScenes.length; i++) {
              $("#obsTempCameraScenePicker").append(`<input type='radio' class='btn-check' name='obsTempCameraScenePicker' id='${cameraScenes[i].id}' autocomplete='off' ${cameraScenes[i].id == (data.currentScene == prefs.obsMediaScene ? prefs.obsCameraScene : data.currentScene) ? "checked" : ""}/>`);
              $("#obsTempCameraScenePicker").append(`<label class='btn btn-lg btn-outline-primary' for='${cameraScenes[i].id}' title='${(cameraScenes[i].kbdScene ? "[Alt-" + cameraScenes[i].kbdScene + "] - " : "") + cameraScenes[i].title}'>${cameraScenes[i].title.match(/\b(\w)/g).join("")}</label>`);
            }
            $("#obsTempCameraScenePicker input").on("change", function () {
              $("#obsTempCameraScene").val($("#obsTempCameraScenePicker input:checked").attr("id")).trigger("change");
            });
          }
        }
        $("#obsTempCameraScene").val(data.currentScene == prefs.obsMediaScene ? prefs.obsCameraScene : data.currentScene).trigger("change");
        return data;
      }
    }).catch(err => {
      notifyUser("error", "errorObs", null, false, err);
    }) : false);
  } catch (err) {
    if (get("obs")._connected) notifyUser("error", "errorObs", null, false, err);
    return false;
  }
}
async function obsSetScene(scene) {
  try {
    if (await obsConnect() && scene) get("obs").send("SetCurrentScene", { "scene-name": scene }).catch(err => {
      notifyUser("error", "errorObs", null, false, err);
    });
  } catch (err) {
    if (get("obs")._connected) notifyUser("error", "errorObs", null, false, err);
  }
}

module.exports = {
  obsSetScene,
  obsGetScenes,
  shortcutSet,
  shortcutsUnset,
};
