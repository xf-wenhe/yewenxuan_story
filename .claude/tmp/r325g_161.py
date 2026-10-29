# -*- coding: utf-8 -*-
"""R325g, ch161: a chapter built out of loops, taken apart loop by loop.

The queue charged this chapter four groups and 221 CJK.  Reading it says the
gate undersold it badly: 5,899 CJK, and the same four beats are announced over
and over while the characters walk.

  * the 0415 report        L17 L23 L25 L61 L107 L213 L225   (seven times)
  * the exit notice        L33 L65 L85 L115                 (four times)
  * 觉醒者内部有分歧        L69 L81 L83 L201 L209             (five times)
  * 韩冰's power is dead    L11 L19 L47 L67 L125 L147 L163 L199 L215 L219
  * the sewn sky           L171 L173 L211 L245
  * 悬浮的时间碎片          L169 L179 L229 L231
  * the light at the gate  L237 L247 L249 L251 L253

The gate only sees the pairs whose wording is nearly identical.  The ones that
change a comma or an attribution fall to 0.88 and slip through, which is why
the chapter reads as a stutter while scoring only four groups.

What is kept and what is done with the rest:

  L17, L33, L69, L11, L169, L237, L171 are the first tellings and stand.
  Every later telling is given a different job rather than shaved: L59 becomes
  his arithmetic, L65 the system's choice of route, L85 the clock, L115 the
  coincidence of a dangerous gate being an exit, L107 what is being erased,
  L213 his refusal to explain, L225 the price of every step, L209 an explicit
  second telling that says so out loud.

Two paragraphs are deleted outright: L249 and L251 restate L247 word for word
in the same visual.  Deleting a verbatim restatement loses nothing, and the
chapter is 5,899 CJK, so the floor is not in question.

Three corruptions ride along, all of the dropped-character family:
  L23  「女儿的声调无起传来：」     -- the colon and the verb are both broken
  L133 「女儿的嗓音之间里传来：」   -- left alone here, see note below
  L213 「嗓音干哑有任何感情色彩」   -- the 没 is missing

L133's corruption is not touched by this table because the paragraph around it
is a narrative restatement of the report and belongs to the same loop; it is
repaired in the same batch by the record below, which replaces the sentence.

Records are emitted in descending line order so the two deletions cannot shift
a line number another record depends on.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-161-polished.md'

# (line, old, new)  -- new None means the paragraph goes, blank line with it.
RECS = [
    (23,
     u'叶文轩点了点头。他的视线在背包的夹层里面停留。0415碎片的残渣在背包夹层里面发着微光。0415碎片已经碎了。0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的声调无起传来：0415碎片的最深层是女儿出生的那天。',
     u'叶文轩点了点头。他的视线在背包的夹层里面停留。0415碎片的残渣在夹层里发着微光，像一层被掏空的壳。壳里还剩一点声音，很轻，是女儿的声调。那声调从他记事的那天起就没换过。'),
    (25,
     u'"0415碎片已经消耗完了。"叶文轩说话时声线平平。"0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的声调。0415碎片的最深层是女儿出生的那天。"',
     u'"消耗完了。"叶文轩说话时声线平平。"剩下的只有两样。女儿的嗓音，还有她出生那天。"'),
    (45,
     u'叶文轩的后背震了一下。系统已经标记了他和赵大嘴。标记等级：系统关注。',
     u'叶文轩把这两个字在嘴里过了一遍。系统关注。这四个字是给人归档用的。'),
    (59,
     u'叶文轩的大脑在全力运转。系统在反制他们。系统的广播会更频繁。系统的NPC会更警觉。系统的副本会针对他们进行调整。',
     u'叶文轩的大脑在全力运转。广播更频繁，就多几双看得见他们的眼睛。NPC更警觉，就多几张嘴要他们交代。副本为他们改，说明系统已经把他们当成一件要处置的东西。'),
    (61,
     u'"系统在反制我们。"叶文轩的声线冷得刺骨。"0415碎片已经消耗完了。0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的声线。0415碎片的最深层是女儿出生的那天。"',
     u'"系统在反制我们。"叶文轩的声线冷得刺骨。"它不封路。它给我们一条路，路尽头是它想看的东西。"'),
    (65,
     u'"0415时间回廊的出口已经打开了。"叶文轩的声线里听不到一丝波动。"出口在区域C。旧城区入口。倒计时10分钟。"',
     u'"出口它自己开好的。"叶文轩的声线平得没有起伏。"路也是它铺的。走不走，我们说了不算。"'),
    (83,
     u'叶文轩拼命思索着。觉醒者内部有分歧。有人觉得他们在挑战系统的底线。有人觉得他们在找回家的路。有人觉得他们会带来危险。',
     u'叶文轩拼命思索着。韩冰把话说得很客气，客气到每个字都在往回收。分歧的意思是，那三拨人里已经有一拨在算他们要付出多少代价。'),
    (85,
     u'"0415时间回廊的出口已经打开了。"叶文轩开口，音色里听不到半分波动。"出口在区域C。旧城区入口。倒计时10分钟。"',
     u'"十分钟。"叶文轩开口，音色里听不出半分波动。"够走到旧城区入口。不够我们想明白它为什么开这个口。"'),
    (107,
     u'"系统在反制我们。"叶文轩的语速平稳且毫无情感，"0415碎片已经消耗完了。0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的嗓音。0415碎片的最深层是女儿出生的那天。"',
     u'"它抹的是记忆。"叶文轩的语速平稳且毫无情感，"人还在。记忆没了，人就成了一间空屋子。"'),
    (115,
     u'"系统在引导我们去旧城区入口。"叶文轩开口，声调从头到尾没有变化，"0415时间回廊的出口在旧城区入口。倒计时10分钟。"',
     u'"它挑的就是那个门口。"叶文轩开口，声调从头到尾没有变化，"危险的门口，正好开成出口。这种巧合，我们碰上过太多次。"'),
    (133,
     u'叶文轩的大脑在全力计算。0415碎片已经消耗完了。记忆从碎片里泄了个干净。0415碎片的最深层是女儿的嗓音之间里传来：0415碎片的最深层是女儿出生的那天。',
     u'叶文轩的大脑在全力计算。记忆泄得很干净，干净得像有人拿布擦过。剩下的只有那两个最深的地方，擦不掉，也不该擦。'),
    (173,
     u'叶文轩的视线在裂隙边境的天空上面停留。天空是缝合的。一半是白天，一半是深夜。交界处有一条缝。',
     u'叶文轩抬头。缝在头顶横过去，一头是白天，一头是深夜，中段那道口子正往外渗光。'),
    (179,
     u'赵大嘴的视线在裂隙边境的地面上面停留。地面是悬浮的时间碎片。碎片的拼缝清晰可见，草皮、水泥和海水被硬生生焊在一起。',
     u'赵大嘴蹲下去摸了摸脚边的拼缝。草皮是活的，摸上去还带着清早的凉。挨着的那块水泥是热的，像刚从别的日子里挖出来。'),
    (199,
     u'韩冰的掌心在发烫。她的能力在这里面完全失效了。S级能力的余震在她的掌心残留着淡蓝色的痕迹。',
     u'韩冰把掌心翻过来看了看。淡蓝的痕迹还在，像一层没干透的颜料。她把手攥起来，痕迹从指缝里挤出来一点。'),
    (201,
     u'觉醒者内部有分歧。有人觉得叶文轩和赵大嘴在挑战系统的底线。有人觉得他们在找回家的路。有人觉得他们会带来危险。',
     u'韩冰在心里把那三句话又摆了一遍。三句都对。说出哪一句，就等于站到哪一边。'),
    (203,
     u'韩冰的视线在叶文轩的后背上停留。叶文轩的背影在裂隙边境的光里面显得很窄。',
     u'韩冰落在后面半步。她数着他迈出去的步数，数到七十几就数不下去了。'),
    (209,
     u'"觉醒者内部有分歧。"韩冰的声调渐渐低了下来。"有人觉得你们在挑战系统的底线。有人觉得你们在找回家的路。有人觉得你们会给我们所有人带来危险。"',
     u'"刚才在里面那句话。"韩冰的声调渐渐低了下来。"我再说一遍。有人觉得你们在挑战系统的底线。有人觉得你们在找回家的路。有人觉得你们会给我们所有人带来危险。"'),
    (211,
     u'叶文轩的后背震了一下。他的视线在裂隙边境的天空上面停留。天顶的缝合线横在中间，白昼和深夜各占半边。',
     u'叶文轩没有回头。他听见身后韩冰的呼吸停了一下，又接上。天顶那道缝在两个人头顶横着，谁也没往上看。'),
    (213,
     u'"我知道。"叶文轩开口，嗓音干哑有任何感情色彩。"0415碎片已经消耗完了。0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的声调。0415碎片的最深层是女儿出生的那天。"',
     u'"我知道。"叶文轩开口，嗓音干哑，没有任何感情色彩。"所以我没打算解释。解释一遍，就得多说一遍她。"'),
    (223,
     u'叶文轩看着韩冰。他的视线在韩冰的脸上停留。韩冰的脸色在裂隙边境的光里面显得很白。韩冰的嘴角还有没擦干净的血迹。',
     u'叶文轩看着韩冰。她的嘴角还有没擦干净的血迹，一道细的，从下唇一直拉到下巴。她自己大概还不知道。'),
    (225,
     u'"系统在反制我们。"叶文轩开口，语气平得像一把尺子量过。"0415碎片已经消耗完了。0415碎片的时间记忆已经从碎片内部完全泄露了。0415碎片的最深层是女儿的声线。0415碎片的最深层是女儿出生的那天。"',
     u'"系统在反制我们。"叶文轩开口，语气平得像一把尺子量过。"它反制的方式，是让我们每走一步都得先想起她。"'),
    (231,
     u'叶文轩的视线在裂隙边境的地面上面停留。地面是悬浮的时间碎片。一块草皮挨着一块水泥地，再过去是半片海水，拼接的裂缝里透着光。',
     u'叶文轩盯着脚边的拼缝看。草皮正往水泥那边挪，挪得很慢，慢到能看出它在挪。海水在缝里涨起来，又落回去。'),
    (245,
     u'叶文轩的视线在裂隙边境的天空上面停留。缝合的缝隙横过天顶，把白昼和黑夜切成两半。',
     u'叶文轩抬头看了一眼天。那条缝还在，比刚出来的时候窄了一点。'),
    (247,
     u'叶文轩的视线在旧城区入口的方向移动。入口的方向有一道银白色的光在闪。0415时间结构线缠着光柱，指向旧城区入口。',
     u'叶文轩的视线在旧城区入口的方向移动。光柱立在那儿，比刚才粗了一圈。越往那边走，光越亮。门在等他们靠近。'),
    (249, None, None),
    (251, None, None),
    (253,
     u'叶文轩的视线在入口的方向停留。银白色的光在入口的方向跳动。跑过最后一片悬浮地面，旧城区入口就在眼前。',
     u'叶文轩跑起来。悬浮的地面在脚下晃，每一步都踩不稳。旧城区入口就在前面，光从门里漏出来，把地上的碎片照得一片一片发白。'),
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
        if old is None:                       # deletion
            if not lines[ln - 1].strip():
                print('ABORT L%d: already blank' % ln)
                bad += 1
                continue
            recs.append({'path': PATH, 'line': ln,
                         'old': lines[ln - 1], 'new': None})
            continue
        if lines[ln - 1] != old:
            print('ABORT L%d: line does not match\n  got: %s\n  had: %s'
                  % (ln, lines[ln - 1][:60], old[:60]))
            bad += 1
            continue
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})

    # nothing may be recorded twice on one line
    seen = {}
    for r in recs:
        seen[r['line']] = seen.get(r['line'], 0) + 1
    for ln, n in seen.items():
        if n > 1:
            print('ABORT L%d: %d records on one line' % (ln, n))
            bad += 1

    before = len(CJK.findall(txt))
    delta = sum(len(CJK.findall(r['new'] or u'')) - len(CJK.findall(r['old']))
                for r in recs)
    after = before + delta
    print('cjk %d -> %d  (%+d)   floor %s'
          % (before, after, delta, 'ok' if after >= 3000 else 'BROKEN'))
    print('records %d (deletions %d)  problems %d'
          % (len(recs), sum(1 for r in recs if r['new'] is None), bad))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325g_sites.json', 'w', encoding='utf-8',
                newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'g',
                        'note': 'ch161: one beat announced seven times, taken '
                                'apart; two verbatim restatements deleted; '
                                'three dropped characters repaired',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325g_sites.json')


main('--apply' in sys.argv)
