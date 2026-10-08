#!/usr/bin/env node
/**
 * Merges per-batch review-agent output (proposed/<lang>/<contentType>-batch-N.json)
 * into the single proposed/<lang>/<contentType>.json file
 * validate-proposed-changes.mjs expects.
 *
 * Usage:
 *   node scripts/i18n-quality/merge-batches.mjs --run-id <id> --language fr --content-type i18n
 */
import fsx from 'fs-extra';
import { resolve } from 'node:path';

const { pathExists, readdir, readJson, writeFile } = fsx;

async function main() {
  const { contentType, language, runId } = parseArgs(process.argv.slice(2));
  if (!language || !contentType || !runId) {
    console.error(
      'Usage: node merge-batches.mjs --run-id <id> --language <code> --content-type <type>',
    );
    process.exit(1);
  }

  const proposedDir = resolve(
    'reports/translation-quality',
    runId,
    'proposed',
    language,
  );
  await fsx.ensureDir(proposedDir);

  const batchPrefix = `${contentType}-batch-`;
  const files = (await readdir(proposedDir))
    .filter((f) => f.startsWith(batchPrefix) && f.endsWith('.json'))
    .sort();

  let merged = [];
  for (const file of files) {
    const batch = await readJson(resolve(proposedDir, file));
    merged = merged.concat(batch);
    console.log(`  + ${file} (${batch.length} records)`);
  }

  const outPath = resolve(proposedDir, `${contentType}.json`);
  await writeFile(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  console.log(
    `\nMerged ${files.length} batch file(s), ${merged.length} total records -> ${outPath}`,
  );

  if (files.length === 0 && !(await pathExists(outPath))) {
    console.warn(
      `No batch files found matching ${batchPrefix}*.json in ${proposedDir}`,
    );
  }
}

function parseArgs(argv) {
  const args = { contentType: null, language: null, runId: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--language') args.language = argv[++i];
    else if (argv[i] === '--content-type') args.contentType = argv[++i];
    else if (argv[i] === '--run-id') args.runId = argv[++i];
  }
  return args;
}

await main();
