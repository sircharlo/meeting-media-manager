import datetime
import json
import os
import subprocess
import sys

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

if __name__ == "__main__":
    latest_tag = get_latest_tag()
    if latest_tag.startswith("v"):
        latest_tag = latest_tag[1:]
        
    new_version = calculate_next_version(latest_tag)
    print(f"Bumping version from {latest_tag} to {new_version}")
    update_package_json(new_version)
    
    # Export for GitHub Actions
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"new_version={new_version}\n")
