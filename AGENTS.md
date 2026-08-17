# Agent Guide

This repository is Meeting Media Manager (M³), a cross-platform Electron desktop
app for downloading and presenting meeting media for congregations of Jehovah's
Witnesses. It uses Quasar (Vue 3), TypeScript, Electron, Pinia, Vue I18n,
VitePress, Vitest, Yarn 4, and Node 24. It is an Electron app, not a web app:
nearly every feature crosses the renderer ⇄ main-process boundary.

Use this file as the first stop for agent-specific project rules. It complements
`CONTRIBUTING.md`; it does not replace it.

## Feature Surface (what the app actually does)

- **Media calendar** (`MediaCalendarPage`): fetches the JW.org meeting schedule
  for the congregation's language, builds per-day media sections (midweek/weekend
  meeting parts, songs, videos, images, PDFs), downloads the media to a local
  cache, and lets users add their own media to sections.
- **Media display**: a dedicated always-on-top fullscreen (or windowed) display
  window on a second screen that presents media — video/audio playback, image
  slideshows, subtitles, zoom/pan, looping, playback speed. Controlled from the
  main window via `mediaPlaying` state in the `current-state` store.
- **Timer page + timer window**: per-part timers with countdown/count-up modes,
  meeting countdown, overtime indicators. Displayed on a second screen.
- **Present a website**: opens a second window showing a JW.org website page
  (optionally mirroring/streaming content) for the audience, with zoom and
  back/forward navigation.
- **OBS integration** (`src/utils/obs.ts`, `src/helpers/obs.ts`): connects to
  OBS Studio over obs-websocket to switch scenes, start/stop recordings, and
  control the media window presentation.
- **Download manager** (`src-electron/main/downloads.ts`): queued downloads with
  priorities (normal vs low/background), pause/resume, cancel-all, and temp-folder
  fallback when the cache directory becomes unusable.
- **Background music**: plays music before/after the meeting, stopping N seconds
  before start time; configurable volume and folders.
- **Watched folder**: a local folder is watched (chokidar) and media dropped into
  it is auto-imported into the right calendar day's sections.
- **Settings & setup wizard**: per-congregation profiles (multiple congregations),
  a setup wizard, and a quick-start tour. Settings are defined declaratively in
  `src/constants/settings.ts` and rendered generically by `SettingsPage`.
- **Integrations**: keyboard shortcuts (global, Electron `globalShortcut`),
  Zoom screen-share automation (robotjs key tapping), custom events, meeting
  recording controls, media auto-export (incl. FFmpeg conversion), cache
  auto-clear, updates (electron-updater, GitHub releases), Sentry crash
  reporting, and a demo mode for automated screenshots.
- **Yeartext & fonts**: displays the annual yeartext with dynamically discovered
  fonts from WOL's CSS (see `updateYeartextFontUrls` in the jw store and
  `getYeartextFontUrlsFromCss` in `src/shared/vanilla.ts`).

## Tech Stack

- **UI**: Quasar 2 (Vue 3 `<script setup lang="ts">` only), Vue Router (hash
  mode), Pinia + `pinia-plugin-persistedstate` for store persistence.
- **Electron 43+** with @quasar/app-vite 3; main/preload in `src-electron/`.
- **i18n**: Vue I18n; English source in `src/i18n/en.json`, other locales are
  Crowdin-generated (do not edit).
- **Docs**: VitePress site in `docs/` with per-language folders.
- **Tests**: Vitest with three projects (`quasar`, `electron`, `docs`) +
  Playwright screenshot tests.
- **Package manager**: Yarn 4 (`packageManager: yarn@4.17.0`), Node `^24.14.0`.
  Never use npm/pnpm.

## Commands

- `yarn install` installs dependencies.
- `yarn electron-rebuild` rebuilds native Electron modules (robotjs).
- `yarn generate:icons` regenerates the custom `mmm-*` icon font from
  `build/icons` (svg2font).
