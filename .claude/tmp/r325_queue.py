# -*- coding: utf-8 -*-
"""Recost the R325 queue against the chapters as they are now.

The queue was measured before any of this work started, so it still charges for
nine chapters that are finished and still quotes the headroom they had when
they were twice their present length.  This walks the same rule the queue was
built with -- paragraphs of >=20 CJK, not headings / blockquotes / 章末 markers,
scored by difflib, one pair per later paragraph at >=0.90 -- and rewrites the
file with only the chapters that still have a group.

Exemptions already granted are carried over by path: a refrain is a chapter
where three or more paragraphs open with the same 34 characters and differ only
in what was appended, a counter is a pair that matches once the numerals are
stripped.  Both are deliberate repetition and neither is a defect.

Usage:  python .claude/tmp/r325_queue.py [--write]
"""
import difflib
import io
import json
import os
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QUEUE = os.path.join(ROOT, 'tools', 'r325_queue.json')
FLOOR = 3000


def grams(s, n=5):
    s = re.sub(u'[^\u4e00-\u9fff]', '', s)
    return set(s[i:i + n] for i in range(len(s) - n + 1))


def groups(path):
    txt = io.open(path, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    idx = [i for i, x in enumerate(lines)
           if x.strip() and len(CJK.findall(x)) >= 20
           and x.lstrip()[0] not in u'#>（']
    G = {i: grams(lines[i]) for i in idx}
    out, seen = [], set()
    for a in range(len(idx)):
        ia = idx[a]
        for b in range(a + 1, len(idx)):
            ib = idx[b]
            A, B = G[ia], G[ib]
            if not A or not B:
                continue
            if len(A & B) / float(min(len(A), len(B))) < 0.55:
                continue
            if abs(len(lines[ia]) - len(lines[ib])) > 0.35 * max(
                    len(lines[ia]), len(lines[ib])):
                continue
            if difflib.SequenceMatcher(None, lines[ia], lines[ib]).ratio() >= 0.90 \
                    and ib not in seen:
                seen.add(ib)
                out.append((ia + 1, ib + 1, len(CJK.findall(lines[ib]))))
    return len(CJK.findall(txt)), out


def main(write):
    old = json.load(io.open(QUEUE, encoding='utf-8'))
    items = old['items'] if isinstance(old, dict) else old
    keep, gone, total_cost = [], [], 0
    for it in items:
        path = os.path.join(ROOT, it['path'])
        cjk, g = groups(path)
        if not g:
            gone.append(it['path'])
            continue
        it = dict(it)
        it['pairs'] = [[a, b] for a, b, _ in g]
        it['cost'] = sum(c for _, _, c in g)
        it['total'] = cjk
        it['headroom'] = cjk - FLOOR
        keep.append(it)
        total_cost += it['cost']

    keep.sort(key=lambda x: -x['cost'])
    print('queued %d  cleared %d  duplicate cost %d CJK'
          % (len(keep), len(gone), total_cost))
    print('cleared: %s' % ', '.join(sorted(os.path.basename(p).split('-')[1]
                                            for p in gone)))
    for it in keep[:12]:
        print('  %-12s cost %4d  cjk %5d  headroom %+5d  pairs %d%s'
              % (os.path.basename(it['path']).split('-')[1], it['cost'],
                 it['total'], it['headroom'], len(it['pairs']),
                 '  REFRAIN' if it.get('refrain') else ''))
    if write:
        io.open(QUEUE, 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'floor': FLOOR,
                        'note': 'in-chapter near-duplicates, recosted after every '
                                'chapter that has been cleared',
                        'cost': total_cost, 'items': keep},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325_queue.json')


main('--write' in sys.argv)
