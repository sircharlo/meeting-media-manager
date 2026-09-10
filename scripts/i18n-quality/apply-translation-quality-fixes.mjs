#!/usr/bin/env node
/**
 * Phase B of the translation-quality pipeline: apply user-approved
 * proposed changes to Crowdin via its API. Dry-run by default, mirroring
 * scripts/cleanup-crowdin.mjs's conventions (same crowdinRequest/listAll/
 * patchTranslations shape, --apply to commit, non-zero exit when there is
 * pending work).
 *
 * This never reads a raw validated/*.json file directly - it takes a
 * *decisions* file: a copy of a validated/<lang>/<contentType>.json where
 * the entries the admin actually wants applied have `"status": "approved"`
 * added (everything else is left alone / status left as "validated" and
 * skipped).
 *
 * Two open items this script does NOT resolve on its own, because they need
 * one live API call against the real project to confirm rather than being
 * guessed at (see the plan this was built from):
 *   1. Whether Crowdin's JSON-source strings expose an `identifier` field
 *      equal to the JSON key. If yes, that's the reliable match. If not,
 *      this falls back to exact-text matching, which is only trusted when
 *      the match is unique - src/i18n/en.json has 5 confirmed duplicate
 *      values ("General", "Not playing", "Public talk", "Stop media",
 *      "Verses"), so a non-unique text match is always reported unresolved,
 *      never guessed.
 *   2. Posting the reviewed `reason` as a Crowdin string comment - not
 *      implemented (per explicit decision to keep review private for now;
 *      the feature exists in Crowdin but its exact REST schema was not
 *      confirmed live).
 *
 * Every run - dry or applied - prints the resolved language-id mapping and
 * resolved/unresolved/stale counts before doing anything else. A stale
 * decision (the live Crowdin translation no longer matches what was
 * recorded at review time - e.g. a translator or the hourly
 * crowdin-autorepair.yml job touched it since) is always skipped and
 * reported, never overwritten.
 *
 * Usage:
 *   node scripts/i18n-quality/apply-translation-quality-fixes.mjs <decisions-file> [<decisions-file> ...] [--apply]
 *
 * Environment: CROWDIN_PERSONAL_TOKEN, CROWDIN_PROJECT_ID (as
 * scripts/cleanup-crowdin.mjs).
 */
import fsx from 'fs-extra';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { pathExists, readJson } = fsx;

const API_VERSION = '/api/v2';
const PAGE_SIZE = 500;

// Same source-file -> Crowdin-source-path mapping as crowdin.yml, needed to
// resolve a contentType back to the Crowdin file that owns its strings.
const SOURCE_PATH_BY_CONTENT_TYPE = {
  'docs-locale': 'docs/locales/en.json',
  i18n: 'src/i18n/en.json',
};

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
    const error = new Error(
      `Crowdin API ${method} ${path} -> ${response.status} ${response.statusText}${detail ? `: ${detail.slice(0, 400)}` : ''}`,
    );
    error.body = detail;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
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
    for (const row of rows) items.push(row.data);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return items;
}

