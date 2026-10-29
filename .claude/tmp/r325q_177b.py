# -*- coding: utf-8 -*-
"""R325q: the last pair in ch177 -- one sentence, subject swapped.

L147 and L174 differ only in whose hand feels it (赵大嘴 against 右手).  That is
the same one-verb variation the ch777 bookend had: it reads as a return and is
copy-paste.  Both rewritten at equal length; the chapter sits three characters
above the floor, so nothing can shrink.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-177-polished.md'
RECS = [
    (147, u'赵大嘴感到它在响应。42片碎片在感知书架的时间结构。',
     u'赵大嘴感到它在响应。42片碎片在读那一排书脊，一册一册地过。'),
    (174, u'右手感到它在响应。42片碎片在感知书架的时间结构。',
     u'右手先动了。碎片顺着他手腕往上爬，爬到肩胛就停住。'),
]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    recs = []
    for ln, old, new in RECS:
        if not (0 < ln <= len(lines)) or lines[ln - 1] != old:
            raise SystemExit('ABORT L%d: line does not match' % ln)
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})
    before = len(CJK.findall(txt))
    d = sum(len(CJK.findall(r['new'])) - len(CJK.findall(r['old'])) for r in recs)
    print('cjk %d -> %d (%+d)' % (before, before + d, d))
    if apply:
        recs.sort(key=lambda r: -r['line'])
        io.open('tools/r325q_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'q',
                        'note': 'ch177: the last pair, one sentence with the '
                                'subject swapped',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325q_sites.json')


main('--apply' in sys.argv)
