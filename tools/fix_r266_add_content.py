# -*- coding: utf-8 -*-
"""R266 (补字轮): put narrative content back into the seven chapters that
deletion rounds pushed under the 3000 CJK floor.

    ch87 2999 / ch297 2999 / ch313 2996 / ch317 2997 /
    ch374 2997 / ch675 2998 / ch820 2962

The precedent is commit b4dcfc8e ("Fix 5 barely-below chapters ... add narrative
content"): when a chapter is under the floor, write prose into it.

This round is PURELY ADDITIVE -- nothing already on disk is deleted or rewritten.
Each site splices a block of new paragraphs in above an anchor line:

    tools/r266_add_sites.json   chapter / before_line / anchor / blank_separated / paragraphs

Anchoring is (line number, exact whole-line text).  Lines are carried as
(core, cr) pairs so a line's own EOL travels with it: no CR, LF or final-newline
byte can drift, and the inserted lines copy the file's own EOL family.  The
paragraph separator follows the file's own convention -- the V1 chapter here has
no blank line between paragraphs, every other chapter does.

Usage:
    python tools/fix_r266_add_content.py --dry      # print the insertions
    python tools/fix_r266_add_content.py --apply    # rewrite the chapters
    python tools/fix_r266_add_content.py --verify   # replay onto HEAD bytes

Fail-closed: a site whose line is neither the anchor nor the block's own first
paragraph aborts the whole run before anything is written.  Idempotent: a re-run
skips every site whose block is already in place.  Every run asserts that
removing the inserted block restores the previous bytes exactly, so "additive"
is checked, not assumed.
"""
import argparse
import io
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SITES = os.path.join("tools", "r266_add_sites.json")
CJK = re.compile(r"[一-鿿]")

# the floor this round exists to clear, plus the margin the author's chapters
# are expected to keep; every touched chapter must end above the second number
MIN_CJK = 3000
TARGET_CJK = 3050

L1_WORDS = ['仿佛', '犹如', '宛若', '如同', '深吸一口气', '缓缓', '不禁', '微微', '轻轻',
            '淡淡', '眼中闪过', '嘴角勾起', '眉头微皱', '眉眼低垂', '瞳孔微缩', '心中暗道',
            '不由得', '不容置疑', '不容置喙', '不易察觉', '显而易见', '毫无疑问', '不可否认',
            '坚定', '闪烁着光芒', '狡黠', '深邃', '凛冽', '冰冷', '不由自主', '情不自禁',
            '自然而然']
DEADLY = [r'不是([^，。]{1,10})[，———]而是', r'带着([^，。]{1,10})的', r'声音不大[，———]却',
          r'他?她知道([^。]{0,30})[。\n]', r'仿佛([^，。]{1,10})一般',
          r'眼中闪过一丝([^，。]{1,6})', r'心中涌起一股([^，。]{1,6})', r'脑子在运转',
          r'脑中闪过([^，。]{1,8})', r'心中一([^，。]{1,4})']

VOL_OF = {}
for _n in range(1, 8):
    _lo = {1: 1, 2: 101, 3: 251, 4: 401, 5: 551, 6: 751, 7: 919}[_n]
    _hi = {1: 100, 2: 250, 3: 400, 4: 550, 5: 750, 6: 918, 7: 1000}[_n]
    for _i in range(_lo, _hi + 1):
        VOL_OF[_i] = _n


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


def block_of(site, eol):
    """The list of (core, cr) lines this site inserts."""
    paras = site["paragraphs"]
    out = []
    for i, p in enumerate(paras):
        out.append((p, eol))
        if site["blank_separated"] and i != len(paras) - 1:
            out.append(("", eol))
    if site["blank_separated"]:
        out.append(("", eol))
    return out


def check_prose(site):
    """The inserted text must obey the book's own de-AI rules."""
    added = "\n".join(site["paragraphs"])
    hits = [w for w in L1_WORDS if w in added]
    for pat in DEADLY:
        m = re.search(pat, added)
        if m:
            hits.append("DEADLY %s -> %r" % (pat, m.group(0)))
    return hits


