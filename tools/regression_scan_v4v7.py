#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Post-R227 regression scan for V4-V7.
Runs check-ai-patterns.js --json once per volume, aggregates blocking/advisory
per chapter, counts CJK, and writes a final-regression.json-structured artifact.
Also prints a human-readable summary (esp. chapters with blocking > 0).
"""
import json, glob, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN = os.path.join(ROOT, ".claude", "skills", "story-deslop", "scripts", "check-ai-patterns.js")
OUT = os.path.join(ROOT, ".claude", "regression-v4-v7-postR227.json")
VOLUMES = [4, 5, 6, 7]

def cjk_count(path):
    with open(path, "r", encoding="utf-8-sig") as fh:
        return sum(1 for ch in fh.read() if 0x4e00 <= ord(ch) <= 0x9fff)

def run_volume(v):
    files = sorted(glob.glob(os.path.join(ROOT, "chapters", f"volume-{v}", "chapter-*-polished.md")))
    by_file = {os.path.basename(f): {"file": os.path.basename(f), "blocking": 0, "advisory": 0, "cjk": 0}
               for f in files}
    if not files:
        return {"files": 0, "blocking": 0, "advisory": 0, "chapters": []}
    # run node with explicit file list (no shell). node emits UTF-8; on Windows
    # subprocess defaults to the system ANSI codepage (GBK), so force utf-8.
    proc = subprocess.run(["node", SCAN, "--json"] + files,
                          capture_output=True, encoding="utf-8", errors="replace",
                          cwd=ROOT)
    if proc.returncode not in (0, 1):
        sys.stderr.write(f"volume-{v}: node exited {proc.returncode}\n{(proc.stderr or '')[:500]}\n")
    try:
        d = json.loads(proc.stdout or "")
        findings = d.get("findings", [])
    except Exception as e:
        sys.stderr.write(f"volume-{v}: JSON parse failed: {e}\n{(proc.stdout or '')[:300]}\n")
        findings = []
    for f in files:
        by_file[os.path.basename(f)]["cjk"] = cjk_count(f)
    for fnd in findings:
        key = os.path.basename(fnd.get("file", ""))
        if key not in by_file:
            continue
        sev = fnd.get("severity", "advisory")
        if sev == "blocking":
            by_file[key]["blocking"] += 1
        else:
            by_file[key]["advisory"] += 1
    chapters = [by_file[os.path.basename(f)] for f in files]
    return {
        "files": len(files),
        "blocking": sum(c["blocking"] for c in chapters),
        "advisory": sum(c["advisory"] for c in chapters),
        "chapters": chapters,
    }

def main():
    result = {"volumes": {}}
    dirty = []
    for v in VOLUMES:
        res = run_volume(v)
        result["volumes"][f"volume-{v}"] = res
        vdirty = [c for c in res["chapters"] if c["blocking"] > 0]
        dirty.extend((v, c) for c in vdirty)
        print(f"volume-{v}: files={res['files']}  blocking={res['blocking']}  advisory={res['advisory']}  dirty_chapters={len(vdirty)}")
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
    print(f"\nArtifact written: {os.path.relpath(OUT, ROOT)}")
    tot_blk = sum(result["volumes"][f"volume-{v}"]["blocking"] for v in VOLUMES)
    tot_adv = sum(result["volumes"][f"volume-{v}"]["advisory"] for v in VOLUMES)
    print(f"TOTAL V4-V7: blocking={tot_blk}  advisory={tot_adv}")
    if dirty:
        print(f"\n=== CHAPTERS WITH BLOCKING > 0 ({len(dirty)}) — need fix ===")
        for v, c in sorted(dirty, key=lambda x: x[1]["file"]):
            print(f"  volume-{v}/{c['file']}  blocking={c['blocking']}  advisory={c['advisory']}")
    else:
        print("\nNo blocking findings across V4-V7. R226 claim confirmed for these volumes.")

if __name__ == "__main__":
    main()
