#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R272 -- four families whose whole repair is one fixed span substitution.

The `，得` family (54 lines carrying the bigram) turned out to be two uniform
machine shapes once the ancestry was read, and both reduce to dropping a
duplicated complement:

  RA  `压低嗓音，得` -> `嗓音压得`
      `赵大嘴把压低嗓音，得比平时更深。` -> `赵大嘴把嗓音压得比平时更深。`
  RB  `放低，得`     -> `放得`
      `朵朵的嗓音放低，得极低，`       -> `朵朵的嗓音放得极低，`

Three things make this mechanically provable rather than a rewrite:

  * `压低嗓音，得` is not Chinese in any context; its replacement transposes
    the object back where it belongs, and the repaired 2-gram `嗓音压得` is
    used 7 times elsewhere in the library;
  * the complement dropped is the *duplicate* one, which is why every site
    costs exactly 1 CJK and nothing else moves;
  * the other 16 lines carrying `，得` are ordinary Chinese (`得有选择地开`,
    `得出了结论`, `得你自己画`) and are left alone.

Families A and C ride along because they are the same kind of edit -- one span,
replaced exactly once, on one line:

  A_CHEST  `。的胸口` -> ``      3 sites, -3 CJK   (PRE-attested: R269 read
           `叶文轩的眼睛在看赵大嘴的胸口，` behind it)
  A_DE     `。的。`   -> `。`     2 sites, -1 CJK
  C_LIST   `，、`     -> `，`     1 site,  CJK-neutral

Usage:
    python tools/fix_r272_reorder.py --dry
    python tools/fix_r272_reorder.py --apply
    python tools/fix_r272_reorder.py --verify
