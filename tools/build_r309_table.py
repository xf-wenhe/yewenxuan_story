# -*- coding: utf-8 -*-
"""Build an R309 replacement table keyed by LINE, not by text.

Batch format: {"chapters": {"194": {"5": "new paragraph", "6": "..."}}}
The key is the index into the chapter's non-empty paragraph list.

Line anchoring is required: the machine generator emitted identical paragraphs
more than once in the same chapter (ch179 has the same three-sentence run at
para 79 and para 83), so a text anchor is not unique.  A line number is.
"""
import io
import json
import os
import re
import sys

CJK = re.compile('[\u4e00-\u9fff]')
FLOOR = 3000
VOLUMES = [(1, 100, 1), (101, 250, 2), (251, 400, 3), (401, 550, 4),
           (551, 750, 5), (751, 918, 6), (919, 1000, 7)]


def path_of(ch):
    for lo, hi, v in VOLUMES:
        if lo <= ch <= hi:
            return 'chapters/volume-%d/chapter-%d-polished.md' % (v, ch)
    raise SystemExit('chapter %d out of range' % ch)


def main():
    batch_path, out_path = sys.argv[1], sys.argv[2]
    batch = json.load(io.open(batch_path, encoding='utf-8'))
    records = []
    by_file = {}
    for key, edits in sorted(batch['chapters'].items(), key=lambda kv: int(kv[0])):
        ch = int(key)
        p = path_of(ch)
        if not os.path.exists(p):
            raise SystemExit('missing file ' + p)
        raw = io.open(p, 'rb').read()
        assert not raw.startswith(b'\xef\xbb\xbf'), p
        txt = raw.decode('utf-8')
        lines = txt.split('\n')
        pmap = []          # non-empty paragraph -> line number (1-based)
        for i, ln in enumerate(lines):
            if ln.strip():
                pmap.append((i + 1, ln.strip()))
        for idx_s, new in sorted(edits.items(), key=lambda kv: -int(kv[0])):
            idx = int(idx_s)
            if idx >= len(pmap):
                raise SystemExit('CH%d para %d out of range (%d)' % (ch, idx, len(pmap)))
            line, old = pmap[idx]
            if not new.strip():
                raise SystemExit('CH%d para %d empty replacement' % (ch, idx))
            if '\n' in new or '\r' in new:
                raise SystemExit('CH%d para %d new is not one paragraph' % (ch, idx))
            records.append({'path': p, 'chapter': ch, 'para': idx,
                            'line': line, 'old': old, 'new': new})
            by_file.setdefault(p, []).append(records[-1])

    tb = ta = 0
    for p, rs in by_file.items():
        txt = io.open(p, encoding='utf-8').read()
        before = len(CJK.findall(txt))
        work = txt
        lines = work.split('\n')
        for r in rs:
            assert lines[r['line'] - 1].strip() == r['old'], (p, r['line'])
            suffix = '\r' if lines[r['line'] - 1].endswith('\r') else ''
            lines[r['line'] - 1] = r['new'] + suffix
        after = len(CJK.findall('\n'.join(lines)))
        tb += before
        ta += after
        print('%-42s %d para  CJK %d -> %d%s'
              % (p.split('/')[-1], len(rs), before, after,
                 '  <-- BELOW FLOOR' if after < FLOOR else ''))
    doc = {'round': 'R309', 'op': 'replace-line',
           'note': 'machine clause runs rewritten, line-anchored',
           'records': records}
    with io.open(out_path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    print('records %d  CJK %d -> %d' % (len(records), tb, ta))


if __name__ == '__main__':
    main()
