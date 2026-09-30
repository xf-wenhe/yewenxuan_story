# -*- coding: utf-8 -*-
"""R273 applier: the stray closing corner bracket, adjudicated site by site.

The author's ruling for this family is adjudicate-per-site, so every record in
tools/r273_sites.json carries a whole old line and a whole new line, and each
one is justified in the builder.  Two of the seven shapes add or drop markup
rather than a bracket, and those are called out in the record's `shape`.

Run:
    python tools/fix_r273_brackets.py --dry
    python tools/fix_r273_brackets.py --apply
    python tools/fix_r273_brackets.py --verify

`detect` is a judgement-free raw-shape scan, so the post-condition is that the
library-wide tally of those two shapes falls to exactly the registered residue
-- 22 sites that this round deliberately leaves alone.
"""
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r273_sites.json")
BOM = b"\xef\xbb\xbf"
CJK = re.compile(r"[一-鿿]")
FLOOR = 3000
LQ, RQ = "「", "」"
# S2: bold opened, corner quote closed, but the bold never closed on the line
S2 = re.compile(r"^> \*\*" + re.escape(LQ) + r".*" + re.escape(RQ) + r"$")


def path_of(n):
    if n <= 100:
        return "chapters/volume-1/chapter-%02d-polished.md" % n
    if n <= 250:
        return "chapters/volume-2/chapter-%03d-polished.md" % n
    if n <= 400:
        return "chapters/volume-3/chapter-%03d-polished.md" % n
    if n <= 550:
        return "chapters/volume-4/chapter-%03d-polished.md" % n
    if n <= 750:
        return "chapters/volume-5/chapter-%03d-polished.md" % n
    if n <= 918:
        return "chapters/volume-6/chapter-%03d-polished.md" % n
    return "chapters/volume-7/chapter-%03d-polished.md" % n


def read_bytes(rel):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "rb") as fh:
        return fh.read()


def write_bytes(rel, raw):
    with open(os.path.join(ROOT, rel.replace("/", os.sep)), "wb") as fh:
        fh.write(raw)


def decode(raw, rel):
    """UTF-8, no BOM, LF only -- assert it rather than trusting it."""
    if raw.startswith(BOM):
        raise SystemExit("ABORT: %s carries a BOM" % rel)
    if b"\r" in raw:
        raise SystemExit("ABORT: %s carries a CR" % rel)
    return raw.decode("utf-8")


def split_lines(text):
    """Plain line list: "\\n".join(split_lines(t)) == t byte for byte."""
    return text.split("\n")


def join_lines(lines):
    return "\n".join(lines)


def detect(text):
    """Raw shape scan, judged without reference to the site table."""
    out = []
    for ln, line in enumerate(split_lines(text), 1):
        if line.count(RQ) > line.count(LQ):
            out.append((ln, "S1", RQ + ">" + LQ))
        if S2.match(line):
            out.append((ln, "S2", "bold-open"))
    return out


def by_chapter(records):
    groups = {}
    for rec in records:
        groups.setdefault(rec["ch"], []).append(rec)
    return groups


def library_census():
    """Tally both shapes across every chapter file."""
    import glob
    counts = {"S1": 0, "S2": 0}
    where = {"S1": [], "S2": []}
    for path in sorted(glob.glob(os.path.join(ROOT, "chapters", "volume-*",
                                              "*.md"))):
        name = os.path.basename(path)
        if name.startswith("outline"):
            continue          # outline files are not chapter text
        rel = path[len(ROOT) + 1:].replace(os.sep, "/")
        for ln, shape, _ in detect(decode(open(path, "rb").read(), rel)):
            counts[shape] += 1
            where[shape].append((rel, ln))
    return counts, where


def floor_screen(table):
    """R268's lesson: screen the whole table before writing anything."""
    blocked = []
    groups = by_chapter(table["records"])
    for ch in sorted(groups):
        rel = path_of(ch)
        text = decode(read_bytes(rel), rel)
        before = len(CJK.findall(text))
        after = before
        for rec in groups[ch]:
            after += (len(CJK.findall(rec["new"]))
                      - len(CJK.findall(rec["old"])))
        if after < FLOOR:
            blocked.append((ch, before, after))
    return blocked