def add_block(items, site, label):
    """Insert the site's block in place.

    Returns (status, start, length) where `start`/`length` locate the inserted
    slice, so the caller can take it back out and prove the round was additive.
    """
    ln = site["before_line"]
    if not (1 <= ln <= len(items)):
        raise SystemExit("ABORT: %s: no line %d" % (label, ln))
    eol = "\r" if any(cr for _c, cr in items) else ""
    block = block_of(site, eol)
    first = block[0][0]
    here = items[ln - 1][0]
    if here == first:
        return "already", None, 0           # the block is already spliced in
    if here != site["anchor"]:
        raise SystemExit(
            "ABORT: %s line %d is neither the anchor nor the block:\n"
            "   anchor: %r\n   block : %r\n   disk  : %r"
            % (label, ln, site["anchor"][:90], first[:90], here[:90]))
    items[ln - 1:ln - 1] = block
    return "applied", ln - 1, len(block)


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
    by_chapter = {}
    for i, s in enumerate(sites):
        by_chapter.setdefault(s["chapter"], []).append((i, s))

    n_applied = n_already = n_verified = 0
    for n in sorted(by_chapter):
        path = chapter_path(n)
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        src = decode(read_bytes(path), rel)
        items = split_lines(src)

        # descend so an earlier site's line numbers stay valid
        order = sorted(by_chapter[n], key=lambda t: -t[1]["before_line"])
        results = {}
        insertions = []
        if not args.verify:
            for idx, site in order:
                status, start, length = add_block(items, site, rel)
                results[idx] = status
                if status == "applied":
                    insertions.append((start, length))

        new = join_lines(items)
        # only the sites that were actually spliced in move the counters; on a
        # re-run every site is already in place and nothing may have changed
        done = [s for i, s in by_chapter[n] if results.get(i) == "applied"] \
            if not args.verify else []
        eol = "\r" if src.count("\r\n") else ""
        added_cjk = sum(len(CJK.findall("\n".join(s["paragraphs"]))) for s in done)
        added_lines = sum(len(block_of(s, eol)) for s in done)

        # --- invariants -----------------------------------------------------
        if args.verify:
            head = to_lf(decode(head_bytes(path), "HEAD:" + rel))
            head_items = split_lines(head)
            for idx, site in by_chapter[n]:
                add_block(head_items, site, "HEAD:" + rel)
            if join_lines(head_items) != to_lf(new):
                raise SystemExit("ABORT: %s replay from HEAD differs" % rel)
            n_verified += 1
        else:
            cjk_src = len(CJK.findall(src))
            cjk_new = len(CJK.findall(new))
            if cjk_new - cjk_src != added_cjk:
                raise SystemExit("ABORT: %s CJK moved %d, table says %d"
                                 % (rel, cjk_new - cjk_src, added_cjk))
            if new.count("\n") - src.count("\n") != added_lines:
                raise SystemExit("ABORT: %s line count moved by %d, table says %d"
                                 % (rel, new.count("\n") - src.count("\n"), added_lines))
            want_cr = src.count("\r") + (added_lines if src.count("\r") else 0)
            if new.count("\r") != want_cr:
                raise SystemExit("ABORT: %s CR count %d, expected %d"
                                 % (rel, new.count("\r"), want_cr))
            for _i, s in by_chapter[n]:
                hits = check_prose(s)
                if hits:
                    raise SystemExit("ABORT: %s new text breaks de-AI rules: %s"
                                     % (rel, "; ".join(hits)))
            # additive, checked rather than assumed: the old bytes survive
            # untouched once the inserted block is taken back out
            restored = list(items)
            for start, length in sorted(insertions, reverse=True):
                del restored[start:start + length]
            if join_lines(restored) != src:
                raise SystemExit("ABORT: %s is not additive -- removing the "
                                 "inserted block does not restore the file" % rel)
            if cjk_new < TARGET_CJK:
                raise SystemExit("ABORT: %s ends at %d CJK, under the %d target"
                                 % (rel, cjk_new, TARGET_CJK))

        for idx, site in by_chapter[n]:
            if results.get(idx) == "already":
                n_already += 1
            elif not args.verify:
                n_applied += 1

        if args.dry:
            for idx, site in by_chapter[n]:
                mark = "=" if results.get(idx) == "already" else " "
                print("%s ch%-4d +L%-4d (%s)  %d -> %d CJK"
                      % (mark, n, site["before_line"],
                         "already" if results.get(idx) == "already" else "insert",
                         len(CJK.findall(src)), len(CJK.findall(new))))
                for p in site["paragraphs"]:
                    print("      +  %s" % p)
                print()
        elif args.verify:
            pass
        else:
            with open(path, "wb") as fh:
                fh.write(new.encode("utf-8"))

    if args.verify:
        print("verify: %d/%d chapters replay byte-identically from HEAD"
              % (n_verified, len(by_chapter)))
    elif args.dry:
        print("dry: %d to insert, %d already in place, %d chapters"
              % (n_applied, n_already, len(by_chapter)))
    else:
        print("apply: inserted %d, already in place %d, chapters %d"
              % (n_applied, n_already, len(by_chapter)))


main()
