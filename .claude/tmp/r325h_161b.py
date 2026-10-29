# -*- coding: utf-8 -*-
"""R325h, ch161 again: four slips in my own replacement prose.

Found by reading the chapter back after R325g, not by any counter:

  L23  「那声调从他记事的那天起就没换过」 -- whose memory?  The daughter is
       seven, so the sentence has a fact available and does not use it.
  L45  「把这两个字在嘴里过了一遍。系统关注。这四个字…」 -- counts two and
       then names four.  The joke is the bureaucratic word, so name it.
  L65  「出口它自己开好的。」 -- no copula, reads like dialect.
  L199 「痕迹从指缝里挤出来一点」 -- a mark on the palm is not a liquid.

Each is a one-line repair against the text R325g left, so the table is
authored on top of it and the replay chain still proves from HEAD.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-161-polished.md'

RECS = [
    (23,
     u'叶文轩点了点头。他的视线在背包的夹层里面停留。0415碎片的残渣在夹层里发着微光，像一层被掏空的壳。壳里还剩一点声音，很轻，是女儿的声调。那声调从他记事的那天起就没换过。',
     u'叶文轩点了点头。他的视线在背包的夹层里面停留。0415碎片的残渣在夹层里发着微光，像一层被掏空的壳。壳里还剩一点声音，很轻，是女儿的声调。那声音他听了七年，一个音都没变过。'),
    (45,
     u'叶文轩把这两个字在嘴里过了一遍。系统关注。这四个字是给人归档用的。',
     u'叶文轩把系统关注这四个字在嘴里过了一遍。归档用的。贴上来，就算记录在案。'),
    (65,
     u'"出口它自己开好的。"叶文轩的声线平得没有起伏。"路也是它铺的。走不走，我们说了不算。"',
     u'"出口是它开好的。"叶文轩的声线平得没有起伏。"路也是它铺的。走不走，我们说了不算。"'),
    (199,
     u'韩冰把掌心翻过来看了看。淡蓝的痕迹还在，像一层没干透的颜料。她把手攥起来，痕迹从指缝里挤出来一点。',
     u'韩冰把掌心翻过来看了看。淡蓝的痕迹还在，比刚才淡了一点。她攥紧手，再摊开，痕迹跟着心跳亮了一下。'),
]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    recs, bad = [], 0
    for ln, old, new in RECS:
        if not (0 < ln <= len(lines)):
            print('ABORT L%d: out of range' % ln)
            bad += 1
            continue
        if lines[ln - 1] != old:
            print('ABORT L%d: line does not match\n  got: %s' % (ln, lines[ln - 1][:60]))
            bad += 1
            continue
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})

    before = len(CJK.findall(txt))
    delta = sum(len(CJK.findall(r['new'])) - len(CJK.findall(r['old'])) for r in recs)
    print('cjk %d -> %d  (%+d)' % (before, before + delta, delta))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    if apply:
        io.open('tools/r325h_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'h',
                        'note': 'ch161: four slips in the R325g prose (a miscount, '
                                'a missing copula, an impossible gesture)',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325h_sites.json')


main('--apply' in sys.argv)
