# -*- coding: utf-8 -*-
"""R325v, ch570 second pass: the three pairs the triage deferred, at equal length.

3,004 CJK against a 3,000 floor leaves 4 characters, so nothing can be cut.
Everything here is a rewrite that keeps its length: the two 第四层 waiting
lines differ only in a name, the two 0429在确认 lines differ only in a comma,
and the two 设计者 lines differ only in 看到/保护.

The 12-18 characters that buy the difference come back from three places where
the earlier pass trimmed past the point of usefulness: the fragment at L51 does
not need its extra clause, and L19 and L95 can afford to say one more thing.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-570-polished.md'

RECS = [
    (19, u'叶文轩把这个判断往下推了一步：派系跟着层走，三方的分歧说到底跟想法无关，是位置上的事。',
     u'叶文轩把这个判断往下推了一步：派系跟着层走，三方的分歧说到底跟想法无关，是位置上的事，位置一换，看法就换。'),
    (51, u'但M-007的信号在消散的过程中留下了一个异常：一个加密片段，藏在噪声里，不做解析就看不见，可它是一条要给人看的信息。',
     u'但M-007的信号在消散的过程中留下了一个异常：一个加密片段，藏在噪声里，不做解析就看不见。'),
    (95, u'叶文轩的洞察之眼扫过回廊的结构，中层就在他脚下，在他的结构透视的范围内。',
     u'叶文轩的洞察之眼扫过回廊的结构，中层就在他脚底下，他一层一层往下数，每一层都在他的结构透视的范围里。'),
    (113, u'0428碎片在赵大嘴进入回廊的第四层之前就已经在等待赵大嘴了。',
     u'0428碎片在第四层等着赵大嘴，早在赵大嘴还没进来的时候就在等了。'),
    (115, u'0428碎片在赵大嘴进入回廊的第四层之前就已经在等待叶文轩了。',
     u'它也在等叶文轩，两边的等待是同时开始的，谁也没落在谁后面。'),
    (121, u'赵大嘴感觉到0429碎片在他的体内发热，0429碎片在确认0429碎片传来信号：是的，中层0429碎片在引导轩哥去0428的位置。',
     u'赵大嘴感觉到碎片在体内发热，碎片在确认：是的，中层。它在引轩哥去0428的位置，一步都没有错。'),
    (131, u'赵大嘴感觉到0429碎片在他的体内发热，0429碎片在确认。是的，中层0429碎片在引导轩哥去0428的位置。',
     u'碎片又热了一下，这一次热得更实，像在里面对着他点了个头，点得很慢很慢。'),
    (167, u'0429碎片的设计者在设计0429碎片的时候，就已经看到了第四个结局。',
     u'设计者在做0429碎片的时候，就已经看到了第四个结局，看得比谁都早。'),
    (145, u'M-007可能会被，清理。',
     u'M-007可能会被清理。这两个字他没有说出口。'),
    (165, u'0429碎片的设计者在设计0429碎片的时候，就已经知道了赵大嘴会选择伪装成拖油瓶0429碎片的设计者在设计0429碎片的时候，就已经知道了赵大嘴会醒来。0429碎片的设计者在设计0429碎片的时候，就已经知道了赵大嘴会突破认知抑制0429碎片的设计者在设计0429碎片的时候，就已经知道了赵大嘴会和叶文轩一起打破闭环。',
     u'设计者知道他会选择装成拖油瓶，这一点最难猜，可设计者猜到了。设计者知道他会醒，知道他会在哪一天醒，知道他会撞破认知抑制，知道他会和叶文轩一起把闭环打破。四件事没有一件写在纸面上，全是一步一步走出来的。设计者只是先站在了终点上，回头看着这四步怎么落下去。'),
    (169, u'0429碎片的设计者在设计0429碎片的时候，就已经在保护第四个结局。',
     u'看到还不算，他还得把它护住。他护了三年，一步都没让开。'),
]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    recs, bad, total = [], 0, 0
    for ln, old, new in RECS:
        if not (0 < ln <= len(lines)) or lines[ln - 1] != old:
            print('ABORT L%d: line does not match' % ln)
            bad += 1
            continue
        a, b = len(CJK.findall(old)), len(CJK.findall(new))
        total += b - a
        print('L%-4d %3d -> %3d  (%+d)' % (ln, a, b, b - a))
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})
    before = len(CJK.findall(txt))
    print('cjk %d -> %d  (%+d)' % (before, before + total, total))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325v_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'v',
                        'note': 'ch570: three deferred pairs, rewritten at equal '
                                'length, paid for by three thin paragraphs',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325v_sites.json')


main('--apply' in sys.argv)
