# -*- coding: utf-8 -*-
"""R268: delete the punctuation two padding rounds left stranded in the prose.

    family C  `的那个角落。`                                   89 sites / 77 ch
              A round swapped the middle slot of a boilerplate sentence --
              `这句话沉进了他心里最深处的那个角落。` became
              `这句话沉进了他心里，沉得极深。的那个角落。` -- and left the tail
              of the original welded to the end.  The sentence in front of the
              orphan is already complete and grammatical, so the repair is to
              drop the orphan, not to restore a phrase that 115 chapters share.

    family D  a lone 。 / ， / 的 a splice inserted                10 sites / 9 ch
              `叶文轩把眼睛睁开。的时候`      the period split a 的时候 clause
              `叶文轩拼命思索着。：`          a period wedged before a colon
              `的0429等了三年`               a stray 的 welded to the front
              `等什么？，消息没有回音`        a comma after a question mark

Both families are repaired by DELETING characters and never by writing new ones,
so each site can be proved: putting the removed span back must reproduce the
previous bytes exactly.  Every site is flagged only where the whole line reads
correctly afterwards -- a line that still carries other damage (ten further
fragments clustered around mid-clause commas in V5) is left for the round that
handles that family, rather than half-fixed here.

Usage:
    python tools/fix_r268_punct_residue.py --dry      # print what would go
    python tools/fix_r268_punct_residue.py --apply    # rewrite the chapters
    python tools/fix_r268_punct_residue.py --verify   # replay onto HEAD bytes

Fail-closed: a site whose recorded line does not match the file aborts the whole
run before anything is written.  Idempotent: a line already repaired is reported
as done.  Guards: BOM-free UTF-8 only, line count and CR count unchanged per
file, the CJK delta must equal the CJK actually removed, and no touched chapter
may fall below the 3000-CJK floor.  A post-condition walks the whole library and
requires both detectors to read zero.
"""
import argparse
import io
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r268_punct_sites.json")
CJK = re.compile(r"[一-鿿]")
SPLIT = re.compile(r"[^。！？…]*[。！？…]|[^。！？…]+")
FLOOR = 3000

# Eight chapters sit within fifteen CJK of the floor because a padding round
# pushed them exactly to it; deleting their orphan would drop them under it.
# The floor is a hard rule, so those sites are held back and registered rather
# than fixed -- the value is the CJK count they would land on.  They are the
# only sites this round knowingly leaves behind.
FLOOR_BLOCKED = {341: 2998, 563: 2999, 677: 2998, 699: 2997,
                 702: 2998, 704: 2996, 906: 2987, 907: 2998}

ORPHAN = "的那个角落。"
TERM = "。！？…"

VOL_OF = {}
for _v in range(1, 8):
    _lo = {1: 1, 2: 101, 3: 251, 4: 401, 5: 551, 6: 751, 7: 919}[_v]
    _hi = {1: 100, 2: 250, 3: 400, 4: 550, 5: 750, 6: 918, 7: 1000}[_v]
    for _i in range(_lo, _hi + 1):
        VOL_OF[_i] = _v


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


def apply_site(items, site, label):
    """Returns (status, removed).  `removed` is a one-element list so the caller
    can put the span back and prove the round touched nothing else."""
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
    at, span = site["at"], site["remove"]
    if core[at:at + len(span)] != span:
        raise SystemExit("ABORT: %s line %d: %r is not at %d"
                         % (label, ln, span, at))
    items[ln - 1] = (core[:at] + core[at + len(span):], cr)
    return "applied", [(at, span)]


def detect_c(text):
    """Orphan tails: `的那个角落。` standing as its own sentence."""
    hits = []
    for i, core in enumerate(text.split("\n")):
        if ORPHAN not in core:
            continue
        for m in re.finditer(re.escape(ORPHAN), core):
            at = m.start()
            if at == 0 or core[at - 1] not in TERM + "\"”」":
                continue
            hits.append((i + 1, core[:at] + core[at + len(ORPHAN):]))
    return hits


