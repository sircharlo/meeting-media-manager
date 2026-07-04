import { app } from 'electron';
import {
  ensureDir,
  ensureDirSync,
  pathExists,
  pathExistsSync,
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
} from 'fs-extra/esm';
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
export async function readJsonResilient(
  primaryDir: string,
  fileName: string,
): Promise<unknown> {
  const primaryPath = join(primaryDir, fileName);
  if (await pathExists(primaryPath)) {
    const data: unknown = await readJson(primaryPath, { throws: false });
    if (data !== null) return data;
  }
  const fallbackPath = join(getFallbackDir(), fileName);
  return (await pathExists(fallbackPath))
    ? readJson(fallbackPath, { throws: false })
    : null;
}

export function readJsonResilientSync(
  primaryDir: string,
  fileName: string,
): unknown {
  const primaryPath = join(primaryDir, fileName);
  if (pathExistsSync(primaryPath)) {
    const data: unknown = readJsonSync(primaryPath, { throws: false });
    if (data !== null) return data;
  }
  const fallbackPath = join(getFallbackDir(), fileName);
  return pathExistsSync(fallbackPath)
    ? readJsonSync(fallbackPath, { throws: false })
    : null;
}

export async function writeJsonResilient(
  primaryDir: string,
  fileName: string,
  data: unknown,
): Promise<void> {
  try {
    await ensureDir(primaryDir);
    await writeJson(join(primaryDir, fileName), data, { spaces: 2 });
  } catch (primaryError) {
    try {
      const fallbackDir = getFallbackDir();
      await ensureDir(fallbackDir);
      await writeJson(join(fallbackDir, fileName), data, { spaces: 2 });
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
  try {
    ensureDirSync(primaryDir);
    writeJsonSync(join(primaryDir, fileName), data, { spaces: 2 });
  } catch (primaryError) {
    try {
      const fallbackDir = getFallbackDir();
      ensureDirSync(fallbackDir);
      writeJsonSync(join(fallbackDir, fileName), data, { spaces: 2 });
    } catch {
      throw primaryError;
    }
  }
}

function getFallbackDir(): string {
  cachedFallbackDir ??= join(app.getPath('temp'), 'Meeting Media Manager');
  return cachedFallbackDir;
}
