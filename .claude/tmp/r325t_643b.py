# -*- coding: utf-8 -*-
"""R325t, ch643 second pass: my own six defects, equal length.

L21   the naming template survives at the first mention -- 叶文轩 twice in
      eight characters.
L57   掉字: 「0429等得很着急锚点B太倒霉了」 runs two sentences together.
L73   「散在牙缝里」 is not a thing a voice does.
L117  「谢谢这两个字它不会用，它只会把它转成信号存下来」 -- two 它 pointing at
      different things in one clause.  0429 is a translator; it cannot say
      thank you, it can only keep what was said.
L137  「没有说完」 cannot be done by 眼睛.
L177  the paragraph opens on 「声音还是发不出来」 with no subject, directly after
      a line of dialogue -- reads as 叶文轩's voice failing, not 赵大嘴's.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-643-polished.md'

RECS = [
    (21, u'叶文轩面不改色，叶文轩开口，整段话没有任何高低。',
     u'叶文轩面不改色，开口时整段话没有任何高低。'),
    (57, u'0429等得很着急锚点B太倒霉了。0429想出手，但0429被编程了，0429不能，出手。0429只能看着，等着，直到锚点A到来。',
     u'0429等得很着急，锚点B太倒霉了。0429想出手，但0429被编程了，0429不能，出手。0429只能看着，等着，直到锚点A到来。'),
    (73, u'赵大嘴把手放在胸口上，隔着两层衣服，摸到那一小块硬的东西。他说，声音像砂砾在地上拖，拖着拖着就散在牙缝里。',
     u'赵大嘴把手放在胸口上，隔着两层衣服，摸到那一小块硬的东西。他说，声音像砂砾在地上拖，拖着拖着就磨钝了。'),
    (117, u'0429收到了。0429想说，谢谢这两个字它不会用，它只会把它转成信号存下来。',
     u'0429收到了。0429不会说谢谢，它只会把人说的话存下来，替人记着。'),
    (137, u'赵大嘴的眼睛动了一下，落在窗台上那盆花上，没有说完。',
     u'赵大嘴的眼睛动了一下，落在窗台上那盆花上，停在那儿没动。'),
    (177, u'声音还是发不出来。他的手在眼睛上抹，抹了两下，越抹越花。肩膀一下一下地抖。',
     u'赵大嘴的声音还是发不出来。他的手在眼睛上抹，抹了两下，越抹越花。肩膀在抖。'),
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
        io.open('tools/r325t_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 't',
                        'note': 'ch643: six defects introduced by the R325s pass',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325t_sites.json')


main('--apply' in sys.argv)
