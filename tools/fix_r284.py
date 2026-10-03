#!/usr/bin/env python3
"""R284 engine: quote-headed attribution repair (welds / EOL fragment deletes /
hand specials).

Applies tools/r284_sites.json to the live tree. Every record is an in-line
replacement located by its recorded offset `at`:

  weld    -- mid-line attribution after a speech, trailing 。 -> ，(0 CJK)
  delete  -- EOL degenerate NP / machine-member fragment; the leading quote is
             kept as the closer of the speech, the fragment text is removed
  special -- 19 hand-adjudicated lines (missing opener / displaced attribution
             / unbalanced-quote repairs), 35 replaces

Conventions (mirroring tools/fix_r279.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * build() validates EVERYTHING in memory -- window match per record, line
    count, first/last line, newline runs, CJK delta, >=3000 floor -- and only
    after it has validated every file does main() write a single byte
    (fail-closed: no half-applied round).
  * within a line, records are applied highest `at` first so offsets stay
    valid; across a file the edits never change the line structure.
  * dry-run by default; pass --apply to write (tmp file + os.replace).
"""
import io
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SITES = os.path.join(HERE, "r284_sites.json")

CJK = re.compile("[一-鿿]")

EXPECT_RECORDS = 1524
EXPECT_WELD = 818
EXPECT_DELETE = 671
EXPECT_SPECIAL = 35
FLOOR = 3000

def abort(msg):
    sys.stderr.write("ABORT: %s\n" % msg)
    sys.exit(2)

def cjk_len(s):
    return len(CJK.findall(s))

def read_raw(path):
    raw = io.open(path, "rb").read()
    bom = raw.startswith(b"\xef\xbb\xbf")
    body = raw[3:] if bom else raw
    if b"\r" in body:
        abort("CR byte in %s" % path)
    return body.decode("utf-8"), bom

def write_raw(path, text, bom):
    data = text.encode("utf-8")
    if bom:
        data = b"\xef\xbb\xbf" + data
    tmp = path + ".r284tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)

def build():
    d = json.load(io.open(SITES, encoding="utf-8"))
    records = d["records"]

    counts = Counter(r["kind"] for r in records)
    if (len(records) != EXPECT_RECORDS or counts["weld"] != EXPECT_WELD
            or counts["delete"] != EXPECT_DELETE or counts["special"] != EXPECT_SPECIAL):
        abort("record counts drifted: %d %s" % (len(records), dict(counts)))

    by_file = defaultdict(list)
    for r in records:
        if not r["find"]:
            abort("empty find %s L%d" % (r["path"], r["line"]))
        by_file[r["path"]].append(r)

    plan = {}
    for path in sorted(by_file):
        full = os.path.join(REPO, path)
        if not os.path.isfile(full):
            abort("missing file %s" % path)
        text, bom = read_raw(full)
        lines = text.split("\n")
        n_lines = len(lines)
        first, last = lines[0], lines[-1]

        by_line = defaultdict(list)
        for r in by_file[path]:
            by_line[r["line"]].append(r)

        for no in sorted(by_line):
            if no < 1 or no > n_lines:
                abort("line out of range %s L%d" % (path, no))
            ln = lines[no - 1]
            # highest offset first, so every later (smaller-at) window is intact
            for r in sorted(by_line[no], key=lambda r: -r["at"]):
                at, f, new = r["at"], r["find"], r["new"]
                if at < 0 or ln[at:at + len(f)] != f:
                    abort("window mismatch %s L%d at=%d %r" % (path, no, at, f))
                ln = ln[:at] + new + ln[at + len(f):]
            lines[no - 1] = ln

        after = "\n".join(lines)
        if len(lines) != n_lines:
            abort("line count changed %s" % path)
        if lines[0] != first or lines[-1] != last:
            abort("first/last line changed %s" % path)
        if after.count("\n\n\n") != text.count("\n\n\n"):
            abort("newline run changed %s" % path)

        delta = cjk_len(after) - cjk_len(text)
        want = sum(cjk_len(r["new"]) - cjk_len(r["find"]) for r in by_file[path])
        if delta != want:
            abort("cjk delta %s: %d != %d" % (path, delta, want))
        if cjk_len(after) < FLOOR:
            abort("floor broken %s = %d" % (path, cjk_len(after)))

        plan[path] = (after, bom, len(by_file[path]), delta)
    return plan

def main():
    apply = "--apply" in sys.argv[1:]
    plan = build()

    files = len(plan)
    records = sum(v[2] for v in plan.values())
    delta = sum(v[3] for v in plan.values())

    if apply:
        for path in sorted(plan):
            after, bom, _, _ = plan[path]
            write_raw(os.path.join(REPO, path), after, bom)
    print("%s: files=%d records=%d cjk_delta=%+d" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta))

if __name__ == "__main__":
    main()
