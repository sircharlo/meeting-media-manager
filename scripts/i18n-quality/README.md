# Translation-quality review pipeline

Reviews existing Crowdin translations for **naturalness** and **JW-appropriate
terminology** against the English source — a different concern from
`scripts/cleanup-crowdin.mjs` / `scripts/fix-i18n-locales.mjs`, which only
repair mechanical corruption (broken syntax, mangled placeholders). Nothing
here is auto-applied: every stage produces a file for the next stage or for
human review, and only an explicit, human-approved `--apply` run of
`apply-translation-quality-fixes.mjs` ever writes to Crowdin.

Per `AGENTS.md`'s Crowdin rules, this pipeline never hand-edits a translated
file — proposed fixes only ever reach Crowdin's stored translations through
its API.

## Pipeline

1. **`extract-review-corpus.mjs`** (deterministic) — diffs a language's
   translated files against English, skips untranslated strings and known
   Crowdin-corruption patterns (owned by `cleanup-crowdin.mjs`), and emits a
   corpus of candidates with their `@:`/`{param}` tokens flagged as
   protected.
2. **Grounding agent** (`prompts/grounding-agent.md`, one per language) —
   researches `jw-terms-seed.json`'s terms on official jw.org pages in that
   language and writes a committed, reusable glossary to `glossaries/<lang>.json`.
3. **Review agent** (`prompts/review-short-strings.md`, batched ~150 records
   per invocation) — proposes targeted edits with a category (phrasing /
   terminology) and an admin-readable reason, citing the glossary for
   terminology fixes.
4. **`validate-proposed-changes.mjs`** (deterministic) — a guardrail gate:
   rejects anything that mangles a protected token, is stale against the
   live repo file, is a no-op, is missing a reason/category, or fails
   vue-i18n compilation. Nothing is silently dropped — everything lands in
   `validated/` or `rejected-by-guardrail/`.
5. **`generate-report.mjs`** (deterministic) — renders `validated/` into a
   Markdown report per (language, content type) — the actual thing a human
   reads to decide what to approve.
6. **`apply-translation-quality-fixes.mjs`** — takes a copy of a validated
   report with `"status": "approved"` added to the entries a human wants
   applied, resolves them to Crowdin string/translation IDs, and PATCHes
   them via the API. Dry-run by default (mirrors `cleanup-crowdin.mjs`'s
   `--apply` convention); always re-checks the live Crowdin text immediately
   before writing and skips anything that's changed since review (a
   translator or the hourly `crowdin-autorepair.yml` sweep may have touched
   it) rather than clobbering it.

## Output locations

- `scripts/i18n-quality/glossaries/<lang>.json` — committed, reusable
  per-language terminology references.
- `reports/translation-quality/<run-id>/` — gitignored, per-run corpus/
  proposed/validated/rejected output and the human-readable reports.

## Status

Pilot scope only: French, `src/i18n/en.json` + `docs/locales/en.json`
("short UI strings"). Long-form prose (`docs/src/**`, `release-notes/*.md`),
the other 13 shipped languages, and the 14 release-notes-only orphan
languages are explicitly deferred — see the plan this was built from for
the staged rollout and go/no-go checkpoints.
