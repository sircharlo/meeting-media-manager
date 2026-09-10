#!/usr/bin/env node
/**
 * Phase 2.5 of the translation-quality pipeline: a deterministic,
 * LLM-free guardrail gate that runs on every raw review-agent proposal
 * before a human ever sees it.
 *
 * Rejects (moves to rejected-by-guardrail/, never silently drops):
 *  - a proposal whose `@:key`/`{param}` token multiset doesn't exactly
 *    match the source's (a review agent must never touch these tokens -
 *    this is the mechanical re-verification, not just trusting the prompt).
 *  - a proposal whose recorded `currentTranslation` no longer matches what
 *    is actually checked out in the repo right now (stale - something else
 *    changed it since extraction).
 *  - a no-op (`proposedTranslation === currentTranslation`).
 *  - anything missing a non-empty `reason` or a valid `category`.
 *  - (i18n content type only) anything that fails to compile as a vue-i18n
 *    message, reusing scripts/fix-i18n-locales.mjs's `compiles()`.
 *
 * Everything else lands in validated/. Also computes a per-file flag rate
 * (proposed / corpus size) and calls out anything over 40% in SUMMARY.md as
 * worth spot-checking for over-eager rewriting before trusting the batch.
 *
 * Usage:
 *   node scripts/i18n-quality/validate-proposed-changes.mjs --run-id <id> --language fr
 */
import fsx from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compiles } from '../fix-i18n-locales.mjs';

const { ensureDir, pathExists, readFile, readJson, writeFile } = fsx;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');
const FLAG_RATE_WARNING_THRESHOLD = 0.4;
const VALID_CATEGORIES = new Set(['phrasing', 'terminology']);

const LINK_TARGET_RE = /@:\{?'?([^'}\s]+)'?\}?/g;
const PARAM_NAME_RE = /\{([\w]+)\}/g;

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function extractTokens(text) {
  return {
    links: [...text.matchAll(LINK_TARGET_RE)].map((m) => m[1]).sort(),
    params: [...text.matchAll(PARAM_NAME_RE)].map((m) => m[1]).sort(),
  };
}

async function getCurrentTranslation(filePath, key) {
  const fullPath = resolve(REPO_ROOT, filePath);
  if (!(await pathExists(fullPath))) return undefined;
  const data = JSON.parse(await readFile(fullPath, 'utf-8'));
  return data[key];
}

