import { app } from 'electron';
import {
  ensureDir,
  ensureDirSync,
  pathExists,
  pathExistsSync,
  readJson,
  readJsonSync,
  remove,
  writeJson,
  writeJsonSync,
} from 'fs-extra/esm';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'upath';

/**
 * Fallback directory for small operational/preference files (window bounds,
 * crash counters, GPU diagnostics) when the primary per-install data
 * directory (normally `app.getPath('userData')`) can't be written to or a
 * specific file in it is locked by another process/AV/policy. Mirrors the
 * primary-then-fallback strategy `getAppDataPath` uses for congregation
 * media storage, but reacts to the actual write failure instead of
 * pre-probing, since a directory-level probe can pass while a specific
 * existing file is locked.
 */
let cachedFallbackDir: null | string = null;
export function getFallbackDir(): string {
  cachedFallbackDir ??= join(app.getPath('temp'), 'Meeting Media Manager');
  return cachedFallbackDir;
}

/**
 * In-memory write-through cache for the small, fixed set of files this
 * module manages (window-state, crash-count, hw-accel-flag — a handful of
 * keys, never per-item/dynamic). Lets readJsonResilientSync avoid a real
 * synchronous disk hit — which blocks the whole main-process event loop —
 * on every repeat read of a file already read or written once this session
 * (e.g. the media/timer window being recreated repeatedly as it's toggled
 * closed and reopened).
 */
const jsonCache = new Map<string, { data: unknown }>();
const cacheKey = (dir: string, fileName: string) => `${dir}::${fileName}`;

export async function readJsonResilient(
  primaryDir: string,
  fileName: string,
): Promise<unknown> {
  const key = cacheKey(primaryDir, fileName);
  const primaryPath = join(primaryDir, fileName);
  if (await pathExists(primaryPath)) {
    const data: unknown = await readJson(primaryPath, { throws: false });
    if (data !== null) {
      jsonCache.set(key, { data });
      return data;
    }
  }
  const fallbackPath = join(getFallbackDir(), fileName);
  const data = (await pathExists(fallbackPath))
    ? await readJson(fallbackPath, { throws: false })
    : null;
  jsonCache.set(key, { data });
  return data;
}

export function readJsonResilientSync(
  primaryDir: string,
  fileName: string,
): unknown {
  const key = cacheKey(primaryDir, fileName);
  const cached = jsonCache.get(key);
  if (cached) return cached.data;

  const primaryPath = join(primaryDir, fileName);
  if (pathExistsSync(primaryPath)) {
    const data: unknown = readJsonSync(primaryPath, { throws: false });
    if (data !== null) {
      jsonCache.set(key, { data });
      return data;
    }
  }
  const fallbackPath = join(getFallbackDir(), fileName);
  const data = pathExistsSync(fallbackPath)
    ? readJsonSync(fallbackPath, { throws: false })
    : null;
  jsonCache.set(key, { data });
  return data;
}

export async function writeJsonResilient(
  primaryDir: string,
  fileName: string,
  data: unknown,
): Promise<void> {
  const key = cacheKey(primaryDir, fileName);
  try {
    await ensureDir(primaryDir);
    await writeJson(join(primaryDir, fileName), data, { spaces: 2 });
    jsonCache.set(key, { data });
  } catch (primaryError) {
    try {
      const fallbackDir = getFallbackDir();
      await ensureDir(fallbackDir);
      await writeJson(join(fallbackDir, fileName), data, { spaces: 2 });
      jsonCache.set(key, { data });
    } catch {
      throw primaryError;
    }
  }
}

export function writeJsonResilientSync(
  primaryDir: string,
  fileName: string,
  data: unknown,
): void {
  const key = cacheKey(primaryDir, fileName);
  try {
    ensureDirSync(primaryDir);
    writeJsonSync(join(primaryDir, fileName), data, { spaces: 2 });
    jsonCache.set(key, { data });
  } catch (primaryError) {
    try {
      const fallbackDir = getFallbackDir();
      ensureDirSync(fallbackDir);
      writeJsonSync(join(fallbackDir, fileName), data, { spaces: 2 });
      jsonCache.set(key, { data });
    } catch {
      throw primaryError;
    }
  }
}

const FALLBACK_ENTRY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Removes per-download/per-publication fallback folders (under the OS temp
 * directory) that haven't been written to in over a month. Data only ever
 * lands here because a user's configured folder was temporarily unusable,
 * so once it's stopped being touched for a while it's safe to assume the
 * folder was fixed (or is no longer relevant) and reclaim the disk space.
 */
export async function pruneStaleFallbackEntries(): Promise<void> {
  const root = getFallbackDir();
  let namespaces: { isDirectory: () => boolean; name: string }[];
  try {
    namespaces = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const namespace of namespaces) {
    if (!namespace.isDirectory()) continue;
    const namespaceDir = join(root, namespace.name);

    let entries: { isDirectory: () => boolean; name: string }[];
    try {
      entries = await readdir(namespaceDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const entryDir = join(namespaceDir, entry.name);
      const newestMtimeMs = await getNewestMtimeMs(entryDir);
      const isStale =
        !newestMtimeMs ||
        Date.now() - newestMtimeMs >= FALLBACK_ENTRY_MAX_AGE_MS;
      if (!isStale) continue;

      await remove(entryDir).catch(() => undefined);
    }
  }
}

async function getNewestMtimeMs(dir: string): Promise<number> {
  let newest = 0;
  let entries: { isDirectory: () => boolean; name: string }[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return newest;
  }

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, await getNewestMtimeMs(entryPath));
      continue;
    }
    try {
      const stats = await stat(entryPath);
      newest = Math.max(newest, stats.mtimeMs);
    } catch {
      // Ignore files that disappear mid-scan
    }
  }

  return newest;
}