- `yarn generate:logos` regenerates logo assets.
- `yarn dev` starts the Electron app in development mode.
- `yarn build` / `yarn build:debug` / `yarn build:unpacked` build the app
  (packaged / debug / skip packaging).
- `yarn lint` runs ESLint and `vue-tsc` type checks for app and Electron code.
- `yarn test:unit` runs renderer + Electron unit tests.
- `yarn depcheck` checks for unused/missing dependencies.
- `yarn format` runs Prettier over everything.
- `yarn docs:dev` / `yarn docs:build` / `yarn docs:preview` / `yarn docs:lint` /
  `yarn docs:test` work on the docs site.
- `yarn screenshot:refresh` re-runs Playwright screenshots (demo mode).
- Env flags that change behavior: `M3_DEMO_MODE=1` (demo/screenshot mode —
  network fetches fail intentionally), `TEST_VERSION=true` (test build identity),
  `M3_ENABLE_GPU_DIAGNOSTICS` (Chromium GPU logging).

## Repository Structure (annotated)

```
src/                         Renderer (Vue 3 + Quasar). Must NOT import src-electron.
  boot/                      Quasar boot files: globals (window.electronApi),
                             i18n, sentry, fonts, demo-mode, notify-types.
  components/                Vue components: dialog/, media/ (MediaList, MediaItem,
                             DownloadStatus, ...), form-inputs/ (ShortcutInput, ...),
                             header/, ui/.
  composables/               use* composition functions: useMediaSection,
                             useMediaSectionRepeat, useMediaDividers,
                             useMediaDragAndDrop, useDialogState, useTimer, useLocale.
  constants/                 locales.ts (LanguageValue + enabled languages),
                             settings.ts (settingsGroups, settingsDefinitions,
                             defaultSettings), jw.ts, media.ts, date.ts, general.ts,
                             jw-icons.ts, mepslangs.ts.
  helpers/                   Feature logic used by stores/components: obs.ts,
                             mediaPlayback.ts, jw-media.ts, congregation-schedule.ts,
                             background-music.ts, export-media.ts, cleanup.ts,
                             keyboardShortcuts.ts (registration + dispatch),
                             keyboard-shortcuts.ts (robotjs key-tap sender),
                             error-catcher.ts, notifications.ts, fonts.ts, zoom.ts,
                             mediaWindowAutoHide.ts, pending-section-imports.ts,
                             demo-mode.ts, usage.ts, date.ts, fs.ts, fs-retry.ts.
  i18n/                      Locale JSON. ONLY en.json is hand-edited.
  layouts/                   MainLayout, MediaPlayerLayout, TimerLayout, RouteHelper.
  migrations/                Store-data migrations (MIGRATION_REGISTRY map).
  pages/                     Route pages: MediaCalendarPage, MediaPlayerPage,
                             TimerPage, SettingsPage, SetupWizard, PresentWebsite,
                             ErrorNotFound.
  router/                    Vue Router routes (hash mode).
  shared/                    Code safe for BOTH renderer and Electron main:
                             vanilla.ts (log(), uuid, sanitizeFilename, scrubUserPaths,
                             CSS/font URL extractors), filesystem-errors.ts
                             (fs error classification for cloud/network paths),
                             network-errors.ts (isFetchNetworkError). Do not put
                             renderer-only or Electron-only code here.
  stores/                    Pinia stores (all persisted): app-settings, congregation-
                             settings (congregations map + encrypted obsPassword),
                             current-state (active congregation, mediaPlaying,
                             downloadProgress, selection), dialog-state, jw (cached
                             JW data: languages, songs, yeartexts, lookupPeriod),
                             obs-state.
  types/                     Shared TS types, barrel-exported via index.d.ts:
                             electron.d.ts (ElectronApi + IPC channel unions),
                             settings.d.ts, media.d.ts, jw/, obs.d.ts, timer.d.ts,
                             fs.d.ts, general.d.ts, search.d.ts, dates.d.ts.
  utils/                     Logic: api.ts (fetchRaw/fetchJson + in-memory cache +
                             retry), fs.ts (cache path resolution, publication dirs),
                             jw.ts (pub id / resolution helpers), obs.ts (websocket
                             connection state), sqlite.ts (executeQuery via preload),
                             settings.ts (validators), media.ts, converters.ts,
                             queue.ts, fetch-retry.ts, dialog-plugin.ts,
                             timer-report.ts, migrations.ts, profile-settings.ts.

src-electron/                Electron main + preload. May import only src/types,
                             src/constants, src/shared from src/.
  constants.ts               Env-derived constants, JW/trusted domains.
  electron-main.ts           App entry: Sentry init, single-instance lock, crash-loop
                             handling, GPU diagnostics, application menu, process-
                             crash handling, window creation.
  electron-preload.ts        contextBridge exposure — builds window.electronApi
                             (typed in src/types/electron.d.ts).
  main/                      Main-process modules:
    ipc.ts                   ALL ipcMain handlers are registered here (single file).
    downloads.ts             Download queue, priorities, pause/resume, retries.
    session.ts               CSP, trusted-domain/CORS header rewriting, user agent.
    fs.ts                    File dialogs, watch folders, zip/unzip, HEIC, paths.
    ffmpeg.ts                Video conversion (createVideoFromNonVideo).
    screen.ts                Screen change listeners, getAllScreens.
    disk-space.ts            Low-disk-space detection.
    secrets.ts               OS-keychain encrypt/decrypt (OBS password).
    security.ts              Hardening (permission handlers, etc.).
    shortcuts.ts             globalShortcut registration from settings.
    updater.ts               electron-updater integration.
    utils.ts                 captureElectronError, isSelf/isTrustedDomain,
                             fetchJsonFromMainProcess, scrubUserPathsDeep usage.
    resilient-storage.ts     JSON read/write with fallback to temp dir.
    window/                  window-base.ts (sendToWindow/logToWindow),
                             window-main.ts, window-media.ts, window-timer.ts,
                             window-website.ts, window-bounds.ts, window-state.ts.
  preload/                   Preload helpers: ipc.ts (invoke/send/listen/sendSync),
                             fs.ts (fs-extra subset across the bridge), sqlite.ts,
                             robot.ts (robotjs key taps), screen.ts, website.ts,
                             close.ts, log.ts, converters.ts.

docs/                        VitePress docs site. Hand-edit only docs/src/en/** and
                             docs/locales/en.json; other locales are Crowdin PRs.
test/                        test/vitest (setup/, mocks/, helpers/) and
                             test/playwright (screenshot tests, yarn screenshot:refresh).
scripts/                     Repo maintenance scripts (update-langs.py, JW icon
                             fallbacks, release notes, etc.).
build/                       Icon font sources (svg2font), logos, packaging assets
                             (installer.nsh, entitlements, splash).
```

