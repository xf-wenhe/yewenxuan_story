#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R251 stage-1 pilot: restore V5 *dialogue* quotes from the pre-strip parent.

Background
----------
9252b142 ("V5 mechanical deslop complete", 2026-08-22) removed ~98.5% of V5's ASCII
quotation marks (182,077 -> 2,747 across 200 chapters).  Its parent 9252b142^ still
carries them -- but 74.7% of the parent's quote pairs are *term/emphasis* quotes
("感觉到", "编译", "结构", "沉睡"), i.e. the AI-tell class R238 deliberately removed
from V6/V7.  A wholesale restore would undo R238, so the parent must not be replayed.

Stage 1 restores ONLY dialogue quotes, and only where all three gates hold:

  1. the current line is identical to a parent line once quotes *and* punctuation
     (`，。：；、！？…—`) are removed -- the strip also rewrote `。"` as `，`, so a
     punctuation-blind comparison is what reaches the damaged band (ch665-707) at all,
  2. both quote boundaries land inside that identical text, and
  3. the surrounding anchor is unique in the current line.

A pair is restored only if BOTH of its boundaries pass -- never one end alone, so the
quote count can never be pushed odd.  Everything else is skipped and left to stage 2
(the manual per-chapter pass).  Fail-closed by construction.

Usage
-----
    python tools/fix_r251_quote_restore.py --dry  --chapters band  [--samples 8]
    python tools/fix_r251_quote_restore.py --dry  --chapters all
    python tools/fix_r251_quote_restore.py --apply --chapters all
    python tools/fix_r251_quote_restore.py --verify --chapters all
