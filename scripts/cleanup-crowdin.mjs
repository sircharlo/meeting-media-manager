#!/usr/bin/env node
/**
 * Clean Crowdin corruption at the source, via the Crowdin API.
 *
 * The app's i18n JSON, docs markdown, and docs locale files go through
 * Crowdin, and translators editing strings in the Crowdin web editor keep
 * re-introducing the same three classes of corruption:
 *
 *   1. Mangling of vue-i18n linked-message syntax (`@:{'key'}`) - typographic
 *      quotes (`@:{‚key‘}`) or stray whitespace (`@: key`), which the message
 *      compiler rejects at runtime (Sentry MMM-V2-3H6).
 *   2. Docs heading anchors (`{#slug}`) drifting away from the English
 *      source, which breaks cross-language links and fails the VitePress
 *      build on duplicate explicit anchors.
 *   3. Translated `link:` frontmatter values in each locale's index.md
 *      (slugs like `/download` being localized).
 *
 * The same corruption lives in Crowdin's translation memory, so every
 * exported PR re-delivers it. This script repairs the stored translations in
 * Crowdin itself and purges the corrupted TM segments, so future Crowdin PRs
 * come out clean and the local fixers (scripts/fix-i18n-locales.mjs and
 * docs/utils/fix-doc-markdown.mjs) become pure safety nets.
 *
 * Usage:
 *   CROWDIN_PERSONAL_TOKEN=... node scripts/cleanup-crowdin.mjs           # dry run
 *   CROWDIN_PERSONAL_TOKEN=... node scripts/cleanup-crowdin.mjs --apply   # commit fixes
 *   ... --language et --language fr ...                                   # limit languages
 *   ... --verbose                                                         # per-change logging
 *   node scripts/cleanup-crowdin.mjs --selftest                           # test the repair logic
 *
 * Automation: .github/workflows/crowdin-autorepair.yml runs this script with
 * --apply on a schedule (hourly) and on demand (workflow_dispatch, with an
 * optional --language). Note: a Crowdin webhook cannot drive it directly -
 * Crowdin's custom webhook payload only accepts its own event variables as
 * keys, so it cannot emit the event_type that GitHub's repository_dispatch
 * API requires (API error "Events [client_payload, event_type] don't exist").
 *
 * Config comes from env: CROWDIN_PERSONAL_TOKEN (required),
 * CROWDIN_PROJECT_ID (falls back to crowdin.yml), CROWDIN_BASE_URL
 * (Enterprise only; defaults to https://api.crowdin.com).
 *
 * Dry-run by default; exits 1 when fixes would be made but --apply was not
 * passed (so CI can use it as a check).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { compiles, fixLinkedMessageSyntax } from './fix-i18n-locales.mjs';

const API_VERSION = '/api/v2';
const I18N_SOURCE_PATH = 'src/i18n/en.json';
const DOCS_SOURCE_PREFIX = 'docs/src/en/';
const PAGE_SIZE = 500;
const TYPOGRAPHIC_QUOTES = '‚‘’‛“”„‟';

// ── Pure repair logic (mirrors scripts/fix-i18n-locales.mjs and
//    docs/utils/fix-doc-markdown.mjs) ─────────────────────────────────────────

function computeAnchorFix(enText, translationText, usedAnchors) {
  if (!isHeadingString(enText)) return null;

  const expected = getTrailingHeadingAnchors(enText).anchors.at(-1);
  if (!expected) return null;

  const seen = usedAnchors.get(expected) ?? 0;
  usedAnchors.set(expected, seen + 1);
  const anchor = seen === 0 ? expected : `${expected}-${seen + 1}`;

  const fixed = replaceHeadingAnchor(translationText, anchor);
  return fixed === translationText ? null : { kind: 'anchor', text: fixed };
}

function computeLinkFix(enText, translationText, locale) {
  const match = /^([ \t]*link:[ \t]*)(\/[^\s]+)\s*$/i.exec(enText);
  if (!match) return null;

  const [, prefix, slug] = match;
  const lastSegment = slug
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .at(-1);
  if (!lastSegment) return null;

  const fixed = `${prefix}/${locale}/${lastSegment}`;
  return fixed === translationText ? null : { kind: 'link', text: fixed };
}

function getTrailingHeadingAnchors(line) {
  const anchors = [];
  let cursor = trimEndIndex(line);

  while (cursor > 0 && line[cursor - 1] === '}') {
    const openIndex = line.lastIndexOf('{#', cursor - 1);
    if (openIndex === -1) break;

    const anchor = line.slice(openIndex + 2, cursor - 1);
    if (!isValidAnchor(anchor)) break;

    anchors.unshift(anchor);
    cursor = trimEndIndex(line, openIndex);
  }

  const start = anchors.length > 0 ? cursor : line.length;
  return { anchors, start };
}

function isHeadingString(text) {
  return (
    /^[ \t]*#{1,6}[ \t]+\S/.test(text) ||
    getTrailingHeadingAnchors(text).anchors.length > 0
  );
}

function isValidAnchor(anchor) {
  return (
    anchor.length > 0 &&
    [...anchor].every((char) => char !== '}' && char.trim() !== '')
  );
}

function repairLinkedMessage(translation) {
  if (!translation.includes('@:') || compiles(translation)) return null;
  const fixed = fixLinkedMessageSyntax(translation);
  return fixed !== translation && compiles(fixed) ? fixed : null;
}

function replaceHeadingAnchor(line, anchor) {
  const withoutAnchors = line.slice(0, getTrailingHeadingAnchors(line).start);
  return `${withoutAnchors.trimEnd()} {#${anchor}}`;
}

function trimEndIndex(value, end = value.length) {
  let cursor = end;
  while (cursor > 0 && value[cursor - 1].trim() === '') {
    cursor -= 1;
  }
  return cursor;
}

const CORRUPTION_SIGNATURES = [
  // Typographic quotes inside @:{...} (e.g. @:{‚cbs‘}).
  new RegExp(`@:\\{[^{}]*[${TYPOGRAPHIC_QUOTES}][^{}]*\\}`),
  // Stray whitespace after @: (e.g. @: cbs), which is never valid.
  /@:[ \t]+(?=[\p{L}\p{N}_-])/u,
  // Doubled heading anchors left over from mangled {#a} {#a} runs.
  /\{#[\w-]+\}\s*\{#/,
];

async function crowdinRequest(
  baseUrl,
  token,
  path,
  { body, method = 'GET' } = {},
) {
  const response = await fetch(`${baseUrl}${API_VERSION}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    method,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const suffix = detail ? `: ${detail.slice(0, 400)}` : '';
    throw new Error(
      `Crowdin API ${method} ${path} -> ${response.status} ${response.statusText}${suffix}`,
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

// ── Config ───────────────────────────────────────────────────────────────────

async function deleteTmSegment(ctx, tmId, segmentId, label) {
  try {
    await crowdinRequest(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/tms/${tmId}/segments/${segmentId}`,
      { method: 'DELETE' },
    );
  } catch (error) {
    ctx.failures.push(`${label}: ${error.message}`);
  }
}

function getConfig() {
  const token = process.env.CROWDIN_PERSONAL_TOKEN;
  if (!token) {
    throw new Error(
      'Missing CROWDIN_PERSONAL_TOKEN env var (create one at https://crowdin.com/settings#api).',
    );
  }

  const projectId =
    process.env.CROWDIN_PROJECT_ID ?? parseProjectIdFromCrowdinYml();
  if (!projectId) {
    throw new Error(
      'Missing CROWDIN_PROJECT_ID env var and no project_id found in crowdin.yml.',
    );
  }

  return {
    baseUrl: process.env.CROWDIN_BASE_URL ?? 'https://api.crowdin.com',
    projectId,
    token,
  };
}

// ── Crowdin API layer ────────────────────────────────────────────────────────

function isCorruptedSegment(text) {
  return CORRUPTION_SIGNATURES.some((signature) => signature.test(text));
}

async function listAll(baseUrl, token, path) {
  const items = [];
  let offset = 0;

  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const page = await crowdinRequest(
      baseUrl,
      token,
      `${path}${separator}limit=${PAGE_SIZE}&offset=${offset}`,
    );
    const rows = page.data ?? [];
    for (const row of rows) {
      items.push(row.data);
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
}

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\/+/, '');
}

function parseArgs(argv) {
  const args = {
    apply: false,
    help: false,
    languages: new Set(),
    selftest: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--selftest') {
      args.selftest = true;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg === '--language') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('--language requires a value (e.g. --language et)');
      }
      args.languages.add(value);
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg} (see --help)`);
    }
  }

  return args;
}

// ── Repair passes ────────────────────────────────────────────────────────────

function parseProjectIdFromCrowdinYml() {
  try {
    const content = readFileSync(
      resolve(process.cwd(), 'crowdin.yml'),
      'utf-8',
    );
    const match = /^project_id:\s*['"]?(\d+)['"]?\s*$/m.exec(content);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function printHelp() {
  console.log(`Clean Crowdin corruption at the source, via the Crowdin API.

Repairs the three recurring classes of Crowdin corruption in the stored
translations (and purges the corrupted translation-memory segments), so
future Crowdin PRs come out clean:

  1. vue-i18n linked-message syntax (@:{'key'}) mangled by typographic
     quotes or stray whitespace - in src/i18n/*.json translations.
  2. Docs heading anchors ({#slug}) drifted away from the English source.
  3. Translated link: frontmatter values in each locale's docs index.md.

Automation:
  .github/workflows/crowdin-autorepair.yml runs this script with --apply
  hourly and on demand (workflow_dispatch). A Crowdin webhook cannot drive
  it directly: custom webhook payloads only accept Crowdin event variables
  as keys, so they cannot emit the event_type that GitHub's
  repository_dispatch API requires.

Options:
  --apply              Commit the fixes to Crowdin (default is a dry run).
  --language <id>      Only process this language (repeatable; default all).
  --verbose            Log every individual change.
  --selftest           Unit-test the repair logic and exit.
  --help               Show this help.

Environment:
  CROWDIN_PERSONAL_TOKEN  API token with project.settings scope (required).
  CROWDIN_PROJECT_ID      Project id (falls back to project_id in crowdin.yml).
  CROWDIN_BASE_URL        API base URL (Enterprise only).
`);
}

async function purgeCorruptedTmSegments(ctx) {
  let tmId = ctx.defaultTmId;

  if (!tmId) {
    const tms = await listAll(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/tms`,
    );
    if (tms.length === 0) {
      ctx.log('[tm] no translation memory found; skipping segment purge');
      return;
    }
    tmId = tms[0].id;
  }

  const segments = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/tms/${tmId}/segments`,
  );

  for (const segment of segments) {
    if (typeof segment.text !== 'string' || !isCorruptedSegment(segment.text))
      continue;

    ctx.totals.segments += 1;
    if (ctx.verbose) {
      ctx.log(
        `[tm] delete segment ${segment.id}: ${JSON.stringify(segment.text)}`,
      );
    }
    if (ctx.apply) {
      await deleteTmSegment(ctx, tmId, segment.id, `tm segment ${segment.id}`);
    }
  }
}

async function repairDocsFile(ctx, file) {
  const strings = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/strings?fileId=${file.id}`,
  );
  if (strings.length === 0) return;

  const sources = new Map(strings.map((string) => [string.id, string.text]));
  const stringOrder = new Map(
    strings.map((string, index) => [string.id, index]),
  );
  const isIndex = file.normalizedPath.endsWith('/index.md');

  for (const language of ctx.languages) {
    const translations = await listAll(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/languages/${encodeURIComponent(language)}/translations?fileId=${file.id}`,
    );
    if (translations.length === 0) continue;

    // File order matters for duplicate-anchor suffixing, so sort translations
    // back into the order the strings appear in the file.
    translations.sort(
      (a, b) =>
        (stringOrder.get(a.stringId) ?? -1) -
        (stringOrder.get(b.stringId) ?? -1),
    );

    const usedAnchors = new Map();
    for (const item of translations) {
      if (typeof item.text !== 'string') continue;
      const source = sources.get(item.stringId) ?? '';

      const linkFix = isIndex
        ? computeLinkFix(source, item.text, language)
        : null;
      const fix = linkFix ?? computeAnchorFix(source, item.text, usedAnchors);
      if (!fix) continue;

      ctx.totals[fix.kind === 'link' ? 'links' : 'anchors'] += 1;
      const label = `${file.normalizedPath} (${language}, string ${item.stringId})`;
      if (ctx.verbose) {
        ctx.log(
          `[${fix.kind}] ${label}: ${JSON.stringify(item.text)} -> ${JSON.stringify(fix.text)}`,
        );
      }
      if (ctx.apply) {
        await updateTranslation(ctx, item.translationId, fix.text, label);
      }
    }
  }
}

// ── Webhook setup ────────────────────────────────────────────────────────────

async function repairI18nLinkedSyntax(ctx, file) {
  const strings = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/strings?fileId=${file.id}`,
  );
  const candidateIds = new Set(
    strings
      .filter(
        (string) =>
          typeof string.text === 'string' && string.text.includes('@:'),
      )
      .map((string) => string.id),
  );
  if (candidateIds.size === 0) return;

  for (const language of ctx.languages) {
    const translations = await listAll(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/languages/${encodeURIComponent(language)}/translations?fileId=${file.id}`,
    );

    for (const item of translations) {
      if (typeof item.text !== 'string' || !candidateIds.has(item.stringId))
        continue;

      const fixed = repairLinkedMessage(item.text);
      if (!fixed) continue;

      ctx.totals.linked += 1;
      const label = `${file.normalizedPath} (${language}, string ${item.stringId})`;
      if (ctx.verbose) {
        ctx.log(
          `[linked] ${label}: ${JSON.stringify(item.text)} -> ${JSON.stringify(fixed)}`,
        );
      }
      if (ctx.apply) {
        await updateTranslation(ctx, item.translationId, fixed, label);
      }
    }
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.selftest) {
    return runSelfTest() ? 0 : 1;
  }

  const { baseUrl, projectId, token } = getConfig();
  const ctx = {
    apply: args.apply,
    baseUrl,
    defaultTmId: undefined,
    failures: [],
    languages: [],
    log: (message) => console.log(message),
    projectId,
    token,
    totals: { anchors: 0, linked: 0, links: 0, segments: 0 },
    verbose: args.verbose,
  };

  const project = (
    await crowdinRequest(baseUrl, token, `/projects/${projectId}`)
  ).data;
  ctx.defaultTmId = project.defaultTmId;
  ctx.languages = (project.targetLanguageIds ?? []).filter(
    (language) => args.languages.size === 0 || args.languages.has(language),
  );

  ctx.log(
    `[crowdin] project ${projectId} - ${ctx.apply ? 'APPLYING fixes' : 'dry run (use --apply to commit)'}`,
  );
  ctx.log(
    `[crowdin] target languages: ${ctx.languages.join(', ') || '(none)'}`,
  );
  if (ctx.languages.length === 0) {
    ctx.log('[crowdin] nothing to do - no target languages match');
    return 0;
  }

  const files = await listAll(baseUrl, token, `/projects/${projectId}/files`);
  const normalizedFiles = files.map((file) => ({
    ...file,
    normalizedPath: normalizePath(file.path ?? file.name ?? ''),
  }));

  const i18nFile = normalizedFiles.find(
    (file) => file.normalizedPath === I18N_SOURCE_PATH,
  );
  if (i18nFile) {
    ctx.log(
      `[crowdin] class 1: linked-message syntax in ${i18nFile.normalizedPath}`,
    );
    await repairI18nLinkedSyntax(ctx, i18nFile);
  } else {
    ctx.log(
      `[crowdin] WARN: source file ${I18N_SOURCE_PATH} not found in project; skipping class 1`,
    );
  }

  const docsFiles = normalizedFiles.filter(
    (file) =>
      file.normalizedPath.startsWith(DOCS_SOURCE_PREFIX) &&
      file.normalizedPath.endsWith('.md'),
  );
  if (docsFiles.length > 0) {
    ctx.log(
      `[crowdin] classes 2+3: docs heading anchors and link: frontmatter (${docsFiles.length} files)`,
    );
    for (const file of docsFiles) {
      await repairDocsFile(ctx, file);
    }
  } else {
    ctx.log(
      `[crowdin] WARN: no ${DOCS_SOURCE_PREFIX}**/*.md files found; skipping classes 2+3`,
    );
  }

  ctx.log('[crowdin] class 4: purging corrupted translation-memory segments');
  await purgeCorruptedTmSegments(ctx);

  const { anchors, linked, links, segments } = ctx.totals;
  const total = anchors + linked + links + segments;
  ctx.log('');
  ctx.log(
    `Done. ${ctx.apply ? 'Applied' : 'Found (dry run - rerun with --apply to commit)'}:`,
  );
  ctx.log(`  linked-syntax repairs:   ${linked}`);
  ctx.log(`  heading-anchor fixes:    ${anchors}`);
  ctx.log(`  link-frontmatter fixes:  ${links}`);
  ctx.log(`  corrupted TM segments:   ${segments}`);

  if (ctx.failures.length > 0) {
    ctx.log(`\n${ctx.failures.length} failure(s):`);
    for (const failure of ctx.failures) {
      ctx.log(`  ${failure}`);
    }
  }

  if (!ctx.apply && total > 0) {
    ctx.log('\nChanges pending - pass --apply to commit them to Crowdin.');
    return 1;
  }
  return ctx.failures.length > 0 ? 1 : 0;
}

function runSelfTest() {
  const cases = [
    // Linked-message repairs (real samples from commit 535970092).
    [
      'linked typographic quotes',
      repairLinkedMessage('Sisesta aadress ... @:{‚official-website-of-jw‘}.'),
      "Sisesta aadress ... @:{'official-website-of-jw'}.",
    ],
    [
      'linked stray whitespace',
      repairLinkedMessage('Välista videod nendest väljaannetest @: cbs ajal'),
      'Välista videod nendest väljaannetest @:cbs ajal',
    ],
    [
      'valid linked left alone',
      repairLinkedMessage('Mine lehele @:settings'),
      null,
    ],
    ['plain text left alone', repairLinkedMessage('Tere maailm'), null],

    // Docs heading anchors.
    [
      'anchor mismatch realigned',
      computeAnchorFix(
        '## What is this app? {#what-is-this-app}',
        '## Mis see on? {#mis-see-on}',
        new Map(),
      ),
      { kind: 'anchor', text: '## Mis see on? {#what-is-this-app}' },
    ],
    [
      'anchor missing appended',
      computeAnchorFix(
        '## What is this app? {#what-is-this-app}',
        '## Mis see on?',
        new Map(),
      ),
      { kind: 'anchor', text: '## Mis see on? {#what-is-this-app}' },
    ],
    [
      'duplicate anchors suffixed in file order',
      (() => {
        const used = new Map();
        computeAnchorFix('## A {#x}', '## A {#x}', used);
        return computeAnchorFix('## A2 {#x}', '## A2 {#x}', used);
      })(),
      { kind: 'anchor', text: '## A2 {#x-2}' },
    ],
    [
      'clean anchor left alone',
      computeAnchorFix('## A {#x}', '## B {#x}', new Map()),
      null,
    ],

    // Docs link: frontmatter.
    [
      'translated link realigned',
      computeLinkFix('link: /download', 'link: /télécharger', 'fr'),
      { kind: 'link', text: 'link: /fr/download' },
    ],
    [
      'clean link left alone',
      computeLinkFix('link: /download', 'link: /fr/download', 'fr'),
      null,
    ],
    [
      'image value untouched',
      computeLinkFix('image: /logo.svg', 'image: /logo.svg', 'fr'),
      null,
    ],
    ['prose untouched', computeLinkFix('Download', 'Télécharger', 'fr'), null],

    // TM segment corruption signatures.
    ['tm typographic quotes', isCorruptedSegment('Viide @:{‚cbs‘}'), true],
    ['tm stray whitespace', isCorruptedSegment('... @: cbs ajal'), true],
    ['tm doubled anchor', isCorruptedSegment('## Foo {#foo} {#foo}'), true],
    ['tm clean segment', isCorruptedSegment("Viide @:{'cbs'} juurde"), false],
  ];

  let failed = 0;
  for (const [name, actual, expected] of cases) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) failed += 1;
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}`);
    if (!pass) {
      console.log(`       expected: ${JSON.stringify(expected)}`);
      console.log(`       actual:   ${JSON.stringify(actual)}`);
    }
  }

  console.log(
    `\n${cases.length - failed}/${cases.length} self-test cases passed.`,
  );
  return failed === 0;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function updateTranslation(ctx, translationId, text, label) {
  try {
    await crowdinRequest(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/translations/${translationId}`,
      {
        body: { text },
        method: 'PUT',
      },
    );
  } catch (error) {
    ctx.failures.push(`${label}: ${error.message}`);
  }
}

try {
  process.exitCode = await run();
} catch (error) {
  console.error(`[crowdin] ${error.message}`);
  process.exitCode = 1;
}
