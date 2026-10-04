#!/usr/bin/env python3
"""R286 engine: line-anchored repair round.

Applies tools/r286_sites.json to the live tree.  One record kind:

  lines -- a whole-line splice: the PRE lines [line, line+len(old)) must equal
           `old` verbatim and are replaced by `new` (which may be empty = pure
           deletion).  Every repair in this round was reduced to this shape by
           .claude/tmp/r286_build.py: substring fixes (count=1 asserted at build
           time), marker welds split into [body, '', marker] (+ refill block),
           orphan-paren line drops, stray end-marker drops and the 51 refill
           blocks inserted before the chapter-end marker.

Conventions (mirroring tools/fix_r285.py / tools/fix_r284.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * build() validates EVERYTHING in memory before main() writes a single byte
    (fail-closed): per record the PRE line window content and the recorded CJK
    delta; per file the interval set (descending, non-overlapping), an
    independent line-level rebuild of the after-text compared byte-for-byte
    with the descending splice, a third char-interval application compared
    against both, the line-count change, first/last line, newline runs and the
    CJK delta; per refill chapter the final count is checked against meta.
  * floors: every touched chapter must end >= 3000 CJK, every refill chapter
    >= 3050; the untouched sub-floor account is re-derived and must be empty.
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
SITES = os.path.join(HERE, "r286_sites.json")

CJK = re.compile("[一-鿿]")

EXPECT_RECORDS = 122
EXPECT_FILES = 91
EXPECT_CJK = 6083
EXPECT_LIBRARY_BEFORE = 3665288
EXPECT_LIBRARY_AFTER = 3671371
FLOOR = 3000
REFILL_FLOOR = 3050


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
    tmp = path + ".r286tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def build():
    d = json.load(io.open(SITES, encoding="utf-8"))
    records, meta = d["records"], d["meta"]
    if (len(records) != EXPECT_RECORDS
            or sum(r["cjk_delta"] for r in records) != EXPECT_CJK
            or meta["library_before"] != EXPECT_LIBRARY_BEFORE
            or meta["library_after"] != EXPECT_LIBRARY_AFTER):
        abort("record/meta counts drifted")
    for r in records:
        if r["kind"] != "lines" or not r["old"]:
            abort("unexpected record shape %s L%s" % (r["path"], r["line"]))

    by_file = defaultdict(list)
    for r in records:
        by_file[r["path"]].append(r)
    if len(by_file) != EXPECT_FILES:
        abort("file count %d != %d" % (len(by_file), EXPECT_FILES))

    refill = dict((int(k), v) for k, v in meta["refill_chapters"].items())
    if len(refill) != 51:
        abort("refill account %d != 51" % len(refill))

    plan = {}
    floor_after = {}
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
        dlines = 0
        delta = 0
        for r in rs:
            li = r["line"] - 1
            if not (0 <= li and li + len(r["old"]) <= n_lines):
                abort("line out of range %s L%d" % (path, r["line"]))
            got = lines[li:li + len(r["old"])]
            if got != r["old"]:
                abort("content mismatch %s L%d\n  want=%r\n  got =%r"
                      % (path, r["line"], r["old"], got))
            if r["cjk_delta"] != cjk_len("\n".join(r["new"])) - cjk_len(
                    "\n".join(r["old"])):
                abort("record cjk drift %s L%d" % (path, r["line"]))
            work[li:li + len(r["old"])] = r["new"]
            last_idx = li + len(r["old"]) - 1
            d0 = offs[li]
            d1 = offs[last_idx] + len(lines[last_idx])
            if not r["new"]:
                # a pure deletion also consumes the removed block's trailing
                # newline, or the following blank line would double up
                if last_idx == n_lines - 1:
                    abort("deletion at EOF %s L%d" % (path, r["line"]))
                d1 += 1
            intervals.append((d0, d1, "\n".join(r["new"])))
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

        rebuild = "\n".join(l for l in work)
        # independent walk: start-line map + consumed lines, ascending
        startmap = {}
        consumed = set()
        for r in by_file[path]:
            startmap[r["line"] - 1] = r
            for k in range(1, len(r["old"])):
                consumed.add(r["line"] - 1 + k)
        walk, i = [], 0
        while i < n_lines:
            if i in startmap:
                r = startmap[i]
                walk.extend(r["new"])
                i += len(r["old"])
            elif i in consumed:
                i += 1
            else:
                walk.append(lines[i])
                i += 1
        if "\n".join(walk) != rebuild:
            abort("line walk != descending splice %s" % path)
        if after != rebuild:
            abort("interval apply != line rebuild %s" % path)
        if len(after.split("\n")) - len(lines) != dlines:
            abort("line-count change %s: %d != %d"
                  % (path, len(after.split("\n")) - len(lines), dlines))
        # everything outside the outermost op windows is untouched
        lo = min(r["line"] - 1 for r in by_file[path])
        hi = max(r["line"] - 1 + len(r["old"]) for r in by_file[path])
        after_lines = after.split("\n")
        if after_lines[:lo] != lines[:lo] or after_lines[hi + dlines:] != lines[hi:]:
            abort("op-window boundary changed %s" % path)
        if after.count("\n\n\n") > n_triple:
            abort("new triple newline %s" % path)
        if cjk_len(after) - cjk_len(text) != delta:
            abort("cjk delta %s: %d != %d"
                  % (path, cjk_len(after) - cjk_len(text), delta))
        ac = cjk_len(after)
        floor = REFILL_FLOOR if int(re.search(r"chapter-(\d+)", path).group(1)) in refill \
            else FLOOR
        if ac < floor:
            abort("floor %s: %d < %d" % (path, ac, floor))
        ch = int(re.search(r"chapter-(\d+)", path).group(1))
        if ch in refill:
            want = refill[ch]["final"]
            if ac != want:
                abort("refill final drift ch%d: %d != %d" % (ch, ac, want))
            floor_after[ch] = ac
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
    if meta["untouched_sub_floor"]:
        abort("untouched sub-floor not empty")
    return plan, floor_after, meta


def main():
    apply = "--apply" in sys.argv[1:]
    plan, floor_after, meta = build()

    files = len(plan)
    records = sum(v[2] for v in plan.values())
    delta = sum(v[3] for v in plan.values())
    if records != EXPECT_RECORDS:
        abort("record count %d != %d" % (records, EXPECT_RECORDS))

    if apply:
        for path in sorted(plan):
            after, bom, _, _ = plan[path]
            write_raw(os.path.join(REPO, path), after, bom)
    print("%s: files=%d records=%d cjk_delta=%+d refill_ok=%d sub_floor=0" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta, len(floor_after)))


if __name__ == "__main__":
    main()
