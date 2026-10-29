# -*- coding: utf-8 -*-
"""R325p, ch177: the same street described eleven times, at equal length.

3,040 CJK against a 3,000 floor is 40 characters of headroom, so nothing can be
deleted and no replacement may be much shorter than what it replaces.

The gate charged four pairs.  The chapter actually says 「灰色的建筑在显形。
墙皮在脱落。窗户碎了。路灯歪了。废弃的汽车在路边」 eleven times (L21 25 31 35
43 67 75 83 85 97 115), 「42片碎片在读取…」 six times, 「1998年。」 five times,
and 「时间结构在自行运转。周而复始。在重演。」 twice with 洞察者能力 in front.

The city looping 1998 is the chapter's subject, so the walk stays a walk through
the same street.  What changes is what the walkers notice: the deeper they go,
the more specific it gets -- car doors open with the keys still in them, grey
grass in the cracks, a newspaper with the date empty, a curtain moving on a
street with no wind, their own footprints from the last loop, a road sign worn
down to the shape of an arrow, and finally the one window on the second floor
that is still whole.

Equal length throughout.  Two paragraphs missing their full stop (L79, L89) get
one, which is the only free change in the table.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-2/chapter-177-polished.md'

RECS = [
    (21, u'旧城区是一个废弃的城市。灰色的建筑在光里面显形。外墙在剥落。窗户的玻璃碎了。路灯歪了。地面是破碎的水泥路面。',
     u'旧城区是一个废弃的城市。灰色的建筑在光里面显形，外墙剥落，露出底下的红砖。路灯歪着，灯罩里积了半罩的灰，灰是白的。'),
    (31, u'赵大嘴的视线在旧城区的建筑上面移动。灰色的建筑在显形。外墙斑驳。玻璃窗碎了。路灯歪了。废弃的汽车在路边。',
     u'赵大嘴的视线停在路边那排汽车上。车门都开着，钥匙还插在锁孔里，像人刚下车走开，一走就走了二十八年。'),
    (35, u'韩冰的视线在旧城区的建筑上面移动。建筑在光里面显形。外墙在剥落。窗户碎了。路灯歪了。汽车停在路边。',
     u'韩冰的视线落在地面上。水泥是碎的，裂缝里长出草，草是灰的，连草都不肯绿。她蹲下去碰了一下，草叶在指头上碎成粉。'),
    (39, u'洞察者能力扫过旧城区。时间结构在自行运转。时间结构周而复始。时间结构在重演。时间结构在1998年。',
     u'洞察者能力扫过旧城区。时间结构在自行运转，一圈接一圈，每圈的起点都是1998年的同一个早晨。'),
    (43, u'三人往旧城区的深处走去。建筑在他们两侧显形。墙皮在脱落。窗户碎了。路灯歪了。废弃的汽车停在路边。汽车的门开着。汽车的方向盘上面有灰。',
     u'三人往旧城区的深处走去。走过第三个路口，两侧的楼开始重复：同一道裂缝，同一扇缺了玻璃的窗，连窗台上那只空花盆都在同一个位置，连花盆里的土都没塌下去。'),
    (45, u'旧城区的街道在自行排列。街道的地面在自行浮动。街道的时间结构线在自行流动。街道的时间结构线在1998年。',
     u'旧城区的街道在自己排列。路面一块一块地挪，挪完还是原位。街道的时间结构线在动，动完仍然锁在1998年。'),
    (67, u'叶文轩的视线在旧城区的建筑上面移动。灰色的建筑在光里面显形。外墙已经斑驳。玻璃窗碎了。路灯歪了。废弃的汽车在路边。',
     u'叶文轩的视线在街面上移动。影子全在头顶，人走过去，脚底下没有影子跟着。'),
    (71, u'赵大嘴感到它在响应。42片碎片在读取旧城区。',
     u'赵大嘴把右手抬起来，掌心朝上。碎片在里面动，动得比他自己说话还快。'),
    (73, u'"42片碎片在读取旧城区的时间结构。"赵大嘴压低嗓子说了句。"42片碎片在感知旧城区。它在响应旧城区的时间结构。"',
     u'"它们在读这条街。"赵大嘴压低嗓子说了句。"读得很慢，像在读一本翻了很多遍的书。"'),
    (75, u'三人继续往旧城区的深处走去。灰色的建筑在旁边显形。外墙在剥落。玻璃窗碎了。路灯歪了。汽车停在路边。汽车的门开着。',
     u'三人继续往深处走。走到第四个路口，叶文轩停下来看了一眼路牌。路牌上的字褪光了，只剩下一个箭头的形状，指着东北。'),
    (79, u'旧城区的建筑的时间线在自行流动。时间线沿着1998年的墙皮往下淌',
     u'旧城区的建筑的时间线在自行流动。时间线沿着1998年的墙皮往下淌。'),
    (83, u'赵大嘴的视线在旧城区的建筑上面移动。灰色的建筑在显形。墙皮在脱落。窗户碎了。路灯歪了。废弃的汽车停在路边。',
     u'赵大嘴蹲下去看了看地面。碎水泥底下压着一张报纸，纸面朝上，日期那一格空着，别的字都在。'),
    (85, u'韩冰的视线在旧城区的建筑上面移动。建筑在光里面显形。墙皮斑驳。玻璃窗碎了。路灯歪了。废弃的汽车在路边。',
     u'韩冰抬头看那些窗户。有几扇里面挂着窗帘，窗帘在动，动得很慢，可这条街上没有风。'),
    (87, u'叶文轩的洞察者能力扫过旧城区。时间结构在自行运转。时间结构周而复始。时间结构在重演。时间结构在1998年。',
     u'叶文轩的洞察者能力扫过旧城区。时间结构在重演，重演得连灰尘落下来的位置都不肯换一个。'),
    (89, u'1998年的时间顺着旧城区的墙面流动',
     u'1998年的时间顺着旧城区的墙面往下流动。'),
    (91, u'"1998年。"叶文轩开口，声调从头至尾没有半点儿起落。',
     u'"同一个早晨。"叶文轩开口，声调从头至尾没有半点儿起落。'),
    (95, u'"42片碎片在读取旧城区的时间结构。"赵大嘴的声音轻，"42片碎片在读取旧城区。它在响应旧城区的时间结构。"',
     u'"它们开始烦了。"赵大嘴的声音轻，"读了三遍，三遍都是同一页。再读下去它们要自己动手翻。"'),
    (97, u'三人站在旧城区的一条街道上面。灰色的建筑在两侧显形。外墙在剥落。窗户的玻璃碎了。路灯歪了。汽车停在路边。',
     u'三人站在一条街道的中间。这条路他们刚才走过，地上的脚印还是新的，一共六行，只有两行是他们的。'),
    (99, u'旧城区的街道在自行排列。街道的地面在自行浮动。街道的时间结构线在自行流动。时间线把整条街锁在1998年。',
     u'街道在自己排列。地砖一块接一块地换位置，换完仍是原样。时间线把这些都锁在1998年，锁得很紧，谁也挪不开一寸。'),
    (115, u'三人往小楼的方向走去。灰色的建筑在两侧显形。外墙斑驳。玻璃窗碎了。路灯歪了。',
     u'三人往小楼走。越走近，那栋楼越清楚：两层，灰墙，二楼那扇窗是完好的，玻璃上还留着反光。'),
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
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})
    before = len(CJK.findall(txt))
    print('cjk %d -> %d  (%+d)   headroom 40 -> %d'
          % (before, before + total, total, 40 + total))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325p_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'p',
                        'note': 'ch177: eleven copies of one street description, '
                                'replaced with what each walker notices',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325p_sites.json')


main('--apply' in sys.argv)
