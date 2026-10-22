#!/usr/bin/env node
/**
 * Clean Crowdin corruption at the source, via the Crowdin API.
 *
 * The app's i18n JSON, docs markdown, and docs locale files go through
 * Crowdin, and translators editing strings in the Crowdin web editor keep
 * re-introducing the same six classes of corruption:
 *
 *   1. Mangling of vue-i18n linked-message syntax (`@:{'key'}`) - typographic
 *      quotes (`@:{‚key‘}`) or stray whitespace (`@: key`), which the message
 *      compiler rejects at runtime (Sentry MMM-V2-3H6).
 *   2. Docs heading anchors (`{#slug}`) drifting away from the English
 *      source, which breaks cross-language links and fails the VitePress
 *      build on duplicate explicit anchors. Crowdin splits most headings in
 *      two: the title and a hidden anchor-only `{#slug}` string. The
 *      export puts the source's space between them, so the anchor-only
 *      string's translation must be the bare anchor (a leading space
 *      doubles it), and the title's translation must not carry an anchor
 *      of its own (zh-CN's did, doubling the anchor itself).
 *   3. `link:` frontmatter values in each locale's docs index.md (the
 *      `hero.actions[].link` fields - Download/About/User Guide/Settings
 *      Guide/FAQ). These *are* real, individually addressable Crowdin
 *      strings (confirmed live via the API), but no language has ever had
 *      an actual translation set for them, so every export falls back to
 *      the literal English path (`/download` instead of `/fr/download`).
 *      A repo file can look correct by accident (someone ran
 *      docs/utils/fix-doc-markdown.mjs by hand once) right up until the
 *      next export touches that file and quietly resets it. This sweep
 *      sets the real, permanent fix: a Crowdin translation of
 *      `/${localeFolder}${englishPath}` for each active docs locale
 *      (src/constants/locales.ts's list, minus the orphaned bzs/cmn-hant/zh
 *      folders that the app no longer ships), creating the translation via
 *      POST when none exists yet and patching it via PATCH when a stale one
 *      does - and approving it, since the project exports approved
 *      translations only (an unapproved link, however correct, still
 *      exports as the English path). docs:lint still doesn't gate on this
 *      class (config.mts's transformPageData hook recomputes the link at
 *      build time regardless of frontmatter), but
 *      docs/utils/__tests__/locales.test.ts's "should have correct links"
 *      test reads the raw frontmatter directly and does fail on it - that's
 *      the CI check this class actually fixes.
 *   4. Release-notes version headers (`## v26.7.0` in release-notes/en.md).
 *      These must stay byte-identical to the source, but translators keep
 *      localizing them - French scrambles (`## 7.0 v26.0`), Spanish drops
 *      separators (`## v26 6.1`) or truncates (`## v26.6`), Finnish swaps in
 *      decimal commas (`## v26,3.0`). The app's About dialog skips any
 *      header that isn't a clean version, so those releases silently vanish
 *      from the "What's New" carousel. (The translated `## UPCOMING
 *      VERSION` heading is legitimate localization and is left alone.)
 *   5. i18n link/param targets in `src/i18n/*.json` translations, in three
 *      flavors, all invisible to the message compiler (which only checks
 *      syntax) but broken at runtime, where a missing linked key echoes as
 *      a raw `key` fragment:
 *      (a) Dangling `@:` targets from truncated autocompletions - Italian
 *          `@:official-of-jw` (for `official-website-of-jw`), `@:study-`
 *          and `@:studio` (for `study-bible`).
 *      (b) Case-mangled `@:` targets - Slovenian `@:oBS` (for `obsStudio`).
 *      (c) Localized `{param}` names - Estonian `{aasta}` (for `{year}`),
 *          which never interpolates because the app passes `{year}`.
 *      Repair is strictly one-to-one: a single dangling translation target
 *      is replaced with the single source key missing from the translation
 *      (same for params). Anything ambiguous is left for translators -
 *      notably deliberate rewordings that drop a link, and German/Dutch
 *      compounds (`@:obsWebSocket-Plugin`). The compounds cannot be fixed
 *      automatically: vue-i18n parses the whole `obsWebSocket-Plugin` token
 *      as one key (`readLinkedRefer` stops only at whitespace/`{@/()/`),
 *      so they echo raw at runtime, yet rewriting them would mangle the
 *      translators' grammar - they need human rewording instead.
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
 *   node scripts/cleanup-crowdin.mjs --help                               # show this help
 *
 * Automation: .github/workflows/crowdin-autorepair.yml runs this script with
 * --apply on a schedule (hourly) and on demand (workflow_dispatch, with an
 * optional --language). Note: a Crowdin webhook cannot drive it directly -
 * Crowdin's custom webhook payload only accepts its own event variables as
 * keys, so it cannot emit the event_type that GitHub's repository_dispatch
 * API requires (API error "Events [client_payload, event_type] don't exist").
 *
 * Config comes from env: CROWDIN_PERSONAL_TOKEN (required - needs the
 * project.translation and tm scopes at Read and Write level), CROWDIN_PROJECT_ID
 * (falls back to crowdin.yml), CROWDIN_BASE_URL (Enterprise only; defaults to
 * https://api.crowdin.com).
 *
 * Dry-run by default; exits 1 when fixes would be made but --apply was not
 * passed (so CI can use it as a check).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getTrailingHeadingAnchors,
  replaceHeadingAnchor,
} from '../docs/utils/heading-anchors.mjs';
import { compiles, fixLinkedMessageSyntax } from './fix-i18n-locales.mjs';
import { crowdinRequest, getConfig, listAll } from './lib/crowdin-api.mjs';

const I18N_SOURCE_PATH = 'src/i18n/en.json';
const DOCS_SOURCE_PREFIX = 'docs/src/en/';
const DOCS_SRC_DIR = 'docs/src';
const RELEASE_NOTES_SOURCE_PATH = 'release-notes/en.md';
const TYPOGRAPHIC_QUOTES = '‚‘’‛“”„‟';

// Matches a hero-action link string's Crowdin context, e.g.
// "CXPath: //yaml/hero/actions[0]/link" - identifies the 5 docs/src/en/
// index.md link: fields (Download/About/User Guide/Settings Guide/FAQ).
const HERO_ACTION_LINK_CONTEXT =
  /^CXPath: \/\/yaml\/hero\/actions\[\d+\]\/link$/;

// Matches a docs heading string's Crowdin context, e.g.
// "CXPath: //heading[23]/content" - shared by both halves of a heading that
// Crowdin splits into its title and a hidden anchor-only `{#slug}` string.
const HEADING_CONTENT_CONTEXT = /^CXPath: \/\/heading\[\d+\]\/content$/;

// docs/src folders that aren't part of the app's active language list
// (src/constants/locales.ts). Excluded so class 3 never guesses a folder
// name for a language Crowdin isn't actually exporting there. `bzs` still
// exists in the repo; `cmn-hant` and `zh` were leftovers from past
// language-code changes and have been deleted, but stay listed so a stray
// export recreating them is never picked up (`zh` would resolve to zh-CN
// and fight `cmn-hans` over the same translations).
const DOCS_ORPHAN_LOCALE_FOLDERS = new Set(['bzs', 'cmn-hant', 'zh']);

// A few docs locale folders don't match Crowdin's own language id even via
// twoLettersCode (mirrors apply-translation-quality-fixes.mjs's override of
// the same name, confirmed live against the project rather than guessed).
const DOCS_LANGUAGE_ID_OVERRIDES = { 'cmn-hans': 'zh-CN' };

// Matches a release-notes version header exactly as it appears in the source
// (`## v26.7.0`, including the legacy separator-less `## 25.6.0` form). The
// `(?!#)` keeps `### ...` subsection headers out.
const VERSION_HEADER_PATTERN = /^##(?!#)\s+v?\d+\.\d+\.\d+/;

function computeAnchorFix(
  enText,
  translationText,
  usedAnchors,
  isHeadingContent = false,
) {
  const { anchors, start } = getTrailingHeadingAnchors(enText);
  const expected = anchors.at(-1);
  if (!expected) {
    return isHeadingContent ? computeStrayAnchorFix(translationText) : null;
  }

  const seen = usedAnchors.get(expected) ?? 0;
  usedAnchors.set(expected, seen + 1);
  const anchor = seen === 0 ? expected : `${expected}-${seen + 1}`;

  // An anchor-only source is the hidden `{#slug}` half of a heading Crowdin
  // split in two: any text translated before the anchor would repeat the
  // title, which the other half already exports.
  const fixed =
    start === 0
      ? `{#${anchor}}`
      : replaceHeadingAnchor(translationText, anchor);
  return fixed === translationText ? null : { kind: 'anchor', text: fixed };
}

// Matches one vue-i18n linked construct and captures its key, covering the
// `@:key`, `@:{key}` and `@:{'key'}` spellings. Deliberately unicode-safe
// (`[\w-]` would stop at ü/ö/ä and slice German compounds in half).
const LINK_TARGET_RE = /@:\{?'?([^'}\s]+)'?\}?/g;
const PARAM_NAME_RE = /\{(\w+)\}/g;

/**
 * Repair dangling i18n link/param targets (class 5) by aligning them with
 * the English source. Only unambiguous one-to-one cases are repaired:
 * exactly one translation target that resolves nowhere, and exactly one
 * source key/param missing from the translation. Everything else is left
 * for translators:
 * - deliberate rewordings that drop a link (nothing dangling to repair),
 * - reordered `{params}` (set-equal, so nothing is missing),
 * - German/Dutch compounds (`@:obsWebSocket-Plugin`): the dangling token
 *   extends a source key with `-Suffix`, i.e. an intentional (if broken)
 *   grammatical construction that automation must not rewrite.
 * `validKeys` is the English key set (link targets must exist as keys);
 * params are code too, so they are matched against the source's own params.
 */
