# -*- coding: utf-8 -*-
"""R270: delete the commas a padding round wedged between a verb and its object.

    ，[我你他她它][。！？…]   -- what follows the comma would be a one-character
    clause, which Chinese cannot have, so something in the shape is damage.
    Two judgements, intersected (the author's ruling):

      ① the 2-gram `[prev][pronoun]` is a real word used elsewhere
      ② the 3-gram `[prev][pronoun][terminator]` is used elsewhere too, so the
         whole clause is attested and only the comma is foreign

    Neither can self-attest: the site's own text is `等，你`, which contributes
    no `等你` to the inventory.  `她在等，你。` -> `她在等你。`

    K1 (182 sites) deletes the comma -- CJK-neutral.
    K2 (5 sites) deletes `，` and the pronoun, where the PRONOUN is the orphan:
    `裂隙之眼升级了，它。` -> `裂隙之眼升级了。`

    Left alone and registered: 26 sites the raw shape matches but the round does
    not prove -- appositives (`第48个叶文轩，你。`), a hesitation pause in
    dialogue, one substitution (`那是我留的，你。`, really `留给你的`), the sites
    that fail ②, and one line whose repair would be a half-fix.

A line may carry several sites, so deletion runs in DESCENDING position and the
undo-check restores in ASCENDING order -- putting the spans back must reproduce
the file byte for byte.

Usage:
    python tools/fix_r270_object_wedge.py --dry      # print what would go
    python tools/fix_r270_object_wedge.py --apply    # rewrite the chapters
    python tools/fix_r270_object_wedge.py --verify   # replay onto HEAD bytes

Fail-closed: a line whose text is neither the recorded old nor the recorded new
aborts the whole run before anything is written.  Guards: BOM-free UTF-8 only,
line count and CR count unchanged per file, the CJK delta must equal the CJK
actually removed, and no touched chapter may fall below the floor.
"""
import argparse
import io
import json
import os
import re
import subprocess
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r270_object_wedge_sites.json")
CJK = re.compile(r"[一-鿿]")
SHAPE = re.compile("，([我你他她它])([。！？…])")
FLOOR = 3000
VOL = [(1, 100), (101, 250), (251, 400), (401, 550), (551, 750), (751, 918),
       (919, 1000)]


def path_of(n):
    v = 1
    for i, (lo, hi) in enumerate(VOL, 1):
        if lo <= n <= hi:
            v = i
    return "chapters/volume-%d/chapter-%0*d-polished.md" % (v, 2 if v == 1 else 3, n)


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


def head_bytes(rel):
    r = subprocess.run(["git", "show", "HEAD:%s" % rel],
                       capture_output=True, cwd=ROOT)
    if r.returncode != 0:
        raise SystemExit("ABORT: git show HEAD:%s failed" % rel)
    return r.stdout


def to_lf(text):
    return text.replace("\r\n", "\n")


def split_lines(text):
    """[(core, cr), ...] -- a line's own EOL travels with it, so
    `join_lines(split_lines(t)) == t` byte for byte."""
    out = []
    for piece in text.split("\n"):
        if piece.endswith("\r"):
            out.append((piece[:-1], "\r"))
        else:
            out.append((piece, ""))
    return out


def join_lines(items):
    return "\n".join(core + cr for core, cr in items)


def apply_line(items, site, label):
    """Returns (status, removed).  `removed` is a list of (at, span) so the
    caller can put every span back and prove the round touched nothing else.
    Deletion descends so that each recorded offset still points at its span."""
    ln = site["line"]
    if not (1 <= ln <= len(items)):
        raise SystemExit("ABORT: %s has no line %d" % (label, ln))
    core, cr = items[ln - 1]
    if core == site["new"]:
        return "already", []
    if core != site["old"]:
        raise SystemExit(
            "ABORT: %s line %d is not the recorded text:\n"
            "   table: %r\n   disk : %r" % (label, ln, site["old"], core))
    text, removed = core, []
    for sp in sorted(site["spans"], key=lambda s: -s["at"]):
        at, span = sp["at"], sp["remove"]
        if text[at:at + len(span)] != span:
            raise SystemExit("ABORT: %s line %d: %r is not at %d"
                             % (label, ln, span, at))
        text = text[:at] + text[at + len(span):]
        removed.append((at, span))
    if text != site["new"]:
        raise SystemExit("ABORT: %s line %d does not reduce to the recorded new"
                         % (label, ln))
    items[ln - 1] = (text, cr)
    return "applied", removed


def restore(core, removed):
    """Put the spans back, in ASCENDING order.  No offset correction is needed:
    every span lies to the left of the next, so by the time span k goes back the
    characters that were left of it in the original are all present again and a
    recorded offset still points at its own span."""
    for at, span in sorted(removed):
        core = core[:at] + span + core[at:]
    return core


