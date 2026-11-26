# Commands, Generated Assets and Releases

Detail file for [`AGENTS.md`](../AGENTS.md). Read it when you need a command
beyond `dev`/`lint`/`test:unit`/`format`, regenerate assets, change language
availability, or work on tests' setup or the release flow.

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
- `yarn fix:i18n` / `yarn fix:docs` normalize locale JSON and docs markdown
  respectively. `fix:i18n` also runs in self-healing (write) mode at the
  start of `dev`/`build*`/`test:unit`, so a bad Crowdin export is repaired
  in place instead of failing the pipeline; it still exits non-zero on
  messages it cannot auto-repair. `fix:docs` runs in `--check` mode as a
  pre-check inside `docs:build`/`docs:dev`/`docs:lint`/`docs:test`.
- `yarn generate:jw-icons-fallbacks` / `yarn refresh:jw-icons-fallbacks`
  maintain the JW icon-font fallback map (backs
  `.github/workflows/refresh-jw-icons-fallbacks.yml`).
- Env flags that change behavior: `M3_DEMO_MODE=1` (demo/screenshot mode —
  network fetches fail intentionally), `TEST_VERSION=true` (test build identity),
  `M3_ENABLE_GPU_DIAGNOSTICS` (Chromium GPU logging).

## Dev Actions (dev builds only)

`yarn dev` adds a tools button at the end of the action island. Its popup
(`src/components/dev/DialogDevActionsPopup.vue`) shows on demand what users
only see at a given moment, on a failure or once: the run-up to a meeting
and its end, background music starting and stopping by itself, download
failures, every updater toast, crash notices, the yeartext offer, Zoom
prompts, feature suggestions, tours and reminders, plus the Demo menu's
commands. It turns orange while it fakes something. "Stop faking
everything" undoes it all.

- The actions live in `src/composables/useDevActions.ts`, in hardcoded
  English (never user-facing), like the Demo menu.
- What they fake lives in `src/helpers/dev-state.ts` (today's meeting time,
  failed requests). Each check that reads it is behind
  `import.meta.env.DEV`, so production never fakes anything. The button and
  popup are async components that production builds leave out.
- State only a component's own code shows goes through `useDevBus()`
  (`src/helpers/dev-bus.ts`), which that component listens to in dev builds.
- Main-process events go through `electronApi.devEmit` (an allowlist in
  `src-electron/main/dev-menu.ts`) to their real renderer handlers. Faked
  main-process failures (failed downloads, low disk space) go through
  `electronApi.setDevFault` (`src-electron/main/dev-faults.ts`). Both are
  only handled in dev builds.

## Generated and Build Assets

- Do not hand-edit generated build output such as `dist/`, `.quasar/`, or
  generated docs output.
- `src/i18n/index.ts`, `docs/locales/index.ts`, and `src/constants/locales.ts`
  contain script-managed sections — treat the `update-langs` comments seriously.
- Build assets under `build/icons` and `build/logos` feed generation scripts
  (`yarn generate:icons`, `yarn generate:logos`); edit source assets, then run
  the generator. `scripts/update-jw-icons-fallbacks.mjs` /
  `refresh-jw-icons-fallbacks.mjs` maintain WOL icon fallbacks.

## Enabling or Disabling a Language

- To enable/disable a language, update both `src/constants/locales.ts`
  (`LanguageValue` union + `enabled` array) and the generated import in
  `src/i18n/index.ts` as described in `CONTRIBUTING.md`. Docs language imports in
  `docs/locales/index.ts` follow the same generated-language pattern.

## Releases & CI

- Releases are triggered by running the `Manual Release` workflow
  (`workflow_dispatch`; beta releases also run nightly via `Release Beta
Version`) — not by hand-editing `package.json`. The workflow bumps the
  version itself and commits `chore: bump version to vX.Y.Z [skip ci]`
  (see `CONTRIBUTING.md` for the full procedure), then auto-builds and
  publishes the draft GitHub release.
- Mergify + `chore:` commits drive the changelog.

## Test Setup Details

- Vitest projects are defined in `vitest.config.mts`, which mirrors the import
  aliases.
- Mocks in `test/vitest/mocks/`: `electronApi.ts` (must be updated when
  `ElectronApi` changes), `http.ts` (msw handlers for JW.org API), `jw.ts`,
  `store.ts`, `pinia.ts`, `github.ts`. Setup files live in
  `test/vitest/setup/`.
- `import.meta.env.VITEST` is set under test; `fetchRaw` skips some logging and
  demo-mode network blocking is real, so tests mock fetch via msw.
- In Pinia v4, plugins registered via `pinia.use()` only take effect once the
  pinia is installed into an app (`app.use(pinia)`). A bare
  `createPinia()` + `pinia.use()` in a test silently no-ops the plugin. Use
  `createPersistedPinia()` from `app/test/vitest/mocks/pinia` (which registers
  `pinia-plugin-persistedstate` _and_ installs the pinia) or
  `createTestingPinia()`. The `local/no-bare-pinia-use` ESLint rule enforces
  this in test files.
- Playwright screenshot tests live in `test/playwright` and run with
  `yarn screenshot:refresh` (demo mode).
