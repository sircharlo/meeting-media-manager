# Electron 44 Cutover — 32-bit Windows & macOS 12 Support Sunset

Working document for the plan approved on 2026-09-01. Delete this file once Phase 2 is done.

## Context

- Open PR [#8913](https://github.com/sircharlo/meeting-media-manager/pull/8913) bumps `electron` 43.4.1 → 44.0.0.
- Electron 44 **removes 32-bit prebuilt binaries** (Windows `ia32`, Linux `armv7l`) and **drops macOS 12** (macOS 13+ required).
- Electron 43 is explicitly the **last release line** with 32-bit builds, so parallel support is not possible from one tree: ia32 installers cannot be produced and the app cannot run on Monterey once we're on 44.

## Strategy (approved)

**Labeled final release, single track.** Cut one last release on Electron 43 that (a) tells affected users this is the last release that supports their system, and (b) stops their auto-updater. Then cut over to Electron 44 for everyone else.

Why the updater gate matters: electron-updater serves one "latest" per app and the Windows updater does **no** architecture filtering. Once a 44-only release is published, still-running ia32/macOS-12 clients would try to download artifacts they can't run → broken updates + Sentry noise. The gate ships in the final-43 release so those clients stop checking.

## Phase 1 — DONE ✅ (current working tree)

| File | Change |
|---|---|
| `src-electron/main/os-support.ts` | **New.** `getOsSupportWarning()` extracted from `ipc.ts`: returns `'mac-legacy'` (macOS < 13) or `'win32-ia32'` (32-bit Windows), else `null`. |
| `src-electron/main/ipc.ts` | Imports the helper; the `getOsSupportWarning` IPC surface is unchanged. |
| `src-electron/main/updater.ts` | `triggerUpdateCheck()` returns early on legacy platforms (logs `'Skipping update check…'`, prefix `electronUpdater`). |
| `src-electron/main/__tests__/updater.test.ts` | 2 new tests: check runs on supported platforms; skipped on legacy. |
| `src/i18n/en.json` | Final copy for `os-support-warning-mac`, `os-support-warning-win32-ia32`, `architecture-mismatch-explain` ("…is the last version…"). |
| `CHANGELOG.md` + `release-notes/en.md` | UPCOMING VERSION entry: "This is the last version of M³ that supports 32-bit Windows and macOS 12 (Monterey)." |

**Verified:** `yarn lint` clean (ESLint + vue-tsc); electron test project 24 files / 159 tests pass.

## ⚠️ Release sequencing (critical)

Cut the **final-43 release from this Phase 1 state** — the updater gate must ship in it. Do **not** apply Phase 2 until that release is out; once the first 44 release publishes, the update feed no longer contains ia32 / macOS-12 artifacts.

## Phase 2 — REMAINING ⏳ (initiate after this month)

### 1. Bump Electron to 44
- Root `package.json`: `"electron": "^43.4.0"` → `"^44.0.0"` — or merge PR #8913 (it covers root `package.json` + `yarn.lock` only).
- `src-electron/package.json`: `"electron": "^43.0.0"` → `"^44.0.0"` (PR #8913 does **not** touch this — must be done manually).
- Sync lockfile: `yarn install --mode=update-lockfile` (or `yarn install`).

### 2. Build config — `quasar.config.ts`
- Windows: `{ arch: ctx.debug ? 'x64' : ['x64', 'ia32'], target: 'nsis' }` → `{ arch: 'x64', target: 'nsis' }`.
- macOS: `minimumSystemVersion: '10.15'` → `'13.0'` (real floor for Electron 44; `10.15` was already below Electron 43's actual floor of 12).

### 3. Remove legacy-platform machinery (dead code on 44 — no 44 build can run on those systems)
- Delete `src-electron/main/os-support.ts`.
- `src-electron/main/updater.ts`: remove the gate + the `getOsSupportWarning` import.
- `src-electron/main/ipc.ts`: remove `handleIpcInvoke('getOsSupportWarning', …)` + the import.
- `src-electron/electron-preload.ts`: remove the `getOsSupportWarning` exposure.
- `src/types/electron.d.ts`: remove the `ElectronApi.getOsSupportWarning` entry, the `'getOsSupportWarning'` invoke key, and the `OsSupportWarning` import.
- `src/types/general.d.ts`: remove the `OsSupportWarning` type.
- `src/components/ui/AnnouncementBanner.vue`: remove the `osSupportWarning` ref/onMounted/computed, the `getOsSupportWarning` destructure, and the type import.
- `src/i18n/en.json`: remove `os-support-warning-mac` + `os-support-warning-win32-ia32` keys.
- `test/vitest/mocks/electronApi.ts`: remove `getOsSupportWarning` mock.
- `src-electron/main/__tests__/updater.test.ts`: remove the `os-support` mock + the 2 gate tests.
- Leave `isArchitectureMismatch` IPC in place (harmless — always false on 44).

### 4. Docs (English only — other locales come from Crowdin)
- `docs/data/version.data.mts`: remove the `win32` field + `downloadUrl('ia32', 'exe')`.
- `docs/src/en/download.md`: remove the `isIa32` UA detection, the `downloads.win32` branch, and the "Windows 32-bit (.exe)" link line.
- `docs/src/en/faq.md` (2 places): Windows → "Windows 10 and later (64-bit only)"; macOS → "macOS 13 (Ventura) and later (Universal build)".
- `docs/locales/en.json`: remove the `windows32Bit` string.

### 5. Changelog
Reword the Platform Support entry for the 44 release, e.g.:
> 🛠️ **Platform Support**: M³ no longer supports 32-bit Windows or macOS 12 (Monterey); the previous release is the last one that runs on those systems. New releases require a 64-bit version of Windows and macOS 13 (Ventura) or later.

(Also mirror into `release-notes/en.md`.)

### 6. Verify
- `yarn lint`
- `yarn test:unit`
- `yarn build:unpacked` sanity check: no `ia32` artifacts produced; mac bundle carries `LSMinimumSystemVersion` 13.0.

## Notes & known consequences

- **Old clients after cutover:** stay on the final-43 release permanently; their updater is gated off; they see the "last supported release" banner. ia32-on-64-bit users are nudged to the 64-bit build (existing `isArchitectureMismatch` notification + new copy).
- **i18n:** non-English locale files still hold the old copy of the edited/removed strings until Crowdin syncs from `en.json` — do not hand-edit them.
- **No parallel legacy track:** keeping an Electron-43 branch + second update feed was considered and rejected in the plan (permanent second branch/CI/backports, and Electron 43 loses security support ~1 year after 44).
- **Electron 44 upgrade itself:** watch for other 44 breaking changes (ANGLE static linking, clipboard module moved out of renderer, `Sec-Fetch-Dest` restrictions on `net.request`) if anything touches those areas.
