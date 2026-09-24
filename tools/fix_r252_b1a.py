# -*- coding: utf-8 -*-
"""R252 B1a: apply the parent-witnessed punctuation repairs to ch551-570.

The strip pass rewrote `。"` as `，` and then deleted the quote characters, so
V5 carries commas where a sentence ended (`有一个，墙。`, `立刻，压下防火墙的`).
This applies the inverse, using the sites computed by the planner and stored
in tools/r252_b1_sites.json:

    `，X` -> `X。`   (the comma moves past X and becomes the period)

Only punctuation and quotation marks move.  No word is added or removed, so
each chapter's CJK count is unchanged by construction -- and asserted below.

Usage:
    python tools/fix_r252_b1a.py --dry      # print -/+ and deltas, write nothing
    python tools/fix_r252_b1a.py --apply    # rewrite the chapters
    python tools/fix_r252_b1a.py --verify   # replay onto HEAD bytes, require
                                            # a byte-identical result

Fail-closed: any anchor that is absent, or present more than once, aborts the
whole run before anything is written.  Idempotent: a site whose `after` is
already on disk counts as done and is skipped.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = os.path.join(ROOT, "tools", "r252_b1_sites.json")
CJK = re.compile(r"[一-鿿]")


def chapter_path(n):
    return os.path.join(ROOT, "chapters", "volume-5",
                        "chapter-%d-polished.md" % n)


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


def cr_flags(text):
    """Per-line 'did this line end with CR', split_keep's own semantics."""
    return [piece.endswith("\r") for piece in text.split("\n")]


def load():
    with io.open(SITES, encoding="utf-8") as fh:
        rows = json.load(fh)
    by_chapter = {}
    for i, row in enumerate(rows):
        by_chapter.setdefault(row["chapter"], []).append((i, row))
    return rows, by_chapter


def transform(text, rows, label, strict=True):
    """Apply every site in `rows` to `text`.  Returns (text, applied, skipped)."""
    applied, skipped = [], []
    for idx, row in rows:
        before, after = row["before"], row["after"]
        hits = text.count(before)
        if hits == 1:
            text = text.replace(before, after)
            applied.append(idx)
        elif hits == 0 and after in text:
            skipped.append(idx)          # already repaired
        elif hits == 0:
            if strict:
                raise SystemExit(
                    "ABORT: %s site %d anchor not found:\n  %r"
                    % (label, idx, before[:120]))
            skipped.append(idx)
        else:
            raise SystemExit(
                "ABORT: %s site %d anchor is not unique (%d hits):\n  %r"
                % (label, idx, hits, before[:120]))
    return text, applied, skipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if sum([args.dry, args.apply, args.verify]) != 1:
        raise SystemExit("choose exactly one of --dry / --apply / --verify")

    rows, by_chapter = load()
    print("sites %d / chapters %d" % (len(rows), len(by_chapter)))

    total_applied = total_skipped = verified = 0
    for n in sorted(by_chapter):
        path = chapter_path(n)
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        src = decode(read_bytes(path), rel)
        new, applied, skipped = transform(src, by_chapter[n], rel)

        cjk_src = len(CJK.findall(src))
        cjk_new = len(CJK.findall(new))
        if cjk_src != cjk_new:
            raise SystemExit("ABORT: %s CJK %d -> %d" % (rel, cjk_src, cjk_new))
        if src.count("\n") != new.count("\n"):
            raise SystemExit("ABORT: %s line count changed" % rel)
        if new.count('"') % 2:
            raise SystemExit("ABORT: %s has an odd quote count" % rel)

        total_applied += len(applied)
        total_skipped += len(skipped)

        if args.dry:
            for idx, row in by_chapter[n]:
                mark = " " if idx in applied else "="
                print("%s ch%-4d L%-4d %-8s" % (mark, n, row["line"], row["kind"]))
                print("    -  %s" % row["before"].rstrip("\r\n"))
                print("    +  %s" % row["after"].rstrip("\r\n"))
        elif args.verify:
            # Replay the same edits onto the HEAD blob and require the file on
            # disk to come back.  git normalises line endings on commit, so
            # most chapters are CRLF on disk and LF in the blob; comparing in
            # LF space is what makes this check meaningful.  Together with the
            # ending check below it is the only proof that nothing except the
            # table's 118 edits moved -- no stray edit, no BOM, no EOL drift.
            head = to_lf(decode(head_bytes(path), "HEAD:" + rel))
            rows_lf = [(idx, dict(row, before=to_lf(row["before"]),
                                  after=to_lf(row["after"])))
                       for idx, row in by_chapter[n]]
            replayed, _, _ = transform(head, rows_lf, "HEAD:" + rel)
            if replayed != to_lf(new):
                raise SystemExit(
                    "ABORT: %s replay from HEAD differs by more than line "
                    "endings" % rel)
            # the anchors were cut from the file's own endings, so a file whose
            # convention drifted could not have matched them at apply time
            flags = cr_flags(new)[:-1]
            implied_crlf = any("\r\n" in row["before"]
                               for _, row in by_chapter[n])
            if implied_crlf and not all(flags):
                raise SystemExit(
                    "ABORT: %s anchors are CRLF but the file is not" % rel)
            if not implied_crlf and any(flags):
                raise SystemExit(
                    "ABORT: %s anchors are LF but the file carries CR" % rel)
            verified += 1
        else:
            with open(path, "wb") as fh:
                fh.write(new.encode("utf-8"))

    verb = "dry" if args.dry else ("verify" if args.verify else "apply")
    print("%s: applied %d, already-done %d, chapters %d"
          % (verb, total_applied, total_skipped,
             verified if args.verify else len(by_chapter)))


main()
