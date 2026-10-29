# -*- coding: utf-8 -*-
"""R325j, ch571 again: the words that are simply broken.

R325i took out the duplicates.  Reading the result showed the chapter has a
second layer of damage that no similarity score sees: sentences whose clauses
were welded together without punctuation, and clauses missing the particle
that makes them grammatical.  These are not style, they are Chinese that does
not parse:

  L3   「箭头在指向回廊的中层」            -- 在 + 指向
  L7   「…在变化白色石材的颜色在变深白色石材从白色变成了灰色」
  L9   「…墙壁的结构在变化墙壁的材料在变化墙壁从白色石材变成了灰色金属」
  L17  「金属表面有的振动」                -- stray 的
  L25  「很多有人用尖锐的东西…」          -- 很多 + 有人
  L79  「有东西在等我们，赵大嘴的回廊中回荡着他的声音」
  L81  「叶文轩的声调在叶文轩的耳朵中回响」 twice over
  L85  「叶文轩的声音在石室内回荡」        -- a corridor, not a stone room
  L95  「在三年前就已经在…」                -- 在 + 在, three times
  L145 「叶文轩的声线…回响。叶文轩的声调…回荡」
  L153 「一扇门在两人身后，关上金属墙壁的接缝在愈合缝隙在消失」
  L161 「一下，两下三下0428备份在跨越边界」

Every replacement is built to the original's length: the chapter has 25 CJK of
headroom above the floor and this batch spends almost none of it.

The chapter as a whole is still template prose -- it is a scene written by
filling clause slots, and R325 does not rewrite scenes.  It is noted in the
plan as a rewrite candidate rather than quietly passed off as repaired.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-571-polished.md'

RECS = [
    (3,
     u'0429备份的信号在叶文轩的空间层中引导着叶文轩和赵大嘴，蓝色的光在叶文轩的脚边扩散。蓝色的光在叶文轩的空间层中形成了一个箭头。箭头在指向回廊的中层。',
     u'0429备份的信号在叶文轩的空间层中引导着他和赵大嘴，蓝色的光在他的脚边扩散。蓝光在空间层里聚成一个箭头，箭头朝上，贴着回廊的墙面，指向回廊的中层。'),
    (7,
     u'回廊的墙壁在变化，白色石材的表面在变化白色石材的颜色在变深白色石材从白色变成了灰色。白色石材从石材变成了金属。回廊的墙壁从白色石材变成了灰色金属。',
     u'回廊的墙壁在变化。白色石材的表面的颜色在变深，从白色变成灰色。灰色再往下变，石材的纹路被磨平，成了金属。回廊的墙壁从白色石材变成了灰色金属。'),
    (9,
     u'叶文轩的洞察之眼在扫描回廊的墙壁，墙壁的结构在变化墙壁的材料在变化墙壁从白色石材变成了灰色金属。金属的表面有划痕，有磨损有使用过的痕迹。',
     u'叶文轩的洞察之眼在扫描回廊的墙壁。墙壁的结构在变，材料在变，从白色石材变成了灰色金属。金属的表面有划痕，有磨损，有使用过的痕迹。'),
    (17,
     u'赵大嘴也蹲下来，手指触碰金属地面。金属表面有的振动，是物理振动。金属内部有什么东西在运转。',
     u'赵大嘴也蹲下来，手指触碰金属地面。金属表面有轻微的振动，是物理振动。金属内部有什么东西在运转。'),
    (25,
     u'赵大嘴的手指在金属地面上移动，手指在金属表面的划痕上滑过，划痕很浅很密，很多有人用尖锐的东西在这块金属上刻了很多东西。',
     u'赵大嘴的手指在金属地面上移动，在划痕上滑过。划痕很浅很密，密密麻麻，像是有人用尖锐的东西在这块金属上刻了很多遍，一层压着一层。'),
    (79,
     u'有东西在等我们，赵大嘴的回廊中回荡着他的声音。',
     u'有东西在等我们。赵大嘴的声音在回廊中回荡着。'),
    (81,
     u'叶文轩点了点头。叶文轩能听到赵大嘴的声音，是通过空气。赵大嘴的嗓音在回廊中回响。赵大嘴的声调在叶文轩的耳朵中回响。',
     u'叶文轩点了点头。他能听到赵大嘴的声音，是通过空气，真正的空气。赵大嘴的嗓音在回廊中回响，一波接一波地撞过来。'),
    (85,
     u'叶文轩的声音在石室内回荡。',
     u'叶文轩的声音在回廊内回荡。'),
    (91,
     u'0429碎片在赵大嘴的体内运行了三年，醒来。',
     u'0429碎片在赵大嘴的体内运行了三年，今天醒来。'),
    (95,
     u'0429碎片在三年前就已经在做这一切。0429碎片的设计者在三年前就已经在安排这一切。未来的叶文轩在三年前就已经在看到第四个结局。',
     u'0429碎片在三年前就已经在做这一切。设计者在三年前就已经在安排这一切。未来的叶文轩在同一个三年前，就已经看见了第四个结局。'),
    (127,
     u'叶文轩把脸凑近缝隙，缝隙的深处有微弱的粉色光。粉色光在缝隙的深处闪烁。粉色光在缝隙的深处脉动。',
     u'叶文轩把脸凑近缝隙。缝隙的深处有微弱的粉色光，那光在深处闪烁，一明一暗地脉动，隔着一层金属看过去。'),
    (145,
     u'"进去，"叶文轩说。叶文轩的声线在回廊里回响。叶文轩的声调于回廊内回荡。',
     u'"进去，"叶文轩说。他的声线在回廊里回响，撞在金属上又弹回来。'),
    (153,
     u'叶文轩和赵大嘴通过了缝隙。缝隙的墙壁在两人通过后合拢，一扇门在两人身后，关上金属墙壁的接缝在愈合缝隙在消失。',
     u'叶文轩和赵大嘴通过了缝隙。缝隙在两人身后合拢。一扇门在他们背后关上了。金属墙壁的接缝在愈合，缝隙在消失。'),
    (161,
     u'0428备份在叶文轩的空间层中脉动，一下，两下三下0428备份在跨越边界。',
     u'0428备份在叶文轩的空间层中脉动。一下，两下，三下。0428备份在跨越边界。'),
    (171,
     u'0428碎片在说话，回响。',
     u'0428碎片在说话，声音在回响。'),
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
            print('ABORT L%d: line does not match\n  got: %s\n  had: %s'
                  % (ln, lines[ln - 1][:70], old[:70]))
            bad += 1
            continue
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})

    total = 0
    for r in recs:
        a, b = len(CJK.findall(r['old'])), len(CJK.findall(r['new']))
        total += b - a
        print('L%-5d %4d %4d %+4d' % (r['line'], a, b, b - a))
    before = len(CJK.findall(txt))
    print('\ncjk %d -> %d  (%+d)   headroom 25 -> %d'
          % (before, before + total, total, 25 + total))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    if apply:
        recs.sort(key=lambda r: -r['line'])
        io.open('tools/r325j_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'j',
                        'note': 'ch571: clauses that do not parse, repaired at '
                                'the original length',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325j_sites.json')


main('--apply' in sys.argv)
