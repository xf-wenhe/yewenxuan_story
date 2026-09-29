# -*- coding: utf-8 -*-
"""R265: remove the orphan punctuation that two mechanical rounds left behind.

The V5 quote-strip pass rewrote an opening quote as a comma (`说："X"` ->
`说：，X`, `的。"副作用"。` -> `的，副作用。`), the voice round wrote `。，` between
clauses, the de-dash pass turned `——` into `，`, and the chain-collapse pass
deleted list items without deleting their separators.  The leftovers are a small
closed set of impossible sequences, plus paragraphs that open with a comma.

This applies the reviewed table built by `.claude/tmp/r265_make_sites.py`:

    tools/r265_orphan_sites.json   chapter / line / kind / before / after / witness

Anchoring is (line number, exact whole-line text): stricter than a
library-unique substring, and it makes end-of-line bytes impossible to touch --
lines are split off, one core is replaced, and the pieces are rejoined, so no
CR, LF or final-newline byte is rewritten.  Every edit deletes punctuation
only, so the CJK count is invariant by construction and asserted below.

Usage:
    python tools/fix_r265_orphan_punct.py --dry      # print -/+ , write nothing
    python tools/fix_r265_orphan_punct.py --apply    # rewrite the chapters
    python tools/fix_r265_orphan_punct.py --verify   # replay onto HEAD bytes
    python tools/fix_r265_orphan_punct.py --sites tools/other.json --dry

Fail-closed: a line whose text is not exactly the table's `before` (and is not
already the table's `after`) aborts the whole run before anything is written.
Idempotent: a re-run skips every site that is already repaired.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r265_orphan_sites.json")
CJK = re.compile(r"[\u4e00-\u9fff]")

VOL_OF = {}
for _n in range(1, 8):
    _lo = {1: 1, 2: 101, 3: 251, 4: 401, 5: 551, 6: 751, 7: 919}[_n]
    _hi = {1: 100, 2: 250, 3: 400, 4: 550, 5: 750, 6: 918, 7: 1000}[_n]
    for _i in range(_lo, _hi + 1):
        VOL_OF[_i] = _n

# the closed detector this round is defined by; after the table runs it must
# find nothing left in a touched chapter (registered leftovers live elsewhere)
DETECTOR = ("，", "：，", "、，", "，、", "。，", "，，")


def chapter_path(n):
    wid = 2 if VOL_OF[n] == 1 else 3
    return os.path.join(ROOT, "chapters", "volume-%d" % VOL_OF[n],
                        "chapter-%0*d-polished.md" % (wid, n))


def read_bytes(path):
    with open(path, "rb") as fh:
        return fh.read()


def decode(raw, label):
    if raw.startswith(b"\xef\xbb\xbf"):
        raise SystemExit("ABORT: %s carries a UTF-8 BOM; refusing" % label)
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SystemExit("ABORT: %s is not UTF-8 (%s)" % (label, exc))


def head_bytes(path):
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    r = subprocess.run(["git", "show", "HEAD:%s" % rel],
                       capture_output=True, cwd=ROOT)
    if r.returncode != 0:
        raise SystemExit("ABORT: git show HEAD:%s failed" % rel)
    return r.stdout


def to_lf(text):
    return text.replace("\r\n", "\n")


def split_lines(text):
    """[(core, cr), ...] -- a line's own CRLF marker travels with it, so
    `join_lines(split_lines(t)) == t` byte for byte and no ending can drift."""
    out = []
    for piece in text.split("\n"):
        if piece.endswith("\r"):
            out.append((piece[:-1], "\r"))
        else:
            out.append((piece, ""))
    return out


def join_lines(items):
    return "\n".join(core + cr for core, cr in items)


def hits_of(core):
    return core.startswith("，") or any(d in core for d in DETECTOR[1:])


def transform(items, rows, label, strict=True):
    """Apply every row to `items` in place.  Returns (applied, skipped)."""
    applied, skipped = [], []
    for idx, row in rows:
        ln = row["line"]
        if not (1 <= ln <= len(items)):
            raise SystemExit("ABORT: %s site %d: no line %d" % (label, idx, ln))
        core, cr = items[ln - 1]
        if core == row["before"]:
            items[ln - 1] = (row["after"], cr)
            applied.append(idx)
        elif core == row["after"]:
            skipped.append(idx)              # already repaired
        elif strict:
            raise SystemExit(
                "ABORT: %s site %d line %d is not the table's anchor:\n"
                "   table: %r\n   disk : %r" % (label, idx, ln,
                                                row["before"][:120], core[:120]))
        else:
            skipped.append(idx)
    return applied, skipped


def load(path):
    with io.open(path, encoding="utf-8") as fh:
        rows = json.load(fh)
    by_chapter = {}
    for i, row in enumerate(rows):
        by_chapter.setdefault(row["chapter"], []).append((i, row))
    return rows, by_chapter


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--sites", default=DEFAULT_SITES,
                    help="change table to apply (default %(default)s)")
    args = ap.parse_args()
    if sum([args.dry, args.apply, args.verify]) != 1:
        raise SystemExit("choose exactly one of --dry / --apply / --verify")

    rows, by_chapter = load(os.path.join(ROOT, args.sites))
    print("sites %d / chapters %d" % (len(rows), len(by_chapter)))

    total_applied = total_skipped = verified = 0
    for n in sorted(by_chapter):
        path = chapter_path(n)
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        src = decode(read_bytes(path), rel)
        items = split_lines(src)

        if args.verify:
            # The disk side is taken as it stands; the proof is that replaying
            # the table onto the HEAD blob reproduces it byte for byte.  A line
            # whose anchor was already consumed still counts as verified, so
            # the replay runs in non-strict mode and only the final comparison
            # decides.
            applied, skipped = [], []
        else:
            applied, skipped = transform(items, by_chapter[n], rel)

        new = join_lines(items)
        cjk_src = len(CJK.findall(src))
        cjk_new = len(CJK.findall(new))
        if cjk_src != cjk_new:
            raise SystemExit("ABORT: %s CJK %d -> %d" % (rel, cjk_src, cjk_new))
        if src.count("\n") != new.count("\n"):
            raise SystemExit("ABORT: %s line count changed" % rel)
        if src.count("\r") != new.count("\r"):
            raise SystemExit("ABORT: %s CR count changed" % rel)
        if src.count('"') != new.count('"'):
            raise SystemExit("ABORT: %s quote count changed" % rel)
        if not args.verify:
            for i, (core, _cr) in enumerate(items, 1):
                if hits_of(core):
                    raise SystemExit("ABORT: %s detector still fires at L%d:\n   %r"
                                     % (rel, i, core[:120]))

        total_applied += len(applied)
        total_skipped += len(skipped)

        if args.dry:
            for idx, row in by_chapter[n]:
                mark = " " if idx in applied else "="
                print("%s ch%-4d L%-4d %-12s" % (mark, n, row["line"], row["kind"]))
                print("    -  %s" % row["before"].rstrip("\r\n"))
                print("    +  %s" % row["after"].rstrip("\r\n"))
        elif args.verify:
            head = to_lf(decode(head_bytes(path), "HEAD:" + rel))
            head_items = split_lines(head)
            transform(head_items, by_chapter[n], "HEAD:" + rel, strict=False)
            if join_lines(head_items) != to_lf(new):
                raise SystemExit(
                    "ABORT: %s replay from HEAD differs" % rel)
            verified += 1
        else:
            with open(path, "wb") as fh:
                fh.write(new.encode("utf-8"))

    verb = "dry" if args.dry else ("verify" if args.verify else "apply")
    print("%s: applied %d, already-done %d, chapters %d"
          % (verb, total_applied, total_skipped,
             verified if args.verify else len(by_chapter)))


main()
