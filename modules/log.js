// Global constants
const { REPO_URL } = require("./../constants");

// Internal modules
const { get } = require("./store");

// External modules
const os = require("os");
const $ = require("jquery");
const remote = require("@electron/remote");
const path = require("upath");
const i18n = require("i18n");
i18n.configure({
  directory: path.join(__dirname, "../locales"),
  defaultLocale: "en",
  updateFiles: false,
  retryInDefaultLocale: true,
});

// Variables
const currentAppVersion = "v" + remote.app.getVersion();
let logLevel = "info";
const logOutput = {
  error: {},
  warn: {},
  info: {},
  debug: {},
};

const log = {
  debug: function () {
    let now = +new Date();
    if (!logOutput.debug[now]) logOutput.debug[now] = [];
    logOutput.debug[now].push(arguments);
    if (logLevel == "debug") console.log.apply(console, arguments);
  },
  error: function () {
    let now = +new Date();
    if (!logOutput.error[now]) logOutput.error[now] = [];
    logOutput.error[now].push(arguments);
    console.error.apply(console, arguments);
  },
  info: function () {
    let now = +new Date();
    if (!logOutput.info[now]) logOutput.info[now] = [];
    logOutput.info[now].push(arguments);
    console.info.apply(console, arguments);
  },
  warn: function () {
    let now = +new Date();
    if (!logOutput.warn[now]) logOutput.warn[now] = [];
    logOutput.warn[now].push(arguments);
    console.warn.apply(console, arguments);
  },
};

const bugUrl = () =>
  REPO_URL +
  "issues/new?labels=bug,from-app&title=ISSUE DESCRIPTION HERE&body=" +
  encodeURIComponent(
    `### Describe the bug
A clear and concise description of what the bug is.

### To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Do '....'
4. See error

### Expected behavior
A clear and concise description of what you expected to happen.

### Screenshots
If possible, add screenshots to help explain your problem.

### System specs
- ${os.type()} ${os.release}
- M³ ${currentAppVersion}

### Additional context
Add any other context about the problem here.\n` +
      (get("prefs")
        ? "\n### Anonymized `prefs.json`\n```\n" +
          JSON.stringify(
            Object.fromEntries(
              Object.entries(get("prefs")).map((entry) => {
                if (
                  (entry[0].startsWith("cong") ||
                    entry[0] == "localOutputPath") &&
                  entry[1]
                )
                  entry[1] = "***";
                return entry;
              })
            ),
            null,
            2
          ) + "\n```"
        : "") +
      (logOutput.error && logOutput.error.length > 0
        ? "\n### Full error log\n```\n" +
          JSON.stringify(logOutput.error, null, 2) +
          "\n```"
        : "") + "\n"
  ).replace(/\n/g, "%0D%0A");

function setLogLevel(level) {
  logLevel = level;
}

function notifyUser(
  type,
  message,
  fileOrUrl = null,
  persistent = false,
  errorFedToMe = null,
  action = null,
  hideDismiss = false
) {
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
    if (["error", "warn"].includes(type))
      log[type](fileOrUrl ? fileOrUrl : "", errorFedToMe ? errorFedToMe : "");
    type = i18n.__(type);
    let thisBugUrl =
      bugUrl() +
      (errorFedToMe
        ? encodeURIComponent(
          "\n### Error details\n```\n" +
              JSON.stringify(
                errorFedToMe,
                Object.getOwnPropertyNames(errorFedToMe),
                2
              ) +
              "\n```\n"
        ).replace(/\n/g, "%0D%0A")
        : "");
    $("#toastContainer").append(
      $(
        `<div class='toast' role='alert' data-bs-autohide='${!persistent}' data-bs-delay='10000'>
        <div class='toast-header'>
          <i class='fas ${icon}'></i>
          <strong class='me-auto ms-2'>${type}</strong>
          <button type='button' class='btn-close ${hideDismiss ? "d-none" : ""}' data-bs-dismiss='toast'></button>
        </div>
        <div class='toast-body'>
          <p>${i18n.__(message)}</p>
          ${fileOrUrl ? `<code>${fileOrUrl}</code>` : ""}
          ${action
    ? `<div class='mt-2 pt-2 border-top'>
          <button type='button' class='btn btn-primary btn-sm toast-action'
            ${!action.noLink ? `data-toast-action-url='${escape(action && action.url ? action.url : thisBugUrl)}'` : ""}>
            ${i18n.__(action && action.desc ? action.desc : "reportIssue")}
          </button>
      </div>`
    : ""}
    </div>
    </div>`
      ).toast("show")
    );
  } catch (err) {
    log.error(err);
  }
}

module.exports = {
  log,
  setLogLevel,
  bugUrl,
  notifyUser,
};
