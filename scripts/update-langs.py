#!/usr/bin/env python3
"""
Analyzes translation completeness for all i18n JSON files in src/i18n/,
then updates src/i18n/index.ts and docs/locales/index.ts with imports
sorted by % translated, each annotated with a completion comment.

Usage:
    python scripts/update-langs.py
"""

import json
import re
from datetime import date
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
REPO_ROOT    = SCRIPT_DIR.parent
SRC_I18N     = REPO_ROOT / "src" / "i18n"
DOCS_LOCALES = REPO_ROOT / "docs" / "locales"
SRC_CONSTANTS_LOCALES = REPO_ROOT / "src" / "constants" / "locales.ts"
TODAY        = date.today().strftime("%Y-%m-%d")
PERCENTAGE_THRESHOLD = 40

# Matches locale JSON import lines (active or commented-out)
LOCALE_IMPORT_LINE = re.compile(
    r"^\s*(?://\s*)?import\s+\w+\s+from\s+'\.\/[\w-]+\.json';"
)
# Matches the % annotation comments this script generates
PCT_COMMENT_LINE = re.compile(
    r"^\s*//\s*\d+\.?\d*%\s+translated\s+as\s+of\s+\d{4}-\d{2}-\d{2}"
)


# ── camelCase conversion ──────────────────────────────────────────────────────

def stem_to_camel(stem: str) -> str:
    """
    Converts a kebab-case filename stem to a camelCase JS identifier.
    Examples:
        'fr'        → 'fr'
        'pt-pt'     → 'ptPt'
        'cmn-hans'  → 'cmnHans'
        'zh-hant-tw'→ 'zhHantTw'
    """
    parts = stem.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def translation_pct(en: dict, lang: dict) -> float:
    """% of EN keys whose translation value differs from the English value."""
    if not en:
        return 0.0
    translated = sum(
        1 for k, v in en.items()
        if lang.get(k, v) != v
    )
    return round(translated / len(en) * 100, 1)


# ── Build translation stats ───────────────────────────────────────────────────

def build_translation_stats(i18n_dir: Path) -> dict[str, tuple[str, float]]:
    """
    Scans i18n_dir for all *.json files (excluding en.json).
    Returns {camelKey: (stem, pct)} for every locale found.
    """
    en_path = i18n_dir / "en.json"
    if not en_path.exists():
        raise FileNotFoundError(f"English source not found: {en_path}")

    en_strings = load_json(en_path)
    stats: dict[str, tuple[str, float]] = {
        "en": ("en", 100.0)
    }

    for json_file in sorted(i18n_dir.glob("*.json")):
        if json_file.stem == "en":
            continue
        key  = stem_to_camel(json_file.stem)
        lang = load_json(json_file)
        pct  = translation_pct(en_strings, lang)
        stats[key] = (json_file.stem, pct)
        print(f"  {key:<14} ({json_file.name}): {pct}%")

    return stats


# ── Import-block builder ──────────────────────────────────────────────────────

def build_import_block(stats: dict[str, tuple[str, float]]) -> str:
    """
    Returns the new import block string.
    All locales found on disk are included as active imports,
    sorted by % translated descending, then alphabetically.
    """
    sorted_keys = sorted(stats, key=lambda k: (0 if k == "en" else 1, -stats[k][1], k))

    lines = []
    for key in sorted_keys:
        stem, pct = stats[key]
        comment   = f"// {pct}% translated as of {TODAY}"
        lines.append(f"{comment}\n{"// " if pct < PERCENTAGE_THRESHOLD else ""}import {key} from './{stem}.json';")

    return "\n\n".join(lines)


# ── Replace locale import block in a file ────────────────────────────────────

def replace_locale_import_block(content: str, new_block: str) -> str:
    """
    Finds the contiguous section of locale JSON imports (and their % comments)
    and replaces it with new_block. All other lines are preserved as-is.
    """
    lines = content.split("\n")
    first_idx = last_idx = None

    for i, line in enumerate(lines):
        if LOCALE_IMPORT_LINE.match(line) or PCT_COMMENT_LINE.match(line):
            if first_idx is None:
                first_idx = i
            last_idx = i

    if first_idx is None:
        raise ValueError(
            "No locale import lines found in file.\n"
            "Expected lines like:  import fr from './fr.json';"
        )

    before = "\n".join(lines[:first_idx])
    after  = "\n".join(lines[last_idx + 1:])
    return before + "\n" + new_block + "\n" + after


# ── Update a single index file ────────────────────────────────────────────────

def update_index(
    stats: dict[str, tuple[str, float]],
    path: Path,
    label: str,
) -> None:
    if not path.exists():
        print(f"⚠️   {label} not found at {path}, skipping.")
        return
    content = path.read_text(encoding="utf-8")
    block   = build_import_block(stats)
    updated = replace_locale_import_block(content, block)
    
    active_keys = sorted(k for k, (_, p) in stats.items() if p >= PERCENTAGE_THRESHOLD)
    keys_str = ",\n  ".join(active_keys)
    
    # Also update the export object if this is an index file
    if label == "src/i18n/index.ts":
        new_export = f"export default {{\n  {keys_str},\n}};"
        updated = re.sub(r"export\s+default\s*\{[\s\S]*?\};", new_export, updated)
    elif label == "docs/locales/index.ts":
        new_export = f"const messages: Record<LanguageValue, Partial<typeof en>> = {{\n  {keys_str},\n}};"
        updated = re.sub(r"const\s+messages:\s*Record<LanguageValue,\s*Partial<typeof\s*en>>\s*=\s*\{[\s\S]*?\};", new_export, updated)
        
    path.write_text(updated, encoding="utf-8")
    print(f"✅  Updated {path}")


# ── Update LanguageValue type ─────────────────────────────────────────────────

def update_locales_type(stats: dict[str, tuple[str, float]], path: Path) -> None:
    if not path.exists():
        print(f"⚠️   locales.ts not found at {path}, skipping.")
        return
    content = path.read_text(encoding="utf-8")

    active_keys = sorted(k for k, (_, p) in stats.items() if p >= PERCENTAGE_THRESHOLD)
    type_union = "\n  | ".join(f"'{k}'" for k in active_keys)
    new_type = f"export type LanguageValue =\n  | {type_union};"
    
    updated = re.sub(r"export\s+type\s+LanguageValue\s*=[\s\S]*?;", new_type, content)
    
    path.write_text(updated, encoding="utf-8")
    print(f"✅  Updated {path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f"📂  Scanning {SRC_I18N} …\n")

    if not SRC_I18N.exists():
        print(f"❌  Directory not found: {SRC_I18N}")
        print("    Run this script from the repository root.")
        return

    stats = build_translation_stats(SRC_I18N)

    # Summary table
    print("\n── Translation completeness (sorted by %) ──────────────────")
    for key, (_, pct) in sorted(stats.items(), key=lambda x: (-x[1][1], x[0])):
        filled = int(pct / 5)
        bar    = "█" * filled + "░" * (20 - filled)
        print(f"  {key:<14} {bar} {pct:>5}%")

    print()
    update_index(stats, SRC_I18N / "index.ts",    "src/i18n/index.ts")
    update_index(stats, DOCS_LOCALES / "index.ts", "docs/locales/index.ts")
    update_locales_type(stats, SRC_CONSTANTS_LOCALES)

    print("\nDone! 🎉")


if __name__ == "__main__":
    main()
