# -*- coding: utf-8 -*-
"""R269: delete the commas two padding rounds wedged inside words in V5.

    A  `，` between a word and its own final particle          387 sites
       ，了 / ，着 -- the particle cannot open a word, so the comma is
              damage wherever it stands (`完成，了` -> `完成了`)
       ，中 / ，地 -- flagged only when the particle does NOT open a real
              word AND the 2-gram left behind is used elsewhere in the
              library (`识中` occurs in 意识中 -> damage; `缝地` occurs
              nowhere -> author's prose, left alone)
    B  `，得` where 得 is a complement, not the "must" verb     5 sites
       `一切变，得最糟` -> `一切变得最糟`.  The `嗓音放低，得极低` family
       needs a reorder rather than a deletion and stays registered.
    C  punctuation stranded at a terminator                    19 sites
       。、  `赵大嘴。、朵朵。`          drop the `。`
       ？，  `准备好了吗？，开始。`       drop the `，`
       。：  `脉搏陡然加快。：0428信号`   drop the `。`

Every span is punctuation, so the CJK count cannot move: this is the first round
of the series with no floor risk at all.  A line may carry several bad commas
(one carries five), so deletion runs in DESCENDING position and the undo-check
restores in ASCENDING order -- putting the spans back must reproduce the file
byte for byte.

Usage:
    python tools/fix_r269_comma_flood.py --dry      # print what would go
    python tools/fix_r269_comma_flood.py --apply    # rewrite the chapters
    python tools/fix_r269_comma_flood.py --verify   # replay onto HEAD bytes

Fail-closed: a line whose text is neither the recorded old nor the recorded new
aborts the whole run before anything is written.  Guards: BOM-free UTF-8 only,
line count and CR count unchanged per file, the CJK delta must equal the CJK
actually removed (zero here), and no touched chapter may fall below the floor.
"""
import argparse
import io
import json
import os
import re
import subprocess
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r269_comma_sites.json")
CJK = re.compile(r"[一-鿿]")
FLOOR = 3000

LEGIT = {
    "中": ("中国", "中间", "中层", "中性", "中心", "中文", "中央", "中途", "中断",
           "中立", "中枢", "中介", "中和", "中期", "中旬", "中年", "中午", "中游",
           "中坚", "中端", "中段", "中控", "中位", "中空", "中庭", "中等", "中型",
           "中转", "中继", "中校", "中锋", "中南", "中欧", "中日", "中美", "中俄",
           "中韩", "中岛", "中盘", "中海", "中村", "中川"),
    "地": ("地面", "地上", "地下", "地方", "地球", "地位", "地图", "地址", "地理",
           "地道", "地域", "地形", "地盘", "地板", "地表", "地层", "地基", "地震",
           "地产", "地头", "地心", "地块", "地砖", "地底", "地铁", "地垫", "地毯",
           "地窖", "地牢", "地点", "地步", "地带", "地标", "地脉", "地热", "地幔",
           "地壳", "地衣", "地摊", "地界", "地洞", "地势"),
    "了": ("了解", "了结", "了不起", "了然", "了却", "了事", "了断"),
    "着": ("着急", "着落", "着火", "着装", "着想", "着手", "着眼", "着陆", "着色"),
}
SIMPLE = ("了", "着")
EVIDENCE = ("中", "地")
DE_SHAPE = ("变，得",)
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


def detect(text, grams):
    """Every site the round's rule would take from this text."""
    hits = []
    for i, core in enumerate(text.split("\n")):
        ln = i + 1
        for m in re.finditer("，", core):
            at = m.start()
            if at == 0 or at + 1 >= len(core):
                continue
            prev, nxt = core[at - 1], core[at + 1]
            if not ("一" <= prev <= "鿿"):
                continue
            if nxt in SIMPLE and not core[at + 1:at + 5].startswith(LEGIT[nxt]):
                hits.append((ln, at, "A:" + nxt))
            elif nxt in EVIDENCE and not core[at + 1:at + 5].startswith(LEGIT[nxt]) \
                    and grams[prev + nxt]:
                hits.append((ln, at, "A:" + nxt))
        for shape in DE_SHAPE:
            for m in re.finditer(re.escape(shape), core):
                hits.append((ln, m.start() + 1, "B:de"))
        for m in re.finditer("。、", core):
            hits.append((ln, m.start(), "C:。、"))
        for m in re.finditer("[。！？…]，", core):
            hits.append((ln, m.start() + 1, "C:？，"))
        for m in re.finditer("。：", core):
            hits.append((ln, m.start(), "C:。："))
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
        sites = json.load(fh)

    by_file = {}
    for s in sites:
        by_file.setdefault(s["path"], []).append(s)

    # The rule's own evidence base is a fixed snapshot: it is built from the
    # tree as it stands before anything is written, so the post-condition tests
    # against the same corpus the table was built from.
    sources = {}
    for rel in sorted(by_file):
        sources[rel] = decode(read_bytes(os.path.join(ROOT, rel.replace("/", os.sep))), rel)
    grams = Counter()
    for text in sources.values():
        for run in re.findall(r"[一-鿿]{2,}", text):
            for i in range(len(run) - 1):
                grams[run[i:i + 2]] += 1

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
            print("%-46s %d line(s)" % (rel, len(by_file[rel])))
        else:
            with open(os.path.join(ROOT, rel.replace("/", os.sep)), "wb") as fh:
                fh.write(new.encode("utf-8"))

    if args.verify:
        print("verify: %d/%d line(s) replay byte-identically from HEAD"
              % (n_verified, len(sites)))
        return

    verb = "dry" if args.dry else "apply"
    print("%s: %d to fix, %d already clean, %d line(s) in %d chapter(s)"
          % (verb, n_applied, n_already, len(sites), len(by_file)))
    if touched:
        lo = min(touched.items(), key=lambda kv: kv[1])
        print("floor: tightest touched chapter %s at %d CJK" % (lo[0], lo[1]))
    if args.dry:
        return

    # post-condition: the rule must read zero across the whole library
    left = []
    for n in range(1, 1001):
        rel = path_of(n)
        text = decode(read_bytes(os.path.join(ROOT, rel.replace("/", os.sep))), rel)
        for ln, at, kind in detect(text, grams):
            left.append((n, ln, kind))
    print("post-condition: rule reads %d site(s) library-wide" % len(left))
    if left:
        for n, ln, kind in left[:20]:
            print("   ch%-5d L%-5d %s" % (n, ln, kind))
        raise SystemExit("ABORT: the rule is not at zero")


main()
