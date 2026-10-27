# Architecture and Code Map

Detail file for [`AGENTS.md`](../AGENTS.md). Read it before touching media,
download, JW-data, settings or store code, or when you don't know where
something lives.

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
  fallback when the cache directory becomes unusable. Each file is transferred by
  our own downloader (`src-electron/main/download-transfer.ts`, Electron
  `net.fetch`), which resumes interrupted downloads with HTTP range requests.
- **Background music**: plays music before/after the meeting, stopping N seconds
  before start time; configurable volume and folders.
- **Before/After Meeting Quick Actions** (`stores/meeting-quick-actions.ts`,
  `stores/music.ts`, `stores/recording-state.ts`): a big-button panel that
  assists with the run-up to and immediately after each meeting — a live
  countdown, one-tap background music start/stop, start/stop recording, and
  a per-congregation checklist grouped into categories and editable from
  Settings. Auto-dismisses once the meeting starts and the checklist is
  complete (or after a grace period), or can be dismissed manually.
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
- **Package manager**: Yarn 4 (see `packageManager` in `package.json` for the
  exact pinned version), Node `^24.14.0`. Never use npm/pnpm.

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
                             demo-mode.ts, usage.ts, date.ts, fs.ts, fs-retry.ts,
                             electron-api-manager.ts (initializeElectronApi -
                             per-page renderer bootstrap), media-sections.ts
                             (add/find/delete media sections, color helpers).
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
  stores/                    Pinia stores (most persisted - check each file's
                             `persist` option; dialog-state, obs-state, demo-mode,
                             meeting-quick-actions, music, and recording-state are
                             not): app-settings, congregation-settings (congregations
                             map + encrypted obsPassword), current-state (active
                             congregation, mediaPlaying, downloadProgress,
                             selection), dialog-state, jw (cached JW data: languages,
                             songs, yeartexts, lookupPeriod), obs-state, demo-mode
                             (seeded demo congregation state), meeting-quick-actions
                             (Before/After Meeting Quick Actions panel state),
                             music (background-music playback), recording-state
                             (meeting-recording start/stop tracking).
  types/                     Shared TS types, barrel-exported via index.d.ts:
                             electron.d.ts (ElectronApi + IPC channel unions),
                             settings.d.ts, media.d.ts, jw/, obs.d.ts, timer.d.ts,
                             fs.d.ts, general.d.ts, search.d.ts, dates.d.ts,
                             congregation-lookups.d.ts, github.d.ts,
                             meeting-quick-actions.d.ts, video-duration.d.ts.
  utils/                     Logic: api.ts (fetchRaw/fetchJson + in-memory cache +
                             retry), fs.ts (cache path resolution, publication dirs),
                             jw.ts (pub id / resolution helpers), obs.ts (websocket
                             connection state), sqlite.ts (executeQuery via preload),
                             settings.ts (validators), media.ts, converters.ts,
                             queue.ts, fetch-retry.ts, dialog-plugin.ts,
                             timer-report.ts, migrations.ts, profile-settings.ts,
                             clone-settings.ts (deep-clones Meeting Quick Actions
                             checklist settings), date.ts (formatDate/dateFromString/
                             getDateDiff and other generic date-math helpers,
                             distinct from helpers/date.ts's meeting-day logic),
                             debounced-storage.ts (Pinia persistence adapter),
                             general.ts (camelToKebabCase, sleep, misc), time.ts
                             (formatTime/timeToSeconds).

src-electron/                Electron main + preload. May import only src/types,
                             src/constants, src/shared from src/.
  constants.ts               Env-derived constants, JW/trusted domains.
  electron-main.ts           App entry: Sentry init, single-instance lock, crash-loop
                             handling, GPU diagnostics, application menu, process-
                             crash handling, window creation.
  electron-preload.ts        contextBridge exposure — builds window.electronApi
                             (typed in src/types/electron.d.ts).
  main/                      Main-process modules:
    ipc.ts                   Nearly all ipcMain handlers are registered here
                             (see electron.md for the one exception).
    downloads.ts             Download queue, priorities, pause/resume, retries.
    download-transfer.ts     One file's HTTP transfer: net.fetch into a .part
                             file, range-request resume, stall timeout.
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
    crash-loop.ts            Crash-loop detection gated on the previous
                             session's clean-exit flag (markCleanExit/
                             recordStartupCrashCount).
    dev-menu.ts              Dev-only "Demo" application menu.
    heic.ts                  HEIC→JPEG conversion in a utility process.
    image-size.ts            Image-dimension reading in a utility process
                             (sandboxes unpatched image-size CVEs).
    os-support.ts            Warns on unsupported OS versions (32-bit
                             Windows, old macOS).
    screen-utils.ts          Display-bounds validation/matching helpers.
    sqlite.ts                executeQuery (backs the preload sqlite.ts
                             bridge) and connection lifecycle.
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

There are two keyboard-shortcut helpers with similar names:
`src/helpers/keyboardShortcuts.ts` (register/dispatch configured shortcuts) and
`src/helpers/keyboard-shortcuts.ts` (sends a raw shortcut via robotjs). Don't
merge or confuse them.

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

## Common Task Cheat-Sheet (where to look first)

- **Add/change a setting**: `src/constants/settings.ts` (`settingsDefinitions`,
  `defaultSettings`) + `src/types/settings.d.ts` + `src/i18n/en.json` keys.
- **New feature? Suggest it**: if it's a good candidate (off by default,
  useful to many congregations, a safe toggle or with its own setup path),
  add it to `FEATURE_NUDGES` in `src/constants/feature-nudges.ts` (order =
  priority, an eligibility rule, a Settings deep link or an event), with
  friendly `feature-nudge-<id>-title` / `-body` strings in `src/i18n/en.json`
  that say in plain words what it does and why it's worth turning on. The
  "Did you know?" dialog (`DialogFeatureNudge.vue`) then suggests it once per
  profile; picking, snoozing and timing live in `src/helpers/feature-nudges.ts`.
- **New Electron API**: follow the IPC checklist in `electron.md` (4-5 files).
- **Bug in downloads**: `src-electron/main/download-transfer.ts` (one file's
  transfer) → `src-electron/main/downloads.ts` (queue) → IPC events →
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
