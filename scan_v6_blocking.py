import subprocess
import re
import json
import os

REPO_ROOT = r"D:\work\yewenxuan_story"
V6_DIR = os.path.join(REPO_ROOT, "chapters", "volume-6")
TOOL = os.path.join(REPO_ROOT, ".claude", "skills", "story-deslop", "scripts", "check-ai-patterns.js")

# Collect all *polished*.md files in volume-6
files = sorted(
    os.path.join(V6_DIR, f)
    for f in os.listdir(V6_DIR)
    if f.endswith("-polished.md")
)

print(f"Found {len(files)} polished V6 chapter files")

BLOCKING_RE = re.compile(r"\[blocking\]\s+\S+:\s+.*?\((.+?)\)\s*$")

results = []
for i, fpath in enumerate(files, 1):
    rel = os.path.relpath(fpath, REPO_ROOT).replace(os.sep, "/")
    try:
        cp = subprocess.run(
            ["node", TOOL, "--check", "--fail-on=blocking", fpath],
            capture_output=True,
            encoding="utf-8",
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        print(f"  [SKIP timeout] {rel}")
        continue

    # Check stdout and stderr for blocking findings
    text = cp.stdout or ""
    # Also check stderr in case errors are there (usually not)
    if not text:
        text = cp.stderr or ""

    blocking_count = 0
    first_excerpt = None

    for line in text.splitlines():
        if "[blocking]" in line:
            blocking_count += 1
            m = BLOCKING_RE.search(line)
            if m and first_excerpt is None:
                first_excerpt = m.group(1).strip()

    if blocking_count > 0:
        results.append({
            "file": rel,
            "count": blocking_count,
            "sample": first_excerpt or "",
        })

    if i % 20 == 0:
        print(f"  [{i}/{len(files)}] processed {i} files, {len(results)} with blocking so far")

# Sort by count descending
results.sort(key=lambda x: x["count"], reverse=True)

out_path = os.path.join(REPO_ROOT, "_v6_blocking_files.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nDone. {len(results)} files have blocking findings (out of {len(files)}).")
print(f"Results written to {out_path}")
if results:
    print(f"Top offenders:")
    for r in results[:5]:
        print(f"  {r['count']:3d}  {r['file']}")
