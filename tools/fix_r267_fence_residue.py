# -*- coding: utf-8 -*-
"""R267: clear the Python fences a padding script left in the prose.

    ch675/677/678/679/682/683/686/688 (V5)   a `'''` line and a `marker = '` line
                                             wedged between two paragraphs
    ch448 (V4)                               the chapter-end marker line ends
                                             with a triple double-quote fence

Nine chapters, ten deleted lines plus one trimmed line.  The two V5 lines were
already in the file at the V5 baseline 59a6f32c; the V4 marks were re-added by
R259, whose slot-restoration read them as stripped quotation marks.  Both are
CJK-neutral -- the round removes ASCII and punctuation only -- so unlike a
delete-a-word round it needs no floor guard.

Usage:
    python tools/fix_r267_fence_residue.py --dry      # print what would go
    python tools/fix_r267_fence_residue.py --apply    # rewrite the chapters
    python tools/fix_r267_fence_residue.py --verify   # replay onto HEAD bytes

Fail-closed: a site whose recorded lines do not match the file aborts the whole
run before anything is written.  Idempotent: a file that no longer carries the
debris is reported as already done.  Every deletion is undo-checked -- putting
the removed lines back at their recorded positions must reproduce the previous
bytes exactly, so "only these lines went" is proved, not asserted.  A
post-condition walks the whole library and requires the detectors to read zero.
"""
import argparse
import io
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r267_fence_sites.json")
CJK = re.compile(r"[一-鿿]")

FENCE = "'" * 3
MARKER = "marker = '"
TRIPLE_DQ = '"' * 3

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


def detector_fence(text):
    """Lines that are nothing but the fence -- the debris shape."""
    return [i + 1 for i, c in enumerate(text.split("\n")) if c.rstrip("\r") == FENCE]


def detector_dq(text):
    """Lines carrying a triple double-quote fence."""
    return [i + 1 for i, c in enumerate(text.split("\n")) if TRIPLE_DQ in c]


def apply_site(items, site, label):
    """Returns (status, removed, info).

    `removed` is [(index, (core, cr)), ...] for a delete, so the caller can put
    the lines back and prove the round touched nothing else; for a trim it is
    [(index, old_core)].
    """
    kind = site["kind"]
    if kind == "delete":
        here = [core for core, _cr in items]
        has_fence = FENCE in here
        has_marker = MARKER in here
        if not has_fence and not has_marker:
            return "already", [], None
        if has_fence != has_marker:
            raise SystemExit("ABORT: %s carries only one half of the pair "
                             "(fence=%s marker=%s)" % (label, has_fence, has_marker))
        removed = []
        for ln, want in sorted(site["lines"], key=lambda t: -t[0]):
            if not (1 <= ln <= len(items)):
                raise SystemExit("ABORT: %s has no line %d" % (label, ln))
            core, cr = items[ln - 1]
            if core != want:
                raise SystemExit(
                    "ABORT: %s line %d is not the recorded debris:\n"
                    "   table: %r\n   disk : %r" % (label, ln, want, core))
            removed.append((ln - 1, (core, cr)))
            del items[ln - 1]
        return "applied", removed, None

    if kind == "trim":
        ln = site["line"]
        if not (1 <= ln <= len(items)):
            raise SystemExit("ABORT: %s has no line %d" % (label, ln))
        core, cr = items[ln - 1]
        if TRIPLE_DQ not in core:
            return "already", [], None
        if core != site["before"]:
            raise SystemExit(
                "ABORT: %s line %d is not the recorded marker:\n"
                "   table: %r\n   disk : %r" % (label, ln, site["before"], core))
        items[ln - 1] = (site["after"], cr)
        return "applied", [(ln - 1, core)], None

    raise SystemExit("ABORT: unknown site kind %r" % kind)


