# -*- coding: utf-8 -*-
"""R325n, ch179: a chase where every landing reports the same sentence.

4,100 CJK, 1,100 of headroom, so this one can afford to delete.

What the gate charged: six pairs.  What reading finds:

  「它在感知。它在响应。它在读取。」      L6 L30 L114 L130 L140 L160 L168   seven
  赵大嘴 repeating it as dialogue          L8 L32 L116 L132 L142 L162 L170  seven
  「线在萎缩。在收缩。在变窄。」            L14 L38 L42 L60 L164 L172         six
  「X的时间结构在1998年。」                 L22 L28 L82 L88 L96               five

Note L30: the three verbs come back in a different order -- 读取、响应、感知.
That is the machine's way of looking varied, and it is why the ratio to L6 is
0.91 rather than 1.00.

The building looping 1998 is real and is the point of the chapter -- the text
says so itself (「循环一模一样，重复到看不出第几遍」).  What is not earned is
saying the same sentence at every landing.  So the scans stay, and each one is
given something different to report: the floors are the same day (L28), don't
touch the walls (L88), this corridor has been walked through many times (L96),
it is turning slower and nearly stopped (L112), the fragments are counting and
stop at six (L116), they recognise the ones inside and refuse to go (L132),
they are waiting for a position (L170).

Deleted outright, four paragraphs that add nothing to what precedes them: L32
and L142 (echoes of the announcement just made), L82 (the third verbatim 1998
report), L140 (the fourth).

Two corruptions repaired in passing: L120 「像有人在压低那人接着开口」 and L122
「里面面正人在门洞里面说话」.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-179-polished.md'

RECS = [
    (28, u'"楼梯上面的时间结构在1998年。"叶文轩的声音平实得完全无波。',
     u'"还是同一天。"叶文轩的声音平实得完全无波。"一楼是这天，二楼也是这天。"'),
    (30, u'赵大嘴感到它在响应。42片碎片在感知楼梯上面的时间结构。它在读取。它在响应。它在感知。',
     u'赵大嘴停下来，手掌按在楼梯的扶手上。碎片在他体内翻了个身，像被什么从里面推了一把。'),
    (32, None, None),
    (34, u'三人往楼梯上面跑。楼梯上面有银白色的光。楼梯上面的墙壁是灰色的。楼梯上面的窗户碎了。楼梯上面的门开着。门洞里面有0428螺旋纹路。纹路在门洞上面闪了一下。',
     u'三人往楼梯上面跑。这一层的窗户也碎了，碎玻璃的分布和一楼一模一样，连踩出来的脚印都在同一个位置。门开着，门洞上有0428的螺旋，纹路在那里闪了一下。'),
    (38, u'楼梯上面的人影在跑。暗红色的0429徽记在制服上面闪了一下。0429碎片的时间结构线在身体里面自行流动。线在萎缩。在收缩。在变窄。',
     u'人影还在跑。他跑得比刚才慢，右腿落地的时候会软一下。暗红色的徽记在制服背后闪，闪得没有刚才亮。'),
    (52, u'42片碎片在感知人身上的0429碎片的时间结构。它在感知。它在响应。它在读取。',
     u'掌心那42片碎片开始发烫。它们不朝墙去了，一片一片全往那个人的方向凑。'),
    (54, u'"42片碎片在感知0429碎片的时间结构。"赵大嘴说话，音量低到难以察觉。',
     u'"它们在看他身上的那块。"赵大嘴说话，音量低到难以察觉。"看得比刚才急。"'),
    (60, u'人影的嘴在裂。0429碎片在发烫。朦胧的紫红色光线从制服下面渗出来。时间结构线在皮肤下面自行流动。线在萎缩。在收缩。在变窄。人影的时间结构在崩塌的最后一步。',
     u'人影的嘴在裂。紫红色的光从制服的破口里渗出来，把他整个人照得发亮。他还在说话，光随着话音往上蹿，蹿一次，人薄一层。'),
    (82, None, None),
    (84, u'三人往楼梯下面走。楼梯上面有银白色的光。楼梯上面的墙壁是灰色的。楼梯上面的窗户碎了。',
     u'三人往楼梯下面走。往下走和往上走看到的东西一样，只有方向反了。'),
    (88, u'"楼梯上面的时间结构在1998年。"叶文轩开口，声音平直而缺乏波澜。',
     u'"下去以后别碰墙。"叶文轩开口，声音平直而缺乏波澜。"墙上的时间是假的，摸久了会跟着走。"'),
    (96, u'"走廊的时间结构在1998年。"',
     u'"这条走廊走过很多遍了。"'),
    (106, u'三人往走廊的深处走去。走廊的门开着。走廊的窗户碎了。走廊的地面是灰色的。走廊的墙壁是灰色的。墙壁上面的标语在灰光底下，轮廓很清楚。"好好学习天天向上"。1998年的标语。标语下面的墙皮剥落了。露出了里面的红砖。红砖的颜色很暗。像血干了之后的颜色。',
     u'三人往走廊的深处走。又是那句标语，灰光底下轮廓很清楚，字迹褪了，形状还在。标语下面的墙皮剥落了，露出红砖。砖色很暗，像干掉的血。'),
    (112, u'"门洞的0429时间结构在自行运转。"叶文轩的寡淡的声音不带温度静得过头了。',
     u'"里面在转。"叶文轩的声音寡淡，静得过了头。"一圈比一圈慢，快停了。"'),
    (114, u'42片碎片在感知门洞的0429时间结构。它在感知。它在响应。它在读取。',
     u'42片碎片同时转向门洞。它们贴着他的肋骨排开，一片挨着一片，像在听。'),
    (116, u'"42片碎片在读取门洞的0429时间结构。"赵大嘴压低嗓音率先开口。',
     u'"它们在数。"赵大嘴压低嗓音率先开口。"数里面的碎片。数到六就停了。"'),
    (120, u'门洞里面有声音。声音在门洞回荡。里头有人在门洞里面说话。声音很低。听不清。像有人在压低那人接着开口。',
     u'门洞里面有声音。两个人在说话，都压得很低，字和字黏在一起，听不出是哪个字。'),
    (122, u'韩冰的耳朵贴着门洞。她能听见门洞里面的声音。声音在门洞内回荡。里面面正人在门洞里面说话。两个声音。一个声音高一点。一个声音低一点。高的声音在说话。低的声音在听。',
     u'韩冰把耳朵贴在门洞的边上。这回听清了一点。两个声音，一个高一个低。高的那个在说，低的那个只在中间应一声。'),
    (130, u'赵大嘴感到它在响应。42片碎片在感知门洞里面的时间结构。它在感知。它在响应。它在读取。',
     u'赵大嘴的呼吸变了。碎片在他体内排成一条线，从头到尾抖了一遍，然后定住。'),
    (132, u'"42片碎片在读取门洞里面的时间结构。"赵大嘴的声音很细像发丝。',
     u'"它们认出里面那块了。"赵大嘴的声音很细像发丝。"认出来了，不肯过去。"'),
    (140, None, None),
    (142, None, None),
    (162, u'"42片碎片在感知0429碎片的时间结构。"赵大嘴的音量轻得好像要断掉。',
     u'"它们在往里靠。"赵大嘴的音量轻得好像要断掉。"靠过去就要拼在一起。"'),
    (164, u'暗红色的0429碎片搁在讲台上面。碎片的时间结构线在讲台上面自行流动。时间结构线在萎缩。时间结构线在收缩。',
     u'暗红色的0429碎片搁在讲台上面。它们自己在动，六个方向各转各的，转不到一处去。'),
    (168, u'42片碎片在感知0429碎片的时间结构。它在读取。它在响应。它在感知。',
     u'42片碎片在赵大嘴的掌心散开，散成一个圆，圆的正中间空着，正好是六片碎片的样子。'),
    (170, u'"42片碎片在读取0429碎片的时间结构。"赵大嘴的声调猛降了下去。',
     u'"它们在等一个位置。"赵大嘴的声调猛降了下去。"六个缺口，缺一块就合不上。"'),
    (172, u'叶文轩的视线在讲台上面停留。讲台上面搁着六片暗红色的0429碎片。碎片的时间结构线在讲台上面自行流动。线在萎缩。在收缩。在变窄。',
     u'叶文轩的视线在讲台上面停留。六片碎片拼在那里，拼得很勉强。接口的地方透光，光从缝里漏出来，在地上投出六道暗红的影子。'),
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
        if old is None:
            if not lines[ln - 1].strip():
                print('ABORT L%d: blank' % ln)
                bad += 1
                continue
            recs.append({'path': PATH, 'line': ln, 'old': lines[ln - 1], 'new': None})
            continue
        if lines[ln - 1] != old:
            print('ABORT L%d: line does not match\n  got: %s\n  had: %s'
                  % (ln, lines[ln - 1][:70], old[:70]))
            bad += 1
            continue
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})

    total = sum(len(CJK.findall(r['new'] or u'')) - len(CJK.findall(r['old']))
                for r in recs)
    before = len(CJK.findall(txt))
    print('cjk %d -> %d  (%+d)   headroom 1100 -> %d'
          % (before, before + total, total, 1100 + total))
    print('records %d (deletions %d)  problems %d'
          % (len(recs), sum(1 for r in recs if r['new'] is None), bad))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325n_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'n',
                        'note': 'ch179: every landing reported the same sentence; '
                                'each scan given its own finding',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325n_sites.json')


main('--apply' in sys.argv)
