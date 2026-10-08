import argparse
import json
import os
import re

PREID = "beta"


def get_current_version():
    with open("package.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["version"], data


def bump_prerelease(version):
    match = re.match(rf"^(\d+\.\d+\.\d+)-{PREID}\.(\d+)$", version)
    if match:
        base, n = match.group(1), int(match.group(2))
        return f"{base}-{PREID}.{n + 1}"

    match = re.match(r"^(\d+)\.(\d+)\.(\d+)", version)
    if not match:
        raise ValueError(f"Unrecognized version format: {version}")
    major, minor, patch = (int(g) for g in match.groups())
    return f"{major}.{minor}.{patch + 1}-{PREID}.0"


def update_package_json(data, new_version):
    data["version"] = new_version
    with open("package.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag-prefix", default="v")
    parser.add_argument("--github-output")
    args = parser.parse_args()

    current_version, data = get_current_version()
    new_version = bump_prerelease(current_version)
    update_package_json(data, new_version)

    new_tag = f"{args.tag_prefix}{new_version}"
    print(f"Bumping version from {current_version} to {new_version} ({new_tag})")

    github_output = args.github_output or os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as f:
            f.write(f"newTag={new_tag}\n")
