# Contributing

You are welcome to contribute some code or to help translate this project! If you want to do so, here you will find some useful information to get you started.

## Help translate this application

If you would like to volunteer to become a M³ language moderator for a language you speak, please [sign in to Crowdin](https://crowdin.com/project/meeting-media-manager) using your GitHub account, and let us know by [creating a new discussion](https://github.com/sircharlo/meeting-media-manager/discussions/new?category=translations) in the **Translations** category.

As language moderator, you will get notified of changes to the English original strings. You will also have access to an easy-to-use interface to review existing and untranslated strings in your language, and submit new translations.

## Help maintain this application

In order to help maintain this application, the following information will help you get started. If anything is unclear or you simply need more information, please feel free to make contact through [a discussion thread](https://github.com/sircharlo/meeting-media-manager/discussions).

### Developer Tools

- [Git](https://git-scm.com/) ^2.45.2
- [Node.js](https://nodejs.org/) ^22.16.0
- [Yarn](https://yarnpkg.com/) ^4.7.0
- [VS Code](https://code.visualstudio.com/) ^1.95.3
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

# Rebuild native modules
yarn electron-rebuild

# Generate icon font
yarn generate:icons

# Generate logo assets
yarn generate:logos

# Serve app with hot reload for development
yarn dev

# Build electron application for production
yarn build

# Build electron application for production with debugging enabled
yarn build:debug

# Format all files
yarn format

# Lint all JS/TS/Vue files
yarn lint

# Run unit tests
yarn test:unit
```

### Build Tools

This project is built with [Quasar](https://quasar.dev/). Documentation about the directory structure can be found [here](https://quasar.dev/quasar-cli-webpack/directory-structure).

This project uses [Electron.js](https://www.electronjs.org/) to create the desktop application. The Electron.js framework is a cross-platform framework for building native applications.

The UI process is made using [Vue.js](https://vuejs.org/). Vue.js is framework for building web applications.

The UI components are made from [Quasar](https://quasar.dev/docs) components.

### Naming Conventions

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification when creating branches, commits and Pull Requests. This will help to automatically generate the changelog and versioning of the application.

#### Branches

Branches should be named according to the following pattern: `type/description` (e.g. `feat/add-new-feature` or `fix/fix-some-bug`).

#### Commits

Commit messages should be written according to the following pattern: `type(scope?): description` (e.g. `refactor: optimize some code` or `chore(deps): update deps`).

#### Pull Requests

Pull Requests are merged by squashing the commits into a single commit with the title of the Pull Request, so the PR should be named according to the following pattern: `type(scope?): description` (e.g. `ci(build): improve build script` or `docs: add some documentation`).

### Code Style

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to enforce a consistent code style. These tools are integrated into the development workflow and will automatically check and format the code.

### Release Procedure

To release a new version of the application, a draft release must be created on GitHub. The [package.json](package.json) version must be updated to the desired version and the changes committed with the message `chore(release): vx.x.x` (e.g. `chore(release): v26.3.1`). Afterwards, the build/release workflow will be executed automatically and will add the necessary executable files to the release draft. After adding a description of the release (features, bug fixes, etc.), it can be published.

### Internationalization

#### Adding a new language

In order to add a completely new language to the application, it has to first be added to Crowdin. Make sure that the `two_letters_code` of the language equals the language symbol that the official website of Jehovah's Witnesses uses. Crowdin will create a Pull Request which will add the new language files to the repository. After that, it can be added to the application.

Add the language symbol in camelCase to the `LanguageValue` type in the [src/constants/locales.ts](./src/constants/locales.ts) file:

```diff
export type LanguageValue =
  // Some more languages
  | 'en'
  // Some more languages
+ | 'ptPt'
  // Some more languages
```

The language symbol should be the camelCase version of the symbol used by the official website of Jehovah's Witnesses. For example, the Portuguese language is represented by the `pt-pt` symbol, so the camelCase version is `ptPt`.

Add the new language to the `locales` array in the [src/constants/locales.ts](./src/constants/locales.ts) file:

```typescript
{
  // English name of the language
  englishName: string;
  // Localized name of the language
  label: string;
  // JW language code
  langcode: JwLangCode;
  // JW language codes for related sign languages
  signLangCodes?: JwLangCode[];
  // The symbol of the language in camelCase (e.g. ptPt for pt-pt).
  value: LanguageValue;
}
```

Add the necessary import statements to the [docs/locales/index.ts](./docs/locales/index.ts) and [src/i18n/index.ts](./src/i18n/index.ts) files:

```diff
// Make sure that the import name is the same as the value in the locales array
// This line should initially be commented out in src/i18n/index.ts
+ import ptPt from './pt-pt.json';
```

#### Enabling a language

To enable a language in the application, you need to perform two steps:

First, uncomment the import statement in the [src/i18n/index.ts](./src/i18n/index.ts) file:

```diff
- // import ptPt from './pt-pt.json';
+ import ptPt from './pt-pt.json';
```

Then, add the language symbol in camelCase to the `enabled` array in the [src/constants/locales.ts](./src/constants/locales.ts) file:

```diff
const enabled = [
  // Some more languages
  'en',
  // Some more languages
+ 'ptPt',
  // Some more languages
];
```

To disable a language, you need to perform the same steps, but in reverse.

### Contribute to the documentation site

The documentation website lives in the `docs` folder. It is built with [VitePress](https://vitepress.dev/). Information about the directory structure can be found [here](https://vitepress.dev/guide/getting-started#file-structure). To work on the documentation site, you can use the following commands:

```bash
# Install dependencies
yarn install

# Serve website locally with hot reload for development
yarn docs:dev

# Build the website for production
yarn docs:build

# Preview the production build locally
yarn docs:preview

# Format all files
yarn format

# Lint all JS/TS/Vue files
yarn docs:lint

# Run tests
yarn docs:test
```
