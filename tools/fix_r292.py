#!/usr/bin/env python3
"""R292 engine: docket shape families -- duplicate-char welds, punctuation welds, chain residue.

Applies tools/r292_sites.json to the live tree.  One record kind:

  sub -- an in-line splice: at the recorded ABSOLUTE file offset `at` the text
         must equal `old` verbatim and is replaced by `new`.  Every record is
         located by its recorded offset (never by find-search), and `old` must
         also be unique inside its recorded line.  Built by
         .claude/tmp/r292_build.py from the 164-line A/B double-char suspects
         census after per-site parent/root forensics:

           * Group A (25, cjk_delta < 0): duplicate-char/word welds repaired by
             the MINIMAL deletion -- the extruded character is the machine
             duplicate, the author word survives:
               `咬住嘴嘴唇`(3caa26f6^ 咬了咬嘴唇) / `目光僵住住了`(9cd5e651^
               目光停住了) / `语气冷静无波波动`(9cd5e651^ 声音很平) /
               `声音略微抖动动` x7 + `嗓子发抖抖起来`(afae40c7 声音打颤起来) /
               `下意识地地摸`(dd7b95a9 情不自禁地摸) / `嗓音轻得得难以捕捉` /
               `赵磊的说话说话话音`(9cd5e651^ 声音很轻) / `握紧拳拳头` /
               `朵朵的嗓音沉得得轻之又轻` x4 / `嗓音中带着带着不安` /
               `已经全部解解除`(7ed2e466 完全解除) / `朵朵继续画画了了` /
               `四面八方传来来`(9cd5e651^ 系统的声音从四面八方传来).
           * Group B (29, CJK sequence identical): punctuation welds restored by
             the smallest inserted separator, every one witnessed by the damage
             round's PARENT line or the clean root:
               `他在笑，笑的时候`(f7622c68^ 逐字) / `它在等，等你露出破绽`
               (f7622c68) / `推开门。门没有锁`(3bab93f8) / `外面下着雨，雨水`
               (3bab93f8) / `现在我给你。你要` / `不要担心我。我选择的` /
               `第N扇门。门的上面` x3 / `蓝色的桥。桥上有两个人`(eee81640) /
               `暗色的门。门上没有标记` / `白色空间在变。变成了灰色` /
               `洞不大，大约一个拳头大` / `那些人在等，等了很久`(ch418 family) /
               the ch568 boundary-structure `。` x2 (eee81640 T).
           * Group C (7): word/sentence-form residue of the R133-R183 chain
             rounds, replaced by the root form (variant layer kept):
               `推荐等级是级.5`(500f669b) / `里头有人在门洞` / `没有一直。一扇
               门开了`(e0040d63) / `声调里带着一种`(3bab93f8 声音里面有一种) /
               `从左到右，从A到B到C`(a94cf0bc) / `那些话`(9cd5e651^ 那些声音
               还在耳边回响) / `声调里没有评判`(eee81640 她的声音里没有评判).

Conventions (mirroring tools/fix_r291.py):
  * read_raw / write_raw preserve the file's BOM byte-for-byte; a CR byte
    aborts (the library is LF-only since R271).
  * build() validates EVERYTHING in memory before main() writes a single byte
    (fail-closed): per record the absolute offset, the line containment, the
    uniqueness of `old` in its line, the recorded CJK delta and the group
    shape (A = pure deletion with negative delta, B = CJK sequence equal with
    zero delta); per file the descending splice compared byte-for-byte with an
    independent per-line rebuild, the op-window boundary, line count, newline
    runs and the CJK delta; per touched chapter the 3000 floor; the untouched-
    chapter account and both library identities.
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
SITES = os.path.join(HERE, "r292_sites.json")

CJK = re.compile("[一-鿿]")

EXPECT_RECORDS = 61
EXPECT_FILES = 53
EXPECT_CJK = -40
EXPECT_LIBRARY_BEFORE = 3671246
EXPECT_LIBRARY_AFTER = 3671206
FLOOR = 3000
EXPECT_A = 25
EXPECT_B = 29
EXPECT_C = 7


def abort(msg):
    sys.stderr.write("ABORT: %s\n" % msg)
    sys.exit(2)


def cjk_len(s):
    return len(CJK.findall(s))


def cjk_seq(s):
    return "".join(CJK.findall(s))


def pure_deletion(old, new):
    """True if new equals old minus one contiguous run (k >= 1)."""
    if len(new) >= len(old):
        return False
    for i in range(len(old)):
        for k in range(1, len(old) - i + 1):
            if old[:i] + old[i + k:] == new:
                return True
    return False


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
    tmp = path + ".r292tmp"
    with io.open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def build():
    records = json.load(io.open(SITES, encoding="utf-8"))
    if len(records) != EXPECT_RECORDS:
        abort("record count %d != %d" % (len(records), EXPECT_RECORDS))
    ga = sum(1 for r in records if r.get("group") == "A")
    gb = sum(1 for r in records if r.get("group") == "B")
    gc = sum(1 for r in records if r.get("group") == "C")
    if (ga, gb, gc) != (EXPECT_A, EXPECT_B, EXPECT_C):
        abort("group tally %d/%d/%d != %d/%d/%d"
              % (ga, gb, gc, EXPECT_A, EXPECT_B, EXPECT_C))
    if sum(r["cjk_delta"] for r in records) != EXPECT_CJK:
        abort("cjk_delta sum drifted")

    by_file = defaultdict(list)
    for r in records:
        for k in ("file", "line", "old", "new", "at", "group", "cjk_delta", "ev"):
            if k not in r:
                abort("record missing %s: %r" % (k, r))
        if not r["old"] or "\n" in r["old"] or "\n" in r["new"]:
            abort("unexpected record shape %s L%s" % (r["file"], r["line"]))
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
        delta = 0
        cdelta = 0
        for r in rs:
            a0, a1 = r["at"], r["at"] + len(r["old"])
            if not (0 <= a0 <= a1 <= len(text)):
                abort("offset out of range %s L%d at=%d" % (path, r["line"], a0))
            if text[a0:a1] != r["old"]:
                abort("content mismatch %s L%d at=%d\n  want=%r\n  got =%r"
                      % (path, r["line"], a0, r["old"], text[a0:a1]))
            lo = offs[r["line"] - 1]
            if not (lo <= a0 and a1 <= lo + len(lines[r["line"] - 1])):
                abort("op outside recorded line %s L%d" % (path, r["line"]))
            if lines[r["line"] - 1].count(r["old"]) != 1:
                abort("old not unique in line %s L%d" % (path, r["line"]))
            if r["cjk_delta"] != cjk_len(r["new"]) - cjk_len(r["old"]):
                abort("record cjk drift %s L%d" % (path, r["line"]))
            if r["group"] == "A":
                if not pure_deletion(r["old"], r["new"]) or r["cjk_delta"] >= 0:
                    abort("group A shape %s L%d" % (path, r["line"]))
            elif r["group"] == "B":
                if cjk_seq(r["old"]) != cjk_seq(r["new"]) or r["cjk_delta"] != 0:
                    abort("group B shape %s L%d" % (path, r["line"]))
            delta += r["cjk_delta"]
            cdelta += len(r["new"]) - len(r["old"])

        prev_a0 = None
        for r in rs:
            a0, a1 = r["at"], r["at"] + len(r["old"])
            if prev_a0 is not None and a1 > prev_a0:
                abort("overlapping ops %s L%d" % (path, r["line"]))
            prev_a0 = a0

        after = text
        for r in rs:
            a0, a1 = r["at"], r["at"] + len(r["old"])
            after = after[:a0] + r["new"] + after[a1:]

        # independent rebuild: per line, ops applied ascending within the line
        # (recorded `at` are ORIGINAL coordinates -> track the running shift)
        per_line = defaultdict(list)
        for r in rs:
            per_line[r["line"] - 1].append(r)
        walk = list(lines)
        for li, lrs in per_line.items():
            s = lines[li]
            base = offs[li]
            shift = 0
            for r in sorted(lrs, key=lambda r: r["at"]):
                i = r["at"] - base + shift
                if s[i:i + len(r["old"])] != r["old"]:
                    abort("line-local mismatch %s L%d" % (path, li + 1))
                s = s[:i] + r["new"] + s[i + len(r["old"]):]
                shift += len(r["new"]) - len(r["old"])
            walk[li] = s
        if "\n".join(walk) != after:
            abort("line rebuild != descending splice %s" % path)
        if len(after.split("\n")) != n_lines:
            abort("line count changed %s" % path)
        # everything outside the outermost op window is byte-identical
        lo = min(r["at"] for r in rs)
        hi = max(r["at"] + len(r["old"]) for r in rs)
        if after[:lo] != text[:lo] or after[hi + cdelta:] != text[hi:]:
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
    print("%s: files=%d records=%d cjk_delta=%+d sub_floor=0" % (
        "APPLIED" if apply else "DRY-RUN (pass --apply to write)",
        files, records, delta))


if __name__ == "__main__":
    main()
