# Electron Main Process and IPC

Detail file for [`AGENTS.md`](../AGENTS.md). Read it before changing
`src-electron/` or `window.electronApi`. The import-boundary rules live in
`AGENTS.md`.

## IPC Handlers and Channels

- The renderer talks to Electron exclusively through the typed
  `window.electronApi` object (interface `ElectronApi` in
  `src/types/electron.d.ts`), exposed by `src-electron/electron-preload.ts`.
- Nearly all `ipcMain` handlers are registered in `src-electron/main/ipc.ts` —
  the one exception is `set-hardware-acceleration`, registered directly in
  `electron-main.ts` because it's tied to that file's own pre-`app.whenReady()`
  hardware-acceleration/crash-loop state, which can't be delegated without
  restructuring startup. Channels are typed as unions: `ElectronIpcInvokeKey`
  (invoke/handle), `ElectronIpcSendKey` (send/on), `ElectronIpcSendSyncKey`
  (sendSync), `ElectronIpcListenKey` (webContents.send → renderer `on*`
  listeners).
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

## Sentry PII and Grouping

- `scrubUserPaths` / `scrubUserPathsDeep` redact home-directory usernames before
  anything reaches Sentry (used in main-process `beforeSend`).
- Filesystem errors are fingerprinted by code+syscall+function so one recurring
  failure doesn't fragment into one Sentry issue per path.
- Renderer `errorCatcher` reports to Sentry in production and logs to the
  console in dev.

## Runtime Dependencies and Packaging

- Electron production dependencies are filtered in `quasar.config.ts` from
  `src-electron/package.json`; if main/preload code needs a runtime dependency,
  add it there (not just the root `package.json`).
- Packaging config (targets, entitlements, NSIS/portable, Sentry sourcemaps)
  lives in `quasar.config.ts`.
