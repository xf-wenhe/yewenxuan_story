# -*- coding: utf-8 -*-
"""R325o: ch777 is a counter, ch179 has one duplicated action left.

ch777.  The chapter advances by numbers, not by paragraphs: 桥梁系统 82% ->
86% -> 95% -> 100%, the daughter's drawing gains 「写了两个字，爸爸」 between
L41 and L99, and a twenty-hour countdown runs under all of it.  Three of the
four pairs the gate flagged are that counter -- take the numerals out and the
paragraphs match, which is the definition the queue already exempts.

The fourth pair is the bookend: L35 and L167 say the same thing about the
familiar signal, L43 and L159 the same thing about the hand's temperature, at
0.98 and 0.97, differing only by 能感知到 / 感到.  A return to an image is a
legitimate move; a return that changes one verb is copy-paste.  So those two
are rewritten to know they are returning -- 「还留在那条信号上」, 「还是那只手」.

Four breaks ride along, all of them sentences that do not finish:
  L33  「沈知秋的声音进入叶文轩的意识响了」   -- two verbs fighting
  L95  「…激活进度是95%」                     -- no full stop
  L129 「沈知秋的叶文轩的意识里响起响了」     -- three nouns and a stutter
  L139 「二十小时后，裂缝会打开球」           -- no full stop

ch179.  One thing R325n left behind: L76 says the three of them head for the
stairs and go down, and L80 says they go down again.  L80 is re-pointed at what
the descent feels like, which is also where the loop can be heard.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
CH777 = u'chapters/volume-6/chapter-777-polished.md'
CH179 = u'chapters/volume-2/chapter-179-polished.md'

RECS = [
    (CH777, 33,
     u'沈知秋的声音进入叶文轩的意识响了，沈知秋在0428碎片中等待，在说：我在0428碎片中。无论你选择什么，我都在。',
     u'沈知秋的声音进入叶文轩的意识。她在0428碎片中等着，在说：我在0428碎片中。无论你选择什么，我都在。'),
    (CH777, 95,
     u'0428在叶文轩的脑子里报告，桥梁系统的激活进度是95%',
     u'0428在叶文轩的脑子里报告，桥梁系统的激活进度是95%。'),
    (CH777, 129,
     u'沈知秋的叶文轩的意识里响起响了，沈知秋在0428碎片中感知到清零协议的失效。沈知秋在说：清零协议失效了。你能感知到系统的全部了。',
     u'沈知秋的声音在叶文轩的意识里响起。她在0428碎片中感知到了清零协议的失效，说：清零协议失效了。你能感知到系统的全部了。'),
    (CH777, 139,
     u'二十小时后，裂缝会打开球',
     u'二十小时后，裂缝会打开球。'),
    (CH777, 159,
     u'叶文轩感到女儿的手的温度，0428副本在记录女儿的手的温度，在传输给叶文轩。',
     u'手还是那只手，温度没变。这三年他摸到的每一次，都是0428副本替他记下来的。'),
    (CH777, 167,
     u'叶文轩感到0428副本的信号，0428副本在女儿的意识中运行，0428副本在传递叶文轩的信号。',
     u'叶文轩还留在那条信号上。女儿的意识里，0428副本还在运行，替他守着一个位置。'),
    (CH179, 80,
     u'三人往楼梯下面走。往下走和往上走看到的东西一样，只有方向反了。',
     u'往下走没人说话。脚步声在楼梯井里叠成两层，一层是他们的，一层慢半拍。'),
]


def main(apply):
    files = {}
    for path, ln, old, new in RECS:
        d = files.setdefault(path, {})
        if 'txt' not in d:
            d['txt'] = io.open(path, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
        lines = d['txt'].split(u'\n')
        if not (0 < ln <= len(lines)) or lines[ln - 1] != old:
            raise SystemExit('ABORT %s L%d: line does not match' % (path, ln))
        d.setdefault('recs', []).append({'path': path, 'line': ln,
                                         'old': old, 'new': new})
    recs = []
    for path, d in files.items():
        before = len(CJK.findall(d['txt']))
        delta = sum(len(CJK.findall(r['new'])) - len(CJK.findall(r['old']))
                    for r in d['recs'])
        print('%-34s %5d -> %5d (%+d)' % (path.split('/')[-1], before,
                                          before + delta, delta))
        recs.extend(sorted(d['recs'], key=lambda r: -r['line']))
    print('records %d' % len(recs))
    if apply:
        io.open('tools/r325o_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'o',
                        'note': 'ch777 bookend relay made a return, four unfinished '
                                'sentences; ch179 one duplicated descent',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325o_sites.json')


main('--apply' in sys.argv)
