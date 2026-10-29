# -*- coding: utf-8 -*-
"""R325m, ch675: two paragraphs of pure speech with no marks at all.

The tail mixes two conventions -- 「他说：…」 for reported speech (L183, L189,
L195, L197) and quoted speech (L133-141) -- and that mixing is older than this
round and belongs to the quote track, not here.

But L181 and L187 are a different case: a whole paragraph of somebody talking,
with no attribution and no marks.  「爸。我做到了。」 sitting alone between two
narration paragraphs does not read as speech, it reads as typo.  Those two get
their marks; the rest of the tail's convention is left alone.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-675-polished.md'

RECS = [
    (181, u'爸。我做到了。',
     u'"爸。我做到了。"'),
    (187,
     u'我小时候老觉得你走得太急。那天早上你连早饭都没吃完。我妈说你去外地干活，后来她也不说了。我上初中的时候翻过你的工具箱，底下有个本子。我那时候看不懂，现在我懂了。你写的是云。',
     u'"我小时候老觉得你走得太急。那天早上你连早饭都没吃完。我妈说你去外地干活，后来她也不说了。我上初中的时候翻过你的工具箱，底下有个本子。我那时候看不懂，现在我懂了。你写的是云。"'),
]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    recs, bad = [], 0
    for ln, old, new in RECS:
        if not (0 < ln <= len(lines)) or lines[ln - 1] != old:
            print('ABORT L%d: line does not match' % ln)
            bad += 1
            continue
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    if apply:
        io.open('tools/r325m_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'm',
                        'note': 'ch675: two paragraphs of unmarked speech in the tail',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325m_sites.json')


main('--apply' in sys.argv)
