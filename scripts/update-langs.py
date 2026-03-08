#!/usr/bin/env python3
"""
Analyzes translation completeness for all i18n JSON files in src/i18n/,
then updates src/i18n/index.ts and docs/locales/index.ts with imports
sorted by % translated, each annotated with a completion comment.

Also updates src/constants/locales.ts:
  - LanguageValue type
  - export const enabled: LanguageValue[]  (langs at or above threshold)
  - export const locales: [...]            (adds placeholders for new langs,
                                            removes langs no longer in LanguageValue)

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

def build_import_block(stats: dict[str, tuple[str, float]], inactive_too: bool = False) -> str:
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
        lines.append(f"{comment}\n{"// " if pct < PERCENTAGE_THRESHOLD and not inactive_too else ""}import {key} from './{stem}.json';")

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
    inactive_too = "docs" in path.parts
    block   = build_import_block(stats, inactive_too=inactive_too)
    updated = replace_locale_import_block(content, block)
    
    active_keys = sorted(k for k, (_, p) in stats.items() if p >= PERCENTAGE_THRESHOLD)
    keys_str = ",\n  ".join(sorted(stats.keys()))
    active_keys_str = ",\n  ".join(active_keys)
    
    # Also update the export object if this is an index file
    if label == "src/i18n/index.ts":
        new_export = f"export default {{\n  {active_keys_str},\n}};"
        updated = re.sub(r"export\s+default\s*\{[\s\S]*?\};", new_export, updated)
    elif label == "docs/locales/index.ts":
        new_export = f"const messages: Record<LanguageValue, Partial<typeof en>> = {{\n  {keys_str},\n}};"
        updated = re.sub(r"const\s+messages:\s*Record<LanguageValue,\s*Partial<typeof\s*en>>\s*=\s*\{[\s\S]*?\};", new_export, updated)
        
    path.write_text(updated, encoding="utf-8")
    print(f"✅  Updated {path}")


# ── Update LanguageValue type, enabled[], and locales[] ──────────────────────

def parse_locales_array(content: str) -> list[dict]:
    """
    Parse the existing locales array from locales.ts into a list of dicts.
    Each entry captures: value, englishName, label, langcode, signLangCodes (optional).
    Uses a regex to find each object block inside the array.
    """
    # Extract the full locales array body
    array_match = re.search(
        r"export const locales(?::[^=]+)?=\s*\[([\s\S]*?)\];\s*$",
        content,
        re.MULTILINE,
    )
    if not array_match:
        return []

    array_body = array_match.group(1)

    # Split into individual object blocks by top-level braces
    entries = []
    depth = 0
    current = []
    for char in array_body:
        if char == '{':
            depth += 1
        if depth > 0:
            current.append(char)
        if char == '}':
            depth -= 1
            if depth == 0 and current:
                entries.append("".join(current).strip())
                current = []

    parsed = []
    for block in entries:
        entry = {}

        m = re.search(r"value:\s*'([^']+)'", block)
        if m:
            entry["value"] = m.group(1)

        m = re.search(r"englishName:\s*'([^']+)'", block)
        if m:
            entry["englishName"] = m.group(1)

        m = re.search(r"label:\s*'([^']+)'", block)
        if m:
            entry["label"] = m.group(1)

        m = re.search(r"langcode:\s*'([^']+)'", block)
        if m:
            entry["langcode"] = m.group(1)

        m = re.search(r"signLangCodes:\s*\[([^\]]*)\]", block)
        if m:
            codes = re.findall(r"'([^']+)'", m.group(1))
            entry["signLangCodes"] = codes

        if "value" in entry:
            parsed.append(entry)

    return parsed


def build_locale_entry(entry: dict) -> str:
    """Render a single locales[] object entry as a TypeScript string."""
    lines = ["{"]
    lines.append(f"    englishName: '{entry.get('englishName', 'PLACEHOLDER')}',")
    lines.append(f"    label: '{entry.get('label', 'PLACEHOLDER')}',")
    lines.append(f"    langcode: '{entry.get('langcode', 'PLACEHOLDER')}',")
    if "signLangCodes" in entry and entry["signLangCodes"]:
        codes = ", ".join(f"'{c}'" for c in entry["signLangCodes"])
        lines.append(f"    signLangCodes: [{codes}],")
    lines.append(f"    value: '{entry['value']}',")
    lines.append("  }")
    return "\n  ".join(lines)


def update_locales_type(stats: dict[str, tuple[str, float]], path: Path) -> None:
    if not path.exists():
        print(f"⚠️   locales.ts not found at {path}, skipping.")
        return

    content = path.read_text(encoding="utf-8")
    all_keys = sorted(stats.keys())
    active_keys = sorted(k for k, (_, p) in stats.items() if p >= PERCENTAGE_THRESHOLD)

    # ── 1. Update LanguageValue type ─────────────────────────────────────────
    looper = all_keys
    type_union = "\n  | ".join(f"'{k}'" for k in looper)
    new_type = f"export type LanguageValue =\n  | {type_union};"
    updated = re.sub(r"export\s+type\s+LanguageValue\s*=[\s\S]*?;", new_type, content)

    # ── 2. Update enabled[] ──────────────────────────────────────────────────
    looper = all_keys if 'docs' in path.parts else active_keys
    enabled_items = "\n  ".join(f"'{k}'," for k in looper)
    new_enabled = f"export const enabled: LanguageValue[] = [\n  {enabled_items}\n];"
    updated = re.sub(
        r"export\s+const\s+enabled\s*:\s*LanguageValue\[\]\s*=\s*\[[\s\S]*?\];",
        new_enabled,
        updated,
    )

    # ── 3. Update locales[] ──────────────────────────────────────────────────
    existing_entries = parse_locales_array(updated)
    existing_by_value = {e["value"]: e for e in existing_entries}

    # Remove entries whose value is no longer in LanguageValue
    # Add placeholder entries for brand-new values
    new_entries = []
    removed = []
    added = []

    for key in active_keys:
        if key in existing_by_value:
            new_entries.append(existing_by_value[key])
        else:
            # New lang detected — insert placeholder
            placeholder = {
                "value": key,
                "englishName": "PLACEHOLDER_ENGLISH_NAME",
                "label": "PLACEHOLDER_LABEL",
                "langcode": "PLACEHOLDER_LANGCODE",
            }
            new_entries.append(placeholder)
            added.append(key)

    for existing_key in existing_by_value:
        if existing_key not in active_keys:
            removed.append(existing_key)

    if removed:
        print(f"  🗑️   Removed from locales[]: {', '.join(removed)}")
    if added:
        print(f"  ➕  Added placeholder(s) to locales[]: {', '.join(added)}")

    # Render the new array
    rendered_entries = ",\n  ".join(build_locale_entry(e) for e in new_entries)
    new_locales = (
        "export const locales: {\n"
        "  englishName: string;\n"
        "  label: string;\n"
        "  langcode: JwLangCode;\n"
        "  signLangCodes?: JwLangCode[];\n"
        "  value: LanguageValue;\n"
        "}[] = [\n"
        f"  {rendered_entries},\n"
        "];"
    )

    updated = re.sub(
        r"export\s+const\s+locales\s*:\s*\{[\s\S]*?\}\[\]\s*=\s*\[[\s\S]*?\];",
        new_locales,
        updated,
    )

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