def path_of(site):
    return os.path.join(ROOT, site["path"].replace("/", os.sep))


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

    n_applied = n_already = n_verified = 0
    for site in sites:
        path = path_of(site)
        rel = site["path"]
        src = decode(read_bytes(path), rel)
        items = split_lines(src)
        cjk_src = len(CJK.findall(src))
        quotes_src = src.count('"')
        cr_src = src.count("\r")

        status, removed, _info = ("skipped", [], None)
        if not args.verify:
            status, removed, _info = apply_site(items, site, rel)
        new = join_lines(items)

        if args.verify:
            head = to_lf(decode(head_bytes(rel), "HEAD:" + rel))
            head_items = split_lines(head)
            apply_site(head_items, site, "HEAD:" + rel)
            if join_lines(head_items) != to_lf(new):
                raise SystemExit("ABORT: %s replay from HEAD differs" % rel)
            n_verified += 1
            continue

        # --- invariants -----------------------------------------------------
        if len(CJK.findall(new)) != cjk_src:
            raise SystemExit("ABORT: %s CJK moved %d" % (rel, len(CJK.findall(new)) - cjk_src))
        if status == "applied":
            if site["kind"] == "delete":
                want_lines = -len(removed)
                want_cr = -sum(1 for _i, (_c, cr) in removed if cr)
            else:
                want_lines = 0
                want_cr = 0
            got_lines = new.count("\n") - src.count("\n")
            if got_lines != want_lines:
                raise SystemExit("ABORT: %s line count moved %d, table says %d"
                                 % (rel, got_lines, want_lines))
            if new.count("\r") - cr_src != want_cr:
                raise SystemExit("ABORT: %s CR count moved %d, table says %d"
                                 % (rel, new.count("\r") - cr_src, want_cr))
            if site["kind"] == "trim" and quotes_src - new.count('"') != 3:
                raise SystemExit("ABORT: %s lost %d quote(s), expected 3"
                                 % (rel, quotes_src - new.count('"')))
            # undo-check: putting the removed material back restores the bytes.
            # Re-insert ascending -- a deletion is undone by walking the
            # recorded positions from the top down, because every re-insertion
            # shifts the lines below it.
            restored = list(items)
            for idx, payload in sorted(removed, key=lambda t: t[0]):
                if site["kind"] == "delete":
                    restored.insert(idx, payload)
                else:
                    restored[idx] = (payload, restored[idx][1])
            if join_lines(restored) != src:
                raise SystemExit("ABORT: %s is not a pure removal -- undoing it "
                                 "does not restore the file" % rel)

        if status == "already":
            n_already += 1
        else:
            n_applied += 1

        if args.dry:
            print("%-46s %-7s %d line(s)" % (rel, status, len(removed)))
            for idx, payload in sorted(removed):
                if site["kind"] == "delete":
                    print("      -  L%-4d %r" % (idx + 1, payload[0]))
                else:
                    print("      -  L%-4d %r" % (idx + 1, payload))
                    print("      +  L%-4d %r" % (idx + 1, site["after"]))
        else:
            with open(path, "wb") as fh:
                fh.write(new.encode("utf-8"))

    if args.verify:
        print("verify: %d/%d chapters replay byte-identically from HEAD"
              % (n_verified, len(sites)))
        return

    if args.dry:
        print("dry: %d to fix, %d already clean, %d site(s)"
              % (n_applied, n_already, len(sites)))
        return

    print("apply: fixed %d, already clean %d, site(s) %d"
          % (n_applied, n_already, len(sites)))

    # post-condition: the detectors must read zero across the whole library
    fences, dqs = [], []
    for vol in range(1, 8):
        d = os.path.join(ROOT, "chapters", "volume-%d" % vol)
        for f in sorted(os.listdir(d)):
            if not re.search(r"chapter-\d+-polished\.md$", f):
                continue
            text = open(os.path.join(d, f), "rb").read().decode("utf-8")
            for ln in detector_fence(text):
                fences.append((f, ln))
            for ln in detector_dq(text):
                dqs.append((f, ln))
    print("post-condition: fence lines %d, triple-double-quote lines %d"
          % (len(fences), len(dqs)))
    if fences or dqs:
        raise SystemExit("ABORT: the detectors are not at zero: %s %s"
                         % (fences[:5], dqs[:5]))


main()
