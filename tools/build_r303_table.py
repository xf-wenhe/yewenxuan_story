# -*- coding: utf-8 -*-
"""Build the R303 delete table.

Scope discipline: only the 50 sentences proven by trace_r303_origin.py to be
ORIGIN in a repair round are eligible, and only where deleting the whole line
keeps the chapter at or above the 3000 CJK floor.  Chapters that would fall
below the floor are deferred to a later round that refills with real content --
deleting here and padding later would just move the problem.

A record is a whole-line delete (op=del).  Neighbouring lines are left alone
even when they read like filler too: this round deletes what it can prove, and
proving a neighbour would need its own trace.

Writes tools/r303_sites.json.
"""
import io
import json
import os
import re
import sys

BS = chr(92)
CJK = re.compile('[一-鿿]')
FLOOR = 3000


def main():
    with io.open('.claude/tmp/r303_filler.json', encoding='utf-8') as fh:
        cen = json.load(fh)
    with io.open('.claude/tmp/r303_origin.json', encoding='utf-8') as fh:
        origin = json.load(fh)

    eligible = {s for s, v in origin.items() if v['cls'] == 'ORIGIN'}

    by_path = {}
    for ch, hits in cen['per_chapter'].items():
        for h in hits:
            if h['text'] not in eligible:
                continue
            by_path.setdefault(h['path'], []).append(h)

    records = []
    deferred = []
    for path in sorted(by_path):
        raw = io.open(path, 'rb').read()
        bom = raw.startswith(b'\xef\xbb\xbf')
        if bom:
            raw = raw[3:]
        txt = raw.decode('utf-8').replace('\r\n', '\n')
        lines = txt.split('\n')
        cur = len(CJK.findall(txt))
        # CJK removed by deleting this chapter's eligible filler lines
        removed = sum(len(CJK.findall(h['text'])) for h in by_path[path])
        if cur - removed < FLOOR:
            deferred.append({
                'path': path, 'chapter': by_path[path][0]['pat'] and int(
                    re.match(r'chapter-(\d+)', os.path.basename(path)).group(1)),
                'cjk_now': cur, 'cjk_after': cur - removed,
                'sites': len(by_path[path]),
            })
            continue
        for h in by_path[path]:
            idx = h['line'] - 1
            if lines[idx] != h['text']:
                raise SystemExit('ABORT: anchor mismatch %s L%d' % (path, h['line']))
            if txt.count(h['text']) < 1:
                raise SystemExit('ABORT: text missing %s L%d' % (path, h['line']))
            records.append({
                'path': path, 'chapter': int(re.match(r'chapter-(\d+)', os.path.basename(path)).group(1)),
                'line': h['line'], 'op': 'del', 'old': h['text'],
                'origin': origin[h['text']]['origin'],
            })

    doc = {
        'round': 'R303',
        'detector': 'census_r303_filler.py + trace_r303_origin.py (cross-chapter repetition, then history trace)',
        'note': (
            'Whole-line deletes of the 50 sentences proven ORIGIN in a repair '
            'round, in chapters that stay >= 3000 CJK afterwards. 17 chapters '
            'would drop below the floor and are deferred -- they need refilling '
            'with real content, not deleting.'
        ),
        'records': records,
        'deferred': deferred,
    }
    with io.open('tools/r303_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))

    print('delete records=%d across %d chapters; deferred=%d'
          % (len(records), len(set(r['path'] for r in records)), len(deferred)))
    by_origin = {}
    for r in records:
        by_origin[r['origin']] = by_origin.get(r['origin'], 0) + 1
    for c, n in sorted(by_origin.items(), key=lambda kv: -kv[1]):
        print('  origin %s : %d' % (c, n))
    return 0


if __name__ == '__main__':
    sys.exit(main())
