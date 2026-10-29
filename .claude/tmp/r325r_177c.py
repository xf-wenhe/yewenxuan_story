# -*- coding: utf-8 -*-
"""R325r: one slip in my own ch177 prose -- six footprints, two of them theirs.

Three people walked here.  「一共六行，只有两行是他们的」 counts a street that
cannot count.  The intended image was worse and simpler: their own prints from
the last time round, still fresh.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-177-polished.md'
OLD = u'三人站在一条街道的中间。这条路他们刚才走过，地上的脚印还是新的，一共六行，只有两行是他们的。'
NEW = u'三人站在一条街道的中间。这条路他们刚才走过，脚印还是新的，一共六行，三行是刚踩的，另外三行也是。'

txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
lines = txt.split(u'\n')
ln = next((k + 1 for k, x in enumerate(lines) if x == OLD), None)
if ln is None:
    raise SystemExit('ABORT: paragraph not found')
print('L%d  cjk %d -> %d' % (ln, len(CJK.findall(OLD)), len(CJK.findall(NEW))))
if '--apply' in sys.argv:
    io.open('tools/r325r_sites.json', 'w', encoding='utf-8', newline='\n').write(
        json.dumps({'round': 'R325', 'batch': 'r',
                    'note': 'ch177: three people do not leave two lines of prints',
                    'floor': 3000,
                    'records': [{'path': PATH, 'line': ln, 'old': OLD, 'new': NEW}]},
                   ensure_ascii=False, indent=1))
    print('wrote tools/r325r_sites.json')
