#!/usr/bin/env python3
"""R293 engine: R211-shape weld round -- blank-line restores at fused rows.

Applies tools/r293_sites.json to the live tree.  One record kind:

  weld -- a blank line is re-inserted between two fused rows.  `old` is
          "A\\nB" (row A and row B, adjacent with NO blank line between
          them), `new` is "A\\n\\nB"; the recorded ABSOLUTE offset `at` is
          the start of row A and `line` its 1-based number, so the op
          window spans exactly rows `line` and `line+1`.  Every record is
          located by its recorded offset (never by find-search), `old` must
          be unique in the whole file, and the CJK sequence is unchanged
          (cjk_delta = 0 by construction).  Built by
          .claude/tmp/r293_build.py from the v4 census (141 commits over
          2026-08-20..09-06) after live re-location:

    * Group A (66): 99c9efa5 ("Batch de-AI fix", 2026-08-21) deleted `--`
      separator lines together with BOTH surrounding blank lines
      (`A\\n\\n--\\n\\nB` -> `A\\nB`), fusing section boundaries in 21 V1
      chapters -- 53 census WELD rows, 8 census UNK rows re-located by
      anchor (row text drifted since), 5 anchor rows whose A row was
      rewritten by 21ad278a.  The `--` separator is NOT restored (author
      precedent: R281/ch783 -- restore the blank line only).
    * Group B (1): chapter-801, faa1fa54 deleted the blank line before the
      end marker `（第八百零一章完）`.

NOT repaired (KEEP, registered in the plan entry): ch502 (7271467d's inline
code-fence split is an intentional repair -- the closing fence must hug its
content), ch681 / ch783 (regions rewritten / repaired since), ch08 / ch10
(21ad278a merged the fused rows into single lines as part of its de-AI
pass).

Conventions (mirroring tools/fix_r292.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * build() validates EVERYTHING in memory before main() writes a single
    byte (fail-closed): per record the absolute offset, the row anchoring
    at `line`, the file-wide uniqueness of `old`, the recorded CJK delta and
    the shape (new == old with the single "\\n" doubled, CJK sequence
    equal); per file the descending splice compared byte-for-byte with an
    independent per-line ascending rebuild, the chained-station boundary
    rule (a station may start exactly at the previous station's B row), the
    op-window boundary (CHARACTER delta), the line count (n_lines + n_ops),
    newline runs and the CJK delta; per touched chapter the 3000 floor; the
    untouched-chapter account and both library identities.
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
SITES = os.path.join(HERE, "r293_sites.json")

CJK = re.compile("[一-鿿]")

EXPECT_RECORDS = 67
EXPECT_FILES = 22
EXPECT_CJK = 0
EXPECT_LIBRARY_BEFORE = 3671206
EXPECT_LIBRARY_AFTER = 3671206
FLOOR = 3000
EXPECT_A = 66
EXPECT_B = 1


def abort(msg):
    sys.stderr.write("ABORT: %s\n" % msg)
    sys.exit(2)


def cjk_len(s):
    return len(CJK.findall(s))


def cjk_seq(s):
    return "".join(CJK.findall(s))


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
    tmp = path + ".r293tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def build():
    records = json.load(io.open(SITES, encoding="utf-8"))
    if len(records) != EXPECT_RECORDS:
        abort("record count %d != %d" % (len(records), EXPECT_RECORDS))
    ga = sum(1 for r in records if r.get("group") == "A")
    gb = sum(1 for r in records if r.get("group") == "B")
    if (ga, gb) != (EXPECT_A, EXPECT_B):
        abort("group tally %d/%d != %d/%d" % (ga, gb, EXPECT_A, EXPECT_B))
    if sum(r["cjk_delta"] for r in records) != EXPECT_CJK:
        abort("cjk_delta sum drifted")

    by_file = defaultdict(list)
    for r in records:
        for k in ("file", "line", "old", "new", "at", "group", "cjk_delta", "ev"):
            if k not in r:
                abort("record missing %s: %r" % (k, r))
        if r["old"].count("\n") != 1 or r["new"].count("\n") != 2:
            abort("unexpected record shape %s L%s" % (r["file"], r["line"]))
        a, b = r["old"].split("\n")
        if not a.strip() or not b.strip():
            abort("blank row in record %s L%s" % (r["file"], r["line"]))
        if r["new"] != a + "\n\n" + b:
            abort("new != A\\n\\nB %s L%s" % (r["file"], r["line"]))
        by_file[r["file"]].append(r)
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

        rs = sorted(by_file[path], key=lambda r: -r["at"])
        a_rows = set(r["line"] for r in rs)
        delta = 0
        cdelta = 0
        for r in rs:
            a, b = r["old"].split("\n")
            a0, a1 = r["at"], r["at"] + len(r["old"])
            if not (0 <= a0 <= a1 <= len(text)):
                abort("offset out of range %s L%d at=%d" % (path, r["line"], a0))
            if text[a0:a1] != r["old"]:
                abort("content mismatch %s L%d at=%d\n  want=%r\n  got =%r"
                      % (path, r["line"], a0, r["old"], text[a0:a1]))
            if not (1 <= r["line"] < n_lines):
                abort("recorded line out of range %s L%d" % (path, r["line"]))
            if offs[r["line"] - 1] != a0:
                abort("at != start of recorded row %s L%d" % (path, r["line"]))
            if lines[r["line"] - 1] != a or lines[r["line"]] != b:
                abort("recorded rows mismatch %s L%d" % (path, r["line"]))
            if text.count(r["old"]) != 1:
                abort("old not unique in file %s L%d" % (path, r["line"]))
            if r["cjk_delta"] != cjk_len(r["new"]) - cjk_len(r["old"]):
                abort("record cjk drift %s L%d" % (path, r["line"]))
            if cjk_seq(r["old"]) != cjk_seq(r["new"]) or r["cjk_delta"] != 0:
                abort("record shape (cjk) %s L%d" % (path, r["line"]))
            if r["group"] not in ("A", "B"):
                abort("unknown group %s L%d" % (path, r["line"]))
            # row A must open a section: preceded by a blank row, or it is
            # itself the A row of a chained station (ch30 L209/L210)
            if r["line"] > 1:
                prev = r["line"] - 1
                if lines[prev - 1].strip() and prev not in a_rows:
                    abort("row A not preceded by blank %s L%d" % (path, r["line"]))
            delta += r["cjk_delta"]
            cdelta += len(r["new"]) - len(r["old"])

        srs = sorted(rs, key=lambda r: r["at"])
        for a, b in zip(srs, srs[1:]):
            if a["at"] + len(a["old"]) > b["at"]:
                a_rest = a["old"].split("\n")
                b_head = b["old"].split("\n")[0]
                chained = (b["at"] == a["at"] + len(a_rest[0]) + 1
                           and a_rest[1] == b_head)
                if not chained:
                    abort("overlapping ops %s L%d/L%d"
                          % (path, a["line"], b["line"]))

        after = text
        for r in rs:
            a0, a1 = r["at"], r["at"] + len(r["old"])
            after = after[:a0] + r["new"] + after[a1:]

        # independent rebuild: ascending per-line insert of the blank row
        # (recorded `line` are ORIGINAL coordinates -> track the running
        # line shift from previously inserted blank rows)
        walk = list(lines)
        shift = 0
        for r in srs:
            pos = r["line"] - 1 + shift
            a, b = r["old"].split("\n")
            if pos < 0 or pos + 1 >= len(walk):
                abort("rebuild pos out of range %s L%d" % (path, r["line"]))
            if walk[pos] != a or walk[pos + 1] != b:
                abort("line-local mismatch %s L%d" % (path, r["line"]))
            walk.insert(pos + 1, "")
            shift += 1
        if "\n".join(walk) != after:
            abort("line rebuild != descending splice %s" % path)
        if len(after.split("\n")) != n_lines + len(rs):
            abort("line count changed %s" % path)
        # everything outside the outermost op window is byte-identical
        lo = min(r["at"] for r in rs)
        hi = max(r["at"] + len(r["old"]) for r in rs)
        if after[:lo] != text[:lo] or after[hi + cdelta:] != text[hi:]:
            abort("op-window boundary changed %s" % path)
        if after.count("\n\n\n") > n_triple:
            abort("new triple newline %s" % path)
        if cjk_len(after) != cjk_len(text):
            abort("cjk changed %s" % path)
        if cjk_len(after) - cjk_len(text) != delta:
            abort("cjk delta %s" % path)
        ac = cjk_len(after)
        if ac < FLOOR:
            abort("floor %s: %d < %d" % (path, ac, FLOOR))
        lib_before_touched += cjk_len(text)
        lib_after_touched += ac
        plan[path] = (after, bom, len(rs), delta)

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
    print("%s: files=%d records=%d cjk_delta=%+d blank_inserts=%d" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta, records))


if __name__ == "__main__":
    main()
