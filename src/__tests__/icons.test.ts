import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Root resolution: this test file lives at src/__tests__/icons.test.ts
// Repo root is two levels up from here
const repoRoot = path.resolve(__dirname, '../../');

const ICONS_DIR = path.join(repoRoot, 'build', 'icons');

const IGNORED_DIRS = new Set([
  '.git',
  '.quasar',
  '.vitepress',
  '.yarn',
  'build/icons', // avoid scanning the icons folder for usage
  'dist',
  'node_modules',
]);

function mapToMmm(raw: string): string {
  let iconName = raw;
  if (iconName.startsWith('chevron_')) {
    iconName = iconName.replace('chevron_', 'mmm-');
  } else if (iconName.startsWith('keyboard_arrow_')) {
    iconName = iconName.replace('keyboard_arrow_', 'mmm-');
  } else if (iconName.startsWith('arrow_drop_')) {
    iconName = 'mmm-dropdown-arrow';
  } else if (iconName === 'cancel' || iconName === 'close') {
    iconName = 'clear';
  }
  if (!iconName.startsWith('mmm-')) {
    iconName = 'mmm-' + iconName;
  }
  return iconName;
}

const INCLUDED_EXTENSIONS = new Set([
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mts',
  '.ts',
  '.tsx',
  '.vue',
]);

function collectAvailableIcons(): Set<string> {
  const files = fs
    .readdirSync(ICONS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.svg'));
  const ids = new Set<string>();
  for (const file of files) {
    const base = path.basename(file, '.svg');
    ids.add('mmm-' + base);
  }
  return ids;
}

function collectUsedIcons(): Set<string> {
  const used = new Set<string>();

  used.add('mmm-dropdown-arrow');

  // Regexes to capture mmm-* icon references in templates/TS
  // Match <q-icon ... name="..." /> or <q-icon ... icon="..." /> (any literal)
  const qIconAnyRegex =
    /<\s*q-icon\b[^>]*\b(?:icon|name)\s*=\s*("|')(?<val>[^"']+)\1/gi;
  // Match <q-btn ... icon="..." /> or name="..." (any literal)
  const qBtnAnyRegex =
    /<\s*q-btn\b[^>]*\b(?:icon|name)\s*=\s*("|')(?<val>[^"']+)\1/gi;
  // Match bound attributes like <q-icon :name="cond ? 'mmm-a' : 'mmm-b'" />
  // Avoid backrefs inside character classes by splitting on quote types
  const qIconBoundRegex =
    /<\s*q-icon\b[^>]*\s:?(?:icon|name)\s*=\s*(?:"(?<valD>[^"]*?)"|'(?<valS>[^']*?)')/gi;
  // Match bound attributes on <q-btn> like :icon="cond ? 'mmm-a' : 'mmm-b'"
  const qBtnBoundRegex =
    /<\s*q-btn\b[^>]*\s:?(?:icon|name)\s*=\s*(?:"(?<valD>[^"]*?)"|'(?<valS>[^']*?)')/gi;
  const innerLiteralRegex = /(["'])([^"']+)\1/g;

  for (const file of walk(repoRoot, repoRoot)) {
    // Skip the icons folder files
    if (file.startsWith(ICONS_DIR)) continue;

    const content = fs.readFileSync(file, 'utf8');

    let match: null | RegExpExecArray;

    const tempMatches = new Set<string>();

    // <q-icon> attributes like icon="..." or name="..." (map to mmm-)
    while ((match = qIconAnyRegex.exec(content)) !== null) {
      const raw = match.groups?.val ?? match[2] ?? '';
      if (!raw) continue;
      const id = mapToMmm(raw);
      if (id && id.startsWith('mmm-')) tempMatches.add(id);
    }
    // <q-btn> attributes like icon="..."
    while ((match = qBtnAnyRegex.exec(content)) !== null) {
      const raw = match.groups?.val ?? match[2] ?? '';
      if (!raw) continue;
      const id = mapToMmm(raw);
      if (id && id.startsWith('mmm-')) tempMatches.add(id);
    }
    // <q-icon> bound attributes like :name="cond ? 'mmm-a' : 'mmm-b'"
    while ((match = qIconBoundRegex.exec(content)) !== null) {
      const expr = match.groups?.valD ?? match.groups?.valS ?? '';
      if (!expr) continue;
      let innerMatch: null | RegExpExecArray;
      while ((innerMatch = innerLiteralRegex.exec(expr)) !== null) {
        const raw = innerMatch[2];
        if (!raw) continue;
        const id = mapToMmm(raw);
        if (id && id.startsWith('mmm-')) tempMatches.add(id);
      }
    }
    // <q-btn> bound attributes like :icon="cond ? 'mmm-a' : 'mmm-b'"
    while ((match = qBtnBoundRegex.exec(content)) !== null) {
      const expr = match.groups?.valD ?? match.groups?.valS ?? '';
      if (!expr) continue;
      let innerMatch: null | RegExpExecArray;
      while ((innerMatch = innerLiteralRegex.exec(expr)) !== null) {
        const raw = innerMatch[2];
        if (!raw) continue;
        const id = mapToMmm(raw);
        if (id && id.startsWith('mmm-')) tempMatches.add(id);
      }
    }
    for (const id of tempMatches) {
      if (id.includes('(')) continue;
      if (id.includes('.')) continue;
      if (id === 'mmm-watched') continue;
      if (id === 'mmm-additional') continue;
      if (id === 'mmm-a') continue;
      if (id === 'mmm-b') continue;
      if (id === 'mmm-icon') continue;
      used.add(id);
    }
  }
  return used;
}

function isIgnoredDir(relative: string) {
  // Normalize to forward slashes for consistency
  const rel = relative.replace(/\\/g, '/');
  const relLower = rel.toLowerCase();
  for (const dir of IGNORED_DIRS) {
    const dirLower = dir.toLowerCase();
    if (dirLower.includes('/')) {
      // Multi-segment ignore like 'build/icons' at ANY depth
      if (
        relLower === dirLower ||
        relLower.startsWith(dirLower + '/') ||
        relLower.endsWith('/' + dirLower) ||
        relLower.includes('/' + dirLower + '/')
      )
        return true;
    } else {
      // Single directory name: ignore if any path segment matches exactly
      const segments = relLower.split('/');
      if (segments.includes(dirLower)) return true;
    }
  }
  return false;
}

function* walk(dir: string, base: string): Generator<string> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      if (!isIgnoredDir(rel)) {
        yield* walk(full, base);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDED_EXTENSIONS.has(ext)) {
        yield full;
      }
    }
  }
}

describe('Icon usage consistency', () => {
  it('all used mmm-* icons must exist in build/icons', () => {
    const used = collectUsedIcons();
    const available = collectAvailableIcons();

    const missing: string[] = [];
    for (const id of used) {
      if (!available.has(id)) missing.push(id);
    }

    expect(missing).toHaveLength(0);
  });

  it('no unused SVG icons (files present but not referenced anywhere)', () => {
    const used = collectUsedIcons();
    const available = collectAvailableIcons();

    const unused: string[] = [];
    for (const id of available) {
      if (!used.has(id)) unused.push(id);
    }

    expect(unused).toHaveLength(0);
  });
});