Import aliases available everywhere: `src/`, `src-electron/`, `stores/`,
`components/`, `pages/`, `layouts/`, `boot/`, `assets/`, `main/` (electron main),
`preload/` (electron preload), `app/` (repo root, e.g. `app/package.json`), and
`#q-app` (Quasar runtime). Vitest mirrors these aliases in `vitest.config.mts`.

## Domain Model & Data Flow (know this before touching media code)

- **Congregation profiles**: `congregation-settings` store keeps
  `congregations: Record<uuid, SettingsValues>`. `current-state.currentCongregation`
  is the active profile id. New settings are defined once in
  `src/constants/settings.ts` (`settingsDefinitions` + `defaultSettings`) and
  typed in `src/types/settings.d.ts`; the settings UI, validation, and missing-
  key backfill all derive from those definitions.
- **JW cached data** (`jw` store): `lookupPeriod[congregationId]` is an array of
  `DateInfo` days, each with `mediaSections` (array of sections, each with
  `items: MediaItem[]`). Fetching is: `src/utils/api.ts` (fetchJson/fetchRaw,
  caching, retry, offline tolerance) → helpers (`jw-media.ts`,
  `congregation-schedule.ts`) → store actions. The store is persisted, so dates
  are rehydrated from strings in `persist.afterHydrate`.
