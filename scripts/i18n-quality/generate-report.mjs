#!/usr/bin/env node
/**
 * Renders validated/<lang>/<contentType>.json into a human-readable
 * Markdown report - the actual deliverable an admin reads to decide what
 * to approve. Deterministic, no LLM.
 *
 * Usage:
 *   node scripts/i18n-quality/generate-report.mjs --run-id <id> --language fr
 */
import fsx from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { pathExists, readdir, readJson, writeFile } = fsx;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');

function escapeCell(text) {
  return text.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

async function main() {
  const { language, runId } = parseArgs(process.argv.slice(2));
  if (!language || !runId) {
    console.error(
      'Usage: node generate-report.mjs --run-id <id> --language <code>',
    );
    process.exit(1);
  }

  const runDir = resolve(REPO_ROOT, 'reports/translation-quality', runId);
  const validatedDir = resolve(runDir, 'validated', language);
  if (!(await pathExists(validatedDir))) {
    console.error(`No validated/ directory found at ${validatedDir}`);
    process.exit(1);
  }

  const files = (await readdir(validatedDir)).filter((f) =>
    f.endsWith('.json'),
  );

  for (const file of files) {
    const contentType = file.replace(/\.json$/, '');
    const records = await readJson(resolve(validatedDir, file));

    const byCategory = {
      phrasing: records.filter((r) => r.category === 'phrasing').length,
      terminology: records.filter((r) => r.category === 'terminology').length,
    };

    const lines = [
      `# Proposed translation-quality changes: ${language} / ${contentType}`,
      '',
      `Run: \`${runId}\`. ${records.length} proposed change${records.length === 1 ? '' : 's'} ` +
        `(${byCategory.terminology} terminology, ${byCategory.phrasing} phrasing) survived the guardrail gate.`,
      '',
      'Nothing here has been applied to Crowdin. To approve entries, copy this ' +
        'run\'s validated JSON, mark the entries you want with `"status": "approved"`, ' +
        'and hand the file to `apply-translation-quality-fixes.mjs`.',
      '',
      '---',
      '',
    ];

    records.forEach((record, index) => {
      lines.push(renderRecord(record, index, language));
    });

    if (records.length === 0) {
      lines.push('_No changes proposed for this content type._', '');
    }

    const outPath = resolve(validatedDir, `${contentType}.md`);
    await writeFile(outPath, lines.join('\n'), 'utf-8');
    console.log(`Wrote ${outPath} (${records.length} entries)`);
  }
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

function renderRecord(record, index, language) {
  const lines = [
    `### ${index + 1}. \`${record.key}\` (${record.category}, confidence: ${record.confidence ?? 'unspecified'})`,
    '',
    `**Reason**: ${record.reason}`,
    '',
    '| | Text |',
    '| --- | --- |',
    `| English source | ${escapeCell(record.sourceEn)} |`,
    `| Current ${language} | ${escapeCell(record.currentTranslation)} |`,
    `| Proposed ${language} | ${escapeCell(record.proposedTranslation)} |`,
  ];
  if (record.glossaryRefs?.length > 0) {
    lines.push('', '**Glossary references**:');
    for (const ref of record.glossaryRefs) {
      lines.push(
        `- "${ref.termEn}" -> "${ref.official}"${ref.sourceUrl ? ` ([source](${ref.sourceUrl}))` : ''}`,
      );
    }
  }
  lines.push('', `_id: \`${record.id}\` | file: \`${record.filePath}\`_`, '');
  return lines.join('\n');
}

await main();