/**
 * The correct value for a docs hero-action `link:` field: the English
 * source path, prefixed with the target language's docs folder (e.g.
 * `/download` + `fr` -> `/fr/download`). `currentText` is `undefined` when
 * no translation exists yet at all (untranslated - the caller must POST a
 * new translation rather than PATCH one), which naturally differs from any
 * real `expected` string, so the "needs a fix" check works the same either
 * way; the caller decides create vs. patch based on whether a translation
 * object already existed.
 */
function computeDocsLinkFix(sourceText, currentText, localeFolder) {
  if (typeof sourceText !== 'string' || !sourceText.startsWith('/')) {
    return null;
  }
  const expected = `/${localeFolder}${sourceText}`;
  return currentText === expected ? null : expected;
}

function computeLinkTargetFix(source, translation, validKeys) {
  if (typeof source !== 'string' || typeof translation !== 'string') {
    return null;
  }
  if (translation === source) return null;

  let fixed = translation;

  const sourceLinks = linkTargetMatches(source).map((match) => match.key);
  const translationLinks = linkTargetMatches(fixed);
  const missingLinks = [
    ...new Set(
      sourceLinks.filter(
        (key) => !translationLinks.some((match) => match.key === key),
      ),
    ),
  ];
  const danglingLinks = translationLinks.filter(
    (match) => !validKeys.has(match.key),
  );
  const isCompound = danglingLinks.some((match) =>
    sourceLinks.some(
      (key) => match.key !== key && match.key.startsWith(`${key}-`),
    ),
  );
  if (!isCompound && danglingLinks.length === 1 && missingLinks.length === 1) {
    const match = danglingLinks[0];
    const correctKey = missingLinks[0];
    // vue-i18n's `@:key` grammar has no punctuation stop character (only
    // whitespace/{@/()/ ends a bare link target), so a *bare* key
    // immediately followed by punctuation with no space - e.g. Russian
    // "@:obsStudio," - genuinely parses with the punctuation attached,
    // making LINK_TARGET_RE capture it as part of `key` too. Naively
    // replacing that whole captured key with the correct one would delete
    // the punctuation outright (e.g. "@:obsStudio, которая" ->
    // "@:obsStudio которая", dropping a grammatically required comma). Only
    // for that bare-form case - not an already-braced `@:{cbsx}` style
    // corruption, where the braces already bound the key correctly and a
    // plain substring swap is the right fix - switch to the explicit braced
    // form (`@:{'key'}`), which unambiguously bounds the key and lets
    // vue-i18n parse the trailing punctuation as ordinary text instead.
    const wasBareForm = !match.full.includes('{');
    const trailingJunk =
      wasBareForm && match.key.startsWith(correctKey)
        ? match.key.slice(correctKey.length)
        : '';
    const replacement = trailingJunk
      ? `@:{'${correctKey}'}${trailingJunk}`
      : match.full.replace(match.key, correctKey);
    fixed =
      fixed.slice(0, match.index) +
      replacement +
      fixed.slice(match.index + match.full.length);
  }

  const sourceParams = paramNameMatches(source).map((match) => match.name);
  const translationParams = paramNameMatches(fixed);
  const missingParams = [
    ...new Set(
      sourceParams.filter(
        (name) => !translationParams.some((match) => match.name === name),
      ),
    ),
  ];
  const danglingParams = translationParams.filter(
    (match) => !sourceParams.includes(match.name),
  );
  if (danglingParams.length === 1 && missingParams.length === 1) {
    const match = danglingParams[0];
    fixed =
      fixed.slice(0, match.index) +
      `{${missingParams[0]}}` +
      fixed.slice(match.index + match.full.length);
  }

  return fixed === translation ? null : { kind: 'links', text: fixed };
}

/**
 * The title half of a heading Crowdin split from its hidden `{#slug}` string
 * has no anchor in the source, so an anchor in its translation doubles the
 * heading's anchor on export (zh-CN's `## 标题？ {#slug} {#slug}`). Returns the
 * translation without it, or null when there is none - or nothing but it,
 * which is left for translators.
 */
function computeStrayAnchorFix(translationText) {
  const { anchors, start } = getTrailingHeadingAnchors(translationText);
  if (anchors.length === 0) return null;
  const text = translationText.slice(0, start).trimEnd();
  return text ? { kind: 'anchor', text } : null;
}

