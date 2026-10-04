#!/usr/bin/env python3
"""R287 engine: `，的` family + duplicated-pair welds + `？。` + bare-EOL fixes.

Applies tools/r287_sites.json to the live tree.  One record kind:

  lines -- a whole-line splice: the PRE line `line` must equal `old[0]` verbatim
           and is replaced by `new[0]`.  Every repair in this round was reduced
           to this shape by .claude/tmp/r287_build.py: 273 `，的` occurrence ops
           (D 220 / X 19 / F 20 / M2 10 / C 2 / M 1 / D+ 1), 16 duplicated-pair
           welds (op A: `，XX` -> `X。X`, source form `X。X`), 2 `？。` collapses
           and 7 bare-EOL terminators added.

Conventions (mirroring tools/fix_r286.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * every record is a single-line splice (len(old)==len(new)==1) -- any other
    shape aborts.
  * build() validates EVERYTHING in memory before main() writes a single byte
    (fail-closed): per record the PRE line content and the recorded CJK delta;
    per file an independent ascending line rebuild compared byte-for-byte with
    the descending splice and with a char-interval apply, the op-window
    boundary, newline runs and the CJK delta; per touched chapter the 3000
    floor; the untouched-chapter account and both library identities.
  * dry-run by default; pass --apply to write (tmp file + os.replace).
    A second dry-run after --apply must abort on content mismatch (exit 2).
"""
import io
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SITES = os.path.join(HERE, "r287_sites.json")

CJK = re.compile("[一-鿿]")

