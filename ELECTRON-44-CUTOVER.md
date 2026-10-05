# Electron 44 Cutover — 32-bit Windows & macOS 12 Support Sunset

Working document for the plan approved on 2026-09-01. Delete this file once Phase 2 is done.

## Context

- Dependabot keeps opening the electron-44 bump PR on its own schedule — the original [#8913](https://github.com/sircharlo/meeting-media-manager/pull/8913) (43.4.1 → 44.0.0) was closed 2026-09-03 and superseded by [#9031](https://github.com/sircharlo/meeting-media-manager/pull/9031), currently open (Dependabot keeps re-rolling this PR to whatever 44.x is newest as it opens, so don't trust a version pinned here either). **Before starting Phase 2, re-check for the latest open Dependabot PR bumping `electron` to 44.x** (`gh pr list --search "electron in:title" --state open`) rather than trusting a PR number/version pinned in this doc — treat "44.0.0" below as illustrative, use whatever version the live PR actually targets.
- Electron 44 **removes 32-bit prebuilt binaries** (Windows `ia32`, Linux `armv7l`) and **drops macOS 12** (macOS 13+ required).
- Electron 43 is explicitly the **last release line** with 32-bit builds, so parallel support is not possible from one tree: ia32 installers cannot be produced and the app cannot run on Monterey once we're on 44.

## Strategy (approved)

**Labeled final release, single track.** Cut one last release on Electron 43 that (a) tells affected users this is the last release that supports their system, and (b) stops their auto-updater. Then cut over to Electron 44 for everyone else.

Why the updater gate matters: electron-updater serves one "latest" per app and the Windows updater does **no** architecture filtering. Once a 44-only release is published, still-running ia32/macOS-12 clients would try to download artifacts they can't run → broken updates + Sentry noise. The gate ships in the final-43 release so those clients stop checking.

## Phase 1 — DONE ✅ (current working tree)

| File                                          | Change                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src-electron/main/os-support.ts`             | **New.** `getOsSupportWarning()` extracted from `ipc.ts`: returns `'mac-legacy'` (macOS < 13) or `'win32-ia32'` (32-bit Windows), else `null`. |
| `src-electron/main/ipc.ts`                    | Imports the helper; the `getOsSupportWarning` IPC surface is unchanged.                                                                        |
| `src-electron/main/updater.ts`                | `triggerUpdateCheck()` returns early on legacy platforms (logs `'Skipping update check…'`, prefix `electronUpdater`).                          |
| `src-electron/main/__tests__/updater.test.ts` | 2 new tests: check runs on supported platforms; skipped on legacy.                                                                             |
| `src/i18n/en.json`                            | Final copy for `os-support-warning-mac`, `os-support-warning-win32-ia32`, `architecture-mismatch-explain` ("…is the last version…").           |
| `CHANGELOG.md` + `release-notes/en.md`        | UPCOMING VERSION entry: "This is the last version of M³ that supports 32-bit Windows and macOS 12 (Monterey)."                                 |

**Verified:** `yarn lint` clean (ESLint + vue-tsc); electron test project 24 files / 159 tests pass.

## ⚠️ Release sequencing (critical)

Cut the **final-43 release from this Phase 1 state** — the updater gate must ship in it. Do **not** apply Phase 2 until that release is out; once the first 44 release publishes, the update feed no longer contains ia32 / macOS-12 artifacts.

## Phase 2 — IN PROGRESS 🚧 (started 2026-10-05)

Steps 1–5 are done on branch `chore/electron-44-cutover` (built on Dependabot PR #9468, Electron 44.5.1, rebased onto `master`); step 6 verified; step 7 still to do. **Not merged** — see "Hold the 44 release" below.

**Hold the 44 release.** v26.9.0/v26.9.1 (the first releases carrying the Phase 1 updater gate) were pulled early, so the gate effectively only reached users through v26.10.0 (2026-10-02). On 2026-10-05, Sentry still showed many v26.8.0 events (no gate). Don't publish a 44 build — and don't merge the branch to `master`, where the nightly beta would pick it up — until v26.8.x and older have mostly disappeared from Sentry, so 32-bit Windows / macOS 12 installs have picked up the gate first.

Where Phase 2 differs from the plan below:

- **`isArchitectureMismatch` was removed too** (step 3): with no ia32 builds it's always false. Removed with `isOS64Bit`, the MainLayout notification, and the `architecture-mismatch*` strings.
- **Docs keep the legacy downloads** (step 4): instead of deleting the 32-bit link, `docs/data/version.data.mts` pins `win32` + a new `macLegacy` link to `LEGACY_VERSION = 'v26.10.0'`, labelled as the last version for 32-bit Windows / macOS 12 (download page + FAQ). The `win32` / `windows32Bit` names were kept so translated download pages keep working. The v26.10.0 GitHub release carries a "Do not delete this release" note at the top.
- **Not mirrored into `release-notes/en.md`** (step 5): that file is regenerated from `CHANGELOG.md` and only carries ✨ New Features sections.
- **Local build gotcha** (step 6): `src-electron` has its own `node_modules`; after bumping it, run a real `yarn install` there, or local packaging silently uses the old Electron.

### 1. Bump Electron to 44

- Root `package.json`: `"electron": "^43.4.0"` → `"^44.x.0"` — or merge the current open Dependabot electron-44 PR (it covers root `package.json` + `yarn.lock` only; find it fresh, don't assume #8913/#9031 are still current by the time this runs).
- `src-electron/package.json`: `"electron": "^43.0.0"` → matching `"^44.x.0"` (the Dependabot PR does **not** touch this — must be done manually, same as it didn't for #8913).
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

Done 2026-10-05: `yarn lint` + `yarn test:unit` (866 tests) pass; a full Windows `yarn build` packages Electron 44.5.1 with x64-only NSIS + portable (no `ia32` artifacts). The macOS 13.0 floor is set in `quasar.config.ts` but can only be confirmed from a macOS build.

### 7. Update the robotjs PR (#7921) — TODO

Draft PR #7921 ("replace jitsi robotjs with robotjs", branch `codex/test-robotjs-prebuilds`) still builds and ships 32-bit Windows binaries. Remove the 32-bit parts:

- `.github/workflows/build.yml`: drop **Windows ia32** from the native-module matrix (keep macOS arm64, macOS Intel, Windows x64).
- The `beforePack` hook: stop swapping in an ia32 `robotjs.node`; only x64 remains on Windows.
- PR description: remove the ia32 mentions (matrix list, and "swap the x64 or ia32 native module").
- Rebase it onto the Electron 44 work once that lands.

## Notes & known consequences

- **Old clients after cutover:** stay on whichever gated Electron 43 release they have (v26.9.0, v26.9.1 or v26.10.0) permanently; their updater is gated off; they see the "last supported release" banner. The docs point them to v26.10.0 for manual installs.
- **i18n:** non-English locale files still hold the old copy of the edited/removed strings until Crowdin syncs from `en.json` — do not hand-edit them.
- **No parallel legacy track:** keeping an Electron-43 branch + second update feed was considered and rejected in the plan (permanent second branch/CI/backports, and Electron 43 loses security support ~1 year after 44).
- **Electron 44 upgrade itself:** watch for other 44 breaking changes (ANGLE static linking, clipboard module moved out of renderer, `Sec-Fetch-Dest` restrictions on `net.request`) if anything touches those areas.