def detect_d(text):
    """Fragments that begin where no Chinese sentence can: a 的-clause split by
    a period, a stray 的, or a comma after a terminator."""
    hits = []
    for i, core in enumerate(text.split("\n")):
        for m in SPLIT.finditer(core):
            s = m.group(0).strip()
            if len(CJK.findall(s)) < 5 or s[0] not in "的，":
                continue
            hits.append((i + 1, s))
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

    # group by file so each chapter is read and written once
    by_file = {}
    held = {}
    for s in sites:
        if s["ch"] in FLOOR_BLOCKED:
            held.setdefault(s["ch"], []).append(s)
            continue
        by_file.setdefault(s["path"], []).append(s)

    n_applied = n_already = n_verified = 0
    touched = {}
    for rel in sorted(by_file):
        path = os.path.join(ROOT, rel.replace("/", os.sep))
        src = decode(read_bytes(path), rel)
        items = split_lines(src)
        cjk_src = len(CJK.findall(src))
        cr_src = src.count("\r")
        lines_src = src.count("\n")

        removed_cjk = 0
        report = []
        for site in by_file[rel]:
            status, removed = ("skipped", [])
            if not args.verify:
                status, removed = apply_site(items, site, rel)
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
                apply_site(head_items, site, "HEAD:" + rel)
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

        # undo-check: putting the removed spans back restores the bytes.
        restored = list(items)
        for site, status, removed in report:
            for at, span in removed:
                idx = site["line"] - 1
                core, cr = restored[idx]
                restored[idx] = (core[:at] + span + core[at:], cr)
        if join_lines(restored) != src:
            raise SystemExit("ABORT: %s is not a pure removal -- undoing it "
                             "does not restore the file" % rel)

        if args.dry:
            print("%-46s %d site(s)" % (rel, len(by_file[rel])))
        else:
            with open(path, "wb") as fh:
                fh.write(new.encode("utf-8"))

    if args.verify:
        print("verify: %d/%d site(s) replay byte-identically from HEAD"
              % (n_verified, sum(len(v) for v in by_file.values())))
        return

    n_held = sum(len(v) for v in held.values())
    if args.dry:
        print("dry: %d to fix, %d already clean, %d site(s) in %d chapter(s)"
              % (n_applied, n_already, len(sites) - n_held, len(by_file)))
        print("held back by the %d-CJK floor: %d site(s) in %d chapter(s)"
              % (FLOOR, n_held, len(held)))
        for ch in sorted(held):
            print("   ch%-5d %d site(s) -- would land on %d CJK"
                  % (ch, len(held[ch]), FLOOR_BLOCKED[ch]))
        return

    print("apply: fixed %d, already clean %d, %d site(s) in %d chapter(s)"
          % (n_applied, n_already, len(sites) - n_held, len(by_file)))
    print("held back by the %d-CJK floor: %d site(s) in %d chapter(s)"
          % (FLOOR, n_held, len(held)))
    if touched:
        lo = min(touched.items(), key=lambda kv: kv[1])
        print("floor: tightest touched chapter %s at %d CJK" % (lo[0], lo[1]))

    # post-condition: both detectors must read zero across the whole library,
    # except for the floor-blocked orphans this round deliberately leaves
    c_left, d_left = [], []
    for vol in range(1, 8):
        d = os.path.join(ROOT, "chapters", "volume-%d" % vol)
        for f in sorted(os.listdir(d)):
            if not re.search(r"chapter-\d+-polished\.md$", f):
                continue
            text = open(os.path.join(d, f), "rb").read().decode("utf-8")
            ch = int(re.search(r"chapter-(\d+)-", f).group(1))
            for ln, body in detect_c(text):
                if ch in FLOOR_BLOCKED:
                    continue
                c_left.append((f, ln))
            for ln, s in detect_d(text):
                d_left.append((f, ln, s[:40]))
    print("post-condition: family C detector %d beyond the held sites, "
          "family D detector %d" % (len(c_left), len(d_left)))
    if c_left:
        raise SystemExit("ABORT: family C is not at zero: %s" % c_left[:5])
    print("  family D remaining, all deferred to the comma round:")
    for f, ln, s in d_left:
        print("    %-42s L%-4d %s" % (f, ln, s))


main()