EXPECT_RECORDS = 208
EXPECT_FILES = 57
EXPECT_CJK = -41
EXPECT_LIBRARY_BEFORE = 3671371
EXPECT_LIBRARY_AFTER = 3671330
FLOOR = 3000
EXPECT_SITE_OPS = 273
EXPECT_WELDS = 16
EXPECT_QMARK = 2
EXPECT_BARE = 7


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
    tmp = path + ".r287tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def build():
    d = json.load(io.open(SITES, encoding="utf-8"))
    records, meta = d["records"], d["meta"]
    kc = meta["kind_counts"]
    site_kinds = sum(v for k, v in kc.items() if k not in ("W", "Q", "B"))
    if (meta["round"] != "R287"
            or meta["site_ops"] != EXPECT_SITE_OPS
            or site_kinds != EXPECT_SITE_OPS
            or kc.get("W") != EXPECT_WELDS
            or kc.get("Q") != EXPECT_QMARK
            or kc.get("B") != EXPECT_BARE
            or sum(kc.values()) != EXPECT_SITE_OPS + EXPECT_WELDS
               + EXPECT_QMARK + EXPECT_BARE
            or sum(len(r["ops"]) for r in records) != sum(kc.values())
            or len(records) != EXPECT_RECORDS
            or meta["records"] != EXPECT_RECORDS
            or meta["files"] != EXPECT_FILES
            or meta["cjk_delta"] != EXPECT_CJK
            or sum(r["cjk_delta"] for r in records) != EXPECT_CJK
            or meta["library_before"] != EXPECT_LIBRARY_BEFORE
            or meta["library_after"] != EXPECT_LIBRARY_AFTER):
        abort("record/meta counts drifted")
    for r in records:
        if not r["old"] or len(r["old"]) != 1 or len(r["new"]) != 1:
            abort("unexpected record shape %s L%s" % (r["path"], r["line"]))

    by_file = defaultdict(list)
    for r in records:
        by_file[r["path"]].append(r)
    if len(by_file) != EXPECT_FILES:
        abort("file count %d != %d" % (len(by_file), EXPECT_FILES))

    plan = {}
    lib_before_touched = 0
    lib_after_touched = 0
    for path in sorted(by_file):
        full = os.path.join(REPO, path)
        if not os.path.isfile(full):
            abort("missing file %s" % path)
        text, bom = read_raw(full)
        lines = text.split("\n")
        n_lines = len(lines)
        n_triple = text.count("\n\n\n")

        offs, off = [], 0
        for ln in lines:
            if text[off:off + len(ln)] != ln:
                abort("line/offset mismatch %s" % path)
            offs.append(off)
            off += len(ln) + 1

        rs = sorted(by_file[path], key=lambda r: -r["line"])
        work = list(lines)
        intervals = []
        delta = 0
        dlines = 0
        for r in rs:
            li = r["line"] - 1
            if not (0 <= li < n_lines):
                abort("line out of range %s L%d" % (path, r["line"]))
            if lines[li] != r["old"][0]:
                abort("content mismatch %s L%d\n  want=%r\n  got =%r"
                      % (path, r["line"], r["old"][0], lines[li]))
            if r["cjk_delta"] != cjk_len(r["new"][0]) - cjk_len(r["old"][0]):
                abort("record cjk drift %s L%d" % (path, r["line"]))
            work[li] = r["new"][0]
            intervals.append((offs[li], offs[li] + len(lines[li]),
                              r["new"][0]))
            dlines += len(r["new"]) - len(r["old"])
            delta += r["cjk_delta"]

        prev_d0 = None
        for d0, d1, _ in sorted(intervals, key=lambda iv: -iv[0]):
            if d1 < d0:
                abort("bad interval %s" % path)
            if prev_d0 is not None and d1 > prev_d0:
                abort("overlapping intervals %s" % path)
            prev_d0 = d0
        after = text
        for d0, d1, repl in sorted(intervals, key=lambda iv: -iv[0]):
            after = after[:d0] + repl + after[d1:]

        rebuild = "\n".join(work)
        # independent walk: start-line map, ascending
        startmap = dict((r["line"] - 1, r) for r in by_file[path])
        walk = []
        for i in range(n_lines):
            if i in startmap:
                walk.append(startmap[i]["new"][0])
            else:
                walk.append(lines[i])
        if "\n".join(walk) != rebuild:
            abort("line walk != descending splice %s" % path)
        if after != rebuild:
            abort("interval apply != line rebuild %s" % path)
        if len(after.split("\n")) - len(lines) != dlines:
            abort("line-count change %s: %d != %d"
                  % (path, len(after.split("\n")) - len(lines), dlines))
        # everything outside the outermost op windows is untouched
        lo = min(r["line"] - 1 for r in by_file[path])
        hi = max(r["line"] for r in by_file[path])
        after_lines = after.split("\n")
        if after_lines[:lo] != lines[:lo] or after_lines[hi + dlines:] != lines[hi:]:
            abort("op-window boundary changed %s" % path)
        if after.count("\n\n\n") > n_triple:
            abort("new triple newline %s" % path)
        if cjk_len(after) - cjk_len(text) != delta:
            abort("cjk delta %s: %d != %d"
                  % (path, cjk_len(after) - cjk_len(text), delta))
        ac = cjk_len(after)
        if ac < FLOOR:
            abort("floor %s: %d < %d" % (path, ac, FLOOR))
        lib_before_touched += cjk_len(text)
        lib_after_touched += ac
        plan[path] = (after, bom, len(by_file[path]), delta)

    # untouched chapters keep their live counts; both identities must hold
    others = 0
    for vol in sorted(os.listdir(os.path.join(REPO, "chapters"))):
        vdir = os.path.join(REPO, "chapters", vol)
        if not os.path.isdir(vdir):
            continue
        for fn in sorted(os.listdir(vdir)):
            rel = "chapters/%s/%s" % (vol, fn)
            if fn.endswith(".md") and "chapter-" in fn and rel not in by_file:
                others += cjk_len(read_raw(os.path.join(REPO, rel))[0])
    if lib_before_touched + others != EXPECT_LIBRARY_BEFORE:
        abort("library before %d != %d"
              % (lib_before_touched + others, EXPECT_LIBRARY_BEFORE))
    lib_after = others + lib_after_touched
    if lib_after != EXPECT_LIBRARY_AFTER:
        abort("library after %d != %d" % (lib_after, EXPECT_LIBRARY_AFTER))
    return plan


def main():
    apply = "--apply" in sys.argv[1:]
    plan = build()

    files = len(plan)
    records = sum(v[2] for v in plan.values())
    delta = sum(v[3] for v in plan.values())
    if records != EXPECT_RECORDS:
        abort("record count %d != %d" % (records, EXPECT_RECORDS))

    if apply:
        for path in sorted(plan):
            after, bom, _, _ = plan[path]
            write_raw(os.path.join(REPO, path), after, bom)
    print("%s: files=%d records=%d cjk_delta=%+d sub_floor=0" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta))


if __name__ == "__main__":
    main()