def detect(text):
    """Every site the round's RAW SHAPE matches in this text, as
    (line, prev, pronoun, terminator).  Deliberately shape-only: after the round
    the shape must read exactly the registered residue and nothing else, so a
    repair that landed on the wrong character or left a new one behind shows up
    as a mismatch rather than passing silently."""
    hits = []
    for i, core in enumerate(text.split("\n")):
        for m in SHAPE.finditer(core):
            at = m.start()
            if at == 0 or not ("一" <= core[at - 1] <= "鿿"):
                continue
            hits.append((i + 1, core[at - 1], m.group(1), m.group(2)))
    return hits


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--sites", default=DEFAULT_SITES)
    args = ap.parse_args()
    if sum([args.dry, args.apply, args.verify]) != 1:
        raise SystemExit("choose exactly one of --dry / --apply / --verify")

    with io.open(os.path.join(ROOT, args.sites), encoding="utf-8") as fh:
        table = json.load(fh)
    sites = table["sites"]
    registered = Counter((r["ch"], r["line"], r["prev"], r["pron"], r["term"])
                         for r in table["registered"])

    by_file = {}
    for s in sites:
        by_file.setdefault(s["path"], []).append(s)

    sources = {}
    for rel in sorted(by_file):
        sources[rel] = decode(read_bytes(os.path.join(ROOT, rel.replace("/", os.sep))), rel)

    n_applied = n_already = n_verified = 0
    touched = {}
    for rel in sorted(by_file):
        src = sources[rel]
        items = split_lines(src)
        cjk_src = len(CJK.findall(src))
        cr_src = src.count("\r")
        lines_src = src.count("\n")

        removed_cjk = 0
        report = []
        for site in by_file[rel]:
            status, removed = ("skipped", [])
            if not args.verify:
                status, removed = apply_line(items, site, rel)
            for _at, span in removed:
                removed_cjk += len(CJK.findall(span))
            if status == "already":
                n_already += 1
            elif status == "applied":
                n_applied += 1
            report.append((site, status, removed))
        new = join_lines(items)

        if args.verify:
            head = to_lf(decode(head_bytes(rel), "HEAD:" + rel))
            head_items = split_lines(head)
            for site in by_file[rel]:
                apply_line(head_items, site, "HEAD:" + rel)
            if join_lines(head_items) != to_lf(new):
                raise SystemExit("ABORT: %s replay from HEAD differs" % rel)
            n_verified += len(by_file[rel])
            continue

        # --- invariants -----------------------------------------------------
        if new.count("\n") != lines_src:
            raise SystemExit("ABORT: %s line count moved" % rel)
        if new.count("\r") != cr_src:
            raise SystemExit("ABORT: %s CR count moved" % rel)
        got = cjk_src - len(CJK.findall(new))
        if got != removed_cjk:
            raise SystemExit("ABORT: %s CJK moved %d, table removes %d"
                             % (rel, -got, removed_cjk))
        now_cjk = len(CJK.findall(new))
        if now_cjk < FLOOR:
            raise SystemExit("ABORT: %s falls to %d CJK, under the %d floor"
                             % (rel, now_cjk, FLOOR))
        touched[rel] = now_cjk

        # undo-check: putting every removed span back restores the bytes.
        # A span is an in-line deletion, so the proof is per line: the file's
        # line structure never moves.
        restored_items = list(items)
        for site, status, removed in report:
            if not removed:
                continue
            idx = site["line"] - 1
            core, cr = restored_items[idx]
            restored_items[idx] = (restore(core, removed), cr)
        if join_lines(restored_items) != src:
            raise SystemExit("ABORT: %s is not a pure removal -- undoing it "
                             "does not restore the file" % rel)

        if args.dry:
            print("%-46s %d site(s)" % (rel, len(by_file[rel])))
        else:
            with open(os.path.join(ROOT, rel.replace("/", os.sep)), "wb") as fh:
                fh.write(new.encode("utf-8"))

    if args.verify:
        print("verify: %d/%d site(s) replay byte-identically from HEAD"
              % (n_verified, len(sites)))
        return

    verb = "dry" if args.dry else "apply"
    print("%s: %d to fix, %d already clean, %d site(s) in %d chapter(s)"
          % (verb, n_applied, n_already, len(sites), len(by_file)))
    if touched:
        lo = min(touched.items(), key=lambda kv: kv[1])
        print("floor: tightest touched chapter %s at %d CJK" % (lo[0], lo[1]))
    if args.dry:
        return

    # post-condition: the shape must read exactly the registered residue
    left = Counter()
    for n in range(1, 1001):
        rel = path_of(n)
        text = decode(read_bytes(os.path.join(ROOT, rel.replace("/", os.sep))), rel)
        for ln, prev, pron, term in detect(text):
            left[(n, ln, prev, pron, term)] += 1
    print("post-condition: shape reads %d site(s) library-wide, %d registered"
          % (sum(left.values()), len(registered)))
    if left != registered:
        for k in sorted(set(left) - set(registered))[:20]:
            print("   UNEXPECTED ch%-5d L%-5d %s，%s%s" % k)
        for k in sorted(set(registered) - set(left))[:20]:
            print("   MISSING    ch%-5d L%-5d %s，%s%s" % k)
        raise SystemExit("ABORT: the post-condition residue is not the "
                         "registered list")


main()
