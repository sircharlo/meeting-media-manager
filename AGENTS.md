# Agent Guide

This repository is Meeting Media Manager (M³), a cross-platform Electron desktop
app for downloading and presenting meeting media for congregations of Jehovah's
Witnesses. It is an Electron app, not a web app: nearly every feature crosses
the renderer ⇄ main-process boundary.

This file holds the rules most tasks need. It complements `CONTRIBUTING.md`; it
does not replace it. Read the detail files below when the task calls for them.

If `AGENTS.local.md` exists in this repo root, it holds personal/local workflow
notes (not committed). It is long: skim its headings and read only the sections
that match the task.

## Detail Files

- [`agent-docs/architecture.md`](agent-docs/architecture.md): what the app
  does, an annotated repo map, import aliases, the domain model and data flow
  (congregation profiles, media sections, `MediaItem`, cache layout,
  downloads), and a where-to-look cheat-sheet. Read it before touching media,
  download, JW-data, settings or store code, or when you don't know where
  something lives.
- [`agent-docs/electron.md`](agent-docs/electron.md): IPC channel types, the
  checklist for adding or changing an Electron API, main-process validation,
  Sentry PII scrubbing and grouping, and Electron runtime dependencies. Read it
  before changing `src-electron/` or `window.electronApi`.
- [`agent-docs/tooling.md`](agent-docs/tooling.md): every `yarn` command and
  env flag, generated assets and their generators, enabling a language, the
  release workflow, and test-setup details.

## Stack and Commands

- Quasar 2 (Vue 3), TypeScript, Electron 43+, Pinia (mostly persisted), Vue
  I18n, VitePress, Vitest. Yarn 4 and Node `^24.14.0`; never use npm/pnpm.
- `yarn dev` runs the app, `yarn lint` runs ESLint + `vue-tsc` (both must
  pass), `yarn test:unit` runs renderer + Electron unit tests, `yarn format`
  runs Prettier.

## Process Boundaries

- Renderer code in `src/` must not import from `src-electron/`. Electron
  main/preload may import only `src/types`, `src/constants` and `src/shared`
  from `src/`, and main and preload must not import each other. ESLint enforces
  all of this.
- The renderer reaches Electron only through the typed `window.electronApi`
  (`ElectronApi` in `src/types/electron.d.ts`). To add or change an Electron
  API, follow the checklist in `agent-docs/electron.md`.
- Build paths with `upath` (`join`, `dirname`, `basename`), never `node:path`.

## Error Handling and Logging

- Never use `console.*` in app code (`no-console` is an ESLint error).
- **Renderer**: `errorCatcher(error, { contexts: { fn: { name: 'fnName', ... } } })`
  from `src/helpers/error-catcher.ts`. Always pass `contexts.fn.name` so Sentry
  can group.
- **Electron main/preload**: `captureElectronError(error, { contexts })` from
  `src-electron/main/utils.ts`, plus `addElectronBreadcrumb` for breadcrumbs.
- **Logging**: `log(message, prefix, type, ...details)` from
  `src/shared/vanilla.ts`; `prefix` must be a `LogPrefix` key (e.g. `'jw'`,
  `'electronDownloads'`, `'mediaPlayback'`). Renderer log prefixes may contain
  emojis; **log() message strings in Electron main/preload must not contain
  emojis** (ESLint).
- Classify network errors with `isFetchNetworkError`
  (`src/shared/network-errors.ts`) and filesystem errors with
  `src/shared/filesystem-errors.ts` before deciding whether to report.

## Vue/UI and Code Style

- Components use `<script setup lang="ts">` only; Vue attributes are
  alphabetized; place watchers (`watch`, `watchEffect`, `watchImmediate`,
  `whenever`, VueUse watcher helpers) after all `const` declarations.
- Follow existing Quasar patterns and local components before adding new UI
  abstractions; prefer existing `mmm-*` icons (run `yarn generate:icons` if icon
  assets change).