/**
 * Release-notes version headers must stay byte-identical to the English
 * source - they are machine-read version tags, not prose. Returns a fix
 * resetting the translation to the source, or null when there is nothing to
 * repair (not a version-header string, already identical, or untranslated).
 * The translated `## UPCOMING VERSION` heading is legitimate localization
 * and never matches VERSION_HEADER_PATTERN, so it is left alone.
 */
function computeVersionHeaderFix(source, translation) {
  if (!VERSION_HEADER_PATTERN.test(source)) return null;
  if (typeof translation !== 'string' || translation.length === 0) return null;
  if (translation === source) return null;
  return { kind: 'version', text: source };
}

/**
 * collectReplaceOps fixer for class 2 (docs heading anchors). `usedAnchors`
 * carries the anchors already seen earlier in the same file;
 * `headingContentIds` are the file's heading strings (see
 * HEADING_CONTENT_CONTEXT).
 */
function docsAnchorFix(item, { headingContentIds, sources, usedAnchors }) {
  if (typeof item.text !== 'string') return null;
  const source = sources.get(item.stringId) ?? '';
  return computeAnchorFix(
    source,
    item.text,
    usedAnchors,
    headingContentIds.has(item.stringId),
  );
}

/**
 * Docs index.md - the only file with hero-action `link:` frontmatter, which
 * class 3 repairs directly via the API (see computeDocsLinkFix).
 */
function isDocsIndexFile(filePath) {
  return filePath.endsWith('/index.md');
}

/**
 * collectReplaceOps fixer for class 1 (linked-message syntax), limited to
 * the strings whose source uses `@:` links (`candidateIds`).
 */
function linkedSyntaxFix(item, candidateIds) {
  if (typeof item.text !== 'string' || !candidateIds.has(item.stringId)) {
    return null;
  }
  const fixed = repairLinkedMessage(item.text);
  return fixed ? { text: fixed } : null;
}

/**
 * collectReplaceOps fixer for class 5 (link/param targets), limited to the
 * strings whose source has links or params (`sources`).
 */
function linkTargetFix(item, sources, validKeys) {
  const source = sources.get(item.stringId);
  if (source === undefined || typeof item.text !== 'string') return null;
  return computeLinkTargetFix(source, item.text, validKeys);
}

function linkTargetMatches(text) {
  return [...text.matchAll(LINK_TARGET_RE)].map((match) => ({
    full: match[0],
    index: match.index ?? 0,
    key: match[1],
  }));
}

function paramNameMatches(text) {
  return [...text.matchAll(PARAM_NAME_RE)].map((match) => ({
    full: match[0],
    index: match.index ?? 0,
    name: match[1],
  }));
}

function repairLinkedMessage(translation) {
  if (!translation.includes('@:') || compiles(translation)) return null;
  const fixed = fixLinkedMessageSyntax(translation);
  return fixed !== translation && compiles(fixed) ? fixed : null;
}

/**
 * A docs locale folder's Crowdin language id. Most folders match a target
 * language id directly (`fr` -> `fr`) or via its twoLettersCode (`es` ->
 * `es-ES`, `pt` -> `pt-BR`); `cmn-hans` matches neither and needs the
 * explicit override (confirmed live: `zh-CN`'s own twoLettersCode is `zh`,
 * which matched the old, now-deleted `zh` folder, not `cmn-hans`).
 */
function resolveDocsLanguageId(
  folder,
  targetLanguageIds,
  languageIdByTwoLetters,
) {
  if (targetLanguageIds.has(folder)) return folder;
  if (
    DOCS_LANGUAGE_ID_OVERRIDES[folder] &&
    targetLanguageIds.has(DOCS_LANGUAGE_ID_OVERRIDES[folder])
  ) {
    return DOCS_LANGUAGE_ID_OVERRIDES[folder];
  }
  return languageIdByTwoLetters.get(folder) ?? null;
}

/**
 * collectReplaceOps fixer for class 4 (release-notes version headers),
 * limited to the version-header strings (`sources`).
 */
function versionHeaderFix(item, sources) {
  const source = sources.get(item.stringId);
  if (source === undefined) return null;
  return computeVersionHeaderFix(source, item.text);
}

