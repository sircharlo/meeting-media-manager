// Internal constants
const constants = require("./../constants");

// Variables
const logLevel = "debug";
const logOutput = {
  error: {},
  warn: {},
  info: {},
  debug: {}
};

const log = {
  debug: function() {
    let now = + new Date();
    if (!logOutput.debug[now]) logOutput.debug[now] = [];
    logOutput.debug[now].push(arguments);
    if (logLevel == "debug") console.log.apply(console,arguments);
  },
  error: function() {
    let now = + new Date();
    if (!logOutput.error[now]) logOutput.error[now] = [];
    logOutput.error[now].push(arguments);
    console.error.apply(console,arguments);
  },
  info: function() {
    let now = + new Date();
    if (!logOutput.info[now]) logOutput.info[now] = [];
    logOutput.info[now].push(arguments);
    console.info.apply(console,arguments);
  },
  warn: function() {
    let now = + new Date();
    if (!logOutput.warn[now]) logOutput.warn[now] = [];
    logOutput.warn[now].push(arguments);
    console.warn.apply(console,arguments);
  },
};

const bugUrl = () => constants.REPO_URL + "issues/new?labels=bug,from-app&title=ISSUE DESCRIPTION HERE&body=" + encodeURIComponent("### Describe the bug\nA clear and concise description of what the bug is.\n\n### To Reproduce\nSteps to reproduce the behavior:\n1. Go to '...'\n2. Click on '....'\n3. Do '....'\n4. See error\n\n### Expected behavior\nA clear and concise description of what you expected to happen.\n\n### Screenshots\nIf possible, add screenshots to help explain your problem.\n\n### System specs\n- " + os.type() + " " + os.release() + "\n- M³ " + currentAppVersion + "\n\n### Additional context\nAdd any other context about the problem here.\n" + (prefs ? "\n### Anonymized `prefs.json`\n```\n" + JSON.stringify(Object.fromEntries(Object.entries(prefs).map(entry => {
  if ((entry[0].startsWith("cong") || entry[0] == "localOutputPath") && entry[1]) entry[1] = "***";
  return entry;
})), null, 2) + "\n```" : "") + (logOutput.error && logOutput.error.length >0 ? "\n### Full error log\n```\n" + JSON.stringify(logOutput.error, null, 2) + "\n```" : "") + "\n").replace(/\n/g, "%0D%0A");

function notifyUser(type, message, fileOrUrl, persistent, errorFedToMe, action, hideDismiss) {
  try {
    let icon;
    switch (type) {
    case "error":
      icon = "fa-exclamation-circle text-danger";
      break;
    case "warn":
      icon = "fa-exclamation-circle text-warning";
      break;
    default:
      icon = "fa-info-circle text-primary";
    }
    if (fileOrUrl) fileOrUrl = escape(fileOrUrl);
    if (["error", "warn"].includes(type)) log[type](fileOrUrl ? fileOrUrl : "", errorFedToMe ? errorFedToMe : "");
    type = i18n.__(type);
    let thisBugUrl = bugUrl() + (errorFedToMe ? encodeURIComponent("\n### Error details\n```\n" + JSON.stringify(errorFedToMe, Object.getOwnPropertyNames(errorFedToMe), 2) + "\n```\n").replace(/\n/g, "%0D%0A") : "");
    $("#toastContainer").append($("<div class='toast' role='alert' data-bs-autohide='" + !persistent + "' data-bs-delay='10000'><div class='toast-header'><i class='fas " + icon + "'></i><strong class='me-auto ms-2'>" + type + "</strong><button type='button' class='btn-close " + (hideDismiss ? "d-none" : "") + "' data-bs-dismiss='toast'></button></div><div class='toast-body'><p>" + i18n.__(message) + "</p>" + (fileOrUrl ? "<code>" + fileOrUrl + "</code>" : "") + (action ? "<div class='mt-2 pt-2 border-top'><button type='button' class='btn btn-primary btn-sm toast-action' " + (action && !action.noLink ? "data-toast-action-url='" + escape((action && action.url ? action.url : thisBugUrl)) + "'" :"") + ">" + i18n.__(action && action.desc ? action.desc : "reportIssue") + "</button></div>" : "") + "</div></div>").toast("show"));
  } catch (err) {
    log.error(err);
  }
}

module.exports = {
  log,
  bugUrl,
  notifyUser
};