"""

import json
import os
import re
import subprocess
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r272_reorder_sites.json")
BOM = b"\xef\xbb\xbf"
CJK = re.compile(r"[一-鿿]")
FLOOR = 3000

# Raw-shape census.  Judgement-free: it counts what is on disk, so the
# post-condition can demand that the residue equals the registered list.
SHAPES = (
    ("RA", "压低嗓音，得"),
    ("RB", "放低，得"),
    ("A_CHEST", "。的胸口"),
    ("A_DE", "。的。"),
    ("C_LIST", "，、"),
)


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


def decode(data, rel):
    if data.startswith(BOM):
        raise SystemExit("ABORT: %s carries a UTF-8 BOM" % rel)
    return data.decode("utf-8")


def split_lines(text):
    """Plain line list: "\n".join(split_lines(t)) == t byte for byte."""
    return text.split("\n")


def join_lines(lines):
    return "\n".join(lines)


def apply_spans(line, spans):
    for span in spans:
        old, new = span["old"], span["new"]
        if line.count(old) != 1:
            raise SystemExit("ABORT: span %r occurs %d times in %r"
                             % (old, line.count(old), line[:60]))
        line = line.replace(old, new)
    return line


def restore_spans(line, spans):
    """Span-level inverse, for records whose replacements are distinctive.

    It cannot work for the 5 records whose replacement is a bare punctuation
    mark -- `。的胸口` -> ``, `。的。` -> `。`, `，、` -> `，` -- because a lone
    `。` or `，` is not unique in its line, so there is nothing to find.  Those
    invert by the recorded whole line instead; verify() counts both.
    """
    for span in reversed(spans):
        old, new = span["old"], span["new"]
        if line.count(new) != 1:
            raise SystemExit("ABORT: reverse span %r occurs %d times"
                             % (new, line.count(new)))
        line = line.replace(new, old)
    return line


def detect(text):
    """Raw shape scan, judged without reference to the site table."""
    out = []
    for ln, line in enumerate(text.split("\n"), 1):
        for kind, shape in SHAPES:
            out.extend([(ln, kind, shape)] * line.count(shape))
    return out


def load():
    with open(SITES, encoding="utf-8") as fh:
        return json.load(fh)


def by_chapter(records):
    out = {}
    for rec in records:
        out.setdefault(rec["ch"], []).append(rec)
    return out


def floor_screen(table):
    """Every touched chapter must still clear FLOOR after the round."""
    delta = {}
    for rec in table["records"]:
        delta[rec["ch"]] = rec["ch_cjk_after"] - rec["ch_cjk_before"]
    blocked = []
    for ch in delta:
        text = decode(read_bytes(path_of(ch)), path_of(ch))
        before = len(CJK.findall(text))
        after = before + delta[ch]
        if after < FLOOR:
            blocked.append((ch, before, after))
    return blocked


def dry(table, verbose=True):
    blocked = floor_screen(table)
    print("dry: %d record(s), %d span(s) across %d chapter(s)"
          % (len(table["records"]),
             sum(len(r["spans"]) for r in table["records"]),
             len({r["ch"] for r in table["records"]})))
    print("dry: CJK delta %d, floor-blocked %d"
          % (sum(r["ch_cjk_after"] - r["ch_cjk_before"]
                 for r in table["records"]), len(blocked)))
    for ch, before, after in blocked:
        print("  FLOOR-BLOCKED ch%d %d -> %d" % (ch, before, after))
    if verbose:
        for rec in table["records"]:
            print("  ch%-4d L%-4d %-16s cjk %d->%d"
                  % (rec["ch"], rec["line"], "+".join(rec["kinds"]),
                     rec["ch_cjk_before"], rec["ch_cjk_after"]))
    if blocked:
        raise SystemExit("ABORT: %d chapter(s) would fall below %d"
                         % (len(blocked), FLOOR))


def apply(table):
    blocked = floor_screen(table)
    if blocked:
        raise SystemExit("ABORT: floor screen failed")
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
            lines[idx] = apply_spans(lines[idx], rec["spans"])
        with open(os.path.join(ROOT, rel.replace("/", os.sep)), "wb") as fh:
            fh.write(join_lines(lines).encode("utf-8"))
        written += 1
    print("apply: wrote %d chapter(s)" % written)


def verify(table):
    groups = by_chapter(table["records"])
    bad = []
    span_rev = line_rev = 0
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
            want[idx] = apply_spans(head[idx], rec["spans"])
            if want[idx] != rec["new"]:
                bad.append("%s L%d: the spans do not produce the record"
                           % (rel, rec["line"]))
        if have != want:
            bad.append("%s: replay is not byte-identical" % rel)
            continue

        for rec in recs:
            idx = rec["line"] - 1
            if all(s["new"] and want[idx].count(s["new"]) == 1
                   for s in rec["spans"]):
                if restore_spans(want[idx], rec["spans"]) != rec["old"]:
                    bad.append("%s L%d: span inverse does not restore"
                               % (rel, rec["line"]))
                span_rev += 1
            else:
                # Whole-line inverse: the record carries `old`, so putting it
                # back at the same index restores HEAD exactly.
                if rec["old"] != head[idx]:
                    bad.append("%s L%d: line inverse does not restore"
                               % (rel, rec["line"]))
                line_rev += 1
    ok = len(groups) - len({b.split(":")[0] for b in bad})
    print("verify: %d/%d chapter(s) replay byte-identically from HEAD"
          % (ok, len(groups)))
    print("verify: %d span-level inverse(s), %d whole-line inverse(s)"
          % (span_rev, line_rev))
    for b in bad[:20]:
        print("  %s" % b)

    left = Counter()
    for n in range(1, 1001):
        rel = path_of(n)
        for ln, kind, shape in detect(decode(read_bytes(rel), rel)):
            left[(n, ln, kind, shape)] += 1
    want = Counter()
    for rec in table["registered"]:
        for kind, shape in SHAPES:
            if shape == rec["shape"]:
                want[(rec["ch"], rec["line"], kind, shape)] += 1
    print("verify: shape census reads %d site(s) library-wide, %d registered"
          % (sum(left.values()), len(table["registered"])))
    print("verify: residue %s" % sorted(left.elements()))
    if bad:
        raise SystemExit("ABORT: %d replay failure(s)" % len(bad))
    if left != want:
        raise SystemExit("ABORT: the residue is not the registered list")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry"
    table = load()
    if mode == "--dry":
        dry(table)
    elif mode == "--apply":
        apply(table)
    elif mode == "--verify":
        verify(table)
    else:
        raise SystemExit("usage: fix_r272_reorder.py --dry|--apply|--verify")


if __name__ == "__main__":
    main()