- New user-facing copy uses i18n keys in `src/i18n/en.json`, never hardcoded
  visible strings in templates or TS.
- Keep logic SonarQube-friendly (see `sonar-project.properties`): no nested
  ternaries; prefer early returns, small helpers and named variables; don't
  copy existing anti-patterns.
- ESLint `perfectionist` enforces the order of imports, object keys and more:
  don't hand-order, let `yarn lint` / lint-staged fix it. Prettier: 2 spaces,
  LF, UTF-8, final newline.

## Testing

- Vitest projects: `quasar` (`src/**/*.test.ts`, happy-dom), `electron`
  (`src-electron/**/*.test.ts`, node), `docs`. Run the smallest useful command
  first (one file), then `yarn test:unit` / `yarn lint` when warranted.
- Reuse mocks in `test/vitest/mocks/` (`electronApi.ts` must track
  `ElectronApi`; tests mock fetch via the msw handlers in `http.ts`).
- Bug fixes get a focused regression test near the affected code; UI tests
  assert behavior and rendered state, not implementation details.
- Never pair a bare `createPinia()` with `pinia.use()` in tests (the plugin
  silently no-ops); use `createPersistedPinia()` from
  `app/test/vitest/mocks/pinia` or `createTestingPinia()`.

## Localization and Crowdin

- Do not translate strings manually. Only populate or edit English source content:
  - `src/i18n/en.json`
  - `release-notes/en.md`
  - `docs/src/en/**`
  - `docs/locales/en.json`
- Other language files come from Crowdin PRs (`crowdin.yml`). Don't edit them
  unless the task is specifically about Crowdin configuration or output.
- Don't edit sections marked `This file will be updated by the update-langs
script` (in `src/i18n/index.ts`, `docs/locales/index.ts`,
  `src/constants/locales.ts`) unless intentionally changing language
  availability (steps in `agent-docs/tooling.md`).

## Generated Files

- Don't hand-edit `dist/`, `.quasar/` or generated docs output. For icons and
  logos, edit the sources in `build/icons` / `build/logos` and run the
  generator.
- If main/preload code needs a runtime dependency, add it to
  `src-electron/package.json`, not just the root `package.json`.

## Common Changes

- **Add/change a setting**: `src/constants/settings.ts` (`settingsDefinitions`,
  `defaultSettings`) + `src/types/settings.d.ts` + `src/i18n/en.json` keys.
- **Persisted store shape change**: edit the store and add a migration to
  `src/migrations/`.
- **New feature**: if it's a good candidate (off by default, useful to many
  congregations, a safe toggle or with its own setup path), add it to
  `FEATURE_NUDGES` in `src/constants/feature-nudges.ts` with friendly
  `feature-nudge-<id>-title` / `-body` strings in `src/i18n/en.json` (details
  in `agent-docs/architecture.md`).

## Commits, Releases and Changelog

- Conventional Commits: branch `type/description`, commit
  `type(scope?): description`; PRs are squash-merged using the PR title. Write
  detailed, context-rich commit messages, matching recent history.
- Never bump versions, touch release metadata, or hand-craft a
  `chore: bump version to ...` commit unless the task explicitly requires it;
  the `Manual Release` workflow does that.
- **Changelog**: every user-facing change (new feature, bug fix, tweak, or
  notable chore) also gets a line in the `## UPCOMING VERSION` section at the
  top of `CHANGELOG.md`, in the existing curated, categorized style
  (✨ New Features / 🛠️ Improvements and Tweaks / 🐞 Bug Fixes / 🔧 Chores).
  Create the section if it's missing (e.g. right after a release). It is synced
  into `release-notes/en.md` so translators get upcoming changes early, and the
  release script renames it to the real version.

## PR Hygiene

- Keep changes scoped to the requested behavior; avoid opportunistic refactors.
- Do not change translated files, generated artifacts, or release metadata
  unless the task explicitly requires it.
- Before finishing, summarize what changed and mention any tests/checks run
  (and why any were skipped).
