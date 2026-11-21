import datetime
import json
import os
import subprocess
import sys
from pathlib import Path

def get_latest_tag():
    try:
        result = subprocess.run(
            ["gh", "release", "view", "--json", "tagName", "--jq", ".tagName"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        # Fallback if no release exists or error occurs
        return "0.0.0"

def calculate_next_version(latest_tag):
    now = datetime.datetime.now()
    year = now.strftime("%y")
    month = str(now.month) # No leading zero
    
    prefix = f"{year}.{month}."
    
    if latest_tag.startswith(prefix):
        try:
            patch = int(latest_tag.split(".")[-1])
            next_patch = patch + 1
        except (ValueError, IndexError):
            next_patch = 0
    else:
        next_patch = 0
        
    return f"{year}.{month}.{next_patch}"

def update_package_json(new_version):
    with open("package.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    data["version"] = new_version
    
    with open("package.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n") # Add newline at end of file

def check_release_exists(version):
    try:
        # Check if a release with this tag already exists (even if it's a draft)
        subprocess.run(
            ["gh", "release", "view", f"v{version}"],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

CHANGELOG_PATH = Path("CHANGELOG.md")
PENDING_HEADER = "## UPCOMING VERSION"


def apply_pending_changelog(new_version: str) -> bool:
    """Rename the UPCOMING VERSION changelog section to the real release version.

    The UPCOMING VERSION section at the top of CHANGELOG.md accumulates every
    user-facing change since the last release (see AGENTS.md). When a real
    (non-beta) release is cut, this renames its header to the version being
    released, so the Manual Release workflow can extract it as the GitHub
    release body. Returns True when the rename was applied.
    """
    if not CHANGELOG_PATH.exists():
        print(
            f"Warning: {CHANGELOG_PATH} not found; cannot apply UPCOMING VERSION changelog."
        )
        return False

    lines = CHANGELOG_PATH.read_text(encoding="utf-8").splitlines()
    version_header = f"## v{new_version}"

    if version_header in lines:
        print(f"{version_header} already present in CHANGELOG.md; skipping.")
        return False

    try:
        index = lines.index(PENDING_HEADER)
    except ValueError:
        print(
            f"Warning: {PENDING_HEADER} section not found in CHANGELOG.md. "
            "Every user-facing change should have an UPCOMING VERSION changelog "
            "entry; add or re-create the section before cutting the release."
        )
        return False

    lines[index] = version_header
    CHANGELOG_PATH.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(
        f"Renamed {PENDING_HEADER} to {version_header} in CHANGELOG.md. "
        "Open a fresh UPCOMING VERSION section for the next cycle when you "
        "next touch the changelog."
    )
    return True


METAINFO_PATH = Path("build/linux/io.github.sircharlo.meeting-media-manager.metainfo.xml")


def add_metainfo_release(new_version: str) -> bool:
    """Add the release to the AppStream metadata, newest first.

    Flathub builds M³ from a release's tag, and its listing shows the
    releases in this file (see build/flatpak). Returns True when the release
    was added.
    """
    if not METAINFO_PATH.exists():
        print(f"Warning: {METAINFO_PATH} not found; cannot add the release to it.")
        return False

    text = METAINFO_PATH.read_text(encoding="utf-8")
    if f'<release version="{new_version}"' in text:
        print(f"Release {new_version} already in {METAINFO_PATH}; skipping.")
        return False

    marker = "  <releases>\n"
    if marker not in text:
        print(f"Warning: no <releases> element in {METAINFO_PATH}; release not added.")
        return False

    today = datetime.date.today().isoformat()
    entry = (
        f'    <release version="{new_version}" date="{today}">\n'
        "      <url type=\"details\">https://github.com/sircharlo/meeting-media-manager"
        f"/releases/tag/v{new_version}</url>\n"
        "    </release>\n"
    )
    METAINFO_PATH.write_text(
        text.replace(marker, marker + entry, 1), encoding="utf-8", newline="\n"
    )
    print(f"Added release {new_version} to {METAINFO_PATH}.")
    return True


if __name__ == "__main__":
    latest_tag = get_latest_tag()
    if latest_tag.startswith("v"):
        latest_tag = latest_tag[1:]
        
    new_version = calculate_next_version(latest_tag)
    print(f"Bumping version from {latest_tag} to {new_version}")

    draft_exists = check_release_exists(new_version)
    if draft_exists:
        print(f"Draft release for v{new_version} already exists. Skipping local version bump.")
    else:
        update_package_json(new_version)
        apply_pending_changelog(new_version)
        add_metainfo_release(new_version)
    
    # Export for GitHub Actions
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"new_version={new_version}\n")
            f.write(f"draft_exists={'true' if draft_exists else 'false'}\n")
