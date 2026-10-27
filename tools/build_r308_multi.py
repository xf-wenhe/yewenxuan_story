# -*- coding: utf-8 -*-
"""Build an R308 table from paragraph-index replacements (scattered padding).

Batch format:
  {"chapters": {"212": {"2": "new paragraph", "21": "...", ...}}}
Key is the 0-based index into the chapter's non-empty paragraphs as recorded in
.claude/tmp/r308_padding.json.

Empty replacement string => delete that paragraph line (and the blank line that
separates it, so the file keeps single blank lines between paragraphs).
"""
import io
import json
import os
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
FLOOR = 3000


def main():
    batch_path, out_path = sys.argv[1], sys.argv[2]
    batch = json.load(io.open(batch_path, encoding='utf-8'))
    pad = json.load(io.open('.claude/tmp/r308_padding.json', encoding='utf-8'))
    by = {r['chapter']: r for r in pad['chapters']}

    records = []
    for key, edits in sorted(batch['chapters'].items(), key=lambda kv: int(kv[0])):
        ch = int(key)
        r = by[ch]
        raw = io.open(r['path'], 'rb').read()
        assert not raw.startswith(b'\xef\xbb\xbf'), r['path']
        txt = raw.decode('utf-8')
        paras = [x.strip() for x in txt.replace('\r\n', '\n').split('\n') if x.strip()]
        for idx_s, new in sorted(edits.items(), key=lambda kv: -int(kv[0])):
            idx = int(idx_s)
            old = paras[idx]
            if txt.count(old) != 1:
                raise SystemExit('CH%d para %d anchor count=%d'
                                 % (ch, idx, txt.count(old)))
            if u'\n' in new or u'\r' in new:
                raise SystemExit('CH%d para %d new is not one paragraph' % (ch, idx))
            records.append({
                'path': r['path'].replace('\\', '/'),
                'chapter': ch,
                'para': idx,
                'old': old,
                'new': new,
            })
        records[-1]['chapter_cjk_after'] = None

    # recompute per-chapter CJK after all edits
    by_file = {}
    for rec in records:
        by_file.setdefault(rec['path'], []).append(rec)
    total_before = total_after = 0
    for path, rs in by_file.items():
        txt = io.open(path, encoding='utf-8').read()
        before = len(CJK.findall(txt))
        work = txt
        for rec in sorted(rs, key=lambda x: -x['para']):
            work = work.replace(rec['old'], rec['new'])
        after = len(CJK.findall(work))
        total_before += before
        total_after += after
        if after < FLOOR:
            raise SystemExit('%s falls to %d CJK' % (path, after))
        print('%s  CJK %d -> %d' % (path.split('/')[-1], before, after))

    doc = {'round': 'R308', 'op': 'replace-line',
           'note': 'scattered R300 padding -> rewritten in place',
           'records': records}
    with io.open(out_path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    print('records %d  CJK %d -> %d' % (len(records), total_before, total_after))


if __name__ == '__main__':
    main()
