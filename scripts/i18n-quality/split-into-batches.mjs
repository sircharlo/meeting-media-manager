#!/usr/bin/env node
/**
 * Splits a corpus/<lang>/<contentType>.json array into fixed-size batch
 * files for review-agent invocations (prompts/review-short-strings.md is
 * written for ~150 records per invocation - large enough to be efficient,
 * small enough to stay a careful read rather than a shallow skim).
 *
 * Usage:
 *   node scripts/i18n-quality/split-into-batches.mjs --run-id <id> --language fr --content-type i18n [--batch-size 150]
 */
import fsx from 'fs-extra';
import { resolve } from 'node:path';

const { ensureDir, readJson, writeFile } = fsx;

async function main() {
  const { batchSize, contentType, language, runId } = parseArgs(
    process.argv.slice(2),
  );
  if (!language || !contentType || !runId) {
    console.error(
      'Usage: node split-into-batches.mjs --run-id <id> --language <code> --content-type <type> [--batch-size 150]',
    );
    process.exit(1);
  }

  const corpusPath = resolve(
    'reports/translation-quality',
    runId,
    'corpus',
    language,
    `${contentType}.json`,
  );
  const records = await readJson(corpusPath);

  const batchDir = resolve(
    'reports/translation-quality',
    runId,
    'corpus',
    language,
    `${contentType}-batches`,
  );
  await ensureDir(batchDir);

  const batchCount = Math.ceil(records.length / batchSize);
  for (let i = 0; i < batchCount; i += 1) {
    const batch = records.slice(i * batchSize, (i + 1) * batchSize);
    const outPath = resolve(batchDir, `batch-${i + 1}.json`);
    await writeFile(outPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf-8');
    console.log(`Wrote ${outPath} (${batch.length} records)`);
  }

  console.log(
    `\n${records.length} records -> ${batchCount} batch(es) in ${batchDir}`,
  );
}

function parseArgs(argv) {
  const args = {
    batchSize: 150,
    contentType: null,
    language: null,
    runId: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--language') args.language = argv[++i];
    else if (argv[i] === '--content-type') args.contentType = argv[++i];
    else if (argv[i] === '--run-id') args.runId = argv[++i];
    else if (argv[i] === '--batch-size') args.batchSize = Number(argv[++i]);
  }
  return args;
}

await main();
