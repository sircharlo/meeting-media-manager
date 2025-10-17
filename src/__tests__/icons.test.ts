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
  const metaRegex = /icon\s*[:=]\s*("|')(?<val>[^"']+)\1/gi;
  // Match return statements returning literal strings in TS/JS
  const returnLiteralRegex = /return\s+("|')(?<val>[^"']+)\1/gi;
  // Match return template literals that form numeric icons: `mmm-numeric-${...}-box-outline`
  const returnNumericTplRegex =
    /return\s+`[^`]*mmm-numeric-\$\{[^}]+\}-box-outline[^`]*`/gi;

  for (const file of walk(repoRoot, repoRoot)) {
    // Skip the icons folder files
    if (file.startsWith(ICONS_DIR)) continue;

    const content = fs.readFileSync(file, 'utf8');

    let match: null | RegExpExecArray;

    // <q-icon> attributes like icon="..." or name="..." (map to mmm-)
    while ((match = qIconAnyRegex.exec(content)) !== null) {
      const raw = match.groups?.val ?? match[2] ?? '';
      if (!raw) continue;
      const id = mapToMmm(raw);
      if (id && id.startsWith('mmm-')) used.add(id);
    }
    // <q-btn> attributes like icon="..."
    while ((match = qBtnAnyRegex.exec(content)) !== null) {
      const raw = match.groups?.val ?? match[2] ?? '';
      if (!raw) continue;
      const id = mapToMmm(raw);
      if (id && id.startsWith('mmm-')) used.add(id);
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
        if (id && id.startsWith('mmm-')) used.add(id);
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
        if (id && id.startsWith('mmm-')) used.add(id);
      }
    }
    // TS/JS: return 'mmm-xyz'
    while ((match = returnLiteralRegex.exec(content)) !== null) {
      const raw = match.groups?.val ?? match[2] ?? '';
      if (!raw) continue;
      const id = mapToMmm(raw);
      if (id && id.startsWith('mmm-')) used.add(id);
    }
    // TS/JS: return `mmm-numeric-${...}-box-outline` -> add 1..10 variants
    if (returnNumericTplRegex.test(content)) {
      for (let i = 1; i <= 10; i++) {
        used.add(`mmm-numeric-${i}-box-outline`);
      }
    }
    // Object properties like icon: 'mmm-refresh'
    while ((match = metaRegex.exec(content)) !== null) {
      const id = match.groups?.id ?? match[2] ?? match[0];
      if (id && id.startsWith('mmm-')) used.add(id);
    }
  }
  return used;
}

function isIgnoredDir(relative: string) {
  // Normalize to forward slashes for consistency
  const rel = relative.replace(/\\/g, '/');
  for (const dir of IGNORED_DIRS) {
    if (rel === dir || rel.startsWith(dir + '/')) return true;
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

    if (missing.length > 0) {
      console.log(missing);
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
