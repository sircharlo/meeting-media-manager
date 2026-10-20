/**
 * The small Crowdin API v2 client shared by scripts/cleanup-crowdin.mjs and
 * scripts/i18n-quality/apply-translation-quality-fixes.mjs: config from the
 * environment (falling back to crowdin.yml for the project id), one request
 * helper, and a paginated "list everything" helper.
 *
 * Environment: CROWDIN_PERSONAL_TOKEN (required), CROWDIN_PROJECT_ID
 * (optional, else crowdin.yml's project_id), CROWDIN_BASE_URL (optional).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_VERSION = '/api/v2';
const PAGE_SIZE = 500;

export async function crowdinRequest(
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
    const error = new Error(
      `Crowdin API ${method} ${path} -> ${response.status} ${response.statusText}${suffix}`,
    );
    // Keep the raw body so callers can inspect structured error payloads
    // (e.g. per-op indices in ErrorPatchCollectionResource).
    error.body = detail;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getConfig() {
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

export async function listAll(baseUrl, token, path) {
  const items = [];
  let offset = 0;

  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const pagePath = `${path}${separator}limit=${PAGE_SIZE}&offset=${offset}`;
    const page = await crowdinRequest(baseUrl, token, pagePath); // NOSONAR: sequential - paginated, stops at the last page
    const rows = page.data ?? [];
    for (const row of rows) {
      items.push(row.data);
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
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
