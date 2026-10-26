# -*- coding: utf-8 -*-
"""Dump R302 candidate sites: R280 filler damage patterns.

Patterns hunted (all grammatical breakage, all traceable to the R280
sub-floor refill commit 7671009):
  那些那 / 那个那   -- the template "脑子里那个那嗓音一圈圈荡开，最后消散"
                       with 同义词轮换 across 嗓音/声调/声线/声音/响动
  他抬(目光|视线|眼)  -- missing verb: 他抬目光掠过窗外
  得再等一会儿来     -- 他得再等一会儿来理清思绪

Writes .claude/tmp/r302_sites_raw.json.
"""
import io
import json
import os
import re

PATTERNS = [
    (u'那些那', re.compile(u'那些那')),
    (u'那个那', re.compile(u'那个那')),
    (u'他抬N', re.compile(u'他抬(?:目光|视线|眼)')),
    (u'得来病句', re.compile(u'得再等一会儿来')),
]


def main():
    recs = []
    for v in range(1, 8):
        d = 'chapters/volume-%d' % v
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('-polished.md'):
                continue
            p = os.path.join(d, f)
            raw = io.open(p, 'rb').read()
            bom = raw.startswith(b'\xef\xbb\xbf')
            txt = raw[3:].decode('utf-8') if bom else raw.decode('utf-8')
            # Normalise CRLF -> LF before splitting so no record carries a
            # trailing CR (52 working-tree files are CRLF via core.autocrlf).
            txt = txt.replace('\r\n', '\n')
            lines = txt.split('\n')
            for i, l in enumerate(lines):
                pat = [name for name, rx in PATTERNS if rx.search(l)]
                if not pat:
                    continue
                ch = int(re.match(r'chapter-(\d+)', f).group(1))
                recs.append({
                    'path': p, 'chapter': ch, 'line': i + 1,
                    'pat': pat, 'text': l,
                })
    out = '.claude/tmp/r302_sites_raw.json'
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(recs, ensure_ascii=False, indent=1))
    print('sites=%d chapters=%d -> %s' % (len(recs), len(set(r['chapter'] for r in recs)), out))


if __name__ == '__main__':
    main()
