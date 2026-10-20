#!/usr/bin/env python3
"""R300 engine: delete P3 tier-2 embedded machine-broadcast segments.

Applies tools/r300_sites.json to the live tree.  All records are span-kind:
one or more SPLIT P3-member segments inside a line; each span [at, end) is
removed except its leading closing-quote chars (`"」』】）`: R284 close-quote
semantics, so a speech keeps its closing quote).

R297 (step 1) already deleted the 68 whole-line P3 sites; this round handles
only embedded (mixed-line) segments.

Conventions (mirroring tools/fix_r285.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * build() validates EVERYTHING in memory before main() writes a single byte
    (fail-closed): per record the line content, a fresh SPLIT recomputation of
    every span (membership, offsets, lead), the expected after-line.
  * floor pre-screen: chapters that would fall below 3000 CJK after deletion
    are logged but NOT blocked (author: defer to later round).
  * dry-run by default; pass --apply to write (tmp file + os.replace).
"""
import io
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CHAPTERS = os.path.join(REPO, "chapters")
SITES = os.path.join(HERE, "r300_sites.json")

CJK = re.compile("[一-鿿]")
SPLIT = re.compile(r"[^。！？…\n]*[。！？…]|[^。！？…\n]+")
QLEAD = set('"」』】）')

EXPECT_RECORDS = 1251
EXPECT_SEGS = 1459
EXPECT_WHOLE = 0
EXPECT_CJK = 14296
EXPECT_CHAPTERS = 345


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
    tmp = path + ".r300tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def build():
    d = json.load(io.open(SITES, encoding="utf-8"))
    records, meta = d["records"], d["meta"]
    n_segs = sum(len(r["segs"]) for r in records)
    if (len(records) != EXPECT_RECORDS
            or n_segs != EXPECT_SEGS
            or sum(r["cjk"] for r in records) != EXPECT_CJK):
        abort("record counts drifted")
    p3_set = set(meta["p3_members"])

    by_file = defaultdict(list)
    for r in records:
        by_file[r["path"]].append(r)
    if len(by_file) != EXPECT_CHAPTERS:
        abort("chapter count %d != %d" % (len(by_file), EXPECT_CHAPTERS))

    plan = {}
    floor_after = {}
    for path in sorted(by_file):
        full = os.path.join(REPO, path)
        if not os.path.isfile(full):
            abort("missing file %s" % path)
        text, bom = read_raw(full)
        lines = text.split("\n")
        n_lines = len(lines)
        first, last = lines[0], lines[-1]
        n_triple = text.count("\n\n\n")

        offs, off = [], 0
        for ln in lines:
            if text[off:off + len(ln)] != ln:
                abort("line/offset mismatch %s" % path)
            offs.append(off)
            off += len(ln) + 1

        new_lines = list(lines)
        intervals = []
        drops = 0
        delta = 0
        for r in sorted(by_file[path], key=lambda r: r["line_no"]):
            li = r["line_no"] - 1
            if not (0 <= li < n_lines):
                abort("line out of range %s L%d" % (path, r["line_no"]))
            ln = lines[li]
            if ln != r["text"]:
                abort("content mismatch %s L%d" % (path, r["line_no"]))

            ms = []
            for m in SPLIT.finditer(ln):
                t = m.group(0).strip().replace("\n", "")
                if t in p3_set:
                    ms.append((t, m.start(), m.end()))
            if len(ms) != len(r["segs"]):
                abort("span count drift %s L%d" % (path, r["line_no"]))
            for (t, a, b), s in zip(ms, r["segs"]):
                lead = 0
                while a + lead < b and ln[a + lead] in QLEAD:
                    lead += 1
                if (t != s["text"] or a != s["at"] or b != s["end"]
                        or lead != s["lead"]):
                    abort("span drift %s L%d" % (path, r["line_no"]))

            keep = []
            lastp = 0
            for s in r["segs"]:
                keep.append(ln[lastp:s["at"] + s["lead"]])
                lastp = s["end"]
            keep.append(ln[lastp:])
            after_ln = "".join(keep)
            if after_ln != r["after"]:
                abort("after drift %s L%d" % (path, r["line_no"]))

            if after_ln.strip() == "":
                abort("span site empty after %s L%d" % (path, r["line_no"]))
            new_lines[li] = after_ln
            for s in r["segs"]:
                intervals.append((offs[li] + s["at"] + s["lead"],
                                  offs[li] + s["end"]))
            delta += r["cjk"]

        prev_d0 = None
        for d0, d1 in sorted(intervals, key=lambda iv: -iv[0]):
            if d1 <= d0:
                abort("empty interval %s" % path)
            if prev_d0 is not None and d1 > prev_d0:
                abort("overlapping intervals %s" % path)
            prev_d0 = d0
        after = text
        for d0, d1 in sorted(intervals, key=lambda iv: -iv[0]):
            after = after[:d0] + after[d1:]

        rebuild = "\n".join(l for l in new_lines if l is not None)
        if after != rebuild:
            abort("interval apply != line rebuild %s" % path)
        if len(lines) - len(after.split("\n")) != drops:
            abort("split-length drop %s: %d != %d"
                  % (path, len(lines) - len(after.split("\n")), drops))
        if after.split("\n")[0] != first or after.split("\n")[-1] != last:
            abort("first/last line changed %s" % path)
        if after.count("\n\n\n") > n_triple:
            abort("new triple newline %s" % path)
        if cjk_len(text) - cjk_len(after) != delta:
            abort("cjk delta %s: %d != %d"
                  % (path, cjk_len(text) - cjk_len(after), delta))
        ac = cjk_len(after)
        if ac < 3000:
            floor_after[path] = ac
        plan[path] = (after, bom, len(by_file[path]), -delta)
    return plan, floor_after, meta


def main():
    apply = "--apply" in sys.argv[1:]
    plan, floor_after, meta = build()

    files = len(plan)
    records = sum(v[2] for v in plan.values())
    delta = sum(v[3] for v in plan.values())
    want_floor = {c["path"]: c["after"] for c in meta["floor"]["chapters"]}
    got_floor = {p: c for p, c in floor_after.items()}
    if got_floor != want_floor:
        abort("sub-floor account drifted: %d vs %d chapters"
              % (len(got_floor), len(want_floor)))

    if apply:
        for path in sorted(plan):
            after, bom, _, _ = plan[path]
            write_raw(os.path.join(REPO, path), after, bom)
    print("%s: files=%d records=%d cjk_delta=%+d sub_floor=%d" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta, len(floor_after)))


if __name__ == "__main__":
    main()
