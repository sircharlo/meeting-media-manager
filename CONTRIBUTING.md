# Contributing

You are welcome to contribute to this project. If you want to do so, here you will find some useful information to get you started.

## Help translate this application

If any one of you would like to volunteer to become a M³ language moderator for a language you speak, please [sign into Crowdin](https://crowdin.com/project/meeting-media-manager) using your GitHub account, and then let me know by [creating a new discussion](https://github.com/sircharlo/meeting-media-manager/discussions/categories/translations) in the **Translations** category.

As language moderator, you will get notified of changes to the English original strings, have a nice and easy to use interface to review existing as well as untranslated strings in your language, and submit new translations to the repo easily.

## Help maintain this application

In order to help maintain this application, the following information will help you get started. If anything is unclear or you simply need more information, please feel free to make contact through [the discussion thread](https://github.com/sircharlo/meeting-media-manager/discussions).

### Developer Tools

- [Git](https://git-scm.com/) >= v2.34.1
- [Node.js](https://nodejs.org/en/) >= v16.13.0
- [Yarn](https://yarnpkg.com/) >= v3.2.3
- [VS Code](https://code.visualstudio.com/) >= v1.70.2
  - VS Code extensions: see [extensions.json](./.vscode/extensions.json)

### Getting Started

To get started, you first have to install Git, Node.js and VS Code (see their respective documentation for more information). Once you have installed those, you can easily install Yarn by executing the following commands:

```bash
# Enable corepack feature of Node.js (includes yarn)
corepack enable

# Update yarn to the latest stable version
yarn set version stable
```

Once you have done that, you are ready to contribute! Fork this repository, clone it, and when you have something to contribute, you can create a Pull Request on GitHub.

### Build Setup

The following commands are used during the development of the application to test and build it:

```bash
# Install dependencies
yarn install

# Run the pre-build.sh script (necessary for dev and build scripts)
yarn prebuild

# Compile Electron ts files to js (necessary for dev and build scripts)
yarn compile

# Serve app with hot reload on localhost:3000
yarn dev

# Build electron application for production
yarn build

# Build with minimal release files (necessary for test script)
yarn build-dev

# Lint all JS/TS/Vue files in `src/`
yarn lint

# Lint all JS/TS/Vue files in `src/` and fix all auto-fixable errors
yarn lint:fix

# Run e2e tests using Playwright
yarn test
```

The development environment uses a different location to store its files ([`app.getPath('appData')`](https://electronjs.org/docs/api/app#appgetpathname)/Electron) than production ([`app.getPath('appData')`](https://electronjs.org/docs/api/app#appgetpathname)/meeting-media-manager). This prevents the accidental breaking/changing of your personal production version of the application.

### Build Tools

This project was generated with [electron-nuxt](https://github.com/michalzaq12/electron-nuxt) v1.8.1 using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://github.com/michalzaq12/electron-nuxt/blob/master/README.md).

This project uses [Electron.js](https://www.electronjs.org/) to create the desktop application. The Electron.js framework is a cross-platform framework for building native applications.

The renderer process is made using [Nuxt.js](https://nuxtjs.org/). The Nuxt framework is a [Vue](https://v2.vuejs.org/) framework for building web applications.

The UI components are made using [Vuetify.js](https://v2.vuetifyjs.com/en/). The Vuetify framework is a Vue UI library for building beautiful material design web applications.

The icons used in this project are taken from the [Font Awesome](https://fontawesome.com/icons) project.

The tests are written using [Playwright](https://playwright.dev/). Playwright is a browser automation tool that allows you to run the actual application and test the different features automatically. Good to know: when testing locally, make sure you build the app first using `yarn build`.

### Release Procedure

To release a new version of the application, you first create a draft release on GitHub. Then, you can change the [package.json](package.json) version to the desired version and commit the changes with the message `chore(release): vx.x.x` (e.g. `chore(release): v23.2.2`). Then, the build/release workflow will be executed and will fill the release draft with the new artifacts. After that, you can add a description of the release (features, bug fixes, etc.) and publish it.

### Contribute to the documentation site

More information about contributing to the documentation site specifically can be found in the [CONTRIBUTING.md](https://github.com/sircharlo/meeting-media-manager/blob/docs/CONTRIBUTING.md) of the docs branch.

The documentation website will automatically be updated when changes are pushed to the docs branch.