async function main() {
  const { apply, decisionFiles } = parseArgs(process.argv.slice(2));
  if (decisionFiles.length === 0) {
    console.error(
      'Usage: node apply-translation-quality-fixes.mjs <decisions-file> [...] [--apply]',
    );
    process.exit(1);
  }

  const { baseUrl, projectId, token } = getConfig();

  const allDecisions = [];
  for (const filePath of decisionFiles) {
    if (!(await pathExists(filePath))) {
      console.error(`Decisions file not found: ${filePath}`);
      process.exit(1);
    }
    const records = await readJson(filePath);
    for (const record of records) {
      if (record.status === 'approved') allDecisions.push(record);
    }
  }

  if (allDecisions.length === 0) {
    console.log(
      'No decisions marked "approved" in the given file(s). Nothing to do.',
    );
    return;
  }

  console.log(
    `[apply] ${allDecisions.length} approved decision(s) across ${decisionFiles.length} file(s)`,
  );

  const project = (
    await crowdinRequest(baseUrl, token, `/projects/${projectId}`)
  ).data;
  const targetLanguageIds = new Set(project.targetLanguageIds ?? []);
  console.log(
    `[apply] project target languages: ${[...targetLanguageIds].join(', ')}`,
  );

  const files = await listAll(baseUrl, token, `/projects/${projectId}/files`);
  const normalizedFiles = files.map((file) => ({
    ...file,
    normalizedPath: normalizePath(file.path ?? file.name ?? ''),
  }));

  const byContentType = new Map();
  for (const decision of allDecisions) {
    const list = byContentType.get(decision.contentType) ?? [];
    list.push(decision);
    byContentType.set(decision.contentType, list);
  }

  const resolved = [];
  const unresolved = [];
  const stale = [];

  for (const [contentType, decisions] of byContentType) {
    const sourcePath = SOURCE_PATH_BY_CONTENT_TYPE[contentType];
    if (!sourcePath) {
      console.warn(
        `[apply] unknown content type "${contentType}", skipping ${decisions.length} decision(s)`,
      );
      continue;
    }
    const file = normalizedFiles.find((f) =>
      f.normalizedPath.endsWith(sourcePath),
    );
    if (!file) {
      console.warn(
        `[apply] could not find Crowdin file for ${sourcePath}, skipping ${decisions.length} decision(s)`,
      );
      continue;
    }

    const fileStrings = await listAll(
      baseUrl,
      token,
      `/projects/${projectId}/strings?fileId=${file.id}`,
    );
    if (fileStrings[0] && fileStrings[0].identifier === undefined) {
      console.warn(
        `[apply] NOTE: strings for ${sourcePath} do not expose an "identifier" field - ` +
          'falling back to exact-text matching for all decisions in this content type.',
      );
    }

    const byLanguage = new Map();
    for (const decision of decisions) {
      if (!targetLanguageIds.has(decision.language)) {
        console.warn(
          `[apply] language "${decision.language}" is not in this project's targetLanguageIds - ` +
            `check whether Crowdin uses a different code for it (e.g. es-ES, zh-CN, pt-BR) before re-running.`,
        );
      }
      const list = byLanguage.get(decision.language) ?? [];
      list.push(decision);
      byLanguage.set(decision.language, list);
    }

    for (const [language, languageDecisions] of byLanguage) {
      const translations = await listAll(
        baseUrl,
        token,
        `/projects/${projectId}/languages/${encodeURIComponent(language)}/translations?fileId=${file.id}`,
      );
      const translationsByStringId = new Map(
        translations.map((t) => [t.stringId, t]),
      );

      for (const decision of languageDecisions) {
        const result = await resolveDecision(
          { baseUrl, projectId, token },
          decision,
          fileStrings,
          translationsByStringId,
        );
        if (result.status === 'resolved') resolved.push(result);
        else if (result.status === 'stale') stale.push(result);
        else unresolved.push(result);
      }
    }
  }

  console.log(
    `\n[apply] resolved: ${resolved.length}, unresolved: ${unresolved.length}, stale: ${stale.length}`,
  );

  for (const { decision, reason } of unresolved) {
    console.log(
      `  UNRESOLVED  ${decision.language}/${decision.contentType}/${decision.key}: ${reason}`,
    );
  }
  for (const { decision, liveText, reason } of stale) {
    console.log(
      `  STALE       ${decision.language}/${decision.contentType}/${decision.key}: ${reason}`,
    );
    console.log(
      `              recorded: ${JSON.stringify(decision.currentTranslation)}`,
    );
    console.log(`              live now: ${JSON.stringify(liveText)}`);
  }

  console.log(`\n${apply ? 'Applying' : 'Dry run (pass --apply to commit)'}:`);
  for (const { decision, matchedBy, translationId } of resolved) {
    console.log(
      `  [${matchedBy}] ${decision.language}/${decision.contentType}/${decision.key} (translationId ${translationId})`,
    );
    console.log(`    - ${JSON.stringify(decision.currentTranslation)}`);
    console.log(`    + ${JSON.stringify(decision.proposedTranslation)}`);
  }

  if (apply && resolved.length > 0) {
    const ops = resolved.map(({ decision, translationId }) => ({
      op: 'replace',
      path: `/${translationId}`,
      value: { text: decision.proposedTranslation },
    }));
    await crowdinRequest(
      baseUrl,
      token,
      `/projects/${projectId}/translations`,
      {
        body: ops,
        method: 'PATCH',
      },
    );
    console.log(`\n[apply] committed ${ops.length} translation(s) to Crowdin.`);
  }

  if (!apply && resolved.length > 0) {
    process.exit(1);
  }
}

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\/+/, '');
}

function parseArgs(argv) {
  const args = { apply: false, decisionFiles: [] };
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true;
    else args.decisionFiles.push(arg);
  }
  return args;
}

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

/**
 * Resolve each decision's Crowdin string+translation. Tries the `identifier`
 * field first (if the live project exposes one matching the JSON key);
 * falls back to a unique exact-text match. Never guesses on ambiguity.
 */
async function resolveDecision(
  ctx,
  decision,
  fileStrings,
  translationsByStringId,
) {
  const byIdentifier = fileStrings.find((s) => s.identifier === decision.key);
  let stringMatch = byIdentifier;
  let matchedBy = 'identifier';

  if (!stringMatch) {
    const textMatches = fileStrings.filter((s) => s.text === decision.sourceEn);
    if (textMatches.length === 1) {
      stringMatch = textMatches[0];
      matchedBy = 'unique-text';
    } else if (textMatches.length > 1) {
      return {
        decision,
        reason: `ambiguous: ${textMatches.length} source strings share this exact text`,
        status: 'unresolved',
      };
    }
  }

  if (!stringMatch) {
    return {
      decision,
      reason: 'no matching source string found',
      status: 'unresolved',
    };
  }

  const translation = translationsByStringId.get(stringMatch.id);
  if (!translation) {
    return {
      decision,
      reason: 'no existing translation found for this string/language',
      status: 'unresolved',
    };
  }

  if (translation.text !== decision.currentTranslation) {
    return {
      decision,
      liveText: translation.text,
      reason:
        'live Crowdin translation no longer matches the text this decision was reviewed against',
      status: 'stale',
    };
  }

  return {
    decision,
    matchedBy,
    status: 'resolved',
    translationId: translation.translationId,
  };
}

try {
  await main();
} catch (error) {
  console.error(`[apply] ${error.message}`);
  process.exitCode = 1;
}
