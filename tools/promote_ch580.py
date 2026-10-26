# -*- coding: utf-8 -*-
"""Promote the last unresolved R302 site (ch580 L148) into the records list.

R280's parent has the author sentence on L147:

    叶文轩需要选择。选择之后没有回头路。

R280 replaced it with the ungrammatical 「他得再等一会儿来理清思绪。」.
Recover the parent sentence and validate it verbatim before promoting.
"""
import io
import json
import subprocess

PATH = 'chapters/volume-5/chapter-580-polished.md'
PRE = '7671009^'
LINE = 148
OLD = u'他得再等一会儿来理清思绪。'


def show(rev, path):
    p = subprocess.run(['git', 'show', '%s:%s' % (rev, path)], capture_output=True)
    if p.returncode != 0:
        raise SystemExit('git show failed')
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8', 'replace')


def main():
    pre = show(PRE, PATH)
    lines = pre.split('\n')
    # Walk back from the live line to the nearest complete author sentence.
    cand = None
    for i in range(LINE - 1, -1, -1):
        t = lines[i].strip()
        if len(t) >= 10 and t.endswith(u'。') and u'他得再等一会儿' not in t:
            cand = t
            break
    if not cand:
        raise SystemExit('ABORT: no parent sentence found above L%d' % LINE)
    if cand not in pre:
        raise SystemExit('ABORT: recovery not verbatim in parent')

    with io.open('tools/r302_sites.json', encoding='utf-8') as fh:
        doc = json.load(fh)

    doc['records'] = [r for r in doc['records'] if not (r['path'] == PATH and r['line'] == LINE)]
    doc['records'].append({
        'path': PATH, 'chapter': 580, 'line': LINE,
        'op': 'sub', 'old': OLD, 'new': cand,
        'src': 'R280 parent sentence (7671009^ L%d)' % (lines.index([l for l in lines if l.strip() == cand][0]) + 1),
        'defect': 'R280 sub-floor refill replaced the parent-attested 「%s」 with the ungrammatical 「%s」' % (cand, OLD),
    })
    doc['unresolved'] = [r for r in doc.get('unresolved', [])
                         if not (r['path'] == PATH and r['line'] == LINE)]
    doc['note'] += ' The last unresolved site (ch580 L148) was recovered from 7671009^ and promoted.'

    with io.open('tools/r302_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    print('promoted ch580 L148 -> %s' % cand)
    print('records=%d unresolved=%d' % (len(doc['records']), len(doc['unresolved'])))


if __name__ == '__main__':
    main()
