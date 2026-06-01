# Agent Guide

This repository is Meeting Media Manager (M3), a cross-platform desktop app for
downloading and presenting meeting media. It uses Quasar, Vue 3, TypeScript,
Electron, Pinia, Vue I18n, VitePress, Vitest, Yarn 4, and Node 24.

Use this file as the first stop for agent-specific project rules. It complements
`CONTRIBUTING.md`; it does not replace it.

## Project Overview

- Renderer/UI code lives in `src/` and is built with Quasar, Vue 3, TypeScript,
  Pinia, and Vue I18n.
- Electron main and preload code lives in `src-electron/`.
- Documentation lives in `docs/` and is built with VitePress.
- Unit tests are split into Vitest projects for Quasar renderer code, Electron
  code, and docs.
- Package management uses Yarn 4. Use the scripts in `package.json`; do not
  introduce another package manager.

## Commands

- `yarn install` installs dependencies.
- `yarn electron-rebuild` rebuilds native Electron modules.
- `yarn generate:icons` regenerates the custom icon font from `build/icons`.
- `yarn dev` starts the Electron app in development mode.
- `yarn lint` runs ESLint and type checks for app and Electron code.
- `yarn test:unit` runs renderer and Electron unit tests.
- `yarn docs:lint` lints and type checks the documentation site.
- `yarn docs:test` runs documentation tests.
- `yarn docs:build` builds the documentation site.

## Localization and Crowdin

- Do not translate strings manually.
- Only populate or edit English source content:
  - `src/i18n/en.json`
  - `release-notes/en.md`
  - `docs/src/en/**`
  - `docs/locales/en.json`
- Other language files are produced by Crowdin PRs according to `crowdin.yml`.
  Avoid editing translated files unless the task is specifically about Crowdin
  configuration or generated translation output.
- New user-facing app copy should use i18n keys, not hardcoded visible strings
  in Vue templates or TypeScript.
- Do not edit generated language import sections marked with
  `This file will be updated by the update-langs script` unless intentionally
  changing language availability.
- To enable or disable a language, update both `src/constants/locales.ts` and
  `src/i18n/index.ts` as described in `CONTRIBUTING.md`. Docs language imports
  in `docs/locales/index.ts` follow the same generated-language pattern.

## Architecture Boundaries

- Renderer code in `src/` must not import from `src-electron/`.
- Electron main and preload code must not import renderer-specific code from
  `src/`. Allowed shared imports are limited to shared-safe areas such as
  `src/types`, `src/constants`, and `src/shared`.
- Electron main code must not import from `src-electron/preload/`.
- Electron preload code must not import from `src-electron/main/`.
- Put code shared by renderer and Electron into an existing shared-safe location
  instead of crossing process boundaries.
- Preserve process separation: renderer behavior talks to privileged Electron
  behavior through the typed preload API and IPC layer.

## Electron IPC Checklist

When adding or changing an Electron API:

- Update the channel unions and exposed API types in `src/types/electron.d.ts`.
- Add or update the main-process handler in `src-electron/main/ipc.ts` when the
  action needs main-process privileges.
- Add or update the preload exposure in `src-electron/electron-preload.ts`.
- Update the relevant preload IPC helper if listener/send/invoke behavior
  changes.
- Update `test/vitest/mocks/electronApi.ts` when renderer tests need the API.
- Keep IPC inputs serializable and validate untrusted or filesystem-sensitive
  values in the main process.

## Vue/UI Conventions

- Vue components use `<script setup lang="ts">`.
- Vue attributes are alphabetized; ESLint enforces this.
- Put watchers (`watch`, `watchEffect`, `watchImmediate`, `whenever`, and
  related VueUse watcher helpers) after `const` declarations.
- Avoid `console` in app code. Use the project logging and error helpers, such
  as `log`, `errorCatcher`, or Electron capture helpers as appropriate.
- Do not add emojis to Electron main or preload `log()` call strings; lint rules
  reject them.
- Follow the existing Quasar component patterns and local components before
  introducing new UI abstractions.
- Use existing `mmm-*` icons from the generated icon font when possible. If icon
  assets change, regenerate with `yarn generate:icons`.

## Testing

- Renderer tests live under `src/**/__tests__` or `src/**/*.test.ts` and run in
  the `quasar` Vitest project.
- Electron tests live under `src-electron/**/*.test.ts` and run in the
  `electron` Vitest project.
- Docs tests live under `docs/**/*.test.ts` and run in the `docs` Vitest
  project.
- Use existing mocks in `test/vitest/mocks` before creating new ones.
- For bug fixes, add focused regression tests near the affected code.
- For UI changes, prefer tests that assert behavior or rendered state over
  implementation details.
- Run the smallest useful test command first, then broader checks such as
  `yarn test:unit` or `yarn lint` when the change warrants it.

## Generated and Build Assets

- Do not hand-edit generated build output such as `dist/`, `.quasar/`, or
  generated docs output.
- Treat `src/i18n/index.ts`, `docs/locales/index.ts`, and
  `src/constants/locales.ts` comments about `update-langs` seriously; generated
  language sections should stay script-managed unless language availability is
  the task.
- Build assets under `build/icons` and `build/logos` feed generation scripts.
  Edit source assets, then run the relevant generator.
- Electron production dependencies are filtered in `quasar.config.ts`. If main
  or preload code needs a runtime dependency, make sure it is included there.

## PR Hygiene

- Keep changes scoped to the requested behavior. Avoid opportunistic refactors.
- Follow Conventional Commits for branch, commit, and PR titles.
- Do not change translated files, generated artifacts, or release metadata
  unless the task explicitly requires it.
- Respect existing formatting: 2-space indentation, LF line endings, UTF-8, and
  a final newline.
- Before finishing, summarize what changed and mention any tests or checks that
  were run. If checks were skipped, say why.
