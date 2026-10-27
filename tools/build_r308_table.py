# -*- coding: utf-8 -*-
"""Build the R308 replacement table from a batch of new closing paragraphs.

Each record replaces one whole padding line (the paragraph 7be2ad1f inserted)
with freshly written prose.  Anchors are read from the LIVE file, byte-exact,
and asserted unique -- the same fail-closed discipline as R295/R296.
"""
import io
import json
import os
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
FLOOR = 3000


def main():
    batch_path = sys.argv[1]
    out_path = sys.argv[2]
    batch = json.load(io.open(batch_path, encoding='utf-8'))
    pad = json.load(io.open('.claude/tmp/r308_padding.json', encoding='utf-8'))
    by = {r['chapter']: r for r in pad['chapters']}

    records = []
    for key, item in sorted(batch['chapters'].items(), key=lambda kv: int(kv[0])):
        ch = int(key)
        r = by[ch]
        old_texts = [t.strip() for t in r['text']]
        raw = io.open(r['path'], 'rb').read()
        assert not raw.startswith(b'\xef\xbb\xbf'), r['path']
        txt = raw.decode('utf-8')
        new = item['new'].strip()
        if len(old_texts) != 1:
            raise SystemExit('CH%d has %d padding paragraphs; handle it alone'
                             % (ch, len(old_texts)))
        old = old_texts[0]
        if txt.count(old) != 1:
            raise SystemExit('CH%d anchor count=%d' % (ch, txt.count(old)))
        if u'\n' in new or u'\r' in new:
            raise SystemExit('CH%d new prose is not a single line' % ch)
        after = len(CJK.findall(txt.replace(old, new)))
        before = len(CJK.findall(txt))
        if after < FLOOR:
            raise SystemExit('CH%d falls to %d CJK' % (ch, after))
        records.append({
            'path': r['path'].replace('\\', '/'),
            'chapter': ch,
            'old': old,
            'new': new,
            'cjk_before': before,
            'cjk_after': after,
            'old_cjk': len(CJK.findall(old)),
            'new_cjk': len(CJK.findall(new)),
        })

    doc = {'round': 'R308', 'op': 'replace-line',
           'note': 'R300 round-3 padding -> real closing beat',
           'records': records}
    with io.open(out_path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    print('records %d' % len(records))
    print('CJK %d -> %d (%+d)' %
          (sum(r['cjk_before'] for r in records),
           sum(r['cjk_after'] for r in records),
           sum(r['cjk_after'] - r['cjk_before'] for r in records)))


if __name__ == '__main__':
    main()
