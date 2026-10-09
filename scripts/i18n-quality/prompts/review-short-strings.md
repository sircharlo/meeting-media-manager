# Short-strings review agent prompt template

One invocation per (language, batch of ~150 corpus records). Consumes a
slice of `reports/translation-quality/<run-id>/corpus/<lang>/<contentType>.json`
plus `scripts/i18n-quality/glossaries/<lang>.json`. Produces one entry per
proposed change, appended to
`reports/translation-quality/<run-id>/proposed/<lang>/<contentType>.json`.

## Task

For each record in the batch, compare `currentTranslation` against
`sourceEn` and judge two **independent** things:

1. **Phrasing** — does the translation read naturally in the target
   language? Only propose a change when you can name a specific
   grammatical or idiomatic problem. "This is one of several valid
   phrasings" is not a reason to change it — leave it alone.
2. **Terminology** — does the translation use JW-organizational vocabulary
   correctly? Only propose a change when it's a genuine mismatch against
   the glossary (or a fresh jw.org lookup you can cite), never a stylistic
   preference. Most strings don't touch JW-specific vocabulary at all —
   this check simply doesn't apply to them.

## Mandatory constraints

1. **Never touch `@:key` / `@:{'key'}` / `{param}` tokens.** They're listed
   per-record in `protectedTokens`. Reword the prose around them, but the
   exact token substrings must appear unchanged in your proposal — this is
   mechanically re-verified afterward and silently rejected if violated.
2. **Never re-flag Crowdin corruption** (typographic quotes, doubled
   anchors, scrambled version numbers, mangled `@:` syntax) — that's a
   separate pipeline's job and is already excluded from your corpus.
3. **Every proposal needs a non-empty `reason`** an admin with zero context
   can act on, and a `category` of exactly `"phrasing"` or `"terminology"`.
4. **Mark `confidence` honestly** (`high`/`medium`/`low`) — be more
   conservative in lower-resource languages where your own fluency is
   weaker.
5. **Do not invent translations for missing strings** — every record you
   receive is already confirmed translated; this is a refinement pass, not
   a translation pass.
6. **When in doubt, propose nothing.** A missed improvement costs nothing;
   a bad "fix" costs review time and may damage a correct translation. Do
   not aim for a target flag rate — most strings should need no change.

## Output format

Only emit records for strings you're proposing a change to (skip the rest
entirely — don't emit a "no change" record). Each proposed record:

```json
{
  "id": "<sha1 of contentType|filePath|key|language>",
  "language": "<lang>",
  "contentType": "<i18n|docs-locale>",
  "filePath": "<from the corpus record>",
  "key": "<from the corpus record>",
  "sourceEn": "<from the corpus record>",
  "currentTranslation": "<from the corpus record>",
  "proposedTranslation": "<your proposed replacement text>",
  "protectedTokens": "<copy verbatim from the corpus record>",
  "category": "phrasing|terminology",
  "reason": "<specific, admin-readable explanation>",
  "glossaryRefs": [{ "termEn": "...", "official": "...", "sourceUrl": "..." }],
  "confidence": "high|medium|low"
}
```

`glossaryRefs` is only populated for `terminology` proposals, citing the
glossary entry (or a fresh jw.org URL) that justifies the change.
