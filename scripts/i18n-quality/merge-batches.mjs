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
  // Batch files are named without zero padding (batch-1 ... batch-10), so
  // sort numerically to keep batch-10 after batch-9.
  const files = (await readdir(proposedDir))
    .filter((f) => f.startsWith(batchPrefix) && f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const outPath = resolve(proposedDir, `${contentType}.json`);
  if (files.length === 0) {
    // Never overwrite an existing merged file with an empty list.
    if (await pathExists(outPath)) {
      console.log(
        `No batch files found matching ${batchPrefix}*.json; keeping existing ${outPath} as is`,
      );
    } else {
      console.warn(
        `No batch files found matching ${batchPrefix}*.json in ${proposedDir}`,
      );
    }
    return;
  }

  // Batch files are independent local reads; merging and logging still
  // happen in sorted file order.
  const batches = await Promise.all(
    files.map((file) => readJson(resolve(proposedDir, file))),
  );
  let merged = [];
  batches.forEach((batch, index) => {
    merged = merged.concat(batch);
    console.log(`  + ${files[index]} (${batch.length} records)`);
  });

  await writeFile(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  console.log(
    `\nMerged ${files.length} batch file(s), ${merged.length} total records -> ${outPath}`,
  );
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