- **MediaItem** (`src/types/media.d.ts`): `uniqueId`, `pubMediaId`, `fileUrl`,
  `source` ('dynamic' from JW.org / 'additional' user-added), `tag` (song/video/
  image/...), `children`, `hidden`, `sortOrderOriginal`, `duration`. Helper
  functions `addUniqueByIdAt`, `deduplicateById`, `replaceMissingMediaByPubMediaId`
  live in `src/stores/jw.ts`.
- **Files/cache layout**: cache root is resolved by `src/utils/fs.ts`
  (`getCachedUserDataPath`, custom `cacheFolder` setting, machine-wide fallback,
  `registerCachePathProvider`), with `Publications/`, `Fonts/`, `Additional Media/`
  and a `Temp/` that always bypasses the custom folder. Paths are built with
  `upath` (`join`, `dirname`, `basename`), never `node:path`.
- **Downloads**: renderer calls `electronApi.downloadFile(url, saveDir, ...)`;
  the main process queues it and emits `downloadProgress/downloadCompleted/...`
  events back to the renderer, which the `current-state` store tracks in
  `downloadProgress` and components render via `DownloadStatus.vue`.

## Process Boundaries & IPC

- Renderer code in `src/` must not import from `src-electron/` (ESLint
  `no-restricted-imports` enforces this, in both directions).
- Electron main/preload must only import `src/types`, `src/constants`,
  `src/shared` from `src/`. Main must not import preload, and preload must not
  import main (both enforced by ESLint).
- The renderer talks to Electron exclusively through the typed
  `window.electronApi` object (interface `ElectronApi` in
  `src/types/electron.d.ts`), exposed by `src-electron/electron-preload.ts`.
- All `ipcMain` handlers are registered in `src-electron/main/ipc.ts`. Channels
  are typed as unions: `ElectronIpcInvokeKey` (invoke/handle), `ElectronIpcSendKey`
  (send/on), `ElectronIpcSendSyncKey` (sendSync), `ElectronIpcListenKey`
  (webContents.send → renderer `on*` listeners).
- IPC inputs must be serializable; filesystem/network-sensitive values are
  validated in the main process (e.g. `openFolder` refuses non-directories,
  `setElectronUrlVariables` ignores malformed domains, sender URL is checked via
  `isSelf`).

## Electron IPC Checklist

When adding or changing an Electron API:

- Update the channel unions and `ElectronApi` type in `src/types/electron.d.ts`.
- Add or update the main-process handler in `src-electron/main/ipc.ts` (or the
  module it delegates to) when the action needs main-process privileges.
- Add or update the preload exposure in `src-electron/electron-preload.ts`,
  including the `invoke`/`send`/`sendSync`/`listen` helpers in
  `src-electron/preload/ipc.ts` if behavior changes.
- Update `test/vitest/mocks/electronApi.ts` so renderer tests see the API.
- Keep IPC inputs serializable and validate untrusted or filesystem-sensitive
  values in the main process.

## Error Handling & Logging

- Never use `console.*` in app code (`no-console` is an ESLint error). Use the
  project logging and error helpers.
- **Renderer**: `errorCatcher(error, { contexts: { fn: { name: 'fnName', ... } } })`
  from `src/helpers/error-catcher.ts` — reports to Sentry in production, logs to
  console in dev. Always pass a `contexts.fn.name` so Sentry can group.
- **Electron main/preload**: `captureElectronError(error, { contexts })` from
  `src-electron/main/utils.ts`, plus `addElectronBreadcrumb` for breadcrumbs.
- **Logging**: `log(message, prefix, type, ...details)` from
  `src/shared/vanilla.ts`. `prefix` must be a `LogPrefix` key (there is a
  controlled set, e.g. `'jw'`, `'electronDownloads'`, `'mediaPlayback'`).
  Renderer log prefixes may contain emojis; **log() message strings in Electron
  main/preload must not contain emojis** (ESLint `no-restricted-syntax`).
