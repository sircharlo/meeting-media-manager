# Grounding agent prompt template

One invocation per language. Produces `scripts/i18n-quality/glossaries/<lang>.json`.

## Inputs

- `scripts/i18n-quality/jw-terms-seed.json` — the curated list of JW-organizational
  terms actually used in this app, each with English context.
- The target language's name (English + native, from `src/constants/locales.ts`).

## Task

**Start here**: jw.org publishes an official terminology guide for media/
government representatives at
<https://www.jw.org/en/global-communications/terminology-guide/> — it's the
organization's own canonical list of preferred terms, and it's translated
into many languages. Fetch the English page and parse its `<head>` for
`<link rel="alternate" hreflang="<lang>" href="...">` tags to find the exact
URL of the target language's version directly (don't guess a URL by pattern

- read it from the page's own hreflang metadata). If the target language has
  a version of this page, treat it as your primary source and cite it for
  every seed term it covers.

**If WebFetch can't find the `hreflang` tags or gives you a lossy/summarized
read of a page** (its markdown conversion sometimes drops `<head>` content
entirely, and its summarization model can mangle non-Latin scripts when
extracting quotes verbatim): fall back to a raw fetch via the Bash tool,
e.g. `curl -s <url>`, and grep/read the raw HTML or text yourself instead of
relying on WebFetch's summary. This matters most for the exact `official`
term string and its surrounding quoted definition — get those from raw text,
not a paraphrase.

For any seed term the terminology guide doesn't cover, fall back to
searching **only jw.org / www.jw.org** (via WebSearch with
`allowed_domains: ["jw.org", "www.jw.org"]`, and WebFetch on the resulting
pages). Prefer authoritative, general-audience pages: organizational
structure / "who we are" pages, Bible-terms glossary pages, JW Library help
pages — not forums, not third-party sites, not machine-translated
aggregators.

**Batch your research.** Don't do one search per term — find a small number
of dense reference pages (e.g. the language's own "About Us" / organizational
page, a Bible-terms glossary page) that between them cover most of the seed
list, and extract many terms per fetch. With ~28 seed terms, aim for 5-10
total fetches, not 28.

For each term, record:

- `termEn`: the seed term.
- `official`: the official target-language rendering as jw.org itself uses it.
- `sourceUrls`: the jw.org URL(s) you found it on.
- `confidence`: `high` (seen verbatim on an authoritative page), `medium`
  (inferred from a closely related page), or `low` (could not find a clear
  official rendering — say so rather than guessing).
- `notes`: anything a reviewer should know (e.g. regional variants, a term
  that jw.org itself renders inconsistently).

If you cannot find an official rendering for a term after a reasonable
search, record it with `confidence: "low"` and an empty `official` field
rather than inventing one.

## Output

Write `scripts/i18n-quality/glossaries/<lang>.json`:

```json
{
  "_comment": "Grounded JW terminology for <lang>, cross-checked against official jw.org pages. Reusable beyond translation-quality review. Regenerate via scripts/i18n-quality/prompts/grounding-agent.md.",
  "_fetchedAt": "<ISO date>",
  "_language": "<lang>",
  "terms": [
    {
      "termEn": "...",
      "official": "...",
      "sourceUrls": ["..."],
      "confidence": "...",
      "notes": ""
    }
  ]
}
```

This file is committed to the repo — it has lasting value as a reference
independent of any single review run.
