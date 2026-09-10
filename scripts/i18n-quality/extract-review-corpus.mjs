#!/usr/bin/env node
/**
 * Extract the corpus of translated (non-identical-to-English) short UI
 * strings a translation-quality review agent should look at, for one
 * language.
 *
 * Deterministic and LLM-free: this is Phase 0 of the translation-quality
 * pipeline (see the plan this was built from). It only diffs local files
 * already checked out in the repo - it never talks to the Crowdin API.
 *
 * Covers `src/i18n/<lang>.json` and `docs/locales/<lang>.json` (both flat
 * JSON, same "short UI string" shape). Long-form prose (docs/src/**,
 * release-notes) is a separate, not-yet-built extractor - the shapes are
 * different enough (headings, paragraphs, no stable key) to need their own
 * chunking logic.
 *
 * A string is skipped (not emitted) when:
 *  - the translation is identical to the English source (untranslated -
 *    nothing to review; confirmed reliable across all enabled languages,
 *    see the plan's scale research: zero missing-key edge cases anywhere).
 *  - the source or translation matches a pattern already owned by
 *    scripts/cleanup-crowdin.mjs's corruption-repair pipeline (version
 *    headers, typographic-quote/whitespace-mangled `@:` links, doubled
 *    anchors, scrambled version numbers) - a quality review must not
 *    re-flag mechanical corruption that pipeline already fixes.
 *
 * Every emitted record carries `protectedTokens` (the `@:key` / `@:{'key'}`
 * link targets and `{param}` names present in the English source) so a
 * review agent - and later, validate-proposed-changes.mjs - can verify a
 * proposed rewrite kept them byte-identical.
 *
 * Usage:
 *   node scripts/i18n-quality/extract-review-corpus.mjs --language fr [--run-id <id>]
 */
import fsx from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ensureDir, readFile, writeFile } = fsx;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

// ── Corruption-repair patterns, kept byte-identical to
//    scripts/cleanup-crowdin.mjs so this extractor never re-flags what that
//    pipeline already owns. ────────────────────────────────────────────────

const TYPOGRAPHIC_QUOTES = '‚‘’‛“”„‟';
const VERSION_HEADER_PATTERN = /^##(?!#)\s+v?\d+\.\d+\.\d+/;
const LINK_TARGET_RE = /@:\{?'?([^'}\s]+)'?\}?/g;
const PARAM_NAME_RE = /\{([\w]+)\}/g;
const CORRUPTION_SIGNATURES = [
  new RegExp(`@:\\{[^{}]*[${TYPOGRAPHIC_QUOTES}][^{}]*\\}`),
  /@:[ \t]+(?=[\p{L}\p{N}_-])/u,
  /\{#[\w-]+\}\s*\{#/,
  /^(?:##\s*)?\d+\.\d+\s+v\d+\.\d+\s*$/,
  /^(?:##\s*)?v\d+[ ,]\d+[,.]?\d*\s*$/,
  /@:[^\s]*-(?=[\s.,;:!?]|$)/,
];

const CONTENT_SOURCES = [
  {
    contentType: 'i18n',
    sourcePath: 'src/i18n/en.json',
    translatedPathTemplate: 'src/i18n/{lang}.json',
  },
  {
    contentType: 'docs-locale',
    sourcePath: 'docs/locales/en.json',
    translatedPathTemplate: 'docs/locales/{lang}.json',
  },
];

async function extractForSource(
  { contentType, sourcePath, translatedPathTemplate },
  language,
) {
  const translatedPath = translatedPathTemplate.replace('{lang}', language);
  const source = await readJson(sourcePath);
  const translated = await readJson(translatedPath);

  const records = [];
  let skippedIdentical = 0;
  let skippedCorrupted = 0;

  for (const [key, sourceValue] of Object.entries(source)) {
    if (typeof sourceValue !== 'string') continue;
    const translatedValue = translated[key];
    if (typeof translatedValue !== 'string') continue; // missing key - out of scope

    if (translatedValue === sourceValue) {
      skippedIdentical += 1;
      continue;
    }
    if (
      VERSION_HEADER_PATTERN.test(sourceValue) ||
      isCorrupted(sourceValue) ||
      isCorrupted(translatedValue)
    ) {
      skippedCorrupted += 1;
      continue;
    }

    records.push({
      contentType,
      currentTranslation: translatedValue,
      filePath: translatedPath,
      key,
      protectedTokens: extractProtectedTokens(sourceValue),
      sourceEn: sourceValue,
    });
  }

  return {
    records,
    skippedCorrupted,
    skippedIdentical,
    totalSourceKeys: Object.keys(source).length,
  };
}

function extractProtectedTokens(sourceText) {
  const links = [...sourceText.matchAll(LINK_TARGET_RE)].map((m) => m[1]);
  const params = [...sourceText.matchAll(PARAM_NAME_RE)].map((m) => m[1]);
  return { links, params };
}

function isCorrupted(text) {
  return CORRUPTION_SIGNATURES.some((pattern) => pattern.test(text));
}

async function main() {
  const { language, runId } = parseArgs(process.argv.slice(2));
  if (!language) {
    console.error(
      'Usage: node extract-review-corpus.mjs --language <code> [--run-id <id>]',
    );
    process.exit(1);
  }

  const resolvedRunId = runId ?? new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(
    REPO_ROOT,
    'reports/translation-quality',
    resolvedRunId,
    'corpus',
    language,
  );
  await ensureDir(outDir);

  const summary = { language, runId: resolvedRunId, sources: [] };

  for (const source of CONTENT_SOURCES) {
    const { records, skippedCorrupted, skippedIdentical, totalSourceKeys } =
      await extractForSource(source, language);

    const outPath = resolve(outDir, `${source.contentType}.json`);
    await writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');

    summary.sources.push({
      contentType: source.contentType,
      emitted: records.length,
      outPath: outPath
        .replace(`${REPO_ROOT}\\`, '')
        .replace(`${REPO_ROOT}/`, ''),
      skippedCorrupted,
      skippedIdentical,
      totalSourceKeys,
    });

    console.log(
      `[${source.contentType}] ${language}: ${totalSourceKeys} source keys, ` +
        `${skippedIdentical} untranslated (skipped), ${skippedCorrupted} known-corruption (skipped), ` +
        `${records.length} emitted for review -> ${outPath}`,
    );
  }

  console.log(`\nrun-id: ${resolvedRunId}`);
  return summary;
}

function parseArgs(argv) {
  const args = { language: null, runId: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--language') {
      args.language = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--run-id') {
      args.runId = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function readJson(relativePath) {
  const path = resolve(REPO_ROOT, relativePath);
  return JSON.parse(await readFile(path, 'utf-8'));
}

await main();
