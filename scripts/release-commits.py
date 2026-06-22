#!/usr/bin/env python3
"""Find release-worthy commits and optionally write release notes."""

from __future__ import annotations

import argparse
import os
import re
import subprocess

COMMIT_PATTERN = re.compile(r"^[0-9a-f]{40}$", flags=re.ASCII)
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
GITHUB_OUTPUT_ENV = "GITHUB_OUTPUT"
REF_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/@-]*$", flags=re.ASCII)
REV_RANGE_PATTERN = re.compile(
    r"^(?P<base>[A-Za-z0-9][A-Za-z0-9._/@-]*)"
    r"\.\."
    r"(?P<head>[A-Za-z0-9][A-Za-z0-9._/@-]*)$",
    flags=re.ASCII,
)


def validate_git_ref(ref: str, label: str) -> str:
    if not REF_PATTERN.fullmatch(ref):
        raise ValueError(f"Invalid {label}.")

    blocked_sequences = ("..", "//", "@{")
    if any(sequence in ref for sequence in blocked_sequences):
        raise ValueError(f"Invalid {label}.")

    if ref.endswith((".", "/", ".lock")):
        raise ValueError(f"Invalid {label}.")

    return ref


def validate_commit_hash(commit: str) -> str:
    if not COMMIT_PATTERN.fullmatch(commit):
        raise ValueError(f"Unexpected commit hash from git rev-list: {commit}")

    return commit


def validate_git_rev_range(rev_range: str) -> str:
    match = REV_RANGE_PATTERN.fullmatch(rev_range)
    if not match:
        raise ValueError("Invalid revision range.")

    validate_git_ref(match["base"], "base ref")
    validate_git_ref(match["head"], "head ref")
    return rev_range


def validate_git_args(args: list[str]) -> list[str]:
    match args:
        case ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]:
            return [
                "diff-tree",
                "--no-commit-id",
                "--name-only",
                "-r",
                validate_commit_hash(commit),
            ]
        case ["show", "-s", "--format=%s", commit]:
            return ["show", "-s", "--format=%s", validate_commit_hash(commit)]
        case ["rev-list", "--reverse", "--no-merges", rev_range]:
            return [
                "rev-list",
                "--reverse",
                "--no-merges",
                validate_git_rev_range(rev_range),
            ]
        case _:
            raise ValueError("Unsupported git command.")


def validate_workspace_output_path(path_input: str, label: str) -> str:
    if not path_input.strip():
        raise ValueError(f"Invalid {label}.")

    base_directory = os.path.realpath(os.getcwd()) + os.sep
    output_path = os.path.realpath(os.path.join(base_directory, path_input.strip()))
    if not output_path.startswith(base_directory):
        raise ValueError(f"Invalid {label}.")

    return output_path

invalid_github_path_string = "Invalid GitHub output path"

def validate_github_output_path(path_input: str) -> str:
    stripped_path = path_input.strip()
    if not stripped_path:
        raise ValueError(invalid_github_path_string)

    if os.path.isabs(stripped_path):
        output_path = os.path.realpath(stripped_path)
        github_output = os.environ.get(GITHUB_OUTPUT_ENV)
        if not github_output:
            raise ValueError(invalid_github_path_string)

        github_output_path = os.path.realpath(github_output)
        if output_path == github_output_path:
            return output_path

        raise ValueError(invalid_github_path_string)

    return validate_workspace_output_path(stripped_path, "GitHub output path")


def run_git(args: list[str]) -> str:
    safe_args = validate_git_args(args)
    return subprocess.run(
        ["git", *safe_args],
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
    base_ref = validate_git_ref(base_ref, "base ref")
    head_ref = validate_git_ref(head_ref, "head ref")
    rev_range = f"{base_ref}..{head_ref}"
    output = run_git(["rev-list", "--reverse", "--no-merges", rev_range])
    commits = [validate_commit_hash(line) for line in output.splitlines() if line]
    release_commits: list[tuple[str, str]] = []

    for commit in commits:
        subject = get_commit_subject(commit)
        if is_relevant_subject(subject) and commit_touches_relevant_files(commit):
            release_commits.append((commit, subject))

    return release_commits


def write_notes(
    notes_path_input: str,
    version: str,
    base_ref: str,
    commits: list[tuple[str, str]],
) -> None:
    notes_path = validate_workspace_output_path(notes_path_input, "notes file path")
    title = f"Release {version}" if version else "Release notes"
    lines = [f"# {title}", "", f"Changes since `{base_ref}`:", ""]

    if commits:
        lines.extend(f"- {subject}" for _, subject in commits)
    else:
        lines.append("No release-worthy commits found.")

    with open(notes_path, "w", encoding="utf-8", newline="\n") as notes_file:
        notes_file.write("\n".join(lines) + "\n")


def append_github_output(path_input: str, values: dict[str, str]) -> None:
    path = validate_github_output_path(path_input)
    with open(path, "a", encoding="utf-8") as output:
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
    try:
        commits = get_release_commits(args.base_ref, args.head_ref)
        messages = "\n".join(subject for _, subject in commits)

        if args.notes_file:
            write_notes(args.notes_file, args.version, args.base_ref, commits)

        if args.github_output:
            append_github_output(
                args.github_output,
                {
                    "has_commits": "true" if commits else "false",
                    "messages": messages,
                },
            )
    except ValueError as error:
        raise SystemExit(f"error: {error}") from error

    if messages:
        print(messages)
    else:
        print("No release-worthy commits found.")


if __name__ == "__main__":
    main()