def apply(table):
    blocked = floor_screen(table)
    if blocked:
        raise SystemExit("ABORT: floor screen failed: %r" % blocked)
    groups = by_chapter(table["records"])
    written = 0
    for ch in sorted(groups):
        rel = path_of(ch)
        lines = split_lines(decode(read_bytes(rel), rel))
        for rec in sorted(groups[ch], key=lambda r: r["line"]):
            idx = rec["line"] - 1
            if lines[idx] != rec["old"]:
                raise SystemExit("ABORT: %s line %d is not the recorded text"
                                 % (rel, rec["line"]))
            lines[idx] = rec["new"]
        write_bytes(rel, join_lines(lines).encode("utf-8"))
        written += 1
    print("apply: wrote %d chapter(s)" % written)


def verify(table):
    groups = by_chapter(table["records"])
    bad = []
    inverses = 0
    for ch in sorted(groups):
        rel = path_of(ch)
        blob = subprocess.run(("git", "show", "HEAD:%s" % rel), cwd=ROOT,
                              capture_output=True, check=True).stdout
        head = split_lines(decode(blob, rel))
        have = split_lines(decode(read_bytes(rel), rel))
        recs = sorted(groups[ch], key=lambda r: r["line"])

        # Replay the table onto the HEAD blob.  Anything the round did that the
        # table does not describe shows up as a byte difference.
        want = list(head)
        for rec in recs:
            idx = rec["line"] - 1
            if head[idx] != rec["old"]:
                bad.append("%s L%d: HEAD line is not the recorded text"
                           % (rel, rec["line"]))
                continue
            want[idx] = rec["new"]
        if have != want:
            bad.append("%s: replay is not byte-identical" % rel)
            continue

        # Every record anchors on the whole line, so the inverse is exact and
        # needs nothing from the spans -- one class, counted, not skipped.
        for rec in recs:
            idx = rec["line"] - 1
            if want[idx] != rec["new"] or head[idx] != rec["old"]:
                bad.append("%s L%d: line inverse does not restore"
                           % (rel, rec["line"]))
            inverses += 1

    ok = len(groups) - len({b.split(":")[0] for b in bad})
    print("verify: %d/%d chapter(s) replay byte-identically from HEAD"
          % (ok, len(groups)))
    print("verify: %d/%d whole-line inverse(s)" % (inverses, len(table["records"])))
    for b in bad[:20]:
        print("  %s" % b)

    counts, where = library_census()
    reg = table["registered"]
    # Outline entries carry a `file` key instead of `ch`; the census walks
    # chapter files only, so they are not part of the expected residue.
    want = {shape: sum(1 for r in reg
                       if r["shape"] == shape and "ch" in r)
            for shape in ("S1", "S2")}
    print("post-condition: S1 %d (registered %d), S2 %d (registered %d)"
          % (counts["S1"], want["S1"], counts["S2"], want["S2"]))
    if counts != want:
        print("  RESIDUE MISMATCH")
        for shape in ("S1", "S2"):
            if counts[shape] != want[shape]:
                for rel, ln in where[shape]:
                    print("    %s L%d" % (rel, ln))
    return not bad and counts == want


def main():
    with io.open(SITES, encoding="utf-8") as fh:
        table = json.load(fh)
    arg = sys.argv[1] if len(sys.argv) > 1 else "--dry"
    counts, _ = library_census()
    print("before: S1 %d, S2 %d" % (counts["S1"], counts["S2"]))
    if arg == "--dry":
        blocked = floor_screen(table)
        print("dry: %d record(s) over %d chapter(s), %d floor-blocked"
              % (len(table["records"]),
                 len({r["ch"] for r in table["records"]}), len(blocked)))
        for rec in table["records"]:
            print("  ch%-4d L%-4d %-13s %s | %s"
                  % (rec["ch"], rec["line"], rec["shape"],
                     rec["old"][:42], rec["new"][:42]))
    elif arg == "--apply":
        apply(table)
    elif arg == "--verify":
        sys.exit(0 if verify(table) else 1)
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
