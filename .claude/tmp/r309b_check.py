# -*- coding: utf-8 -*-
"""R309 stage-2 pre-apply check.

Rewriting is where new tells get introduced, so the check runs on the
replacement text itself, before it touches the library:

  1. L1 banned words that were not in the old text,
  2. DEADLY sentence patterns that were not in the old text,
  3. cross-chapter echoes -- a sentence of >= 12 CJK that would end up in two
     or more chapters (the one defect stage 1 actually shipped and had to
     repair afterwards),
  4. in-chapter echoes -- the same sentence twice inside one chapter.

Usage: python .claude/tmp/r309b_check.py tools/r309b_sites.json
"""
import glob
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
SPLIT = re.compile(u'(?<=[。！？])')
MIN = 12

BANNED = [u'仿佛', u'犹如', u'宛若', u'如同', u'缓缓', u'不禁', u'微微',
          u'轻轻', u'淡淡', u'一丝', u'一股', u'一抹', u'一缕',
          u'深吸一口气', u'眼中闪过', u'嘴角勾起', u'眉头微皱',
          u'不容置疑', u'显而易见', u'毫无疑问', u'不由自主', u'情不自禁',
          u'从容不迫', u'波澜不惊', u'纹丝不动']
DEADLY = [
    (u'not-is-comparison', re.compile(u'不是[^，。！？]{1,10}，是[^，。！？]{1,10}')),
    (u'not-is-而是', re.compile(u'不是[^，。！？]{1,10}而是[^，。！？]{1,10}')),
    (u'negation-parade', re.compile(u'没有[^，。！？]{1,12}，没有[^，。！？]{1,12}')),
    (u'em-dash', re.compile(u'——')),
    (u'他知道', re.compile(u'他知道[^\\n]{1,40}')),
]


def sents(t):
    return [s.strip() for s in SPLIT.split(t.replace('\r\n', '\n')) if s.strip()]


def main():
    table = json.load(io.open(sys.argv[1], encoding='utf-8'))
    recs = table['records']

    # library sentence -> chapters, with the replacements already applied
    disk = {}
    for f in glob.glob('chapters/volume-*/*-polished.md'):
        disk[f.replace('\\', '/')] = io.open(f, encoding='utf-8').read()
    for r in recs:
        lines = disk[r['path']].replace('\r\n', '\n').split('\n')
        i = r['line'] - 1
        lines[i] = lines[i].replace(r['old'], r['new'], 1)
        disk[r['path']] = '\n'.join(lines)

    idx = {}
    for path, txt in disk.items():
        ch = re.search(r'chapter-(\d+)', path).group(1)
        for s in sents(txt):
            if len(CJK.findall(s)) >= MIN:
                idx.setdefault(s, set()).add(ch)

    fails = 0
    for r in recs:
        tag = '%s L%d' % (r['path'].split('/')[-1], r['line'])
        for w in BANNED:
            if w in r['new'] and w not in r['old']:
                print('FAIL banned  %s : %s' % (tag, w))
                fails += 1
        for name, rx in DEADLY:
            for m in rx.finditer(r['new']):
                if m.group(0) not in r['old']:
                    print('FAIL deadly  %s : %s -- %s' % (tag, name, m.group(0)))
                    fails += 1
        # Echoes are measured on the sentence each replacement LANDS IN, not on
        # the fragment.  R314 caught the difference: `在创造变量"，但不会。失控"。`
        # was replaced by a 10-CJK fragment, which is under the 12 floor, so the
        # sentence containing it was never compared -- and both ch814 records
        # passed while making the sentence byte-identical to v5 ch714 L39.
        landed = [s.strip() for s in sents(disk[r['path']].split('\n')[r['line'] - 1])
                  if r['new'] in s]
        for s in landed:
            if len(CJK.findall(s)) < MIN:
                continue
            if '"' in s or u'「' in s or u'」' in s:
                continue
            chapters = idx.get(s, set())
            if len(chapters) > 1:
                print('FAIL cross-chapter  %s : %s  -> %s'
                      % (tag, s[:40], sorted(chapters)))
                fails += 1
        # in-chapter duplication
        own = {}
        for s in sents(disk[r['path']]):
            if len(CJK.findall(s)) >= MIN:
                own[s] = own.get(s, 0) + 1
        for s in sents(r['new']) + landed:
            if own.get(s, 0) > 1 and len(CJK.findall(s)) >= MIN:
                print('FAIL in-chapter  %s : %s' % (tag, s[:40]))
                fails += 1
                break

    print()
    print('CHECK %s: %d failures over %d records'
          % ('OK' if fails == 0 else 'FAIL', fails, len(recs)))
    raise SystemExit(0 if fails == 0 else 1)


main()