- **PII & grouping**: `scrubUserPaths` / `scrubUserPathsDeep` redact home-directory
  usernames before anything reaches Sentry (used in main-process `beforeSend`).
  Filesystem errors are fingerprinted by code+syscall+function so one recurring
  failure doesn't fragment into one Sentry issue per path. Network errors should
  be classified with `isFetchNetworkError` (`src/shared/network-errors.ts`) and
  filesystem errors with `src/shared/filesystem-errors.ts` before deciding
  whether to report.

## Vue/UI Conventions

- Components use `<script setup lang="ts">` only (ESLint enforces
  `vue/component-api-style` and `vue/block-lang`).
- Vue attributes are alphabetized (`vue/attributes-order`).
- Place watchers (`watch`, `watchEffect`, `watchImmediate`, `whenever`, and the
  VueUse watcher helpers) AFTER all `const` declarations — a local ESLint rule
  (`local/no-watch-before-const`) warns otherwise.
- Follow existing Quasar component patterns and local components before
  introducing new UI abstractions. Use existing `mmm-*` icons from the generated
  icon font when possible; if icon assets change, run `yarn generate:icons`.
- New user-facing copy must use i18n keys in `src/i18n/en.json`, never hardcoded
  visible strings in templates or TS.
- Keep logic SonarQube-friendly (see `sonar-project.properties`): avoid nested
  ternaries, prefer early returns / small helpers / named variables over
  compressed one-liners, and don't copy existing anti-patterns into new code.

## Lint / Format Gotchas

- ESLint uses the `perfectionist` plugin with natural ordering: imports, object
  keys, and other sortable constructs are enforced — don't hand-order, run
  `yarn lint` (or the lint-staged fix on commit).
- Prettier: 2-space indentation, LF line endings, UTF-8, final newline.
- `yarn lint` runs ESLint + `vue-tsc --noEmit`; both must pass.
- There are two keyboard-shortcut helpers with similar names:
  `src/helpers/keyboardShortcuts.ts` (register/dispatch configured shortcuts) and
  `src/helpers/keyboard-shortcuts.ts` (sends a raw shortcut via robotjs). Don't
  merge or confuse them.

## Testing

- Three Vitest projects (`vitest.config.mts`): `quasar` (renderer,
  `src/**/*.test.ts`, happy-dom), `electron` (`src-electron/**/*.test.ts`, node),
  `docs` (`docs/**/*.test.ts`). Run all with `yarn test:unit`.
- Reuse mocks in `test/vitest/mocks/` before creating new ones: `electronApi.ts`
  (must be updated when `ElectronApi` changes), `http.ts` (msw handlers for
  JW.org API), `jw.ts`, `store.ts`, `pinia.ts`, `github.ts`. Setup files live in
  `test/vitest/setup/`.
- For bug fixes, add focused regression tests near the affected code. For UI
  changes, prefer asserting behavior/rendered state over implementation details.
- Run the smallest useful test command first (e.g. a single file), then broader
  checks such as `yarn test:unit` or `yarn lint` when the change warrants it.
- `import.meta.env.VITEST` is set under test; `fetchRaw` skips some logging and
  demo-mode network blocking is real, so tests mock fetch via msw.
- In Pinia v4, plugins registered via `pinia.use()` only take effect once the
  pinia is installed into an app (`app.use(pinia)`). A bare
  `createPinia()` + `pinia.use()` in a test silently no-ops the plugin. Use
  `createPersistedPinia()` from `app/test/vitest/mocks/pinia` (which registers
  `pinia-plugin-persistedstate` _and_ installs the pinia) or
  `createTestingPinia()`. The `local/no-bare-pinia-use` ESLint rule enforces
  this in test files.

## Localization and Crowdin

