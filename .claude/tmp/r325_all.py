# -*- coding: utf-8 -*-
"""List EVERY near-duplicate pair inside one chapter, not just one per paragraph.

Usage:  python .claude/tmp/r325_all.py 161

`r325_show.py` marks a paragraph `seen` after the first group it lands in, so a
paragraph repeated five times shows up once.  That is right for building a
table but wrong for judging a chapter: a beat told seven times looks like two
groups.  This prints the full pair graph on the queue's own rule, so the size
of a cluster is visible before deciding how to break it.
"""
import difflib
import io
import os
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')


def grams(s, n=5):
    s = re.sub(u'[^\u4e00-\u9fff]', '', s)
    return set(s[i:i + n] for i in range(len(s) - n + 1))


def find_chapter(num):
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for root, _, files in os.walk(os.path.join(base, 'chapters')):
        for f in files:
            if f == 'chapter-%s-polished.md' % num:
                return os.path.join(root, f)
    raise SystemExit('no such chapter: %s' % num)


def main(num):
    path = find_chapter(num)
    txt = io.open(path, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    idx = [i for i, x in enumerate(lines)
           if x.strip() and len(CJK.findall(x)) >= 20
           and x.lstrip()[0] not in u'#>（']
    G = {i: grams(lines[i]) for i in idx}
    pairs = []
    for a in range(len(idx)):
        ia = idx[a]
        for b in range(a + 1, len(idx)):
            ib = idx[b]
            A, B = G[ia], G[ib]
            if not A or not B:
                continue
            if len(A & B) / float(min(len(A), len(B))) < 0.55:
                continue
            if abs(len(lines[ia]) - len(lines[ib])) > 0.35 * max(len(lines[ia]),
                                                               len(lines[ib])):
                continue
            r = difflib.SequenceMatcher(None, lines[ia], lines[ib]).ratio()
            if r >= 0.90:
                pairs.append((r, ia + 1, ib + 1, len(CJK.findall(lines[ia]))))

    pairs.sort(key=lambda x: (-x[0], x[1]))
    print('=== %s  cjk %d  pairs %d' % (os.path.basename(path),
                                        len(CJK.findall(txt)), len(pairs)))
    # which lines are involved, so a cluster's membership is obvious
    touched = {}
    for r, la, lb, c in pairs:
        touched.setdefault(la, 0)
        touched[la] += 1
        touched.setdefault(lb, 0)
        touched[lb] += 1
    print('lines involved: %s' % sorted(touched))
    for r, la, lb, c in pairs:
        print('\n-- %.2f  L%d  vs  L%d   (earlier %d cjk)' % (r, la, lb, c))
        print('   L%-4d %s' % (la, lines[la - 1]))
        print('   L%-4d %s' % (lb, lines[lb - 1]))
    return path


if __name__ == '__main__':
    main(sys.argv[1])
