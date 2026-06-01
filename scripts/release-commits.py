#!/usr/bin/env python3
"""Find release-worthy commits and optionally write release notes."""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

CONVENTIONAL_PATTERN = re.compile(
    r"^(?P<type>feat|fix|perf|refactor|revert|chore|deps|depsdev|deps-dev|build)"
    r"(?:\([^)]*\))?!?:\s*(?P<description>.+)",
    flags=re.IGNORECASE | re.ASCII,
)
LEGACY_PATTERN = re.compile(
    r"^(fix(?:es|ed)?|add(?:s|ed)?|update(?:s|d)?|remov(?:e|es|ed)|"
    r"refactor(?:s|ed)?|improve(?:s|d)?|revert(?:s|ed)?)\b",
    flags=re.IGNORECASE | re.ASCII,
)
SKIP_SUBJECT_PATTERN = re.compile(
    r"^chore(?:\([^)]*\))?: (?:bump version|auto-update release-notes)",
    flags=re.IGNORECASE | re.ASCII,
)
DOC_ONLY_PATHS = (
    "docs/",
    "release-notes/",
)
DOC_ONLY_FILES = {
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "README.md",
}
WORKFLOW_ONLY_PATHS = (
    ".github/",
)


def run_git(args: list[str]) -> str:
    return subprocess.run(
        ["git", *args],
        capture_output=True,
        check=True,
        text=True,
    ).stdout.strip()


def is_relevant_subject(subject: str) -> bool:
    if SKIP_SUBJECT_PATTERN.search(subject):
        return False

    return bool(
        CONVENTIONAL_PATTERN.search(subject) or LEGACY_PATTERN.search(subject)
    )


def is_doc_or_workflow_only_path(path: str) -> bool:
    if path in DOC_ONLY_FILES or path.endswith(".md"):
        return True

    return path.startswith(DOC_ONLY_PATHS) or path.startswith(WORKFLOW_ONLY_PATHS)


def commit_touches_relevant_files(commit: str) -> bool:
    files_output = run_git([
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        commit,
    ])
    files = [line for line in files_output.splitlines() if line]

    if not files:
        return True

    return any(not is_doc_or_workflow_only_path(path) for path in files)


def get_commit_subject(commit: str) -> str:
    return run_git(["show", "-s", "--format=%s", commit])


def get_release_commits(base_ref: str, head_ref: str) -> list[tuple[str, str]]:
    rev_range = f"{base_ref}..{head_ref}"
    output = run_git(["rev-list", "--reverse", "--no-merges", rev_range])
    commits = [line for line in output.splitlines() if line]
    release_commits: list[tuple[str, str]] = []

    for commit in commits:
        subject = get_commit_subject(commit)
        if is_relevant_subject(subject) and commit_touches_relevant_files(commit):
            release_commits.append((commit, subject))

    return release_commits


def write_notes(
    notes_path: Path,
    version: str,
    base_ref: str,
    commits: list[tuple[str, str]],
) -> None:
    title = f"Release {version}" if version else "Release notes"
    lines = [f"# {title}", "", f"Changes since `{base_ref}`:", ""]

    if commits:
        lines.extend(f"- {subject}" for _, subject in commits)
    else:
        lines.append("No release-worthy commits found.")

    notes_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def append_github_output(path: Path, values: dict[str, str]) -> None:
    with path.open("a", encoding="utf-8") as output:
        for key, value in values.items():
            if "\n" in value:
                output.write(
                    f"{key}<<__release_commits__\n"
                    f"{value}\n"
                    "__release_commits__\n"
                )
            else:
                output.write(f"{key}={value}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-ref", required=True)
    parser.add_argument("--head-ref", default="HEAD")
    parser.add_argument("--version", default="")
    parser.add_argument("--notes-file")
    parser.add_argument("--github-output")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    commits = get_release_commits(args.base_ref, args.head_ref)
    messages = "\n".join(subject for _, subject in commits)

    if args.notes_file:
        write_notes(Path(args.notes_file), args.version, args.base_ref, commits)

    if args.github_output:
        append_github_output(
            Path(args.github_output),
            {
                "has_commits": "true" if commits else "false",
                "messages": messages,
            },
        )

    if messages:
        print(messages)
    else:
        print("No release-worthy commits found.")


if __name__ == "__main__":
    main()