const CORRUPTION_SIGNATURES = [
  // Typographic quotes inside @:{...} (e.g. @:{‚cbs‘}).
  new RegExp(String.raw`@:\{[^{}]*[${TYPOGRAPHIC_QUOTES}][^{}]*\}`),
  // Stray whitespace after @: (e.g. @: cbs), which is never valid.
  /@:[ \t]+(?=[\p{L}\p{N}_-])/u,
  // Doubled heading anchors left over from mangled {#a} {#a} runs.
  /\{#[\w-]+\}\s*\{#/,
  // Scrambled release-notes version headers (e.g. `7.0 v26.0` for `v26.7.0`).
  /^(?:##\s*)?\d+\.\d+\s+v\d+\.\d+\s*$/,
  // Localized separators in release-notes versions (`v26,3.0`, `v26 6.1`).
  // The optional separator owns its trailing digits so the two digit runs
  // can't overlap (and backtrack) when there is no separator.
  /^(?:##\s*)?v\d+[ ,]\d+(?:[,.]\d*)?\s*$/,
  // Truncated vue-i18n linked keys (`@:study- ` for `@:study-bible`): a link
  // token ending in a hyphen is never valid.
  /@:[^\s]*-(?=[\s.,;:!?]|$)/,
];

/**
 * Commits one language's class 2+3 repairs of a docs file: the edits, then
 * the new translations, then the approvals of the existing links and of the
 * links just created.
 */
async function applyDocsFixes(ctx, { approvals, creates, ops }, label) {
  if (ops.length > 0) {
    await patchTranslations(ctx, ops, label);
  }
  const createdIds =
    creates.length > 0 ? await createTranslations(ctx, creates, label) : [];
  const toApprove = [...approvals, ...createdIds];
  if (toApprove.length > 0) {
    await approveTranslations(ctx, toApprove, label);
  }
}

async function approveTranslations(ctx, translationIds, label) {
  // Like adding a translation, approving one has no batch endpoint (POST
  // /projects/{id}/approvals takes one translationId per call).
  const approvalsPath = `/projects/${ctx.projectId}/approvals`;
  for (const translationId of translationIds) {
    const options = { body: { translationId }, method: 'POST' };
    try {
      await crowdinRequest(ctx.baseUrl, ctx.token, approvalsPath, options); // NOSONAR: sequential - rate-limited API
    } catch (error) {
      ctx.failures.push(
        `${label} (approve translation ${translationId}): ${error.message}`,
      );
    }
  }
}

/**
 * Maps each of the project's target languages that has an active docs
 * locale folder (see loadActiveDocsLocales) to that folder.
 */
function buildDocsLocaleFolderMap(project) {
  const docsLocaleFolderByLanguage = new Map();
  const targetLanguageIdSet = new Set(project.targetLanguageIds ?? []);
  const languageIdByTwoLetters = new Map(
    (project.targetLanguages ?? []).map((lang) => [
      lang.twoLettersCode,
      lang.id,
    ]),
  );
  for (const folder of loadActiveDocsLocales()) {
    const languageId = resolveDocsLanguageId(
      folder,
      targetLanguageIdSet,
      languageIdByTwoLetters,
    );
    if (languageId) docsLocaleFolderByLanguage.set(languageId, folder);
  }
  return docsLocaleFolderByLanguage;
}

/**
 * Class 3 for one language of a docs file: every hero-action `link:` string
 * whose translation isn't the localized path (see computeDocsLinkFix) becomes
 * a `replace` op on the stale translation, or a create when there is no
 * translation yet. The project exports approved translations only, so an
 * existing link missing from `approvedIds` is approved too, even when its
 * text is right (it would export as the English path), and a created one is
 * approved once it exists (see repairDocsFile). Only runs for languages that
 * resolved to an active docs locale folder (see
 * loadActiveDocsLocales/resolveDocsLanguageId) - anything else (an orphaned
 * or docs-less target language) is left alone.
 */
function collectHeroLinkFixes(
  ctx,
  translations,
  { approvedIds, file, heroLinkStrings, language, localeFolder, sources },
) {
  const approvals = [];
  const ops = [];
  const creates = [];
  if (!localeFolder) return { approvals, creates, ops };

  const translationByStringId = new Map(
    translations.map((t) => [t.stringId, t]),
  );
  for (const heroString of heroLinkStrings) {
    const sourceText = sources.get(heroString.id);
    const existing = translationByStringId.get(heroString.id);
    const label = `${file.normalizedPath} (${language}, string ${heroString.id})`;
    const localizedPath = computeDocsLinkFix(
      sourceText,
      undefined,
      localeFolder,
    );
    if (localizedPath && existing && !approvedIds.has(existing.translationId)) {
      ctx.totals.docsLinkApprovals += 1;
      if (ctx.verbose) ctx.log(`[docs-link] ${label}: approve`);
      approvals.push(existing.translationId);
    }

    const fix = computeDocsLinkFix(sourceText, existing?.text, localeFolder);
    if (fix === null) continue;

    ctx.totals.docsLinks += 1;
    if (ctx.verbose) {
      ctx.log(
        `[docs-link] ${label}: ${JSON.stringify(existing?.text ?? '(untranslated)')} -> ${JSON.stringify(fix)}`,
      );
    }
    if (existing) {
      ops.push({
        op: 'replace',
        path: `/${existing.translationId}`,
        value: { text: fix },
      });
    } else {
      ctx.totals.docsLinkApprovals += 1;
      creates.push({
        languageId: language,
        stringId: heroString.id,
        text: fix,
      });
    }
  }
  return { approvals, creates, ops };
}

/**
 * One language's pass of a per-translation repair (classes 1, 2, 4 and 5):
 * `computeFix(item)` returns a `{ text }` fix for one translation of `file`
 * (or a falsy value when there is nothing to repair); each fix is counted in
 * `ctx.totals[totalsKey]`, logged as `[tag] ...` with --verbose, and turned
 * into a batch-PATCH `replace` op.
 */
function collectReplaceOps(
  ctx,
  translations,
  { computeFix, file, language, tag, totalsKey },
) {
  const ops = [];
  for (const item of translations) {
    const fix = computeFix(item);
    if (!fix) continue;

    ctx.totals[totalsKey] += 1;
    const label = `${file.normalizedPath} (${language}, string ${item.stringId})`;
    if (ctx.verbose) {
      ctx.log(
        `[${tag}] ${label}: ${JSON.stringify(item.text)} -> ${JSON.stringify(fix.text)}`,
      );
    }
    ops.push({
      op: 'replace',
      path: `/${item.translationId}`,
      value: { text: fix.text },
    });
  }
  return ops;
}

/**
 * Adds `creates` and returns the new translations' ids (only the ones that
 * were actually created).
 */
async function createTranslations(ctx, creates, label) {
  // Unlike editing, adding a brand-new translation has no batch endpoint
  // (POST /projects/{id}/translations takes one {stringId, languageId,
  // text} object per call) - so these go one at a time, same failure
  // handling as patchTranslations' per-op retry path.
  const translationsPath = `/projects/${ctx.projectId}/translations`;
  const addTranslation = (body) =>
    crowdinRequest(ctx.baseUrl, ctx.token, translationsPath, {
      body,
      method: 'POST',
    });
  const createdIds = [];
  for (const create of creates) {
    try {
      const response = await addTranslation(create); // NOSONAR: sequential - rate-limited API
      createdIds.push(response.data.id);
    } catch (error) {
      ctx.failures.push(
        `${label} (string ${create.stringId}): ${error.message}`,
      );
    }
  }
  return createdIds;
}

async function deleteTmSegment(ctx, tmId, segmentId, label) {
  try {
    await crowdinRequest(
      ctx.baseUrl,
      ctx.token,
      `/tms/${toCrowdinId(tmId)}/segments/${toCrowdinId(segmentId)}`,
      { method: 'DELETE' },
    );
  } catch (error) {
    ctx.failures.push(`${label}: ${error.message}`);
  }
}

function getFailedPatchIndices(body) {
  // Parse the ErrorPatchCollectionResource body from a failed batch PATCH
  // ({errors: [{index, errors}]}) and return the indices of the ops that
  // failed. Returns null when the body isn't that shape (e.g. a 403 scope
  // error or a plain validation error), in which case the whole batch failed.
  if (typeof body !== 'string' || body.length === 0) return null;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  const errors = parsed?.errors;
  if (!Array.isArray(errors)) return null;

  const indices = errors
    .map((entry) => entry?.index)
    .filter((index) => typeof index === 'number');
  return indices.length > 0 ? indices : null;
}

function isCorruptedSegment(text) {
  return CORRUPTION_SIGNATURES.some((signature) => signature.test(text));
}

/**
 * The ids of one language's approved translations in a file - the only ones
 * the project exports.
 */
async function listApprovedTranslationIds(ctx, language, fileId) {
  const approvals = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/approvals?fileId=${fileId}&languageId=${encodeURIComponent(language)}`,
  );
  return new Set(approvals.map((approval) => approval.translationId));
}

function listFileTranslations(ctx, language, fileId) {
  return listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/languages/${encodeURIComponent(language)}/translations?fileId=${fileId}`,
  );
}

/**
 * The docs locale folders class 3 should manage: every docs/src/<folder>
 * directory except the English source and the app's non-locale folders,
 * minus the orphaned bzs/cmn-hant/zh folders (see
 * DOCS_ORPHAN_LOCALE_FOLDERS). Read from the repo checkout - same source of
 * truth docs/utils/__tests__/locales.test.ts uses - rather than Crowdin's
 * full target-language list, which still includes languages the app no
 * longer ships docs for.
 */
function loadActiveDocsLocales() {
  let entries;
  try {
    entries = readdirSync(resolve(process.cwd(), DOCS_SRC_DIR), {
      withFileTypes: true,
    });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        name !== 'en' &&
        name !== 'assets' &&
        name !== 'public' &&
        !DOCS_ORPHAN_LOCALE_FOLDERS.has(name),
    );
}

/**
 * English key set for validating `@:` link targets. Read from the repo
 * checkout rather than the Crowdin API so the repair never depends on how
 * Crowdin names string identifiers - link targets must exist as keys in
 * `src/i18n/en.json`, full stop.
 */
function loadEnKeys() {
  try {
    const content = readFileSync(
      resolve(process.cwd(), I18N_SOURCE_PATH),
      'utf-8',
    );
    return new Set(Object.keys(JSON.parse(content)));
  } catch {
    return new Set();
  }
}

function logUnmatchedPaths(ctx, files, max = 15) {
  ctx.log(`[crowdin] DEBUG: sample of ${files.length} file paths in project:`);
  for (const file of files.slice(0, max)) {
    const label = file.normalizedPath || file.name || `id ${file.id}`;
    ctx.log(`  ${label}`);
  }
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

async function patchTranslations(ctx, ops, label) {
  // Editing translation text is a JSON Patch on the batch endpoint
  // (PATCH /projects/{id}/translations) - the per-id PUT is "Restore
  // Translation" and takes no body. Ops are full RFC 6902 operations
  // ({op, path, value}) so a batch can mix 'replace' and 'add'. A batch can
  // partially fail: the 400 body is an ErrorPatchCollectionResource listing
  // the indices that failed, so retry those one-by-one instead of dropping
  // the whole file's fixes.
  try {
    await crowdinRequest(
      ctx.baseUrl,
      ctx.token,
      `/projects/${ctx.projectId}/translations`,
      { body: ops, method: 'PATCH' },
    );
    return;
  } catch (error) {
    const failedIndices = getFailedPatchIndices(error.body);
    if (failedIndices === null) {
      // Not a per-op failure (scope error, rate limit, etc.) - whole batch
      // failed.
      ctx.failures.push(`${label}: ${error.message}`);
      return;
    }
    if (ctx.verbose) {
      ctx.log(
        `[patch] ${label}: batch failed for ${failedIndices.length} of ${ops.length} op(s) - retrying individually`,
      );
    }
    const translationsPath = `/projects/${ctx.projectId}/translations`;
    for (const index of failedIndices) {
      const op = ops[index];
      if (!op) continue;
      const options = { body: [op], method: 'PATCH' };
      try {
        await crowdinRequest(ctx.baseUrl, ctx.token, translationsPath, options); // NOSONAR: sequential - rate-limited API
      } catch (opError) {
        ctx.failures.push(`${label} (op ${index}): ${opError.message}`);
      }
    }
  }
}

function printHelp() {
  console.log(`Clean Crowdin corruption at the source, via the Crowdin API.

Repairs the six recurring classes of Crowdin corruption in the stored
translations (and purges the corrupted translation-memory segments), so
future Crowdin PRs come out clean:

  1. vue-i18n linked-message syntax (@:{'key'}) mangled by typographic
     quotes or stray whitespace - in src/i18n/*.json translations.
  2. Docs heading anchors ({#slug}) drifted away from the English source,
     including a space before a hidden anchor-only string's {#slug} and an
     anchor added to a heading title's translation (both double up on
     export).
  3. Docs hero-action link: frontmatter (docs/src/en/index.md's Download/
     About/User Guide/Settings Guide/FAQ buttons) - these are real Crowdin
     strings that no language has ever had an actual translation for, so
     every export falls back to the literal English path. Sets the real
     /{locale}/{slug} translation for each active docs locale, creating it
     when missing and patching it when stale, and approves it (only
     approved translations are exported).
  4. Release-notes version headers (## v26.7.0) localized by translators
     (scrambled, truncated, or re-punctuated) - reset to the English source
     so the About dialog's "What's New" carousel keeps those releases.
  5. i18n link/param targets in src/i18n/*.json translations: dangling
     @:keys (truncated autocompletions), case-mangled @:keys, and
     localized {params} - each reset to the English source key/param when
     the mapping is unambiguous (one dangling target, one missing source
     key). Deliberate rewordings and German/Dutch compounds are left for
     translators.

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
  CROWDIN_PERSONAL_TOKEN  API token (required). Must have the project.translation
                         and tm scopes set to Read and Write (create at
                         https://crowdin.com/settings#api, pick scopes there).
  CROWDIN_PROJECT_ID      Project id (falls back to project_id in crowdin.yml).
  CROWDIN_BASE_URL        API base URL (Enterprise only).
`);
}

async function purgeCorruptedTmSegments(ctx) {
  let tmId = ctx.defaultTmId;

  if (!tmId) {
    // TMs are global resources, not project-scoped (that's why the
    // project-scoped path 404s).
    const tms = await listAll(ctx.baseUrl, ctx.token, `/tms`);
    if (tms.length === 0) {
      ctx.log('[tm] no translation memory found; skipping segment purge');
      return;
    }
    tmId = tms[0].id;
  }

  const segments = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/tms/${toCrowdinId(tmId)}/segments`,
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
      await deleteTmSegment(ctx, tmId, segment.id, `tm segment ${segment.id}`); // NOSONAR: sequential - rate-limited API
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

  const headingContentIds = new Set(
    strings
      .filter((string) => HEADING_CONTENT_CONTEXT.test(string.context ?? ''))
      .map((string) => string.id),
  );

  // Class 3: docs hero-action link: frontmatter (see computeDocsLinkFix).
  const heroLinkStrings = isDocsIndexFile(file.normalizedPath)
    ? strings.filter((string) =>
        HERO_ACTION_LINK_CONTEXT.test(string.context ?? ''),
      )
    : [];

  for (const language of ctx.languages) {
    const localeFolder = ctx.docsLocaleFolderByLanguage.get(language);
    const translations = await listFileTranslations(ctx, language, file.id); // NOSONAR: sequential - rate-limited API
    // A language with no translations at all in this file still needs class
    // 3 (every hero link is untranslated, which is exactly what needs
    // fixing), so only skip outright when there's neither an existing
    // translation to check for class 2 nor a locale folder to fix class 3
    // against.
    if (translations.length === 0 && !localeFolder) continue;

    // File order matters for duplicate-anchor suffixing, so sort translations
    // back into the order the strings appear in the file.
    translations.sort(
      (a, b) =>
        (stringOrder.get(a.stringId) ?? -1) -
        (stringOrder.get(b.stringId) ?? -1),
    );

    // Class 2: heading anchors.
    const usedAnchors = new Map();
    const anchorOps = collectReplaceOps(ctx, translations, {
      computeFix: (item) =>
        docsAnchorFix(item, { headingContentIds, sources, usedAnchors }),
      file,
      language,
      tag: 'anchor',
      totalsKey: 'anchors',
    });

    // Class 3: docs hero-action link: frontmatter.
    const approvedIds =
      heroLinkStrings.length > 0 && localeFolder
        ? await listApprovedTranslationIds(ctx, language, file.id) // NOSONAR: sequential - rate-limited API
        : new Set();
    const heroLinkFixes = collectHeroLinkFixes(ctx, translations, {
      approvedIds,
      file,
      heroLinkStrings,
      language,
      localeFolder,
      sources,
    });

    if (ctx.apply) {
      const fixes = {
        ...heroLinkFixes,
        ops: [...anchorOps, ...heroLinkFixes.ops],
      };
      const label = `${file.normalizedPath} (${language})`;
      await applyDocsFixes(ctx, fixes, label); // NOSONAR: sequential - rate-limited API
    }
  }
}

/**
 * Classes 2+3 (heading anchors + hero-action link: frontmatter), one docs
 * source file at a time.
 */
async function repairDocsFiles(ctx, normalizedFiles) {
  const docsFiles = normalizedFiles.filter(
    (file) =>
      file.normalizedPath.includes(DOCS_SOURCE_PREFIX) &&
      file.normalizedPath.endsWith('.md'),
  );
  if (docsFiles.length > 0) {
    ctx.log(
      `[crowdin] classes 2+3: heading anchors + hero-action link: frontmatter (${docsFiles.length} files, ${ctx.docsLocaleFolderByLanguage.size} active docs locales)`,
    );
    for (const file of docsFiles) {
      await repairDocsFile(ctx, file); // NOSONAR: sequential - rate-limited API
    }
  } else {
    ctx.log(
      `[crowdin] WARN: no ${DOCS_SOURCE_PREFIX}**/*.md files found; skipping classes 2+3`,
    );
    logUnmatchedPaths(ctx, normalizedFiles, 15);
  }
}

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
    const translations = await listFileTranslations(ctx, language, file.id); // NOSONAR: sequential - rate-limited API

    const ops = collectReplaceOps(ctx, translations, {
      computeFix: (item) => linkedSyntaxFix(item, candidateIds),
      file,
      language,
      tag: 'linked',
      totalsKey: 'linked',
    });
    if (ctx.apply && ops.length > 0) {
      await patchTranslations(ctx, ops, `${file.normalizedPath} (${language})`); // NOSONAR: sequential - rate-limited API
    }
  }
}

async function repairI18nLinkTargets(ctx, file) {
  if (ctx.enKeys.size === 0) {
    ctx.log(
      `[crowdin] WARN: could not load English keys from ${I18N_SOURCE_PATH}; skipping class 5`,
    );
    return;
  }

  const strings = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/strings?fileId=${file.id}`,
  );
  const sources = new Map(
    strings
      .filter(
        (string) =>
          typeof string.text === 'string' &&
          (string.text.includes('@:') || /\{\w+\}/.test(string.text)),
      )
      .map((string) => [string.id, string.text]),
  );
  if (sources.size === 0) return;

  for (const language of ctx.languages) {
    const translations = await listFileTranslations(ctx, language, file.id); // NOSONAR: sequential - rate-limited API

    const ops = collectReplaceOps(ctx, translations, {
      computeFix: (item) => linkTargetFix(item, sources, ctx.enKeys),
      file,
      language,
      tag: 'links',
      totalsKey: 'links',
    });
    if (ctx.apply && ops.length > 0) {
      await patchTranslations(ctx, ops, `${file.normalizedPath} (${language})`); // NOSONAR: sequential - rate-limited API
    }
  }
}

async function repairReleaseNotesVersions(ctx, file) {
  const strings = await listAll(
    ctx.baseUrl,
    ctx.token,
    `/projects/${ctx.projectId}/strings?fileId=${file.id}`,
  );
  const sources = new Map(
    strings
      .filter(
        (string) =>
          typeof string.text === 'string' &&
          VERSION_HEADER_PATTERN.test(string.text),
      )
      .map((string) => [string.id, string.text]),
  );
  if (sources.size === 0) return;

  for (const language of ctx.languages) {
    const translations = await listFileTranslations(ctx, language, file.id); // NOSONAR: sequential - rate-limited API

    const ops = collectReplaceOps(ctx, translations, {
      computeFix: (item) => versionHeaderFix(item, sources),
      file,
      language,
      tag: 'version',
      totalsKey: 'versions',
    });
    if (ctx.apply && ops.length > 0) {
      await patchTranslations(ctx, ops, `${file.normalizedPath} (${language})`); // NOSONAR: sequential - rate-limited API
    }
  }
}

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
    docsLocaleFolderByLanguage: new Map(),
    enKeys: loadEnKeys(),
    failures: [],
    languages: [],
    log: (message) => console.log(toSingleLine(message)), // NOSONAR: line breaks stripped by toSingleLine
    projectId,
    token,
    totals: {
      anchors: 0,
      docsLinkApprovals: 0,
      docsLinks: 0,
      linked: 0,
      links: 0,
      segments: 0,
      versions: 0,
    },
    verbose: args.verbose,
  };

  const project = (
    await crowdinRequest(baseUrl, token, `/projects/${projectId}`)
  ).data;
  ctx.defaultTmId = project.defaultTmId;
  ctx.languages = (project.targetLanguageIds ?? []).filter(
    (language) => args.languages.size === 0 || args.languages.has(language),
  );

  // Class 3's language -> docs-folder mapping (e.g. `es-ES` -> `es`,
  // `zh-CN` -> `cmn-hans`), scoped to the app's active docs locales only.
  ctx.docsLocaleFolderByLanguage = buildDocsLocaleFolderMap(project);

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
  await runRepairPasses(ctx, normalizedFiles);

  ctx.log('[crowdin] class 6: purging corrupted translation-memory segments');
  try {
    await purgeCorruptedTmSegments(ctx);
  } catch (error) {
    ctx.failures.push(`translation-memory purge: ${error.message}`);
  }

  const {
    anchors,
    docsLinkApprovals,
    docsLinks,
    linked,
    links,
    segments,
    versions,
  } = ctx.totals;
  const total =
    anchors +
    docsLinkApprovals +
    docsLinks +
    linked +
    links +
    segments +
    versions;
  ctx.log('');
  ctx.log(
    `Done. ${ctx.apply ? 'Applied' : 'Found (dry run - rerun with --apply to commit)'}:`,
  );
  ctx.log(`  linked-syntax repairs:   ${linked}`);
  ctx.log(`  heading-anchor fixes:    ${anchors}`);
  ctx.log(`  docs link: fixes:        ${docsLinks}`);
  ctx.log(`  docs link: approvals:    ${docsLinkApprovals}`);
  ctx.log(`  version-header repairs:  ${versions}`);
  ctx.log(`  link/param target fixes: ${links}`);
  ctx.log(`  corrupted TM segments:   ${segments}`);

  if (ctx.failures.length > 0) {
    ctx.log('');
    ctx.log(`${ctx.failures.length} failure(s):`);
    for (const failure of ctx.failures) {
      ctx.log(`  ${failure}`);
    }
  }

  if (!ctx.apply && total > 0) {
    ctx.log('');
    ctx.log('Changes pending - pass --apply to commit them to Crowdin.');
    return 1;
  }
  return ctx.failures.length > 0 ? 1 : 0;
}

/**
 * Classes 1-5, in order: the repairs of the stored translations of the
 * project's source files (class 6 purges translation memory instead - see
 * run).
 */
async function runRepairPasses(ctx, normalizedFiles) {
  const i18nFile = normalizedFiles.find((file) =>
    file.normalizedPath.endsWith(I18N_SOURCE_PATH),
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
    logUnmatchedPaths(ctx, normalizedFiles, 15);
  }

  await repairDocsFiles(ctx, normalizedFiles);

  const releaseNotesFile = normalizedFiles.find((file) =>
    file.normalizedPath.endsWith(RELEASE_NOTES_SOURCE_PATH),
  );
  if (releaseNotesFile) {
    ctx.log(
      `[crowdin] class 4: release-notes version headers in ${releaseNotesFile.normalizedPath}`,
    );
    await repairReleaseNotesVersions(ctx, releaseNotesFile);
  } else {
    ctx.log(
      `[crowdin] WARN: source file ${RELEASE_NOTES_SOURCE_PATH} not found in project; skipping class 4`,
    );
    logUnmatchedPaths(ctx, normalizedFiles, 15);
  }

  ctx.log('[crowdin] class 5: i18n link/param targets');
  if (i18nFile) {
    await repairI18nLinkTargets(ctx, i18nFile);
  } else {
    ctx.log(
      `[crowdin] WARN: source file ${I18N_SOURCE_PATH} not found in project; skipping class 5`,
    );
  }
}

function runSelfTest() {
  const refusesCrowdinId = (value) => {
    try {
      toCrowdinId(value);
      return false;
    } catch {
      return true;
    }
  };
  // Class 3 for French, with one hero link (string 1, source `/faq`).
  const heroLinkFixes = (translations, approvedIds = new Set()) =>
    collectHeroLinkFixes(
      { totals: { docsLinkApprovals: 0, docsLinks: 0 }, verbose: false },
      translations,
      {
        approvedIds,
        file: { normalizedPath: 'master/docs/src/en/index.md' },
        heroLinkStrings: [{ id: 1 }],
        language: 'fr',
        localeFolder: 'fr',
        sources: new Map([[1, '/faq']]),
      },
    );

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
    [
      'anchor-only translation loses its leading space',
      computeAnchorFix('{#media-download}', ' {#media-download}', new Map()),
      { kind: 'anchor', text: '{#media-download}' },
    ],
    [
      'anchor-only translation drops a repeated title',
      computeAnchorFix(
        '{#why-choose-m3}',
        '为什么选择M3？ {#why-choose-m3}',
        new Map(),
      ),
      { kind: 'anchor', text: '{#why-choose-m3}' },
    ],
    [
      'bare anchor-only translation left alone',
      computeAnchorFix('{#x}', '{#x}', new Map()),
      null,
    ],
    [
      'anchor stripped from a heading title translation',
      computeAnchorFix(
        'Why choose M³?',
        '为什么选择 M³？ {#why-choose-m3}',
        new Map(),
        true,
      ),
      { kind: 'anchor', text: '为什么选择 M³？' },
    ],
    [
      'heading title translation without anchor left alone',
      computeAnchorFix('Why choose M³?', '为什么选择 M³？', new Map(), true),
      null,
    ],
    [
      'anchor-only heading title translation left for translators',
      computeAnchorFix('Why choose M³?', '{#why-choose-m3}', new Map(), true),
      null,
    ],
    [
      'anchor in a non-heading translation left alone',
      computeAnchorFix('Why choose M³?', 'Pourquoi ? {#x}', new Map()),
      null,
    ],

    // Docs index.md detection drives the class-3 hero-link repair.
    [
      'docs index detected',
      isDocsIndexFile('master/docs/src/en/index.md'),
      true,
    ],
    [
      'non-index docs file ignored',
      isDocsIndexFile('master/docs/src/en/faq.md'),
      false,
    ],
    [
      'non-docs path ignored',
      isDocsIndexFile('master/src/i18n/en.json'),
      false,
    ],

    // Docs hero-action link: frontmatter (class 3).
    [
      'docs link untranslated gets locale prefix',
      computeDocsLinkFix('/download', undefined, 'es'),
      '/es/download',
    ],
    [
      'docs link stale prefix corrected',
      computeDocsLinkFix('/about', '/about', 'fr'),
      '/fr/about',
    ],
    [
      'docs link already correct left alone',
      computeDocsLinkFix('/faq', '/de/faq', 'de'),
      null,
    ],
    [
      'docs link non-path source ignored',
      computeDocsLinkFix('Download', undefined, 'es'),
      null,
    ],
    [
      'docs link correct but unapproved gets approved',
      heroLinkFixes([{ stringId: 1, text: '/fr/faq', translationId: 10 }]),
      { approvals: [10], creates: [], ops: [] },
    ],
    [
      'docs link correct and approved left alone',
      heroLinkFixes(
        [{ stringId: 1, text: '/fr/faq', translationId: 10 }],
        new Set([10]),
      ),
      { approvals: [], creates: [], ops: [] },
    ],
    [
      'docs link stale and unapproved gets patched and approved',
      heroLinkFixes([{ stringId: 1, text: '/faq', translationId: 10 }]),
      {
        approvals: [10],
        creates: [],
        ops: [{ op: 'replace', path: '/10', value: { text: '/fr/faq' } }],
      },
    ],
    [
      'docs link untranslated gets created (approved once it exists)',
      heroLinkFixes([]),
      {
        approvals: [],
        creates: [{ languageId: 'fr', stringId: 1, text: '/fr/faq' }],
        ops: [],
      },
    ],

    // Docs locale folder -> Crowdin language id resolution (class 3).
    [
      'docs language id direct match',
      resolveDocsLanguageId('fr', new Set(['de', 'fr']), new Map()),
      'fr',
    ],
    [
      'docs language id via twoLettersCode',
      resolveDocsLanguageId(
        'es',
        new Set(['es-ES']),
        new Map([['es', 'es-ES']]),
      ),
      'es-ES',
    ],
    [
      'docs language id via explicit override',
      resolveDocsLanguageId(
        'cmn-hans',
        new Set(['zh-CN']),
        new Map([['zh', 'zh-CN']]),
      ),
      'zh-CN',
    ],
    [
      'docs language id unresolvable returns null',
      resolveDocsLanguageId('xx', new Set(['fr']), new Map()),
      null,
    ],

    // TM segment corruption signatures.
    ['tm typographic quotes', isCorruptedSegment('Viide @:{‚cbs‘}'), true],
    ['tm stray whitespace', isCorruptedSegment('... @: cbs ajal'), true],
    ['tm doubled anchor', isCorruptedSegment('## Foo {#foo} {#foo}'), true],
    ['tm clean segment', isCorruptedSegment("Viide @:{'cbs'} juurde"), false],
    [
      'tm truncated link target',
      isCorruptedSegment('Aggiungi media dalla Bibbia @:study- alla lista'),
      true,
    ],
    [
      'tm compound link left alone',
      isCorruptedSegment('Konfiguriere das @:obsWebSocket-Plugin in OBS.'),
      false,
    ],
    ['tm scrambled version header', isCorruptedSegment('## 7.0 v26.0'), true],
    ['tm localized version separators', isCorruptedSegment('## v26,3.0'), true],
    ['tm space-separated version', isCorruptedSegment('## v26 6.1'), true],
    ['tm separator-less version tail', isCorruptedSegment('v26 61 '), true],
    ['tm trailing-comma version', isCorruptedSegment('v26,3,'), true],
    [
      'tm version followed by text left alone',
      isCorruptedSegment('## v26 6.1 notes'),
      false,
    ],
    [
      'tm clean version header left alone',
      isCorruptedSegment('## v26.7.0'),
      false,
    ],

    // Release-notes version headers (real samples from fr/es/fi exports).
    [
      'version scrambled french header reset to source',
      computeVersionHeaderFix('## v26.7.0', '## 7.0 v26.0'),
      { kind: 'version', text: '## v26.7.0' },
    ],
    [
      'version localized separators reset to source',
      computeVersionHeaderFix('## v26.3.0', '## v26,3.0'),
      { kind: 'version', text: '## v26.3.0' },
    ],
    [
      'version truncated spanish header reset to source',
      computeVersionHeaderFix('## v26.6.0', '## v26.6'),
      { kind: 'version', text: '## v26.6.0' },
    ],
    [
      'version identical translation left alone',
      computeVersionHeaderFix('## v26.7.0', '## v26.7.0'),
      null,
    ],
    [
      'version untranslated string left alone',
      computeVersionHeaderFix('## v26.7.0', ''),
      null,
    ],
    [
      'version upcoming heading is translatable',
      computeVersionHeaderFix('## UPCOMING VERSION', '## VERSION À VENIR'),
      null,
    ],
    [
      'version subsection header ignored',
      computeVersionHeaderFix(
        '### ✨ New Features',
        '### ✨ Nouvelles fonctionnalités',
      ),
      null,
    ],

    // i18n link/param targets (real samples from the it/sl/et exports).
    // Valid keys mirror src/i18n/en.json for these samples.
    ...(() => {
      const keys = new Set([
        'cbs',
        'obsStudio',
        'obsWebSocket',
        'official-website-of-jw',
        'study-bible',
      ]);
      const linkCases = [
        [
          'link truncated autocompletion expanded',
          computeLinkTargetFix(
            'Add one of the videos from the @:official-website-of-jw to the media list.',
            'Aggiungi uno dei video dal sito web @:official-of-jw alla lista.',
            keys,
          ),
          {
            kind: 'links',
            text: 'Aggiungi uno dei video dal sito web @:official-website-of-jw alla lista.',
          },
        ],
        [
          'link trailing-hyphen truncation expanded',
          computeLinkTargetFix(
            'Add media from the @:study-bible',
            'Aggiungi media dalla Bibbia @:study-',
            keys,
          ),
          {
            kind: 'links',
            text: 'Aggiungi media dalla Bibbia @:study-bible',
          },
        ],
        [
          'link case-mangled key restored',
          computeLinkTargetFix(
            '@:obsStudio is a free app used to manage feeds in many Kingdom Halls.',
            '@:oBS Studio je brezplačen program.',
            keys,
          ),
          {
            kind: 'links',
            text: '@:obsStudio Studio je brezplačen program.',
          },
        ],
        [
          'link braced key preserved through replacement',
          computeLinkTargetFix(
            "If entered, M³ will skip media for the @:{'cbs'}.",
            'Če vnešeno, bo M³ izpustil medije za @:{cbsx}.',
            keys,
          ),
          {
            kind: 'links',
            text: 'Če vnešeno, bo M³ izpustil medije za @:{cbs}.',
          },
        ],
        [
          'link bare key glued to trailing punctuation isolated with braces',
          computeLinkTargetFix(
            'The scene in @:obsStudio that will be used as the default stage view.',
            'Сцена в @:obsStudio, которая будет использоваться по умолчанию.',
            keys,
          ),
          {
            kind: 'links',
            text: "Сцена в @:{'obsStudio'}, которая будет использоваться по умолчанию.",
          },
        ],
        [
          'link bare key glued to trailing punctuation (period) isolated with braces',
          computeLinkTargetFix(
            '@:obsStudio is a free app.',
            '@:obsStudio.',
            keys,
          ),
          {
            kind: 'links',
            text: "@:{'obsStudio'}.",
          },
        ],
        [
          'link deliberate rewording left alone',
          computeLinkTargetFix(
            "If entered, M³ will skip media for the @:{'cbs'}.",
            'Če vnešeno, bo M³ izpustil medije med Občinskim preučevanjem Biblije.',
            keys,
          ),
          null,
        ],
        [
          'link german compound left alone',
          computeLinkTargetFix(
            '@:obsStudio port and password',
            '@:obsStudio-Port und Passwort',
            keys,
          ),
          null,
        ],
        [
          'link valid-but-different key left alone',
          computeLinkTargetFix(
            'Add media from the @:study-bible',
            'Ajouter des médias à partir de @:cbs',
            keys,
          ),
          null,
        ],
        [
          'param localized name restored',
          computeLinkTargetFix(
            'Would you like to preview the yeartext for {year}?',
            'Kas soovid vaadata {aasta} a. aastateksti eelvaadet?',
            keys,
          ),
          {
            kind: 'links',
            text: 'Kas soovid vaadata {year} a. aastateksti eelvaadet?',
          },
        ],
        [
          'param reordered translation left alone',
          computeLinkTargetFix('From {from} to {to}', 'De {to} à {from}', keys),
          null,
        ],
        [
          'param dropped by translator left alone',
          computeLinkTargetFix(
            'Are you sure you want to delete {count} items?',
            'Ali si prepričan, da želiš izbrisati elemente?',
            keys,
          ),
          null,
        ],
      ];
      return linkCases;
    })(),

    // Batch PATCH per-op error parsing.
    [
      'patch indices parsed from error body',
      getFailedPatchIndices(
        JSON.stringify({
          errors: [
            { errors: [], index: 1 },
            { errors: [], index: 3 },
          ],
        }),
      ),
      [1, 3],
    ],
    [
      'patch empty indices array returns null',
      getFailedPatchIndices(JSON.stringify({ errors: [] })),
      null,
    ],
    [
      'non-patch error body returns null',
      getFailedPatchIndices(
        JSON.stringify({ error: { code: 403, message: 'Forbidden' } }),
      ),
      null,
    ],
    [
      'unparseable body returns null',
      getFailedPatchIndices('<html>oops'),
      null,
    ],
    ['empty body returns null', getFailedPatchIndices(''), null],

    // Log and request-path hardening for data from the Crowdin API.
    [
      'log text flattened to one line',
      toSingleLine('404 Not Found\r\n::error::forged\nline'),
      '404 Not Found ::error::forged line',
    ],
    ['numeric crowdin id kept', toCrowdinId('12345'), 12_345],
    [
      'path-like crowdin ids refused',
      ['..', '1/../projects', '1?limit=1', '', 0, -3, 1.5, null].map((value) =>
        refusesCrowdinId(value),
      ),
      [true, true, true, true, true, true, true, true],
    ],
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

// Crowdin ids are positive integers. The TM ids put into request paths come
// from API responses (the project's defaultTmId, the TM and segment
// listings), so anything else is refused rather than allowed to change the
// path (`..`, `/`, a query string) the token is sent to.
function toCrowdinId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`Unexpected Crowdin id: ${JSON.stringify(value)}`);
  }
  return id;
}

// Crowdin API data (file paths, language ids, error response bodies) ends up
// in this script's log lines, which CI prints; flattening its line breaks
// keeps that data from forging extra log lines or GitHub Actions workflow
// commands (`::error::...`).
function toSingleLine(text) {
  return String(text).replaceAll(/[\r\n]+/g, ' ');
}

try {
  process.exitCode = await run();
} catch (error) {
  console.error(`[crowdin] ${toSingleLine(error.message)}`); // NOSONAR: line breaks stripped by toSingleLine
  process.exitCode = 1;
}
