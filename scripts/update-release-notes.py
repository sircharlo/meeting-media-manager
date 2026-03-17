#!/usr/bin/env python3
"""
Syncs release-notes/en.md from CHANGELOG.md.
Extracts only the "New Features" section for each version.
"""

import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
CHANGELOG_PATH = REPO_ROOT / "CHANGELOG.md"
EN_NOTES_PATH = REPO_ROOT / "release-notes" / "en.md"

HEADER = """<!-- markdownlint-disable no-duplicate-heading -->

# What's New

For the full list of changes between versions, see our CHANGELOG.md file on GitHub.
"""

def extract_new_features():
    if not CHANGELOG_PATH.exists():
        print(f"Error: {CHANGELOG_PATH} not found.")
        return ""

    content = CHANGELOG_PATH.read_text(encoding="utf-8")
    
    # Split by version headers (## vX.Y.Z)
    version_blocks = re.split(r'\n(## v?\d+\.\d+\.\d+.*)\n', content)
    
    output = [HEADER]
    
    # version_blocks[0] is everything before the first version header (header/intro)
    # The rest are in pairs: [header, content, header, content, ...]
    for i in range(1, len(version_blocks), 2):
        version_header = version_blocks[i].strip()
        version_content = version_blocks[i+1]
        
        # Extract "New Features" section
        # Look for ### ✨ New Features and capture everything until the next ### or ##
        feature_match = re.search(r'(### ✨ New Features.*?)(\n###|\n##|$)', version_content, re.DOTALL)
        
        if feature_match:
            features = feature_match.group(1).strip()
            output.append(f"\n{version_header}\n\n{features}\n")

    return "".join(output)

def main():
    print(f"Syncing {EN_NOTES_PATH} from {CHANGELOG_PATH}...")
    new_en_content = extract_new_features()
    
    if not new_en_content:
        print("No features found to sync.")
        return

    # Normalize line endings to LF for consistency in Git
    new_en_content = new_en_content.replace('\r\n', '\n')

    if EN_NOTES_PATH.exists():
        old_content = EN_NOTES_PATH.read_text(encoding="utf-8").replace('\r\n', '\n')
        if old_content.strip() == new_en_content.strip():
            print("No changes detected. Skipping update.")
            return

    EN_NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
    EN_NOTES_PATH.write_text(new_en_content, encoding="utf-8", newline='\n')
    print(f"Successfully updated {EN_NOTES_PATH}")

if __name__ == "__main__":
    main()