"""
import argparse
import os
import re
import subprocess
import sys

PARENT_REV = "9252b142^"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DQT = '"'

CJK = re.compile(r"[一-鿿]")
# An attribution must be a *structure*, not a bare verb: "optional punct + 2-4 char name +
# speech verb + punct".  Matching bare verbs misfires on 答案 / 知道 / 说明 / 概念 -- that
# bug restored the emphasis quote in ch619 ("编译") on the first dry run.
NAME = r"[一-鿿]{2,4}"
VERB = r"(说|问|答|喊|叫|回答|反问|自语|补充|开口|出声|说话|说道|问道|答道|喊道|叫道|叹道|嘟囔|嘟哝|咕哝|低声)"
ATTR_AFTER = re.compile(r"^[，。：]?" + NAME + VERB + r"[，。：！？]")
ATTR_BEFORE = re.compile(NAME + VERB + r"[，。：]?$")
SENT_END = "。？！…"
# The strip pass also rewrote `。"` as `，`, so two lines that differ only in this class of
# punctuation are still the same text; only quote *positions* are ever transferred, never
# words.  This is what reaches the damaged band (ch665-707) at all.
NORM_DROP = "，。：；、！？…—"
ANCHORS = (10, 8, 6, 5, 4, 3, 2)  # anchor half-widths to try, longest first

# R251 stage-1 pilot: best / middling / worst parent-alignment coverage.
PILOT = [745, 650, 683, 654]
# The chapters whose *parent* is itself densely emphasis-quoted (per-line quote count > 10).
BAND = [n for n in range(665, 708) if n != 667] + [711, 719, 720, 721]


def norm(s):
    """Text minus punctuation and whitespace -- the alignment key."""
    return "".join(ch for ch in s if ch not in NORM_DROP and not ch.isspace())


def parse_scope(text):
    if text == "all":
        return list(range(551, 751))
    if text == "band":
        return list(BAND)
    if text == "pilot":
        return list(PILOT)
    out = []
    for part in text.split(","):
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


def chapter_path(n):
    return "chapters/volume-5/chapter-%d-polished.md" % n


def git_show(rev, path):
    r = subprocess.run(["git", "show", "%s:%s" % (rev, path)], capture_output=True)
    if r.returncode != 0:
        return None
    return r.stdout.decode("utf-8", "replace")


def split_keep(text):
    """Split on \\n, remembering which lines ended with \\r, so the file round-trips."""
    out = []
    for piece in text.split("\n"):
        if piece.endswith("\r"):
            out.append((piece[:-1], True))
        else:
            out.append((piece, False))
    return out


def join_keep(parts):
    return "\n".join(core + ("\r" if cr else "") for core, cr in parts)


def find_quotes(text):
    """Return [(open_i, close_i, content)] for balanced pairs on one line."""
    out = []
    i, n = 0, len(text)
    while i < n:
        if text[i] == DQT:
            j = text.find(DQT, i + 1)
            if j == -1:
                break  # odd trailing quote -- stop, do not guess
            out.append((i, j, text[i + 1:j]))
            i = j + 1
        else:
            i += 1
    return out


def is_dialogue(text, i, j, content):
    """Utterance, as opposed to a term/emphasis quote.

    Deliberately conservative: stage 1 must never re-introduce the AI-tell emphasis
    quotes that R238 removed.  A short noun phrase like 编译 / 结构 / 感觉到 has no
    attribution and no sentence shape, so it fails every branch below.

    The earlier "content contains 。 and is short" test was too loose for the damaged
    band: there the strip-era text wrapped sentence *fragments* in quotes and pushed the
    period inside ("逐渐。" / "纹路。" / "的。" / "吧"), so those pairs classified as
    dialogue.  Harmless while alignment demanded byte-identical lines, fatal once
    alignment went punctuation-blind -- so the content must now *end* with terminal
    punctuation, and either open the line or be followed by a sentence boundary.
    """
    cjk = len(CJK.findall(content))
    if cjk == 0:
        return False  # bare punctuation ("。", "……") is never an utterance we can vouch for
    if ATTR_AFTER.match(text[j + 1:j + 24]):
        return True
    if ATTR_BEFORE.search(text[max(0, i - 16):i]):
        return True
    if cjk > 12:
        return True
    if content[-1] in SENT_END and cjk >= 2:
        if text[:i].strip() == "":
            return True  # the pair opens the line: it is the line's speech
        after = text[j + 1:j + 2]
        if after == "" or after in SENT_END + "，。！？：；、…":
            return True  # the pair ends a sentence: mid-line narration may follow
        if cjk >= 6:
            return True  # long enough to be an utterance even embedded in a sentence
    return False


def map_line(parent_line, current_line):
    """Try to place this line's dialogue quotes into current_line.

    Returns (positions, stats). positions are indices in current_line; empty means
    nothing could be restored on this line.
    """
    stats = {"pairs": 0, "restored": 0, "reasons": {}}

    def bump(reason, count=1):
        stats["reasons"][reason] = stats["reasons"].get(reason, 0) + count

    spans = [s for s in find_quotes(parent_line) if is_dialogue(parent_line, *s)]
    stats["pairs"] = len(spans)
    if not spans:
        return [], stats
    # A line that still carries quotes was only partially stripped by 9252b142; inserting
    # into it produces ""doubled"" marks (ch749 had 142 of them).  Leave such lines alone.
    if DQT in current_line:
        bump("line-already-has-quotes", len(spans))
        return [], stats

    P = parent_line.replace(DQT, "")
    C = current_line.replace(DQT, "")
    PN = norm(P)
    CN = norm(C)
    # Identical once quotes *and* punctuation are removed -- or nothing.  A mere similarity is
    # not enough to transfer a quote position: when the parent line is itself densely
    # emphasis-quoted (ch683 "维护派"的"队长。"在"。"说。"), deleting those quotes leaves a
    # de-quoted form that only *resembles* the current line, and a fuzzy matcher will happily
    # place a quote mid-sentence.  The punctuation-blind comparison is what reaches the
    # `。"` -> `，` rewrites of the damaged band (ch665-707); it is safe only because
    # is_dialogue now rejects the sentence-fragment emphasis pairs that band is full of.
    if not PN or PN != CN:
        bump("text-differs-from-parent", len(spans))
        return [], stats
    # Index maps through the views of the line: P -> PN == CN -> C -> current_line.
    cn_to_c = [k for k, ch in enumerate(C) if ch not in NORM_DROP and not ch.isspace()]
    c_to_line = [k for k, ch in enumerate(current_line) if ch != DQT]

    def c_index(kn):
        return cn_to_c[kn] if kn < len(cn_to_c) else len(C)

    def line_index(c_k):
        return c_to_line[c_k] if c_k < len(c_to_line) else len(current_line)

    def boundary(k):
        """Index in PN where a quote sitting immediately before P[k] must land."""
        return len(norm(P[:k]))

    inserts = []
    placed = 0
    for (i, j, _content) in spans:
        pair = []
        for idx in (i, j):
            k = idx - parent_line.count(DQT, 0, idx)
            kn = boundary(k)
            pos_c = None
            for half in ANCHORS:
                left = PN[max(0, kn - half):kn]
                right = PN[kn:kn + half]
                full = left + right
                if not full or CN.count(full) != 1:
                    continue
                if CN.find(full) + len(left) != kn:
                    continue  # anchor agrees with itself but not with the alignment
                pos_c = c_index(kn)
                break
            if pos_c is None:
                bump("anchor-not-unique")
                pair = None
                break
            pair.append(pos_c)
        if pair is None:
            continue
        if pair[0] == pair[1] or pair[0] in inserts or pair[1] in inserts:
            bump("ambiguous-position")
            continue
        inserts.extend(pair)
        placed += 1

    if not inserts:
        return [], stats
    positions = sorted(line_index(p) for p in inserts)
    # Fail-closed self-check: the restored line must read as dialogue end to end.  Catches
    # pairs whose surrounding text later rounds rewrote out from under the anchor
    # (ch559 "等他，他会来他会看到门", ch654, ch730) -- those go to stage 2 instead.
    # Withdrawal is line-wide and happens *before* anything is counted as restored, so the
    # per-line arithmetic (pairs == restored + reasons) stays exact.
    probe = current_line
    for p in sorted(positions, reverse=True):
        probe = probe[:p] + DQT + probe[p:]
    for (qi, qj, qc) in find_quotes(probe):
        if not is_dialogue(probe, qi, qj, qc):
            bump("self-check-failed", placed)
            return [], stats
    stats["restored"] = placed
    return positions, stats


def align_lines(parent_lines, current_lines):
    """For each current line index, the parent line index it maps to (or None).

    Keyed on the punctuation-blind, quote-blind form, and only when the parent line is the
    *only* line carrying that key -- an ambiguous one (a repeated line such as "嗯。") is
    never used, because quoting either candidate would be a guess.  map_line re-checks the
    same condition per line, so nothing here can force a restore through.
    """
    parent_key = {}
    for pi, pline in enumerate(parent_lines):
        key = norm(pline.replace(DQT, ""))
        if key:
            parent_key.setdefault(key, []).append(pi)

    mapping = {}
    for ci, cline in enumerate(current_lines):
        key = norm(cline.replace(DQT, ""))
        if not key:
            continue
        hits = parent_key.get(key)
        if hits and len(hits) == 1:
            mapping[ci] = hits[0]
    return mapping


def transform_text(text, parent):
    """Pure transformation: (current text, parent text) -> result dict.

    process() feeds it the working tree; verify() feeds it the HEAD blob, so the same
    edits can be replayed onto committed bytes and compared byte for byte.
    """
    has_bom = text.startswith("﻿")
    if has_bom:
        text = text[1:]

    cur_parts = split_keep(text)
    par_parts = split_keep(parent)
    cur_lines = [c for c, _ in cur_parts]
    par_lines = [c for c, _ in par_parts]

    mapping = align_lines(par_lines, cur_lines)
    # One-to-one only.  align_lines already requires the parent line to be unique, but two
    # *current* lines can still claim the same parent line (a repeated line such as "嗯。"),
    # and quoting both would be a guess -- so drop every contested parent line.
    claimants = {}
    for ci, pi in mapping.items():
        claimants.setdefault(pi, []).append(ci)
    contested = {pi for pi, cis in claimants.items() if len(cis) > 1}
    if contested:
        mapping = {ci: pi for ci, pi in mapping.items() if pi not in contested}

    all_inserts = {}
    totals = {"pairs": 0, "restored": 0, "reasons": {}}
    for ci, pi in mapping.items():
        pos, st = map_line(par_lines[pi], cur_lines[ci])
        # Every dialogue pair on a mapped line must end up either restored or explained.
        accounted = st["restored"] + sum(st["reasons"].values())
        if st["pairs"] != accounted:
            raise AssertionError(
                "line %d (parent %d): pairs=%d but restored+reasons=%d"
                % (ci + 1, pi + 1, st["pairs"], accounted))
        totals["pairs"] += st["pairs"]
        totals["restored"] += st["restored"]
        for r, v in st["reasons"].items():
            totals["reasons"][r] = totals["reasons"].get(r, 0) + v
        if pos:
            all_inserts[ci] = pos

    samples = []
    suspects = []
    for ci, positions in sorted(all_inserts.items()):
        before = cur_lines[ci]
        after = before
        for p in sorted(positions, reverse=True):
            after = after[:p] + DQT + after[p:]
        par = par_lines[mapping[ci]] if mapping.get(ci) is not None else ""
        samples.append((ci + 1, par, before, after))
        # Self-check: every quote this round creates must itself classify as dialogue.
        # A single suspect means the classifier leaked an emphasis quote (ch619 "编译").
        for (qi, qj, qc) in find_quotes(after):
            if not is_dialogue(after, qi, qj, qc):
                suspects.append((ci + 1, qc, after))
        cur_parts[ci] = (after, cur_parts[ci][1])

    new_text = join_keep(cur_parts)
    if has_bom:
        new_text = "﻿" + new_text

    return {
        "old": text,
        "new": new_text,
        "changed": new_text != text,
        "parent_quotes": parent.count(DQT),
        "cur_quotes": text.count(DQT),
        "lines_changed": len(all_inserts),
        "contested": len(contested),
        "totals": totals,
        "samples": samples,
        "suspects": suspects,
    }


def process(n):
    """Run the transformation against the working tree."""
    path = chapter_path(n)
    abs_path = os.path.join(ROOT, path)
    with open(abs_path, "rb") as fh:
        raw = fh.read()
    text = raw.decode("utf-8")
    parent = git_show(PARENT_REV, path)
    if parent is None:
        return None
    res = transform_text(text, parent)
    res["n"] = n
    res["path"] = abs_path
    return res


def verify(n):
    """Replay the same edits onto the HEAD blob and compare with the working tree.

    EOL is the only difference allowed: .gitattributes pins eol=lf, so a CRLF working
    tree file legitimately differs from its LF blob.  Anything else is a MISMATCH, and
    this is the only check that proves no other byte -- BOM, CRLF/LF, stray edits -- moved.
    """
    path = chapter_path(n)
    abs_path = os.path.join(ROOT, path)
    with open(abs_path, "rb") as fh:
        disk = fh.read()
    head = git_show("HEAD", path)
    parent = git_show(PARENT_REV, path)
    if head is None or parent is None:
        return "NO-BLOB"
    expected = transform_text(head, parent)["new"].encode("utf-8")
    if expected == disk:
        return "IDENTICAL"
    if expected.replace(b"\n", b"\r\n") == disk:
        return "EOL-ONLY"
    return "MISMATCH"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--samples", type=int, default=6)
    ap.add_argument("--chapters", default="pilot",
                    help="'all', 'band', 'pilot', or a list such as 665-707,711")
    args = ap.parse_args()
    scope = parse_scope(args.chapters)
    if args.verify:
        bad = 0
        for n in scope:
            outcome = verify(n)
            if outcome == "MISMATCH":
                bad += 1
            print("ch%d  %s" % (n, outcome))
        print("VERIFY: %s" % ("PASS" if bad == 0 else "FAIL (%d MISMATCH)" % bad))
        return 0 if bad == 0 else 3
    if not (args.dry or args.apply):
        ap.error("pass --dry, --apply or --verify")
    if args.dry and args.apply:
        ap.error("--dry and --apply are mutually exclusive")

    grand = {"pairs": 0, "restored": 0, "changed_lines": 0,
             "cjk": 0, "quotes_before": 0, "quotes_after": 0}
    reasons = {}
    suspects_total = 0
    results = []
    for n in scope:
        res = process(n)
        if res is None:
            print("ch%d: parent not found -- ABORT" % n)
            return 1
        t = res["totals"]
        grand["pairs"] += t["pairs"]
        grand["restored"] += t["restored"]
        grand["changed_lines"] += res["lines_changed"]
        grand["cjk"] += len(CJK.findall(res["old"]))
        grand["quotes_before"] += res["cur_quotes"]
        grand["quotes_after"] += res["new"].count(DQT)
        for r, v in t["reasons"].items():
            reasons[r] = reasons.get(r, 0) + v
        added = res["new"].count(DQT) - res["old"].count(DQT)
        print("=" * 72)
        print("ch%d  parent_quotes=%d  now_quotes=%d  -> +%d quotes on %d lines  "
              "pairs=%d restored=%d %s"
              % (n, res["parent_quotes"], res["cur_quotes"], added, res["lines_changed"],
                 t["pairs"], t["restored"], dict(sorted(t["reasons"].items()))))
        for (ln, par, before, after) in res["samples"][:args.samples]:
            print("  L%-4d父本  %s" % (ln, par))
            print("  L%-4d 修前  %s" % (ln, before))
            print("  L%-4d 修后  %s" % (ln, after))
        if res["suspects"]:
            print("  !! SUSPECT x%d -- restore leaked a non-dialogue quote:" % len(res["suspects"]))
            for (ln, content, line) in res["suspects"][:5]:
                print("     L%d  内容=%r  %s" % (ln, content, line))
            suspects_total += len(res["suspects"])
        results.append(res)

    print("=" * 72)

    def density(q):
        return (1000.0 * q / grand["cjk"]) if grand["cjk"] else 0.0

    print("TOTAL (%d chapters): dialogue pairs=%d restored=%d (%.1f%%)  lines=%d  skip=%s"
          % (len(scope), grand["pairs"], grand["restored"],
             (100.0 * grand["restored"] / grand["pairs"]) if grand["pairs"] else 0.0,
             grand["changed_lines"], dict(sorted(reasons.items()))))
    print("      quotes %d -> %d   density %.1f/1000 -> %.1f/1000   (CJK %d, unchanged)"
          % (grand["quotes_before"], grand["quotes_after"],
             density(grand["quotes_before"]), density(grand["quotes_after"]), grand["cjk"]))
    print("GATE: suspects=%d  -> %s" % (suspects_total, "PASS" if suspects_total == 0 else "FAIL"))
    if args.apply:
        if suspects_total:
            print("ABORT: refusing to write while a restored quote fails the dialogue test.")
            return 2
        for res in results:
            if res["changed"]:
                with open(res["path"], "wb") as fh:
                    fh.write(res["new"].encode("utf-8"))
                print("applied: %s" % os.path.relpath(res["path"], ROOT))
    else:
        print("(dry run -- nothing written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