- Do not translate strings manually. Only populate or edit English source content:
  - `src/i18n/en.json`
  - `release-notes/en.md`
  - `docs/src/en/**`
  - `docs/locales/en.json`
- Other language files are produced by Crowdin PRs according to `crowdin.yml`.
  Avoid editing translated files unless the task is specifically about Crowdin
  configuration or generated translation output.
- To enable/disable a language, update both `src/constants/locales.ts`
  (`LanguageValue` union + `enabled` array) and the generated import in
  `src/i18n/index.ts` as described in `CONTRIBUTING.md`. Docs language imports in
  `docs/locales/index.ts` follow the same generated-language pattern.
- Do not edit sections marked with `This file will be updated by the
update-langs script` unless intentionally changing language availability.

## Generated and Build Assets

- Do not hand-edit generated build output such as `dist/`, `.quasar/`, or
  generated docs output.
- `src/i18n/index.ts`, `docs/locales/index.ts`, and `src/constants/locales.ts`
  contain script-managed sections — treat the `update-langs` comments seriously.
- Build assets under `build/icons` and `build/logos` feed generation scripts
  (`yarn generate:icons`, `yarn generate:logos`); edit source assets, then run
  the generator. `scripts/update-jw-icons-fallbacks.mjs` /
  `refresh-jw-icons-fallbacks.mjs` maintain WOL icon fallbacks.
- Electron production dependencies are filtered in `quasar.config.ts` from
  `src-electron/package.json`; if main/preload code needs a runtime dependency,
  add it there (not just the root `package.json`).
- Packaging config (targets, entitlements, NSIS/portable, Sentry sourcemaps)
  lives in `quasar.config.ts`.

## Releases & CI

- Conventional Commits everywhere: branch `type/description`, commit
  `type(scope?): description`, PRs are squash-merged using the PR title.
- Version bumps are committed as `chore(release): vx.x.x`; CI auto-builds and
  publishes the draft GitHub release (see `CONTRIBUTING.md` for the full
  procedure). Never bump versions or touch release metadata unless the task
  explicitly requires it.
- Mergify + `chore:` commits drive the changelog; the recent history shows a
  convention of detailed, context-rich commit messages — match that style.

## Common Task Cheat-Sheet (where to look first)

- **Add/change a setting**: `src/constants/settings.ts` (`settingsDefinitions`,
  `defaultSettings`) + `src/types/settings.d.ts` + `src/i18n/en.json` keys.
- **New Electron API**: follow the IPC checklist above (4-5 files).
- **Bug in downloads**: `src-electron/main/downloads.ts` (queue) → IPC events →
  `src/stores/current-state.ts` `downloadProgress` → `DownloadStatus.vue`.
- **Bug in media display window**: `src-electron/main/window/window-media.ts`
  (window mgmt) + `src/helpers/mediaPlayback.ts` + `MediaPlayerPage.vue` +
  `mediaPlaying` state.
- **JW data not fetching / wrong items**: `src/utils/api.ts` → `jw` store actions
  → `src/helpers/jw-media.ts` / `congregation-schedule.ts`. Offline/network
  errors: `src/shared/network-errors.ts`, `src/utils/fetch-retry.ts`.
- **OBS behavior**: `src/utils/obs.ts` (connection), `src/helpers/obs.ts`
  (actions), `src/stores/obs-state.ts`, `ObsStatus.vue`.
- **Persisted store shape changes**: edit the store + add a migration to
  `src/migrations/` (see `app-settings` store's `ensureMigrations`).
- **Filesystem edge cases (cloud drives, permissions)**: `src/shared/filesystem-errors.ts`
  and `src/utils/fs.ts` — many fixes live here.
- **Screenshots/visual regression**: `test/playwright` + `M3_DEMO_MODE`.

## PR Hygiene

- Keep changes scoped to the requested behavior; avoid opportunistic refactors.
- Do not change translated files, generated artifacts, or release metadata
  unless the task explicitly requires it.
- Before finishing, summarize what changed and mention any tests/checks run
  (and why any were skipped).
