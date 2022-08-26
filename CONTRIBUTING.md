# Contributing

You are welcome to contribute to this project. If you want to do so, here you will find some useful information to get you started.

## Help translate this application

If any one of you would like to volunteer to become a M³ language moderator for a language you speak, please [sign into GitLocalize](https://gitlocalize.com/) using your GitHub account, and then let me know by [creating a new discussion](https://github.com/sircharlo/meeting-media-manager/discussions/categories/translations) in the **Translations** category.

As language moderator, you will get notified of changes to the English original strings, have a nice and easy to use interface to review existing as well as untranslated strings in your language, and submit new translations to the repo easily.

## Help maintain this application

In order to help maintain this application, the following information will help you get started. If anything is unclear or you simply need more information, please feel free to make contact through [the discussion thread](https://github.com/sircharlo/meeting-media-manager/discussions).

### Developer Tools

- [Git](https://git-scm.com/) >= v2.34.1
- [Node.js](https://nodejs.org/en/) >= v16.17.0
- [Yarn](https://yarnpkg.com/) >= v3.2.3
- [VS Code](https://code.visualstudio.com/) >= v1.70.2
  - VS Code extensions: see [extensions.json](/.vscode/extensions.json)

### Build Setup

``` bash
# Install dependencies
yarn install

# Serve app with hot reload on localhost:3000
yarn dev

# Build electron application for production
yarn build

# Lint all JS/Vue component files in `src/`
yarn lint

# Lint all JS/Vue component files in `src/` and fix all auto-fixable errors
yarn lint:fix

```

### Build Tools

This project was generated with [electron-nuxt](https://github.com/michalzaq12/electron-nuxt) v1.8.1 using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://github.com/michalzaq12/electron-nuxt/blob/master/README.md).

This project uses [Electron.js](https://www.electronjs.org/) to create the desktop application. The Electron.js framework is a cross-platform framework for building native applications.

The renderer process is made using [Nuxt](https://nuxtjs.org/). The Nuxt framework is a Vue framework for building web applications.

The UI components are made using [Vuetify](https://vuetifyjs.com/en/). The Vuetify framework is a Vue UI library for building beautiful material design web applications.

The icons used in this project are taken from the [Font Awesome](https://fontawesome.com/icons) project.

### Run documentation website locally

The documentation website is hosted on [GitHub Pages](https://pages.github.com/) and generated with [Jekyll](https://jekyllrb.com/docs/installation/). To run the documentation site locally, you can follow the [instructions](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll) of GitHub Pages. Once you have installed Bundle, you can run the following commands:

``` bash
# Navigate to docs folder of the project
cd docs

# Install dependencies
bundle install

# Serve website with hot reload on localhost:4000
bundle exec jekyll serve
```