async function main() {
  const { language, runId } = parseArgs(process.argv.slice(2));
  if (!language || !runId) {
    console.error(
      'Usage: node validate-proposed-changes.mjs --run-id <id> --language <code>',
    );
    process.exit(1);
  }

  const runDir = resolve(REPO_ROOT, 'reports/translation-quality', runId);
  const proposedDir = resolve(runDir, 'proposed', language);
  const corpusDir = resolve(runDir, 'corpus', language);
  const validatedDir = resolve(runDir, 'validated', language);
  const rejectedDir = resolve(runDir, 'rejected-by-guardrail', language);
  await ensureDir(validatedDir);
  await ensureDir(rejectedDir);

  if (!(await pathExists(proposedDir))) {
    console.error(`No proposed/ directory found at ${proposedDir}`);
    process.exit(1);
  }

  // Skip merge-batches.mjs's intermediate per-batch files
  // (<contentType>-batch-N.json) - only the merged <contentType>.json files
  // are real content types to validate.
  const contentTypeFiles = (await fsx.readdir(proposedDir)).filter(
    (f) => f.endsWith('.json') && !/-batch-\d+\.json$/.test(f),
  );

  const summaryLines = [
    `# Validation summary - ${language} (run ${runId})`,
    '',
    '| Content type | Corpus size | Proposed | Validated | Rejected | Flag rate |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  const warnings = [];

  for (const file of contentTypeFiles) {
    const contentType = file.replace(/\.json$/, '');
    const proposed = await readJson(resolve(proposedDir, file));
    const corpus = await readJson(resolve(corpusDir, file));
    const corpusIndex = new Map(corpus.map((r) => [r.key, r]));

    const validated = [];
    const rejected = [];
    for (const record of proposed) {
      const result = await validateOne(record, corpusIndex);
      if (result.status === 'validated') validated.push(result);
      else rejected.push(result);
    }

    await writeFile(
      resolve(validatedDir, file),
      `${JSON.stringify(validated, null, 2)}\n`,
      'utf-8',
    );
    await writeFile(
      resolve(rejectedDir, file),
      `${JSON.stringify(rejected, null, 2)}\n`,
      'utf-8',
    );

    const flagRate = corpus.length > 0 ? proposed.length / corpus.length : 0;
    summaryLines.push(
      `| ${contentType} | ${corpus.length} | ${proposed.length} | ${validated.length} | ${rejected.length} | ${(flagRate * 100).toFixed(1)}% |`,
    );
    if (flagRate > FLAG_RATE_WARNING_THRESHOLD) {
      warnings.push(
        `**${contentType}**: flag rate ${(flagRate * 100).toFixed(1)}% (${proposed.length}/${corpus.length}) is above the ${FLAG_RATE_WARNING_THRESHOLD * 100}% threshold - spot-check this batch for over-eager rewriting before trusting it.`,
      );
    }

    console.log(
      `[${contentType}] ${language}: ${proposed.length} proposed -> ${validated.length} validated, ${rejected.length} rejected`,
    );
    if (rejected.length > 0) {
      const reasonCounts = {};
      for (const r of rejected) {
        reasonCounts[r._rejectionReason] =
          (reasonCounts[r._rejectionReason] ?? 0) + 1;
      }
      console.log(`  rejection reasons: ${JSON.stringify(reasonCounts)}`);
    }
  }

  summaryLines.push('');
  if (warnings.length > 0) {
    summaryLines.push('## Warnings', '', ...warnings.map((w) => `- ${w}`));
  } else {
    summaryLines.push('No flag-rate warnings.');
  }

  await writeFile(
    resolve(runDir, 'SUMMARY.md'),
    `${summaryLines.join('\n')}\n`,
    'utf-8',
  );
  console.log(`\nWrote ${resolve(runDir, 'SUMMARY.md')}`);
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

function reject(record, reasonCode) {
  return { ...record, _rejectionReason: reasonCode };
}

function tokensMatch(expected, actual) {
  return (
    arraysEqual([...expected.links].sort(), actual.links) &&
    arraysEqual([...expected.params].sort(), actual.params)
  );
}

async function validateOne(record, corpusIndex) {
  if (typeof record.reason !== 'string' || record.reason.trim() === '') {
    return reject(record, 'missing-reason');
  }
  if (!VALID_CATEGORIES.has(record.category)) {
    return reject(record, 'invalid-category');
  }
  if (
    typeof record.proposedTranslation !== 'string' ||
    record.proposedTranslation.trim() === ''
  ) {
    return reject(record, 'empty-proposal');
  }
  if (record.proposedTranslation === record.currentTranslation) {
    return reject(record, 'no-op');
  }

  const corpusRecord = corpusIndex.get(record.key);
  if (!corpusRecord) {
    return reject(record, 'unknown-key-not-in-corpus');
  }

  const liveCurrent = await getCurrentTranslation(record.filePath, record.key);
  if (liveCurrent !== record.currentTranslation) {
    return reject(record, 'stale-current-translation-changed');
  }

  const actualTokens = extractTokens(record.proposedTranslation);
  if (!tokensMatch(corpusRecord.protectedTokens, actualTokens)) {
    return reject(record, 'protected-token-mismatch');
  }

  if (
    record.contentType === 'i18n' &&
    record.proposedTranslation.includes('@:') &&
    !compiles(record.proposedTranslation)
  ) {
    return reject(record, 'fails-vue-i18n-compile');
  }

  return { ...record, status: 'validated' };
}

await main();
