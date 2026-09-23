# -*- coding: utf-8 -*-
"""R242: six parent-verified repair sites in V6 (chapter-770/807/851/865/880).

Family A — gutted terms (3 sites). The Voice rounds (commit 9cd5e651, R133-R138)
collapsed a quoted term into `"……"`, losing the word itself. The add-time commit
(eee81640) carried 声音 at all three:

    ch770 但那只是。"声音"。             -> 但那只是。"……"，
    ch865 每个碎片都有自己的。"声音"。    -> 每个碎片都有自己的。"……"，
    ch880 0429残余在传递记录者的。"声音"。 -> 0429残余在传递记录者的。"……"。

Repair restores the word in the stripped house form, matching the Voice round's own
treatment of the sibling sites in the same paragraphs (`是。"意识的投影"。` ->
`是意识的投影。`). V4 ch501's `"……"赵磊的声音迟疑了` is a genuine ellipsis utterance
and is left alone.

Family B — ch851 attribution punctuation (2 sites). The chapter writes `。"未来叶说，`
at 14 sites and `"。未来叶说，` at 2; the slips move the period inside the closing
quote. Add-time carried the same `"。` shape, so the slip is authoring, not damage —
the chapter's own majority convention decides the fix.

Family C — ch807 quote structure (1 site). Add-time was
`未来叶文轩的声音说。"我低估的是"心"的力量`. R238 stripped the term marks but the
pairing cascade ran across the second one, leaving the resumed dialogue unopened and a
stray quote after 心. Restores the opening quote, drops the stray (net quote delta 0).

Every literal must occur exactly once in its file or the run aborts. Files are rebuilt
from the working-tree bytes with BOM state preserved; per-file CRLF/LF mix is untouched
by construction (no line-ending normalisation, no re-wrapping).

Modes: --report (default, no writes) | --apply

Round log: 20260923-10 gate=PASS raw_matches=0 filtered_matches=0 candidate_files=0.
Post-apply invariants: five files, 6 edits, diff --numstat 1/1 or 2/2 per file, CJK +2
at the three restored sites only (4350->4352 / 4429->4431 / 4862->4864), line counts and
BOM state unchanged, `"` totals even before and after, L1 words +0, DEADLY +0,
R238 detector 0 unbalanced / 0 DANGLING-KEPT, R240 detector 0 deletions.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
import fix_v6v7_quotes as Q
import polish_pipeline as pp

EDITS = [
    ('chapters/volume-6/chapter-770-polished.md',
     '"对。但那只是。"……"，融合之后，',
     '"对。但那只是声音。融合之后，'),
    ('chapters/volume-6/chapter-865-polished.md',
     '每个碎片都有自己的。"……"，每个碎片都有自己的想法。',
     '每个碎片都有自己的声音。每个碎片都有自己的想法。'),
    ('chapters/volume-6/chapter-880-polished.md',
     '0429残余在传递记录者的。"……"。',
     '0429残余在传递记录者的声音。'),
    ('chapters/volume-6/chapter-851-polished.md',
     '"我在2147年做了很多安排"。未来叶说，',
     '"我在2147年做了很多安排。"未来叶说，'),
    ('chapters/volume-6/chapter-851-polished.md',
     '"黑暗节点不是敌人"。未来叶说，',
     '"黑暗节点不是敌人。"未来叶说，'),
    ('chapters/volume-6/chapter-807-polished.md',
     '吐出声音来。我低估的是心"的力量',
     '吐出声音来。"我低估的是心的力量'),
]


def sites_of(text, old, new):
    """Position of the unique occurrence of `old`; already-applied returns None (idempotent),
    absent-or-ambiguous aborts."""
    n = text.count(old)
    if n == 0 and text.count(new) == 1:
        return None
    if n != 1:
        raise SystemExit('ABORT: literal %r occurs %d times' % (old, n))
    return text.find(old)


def main(apply=False):
    by_file = {}
    for path, old, new in EDITS:
        by_file.setdefault(path, []).append((old, new))
    total = 0
    for path, pairs in sorted(by_file.items()):
        raw = Q.read_raw(path)
        bom = raw.startswith(b'\xef\xbb\xbf')
        cur = Q.decode(raw)
        before = cur
        done = 0
        for old, new in pairs:
            i = sites_of(cur, old, new)
            if i is None:
                done += 1
                continue
            cur = cur[:i] + new + cur[i + len(old):]
            total += 1
        print('%-46s edits=%d  already=%d  quotes%+d  cjk%+d  lines%+d  bytes%+d  bom=%s'
              % (path.replace('\\', '/'), len(pairs), done,
                 cur.count('"') - before.count('"'),
                 pp.cjk_count(cur) - pp.cjk_count(before),
                 cur.count('\n') - before.count('\n'),
                 len(cur.encode('utf-8')) - len(before.encode('utf-8')), bom))
        if apply and total:
            with open(path, 'wb') as fh:
                fh.write((b'\xef\xbb\xbf' if bom else b'') + cur.encode('utf-8'))
    print('total edits=%d  mode=%s' % (total, 'APPLY' if apply else 'REPORT'))


if __name__ == '__main__':
    main(apply='--apply' in sys.argv)
