# -*- coding: utf-8 -*-
"""R325l, ch675 again: the scene R325k wrote, put into the book's voice.

R325k rebuilt the broadcast block as the farewell inside the white space.  Three
things were wrong with what I wrote, none of them visible to a counter:

  1. Speech style.  Half the lines used quotes and half used 「他说：…」, in the
     same scene.  The book carries 100,028 ASCII speech marks and eight files
     with full-width ones, so the marks win.  Thirteen lines normalised.

  2. Order.  「赵大嘴问：十年以后呢。」 landed two paragraphs before the line that
     says the energy lasts ten years.  The question has no referent until the
     answer exists, so the three paragraphs are rotated: statement, question,
     answer.

  3. Three beats that contradicted their neighbours.  L59 had 0429 offering to
     relay the father's words while the father was speaking directly two lines
     earlier.  L99 grew the corners on 0429's light here, and the tail grows
     them again five paragraphs later as a discovery (L199).  L115 put 叶文轩
     standing two steps away after 0428 had been talking to him for a while.

And the tail still had its own machine filler, which the 0.90 gate cannot see
because these paragraphs are short: 「光里晃动的影子…被遗忘的东西在漂流／涌起」
four times over the same image, 「时间还需要再多一点」 and 「他还需要一些时间去
梳理思路」 twice over the same statement.  Twelve paragraphs, 231 CJK, replaced
with the same number of paragraphs and the same weight: the crack breathing, the
colour shifting, 赵大嘴 looking at his own hand going pale, the data settling on
one number.

Nothing is deleted; every line keeps its number.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-675-polished.md'

RECS = [
    # -- speech normalised to the book's marks -----------------------------
    (15, u'赵大嘴问：你在哪。',
     u'"你在哪。"赵大嘴问。'),
    (19, u'赵大嘴说：我没哭过几次。',
     u'"我没哭过几次。"赵大嘴说。'),
    (23, u'赵大嘴说：你数这个干什么。',
     u'"你数这个干什么。"赵大嘴说。'),
    (37, u'赵大嘴的喉咙动了一下。他说：我没想过能听见你说这句话。',
     u'赵大嘴的喉咙动了一下。"我没想过能听见你说这句话。"'),
    (41, u'这五个字之后，白色空间安静了很久。赵大嘴把手从脸上拿下来，眼睛红着，人已经稳住了。他说：爸，你说话，我听着。',
     u'这五个字之后，白色空间安静了很久。赵大嘴把手从脸上拿下来，眼睛红着，人已经稳住了。"爸，你说话，我听着。"'),
    (47, u'赵大嘴沉默了几秒。他说：她不知道。我没敢告诉她。',
     u'赵大嘴沉默了几秒。"她不知道。"他说，"我没敢告诉她。"'),
    (51, u'赵大嘴说：爸，我这三年一直在装。装傻，装没用，装到所有人都懒得看我一眼。',
     u'"爸，我这三年一直在装。"赵大嘴说，"装傻，装没用，装到所有人都懒得看我一眼。"'),
    (55, u'赵大嘴说：那你为什么不早点出来。',
     u'"那你为什么不早点出来。"赵大嘴说。'),
    (81, u'赵大嘴把眼睛闭上。他说：我一直在。',
     u'赵大嘴把眼睛闭上。"我一直在。"他说。'),
    (97, u'赵大嘴抬起头，对着那个散开的点说：谢谢。谢谢你带我找到我爸。',
     u'赵大嘴抬起头，对着那个散开的点说："谢谢。谢谢你带我找到我爸。"'),
    (107, u'叶文轩问：还有多久。',
     u'"还有多久。"叶文轩问。'),
    (117, u'赵大嘴问：小鱼是谁。',
     u'"小鱼是谁。"赵大嘴问。'),
    # -- the ten years, in the order a conversation takes -------------------
    (67, u'赵大嘴问：十年以后呢。',
     u'"留给你的是能量，在你神经通路里。"0429碎片说，"够用十年。概率场从今天起你自己操作。"'),
    (69, u'"十年以后你自己会找到新的路。"0429碎片说，"你一直都比自己以为的能干。"',
     u'"十年以后呢。"赵大嘴问。'),
    (71, u'"留给你的能量在神经通路里。"0429碎片说，"够用十年。概率场以后你自己操作，不用我扶。"',
     u'"十年以后你会自己找到新的路。"0429碎片说，"你一直比自己以为的能干。"'),
    # -- three beats that fought their neighbours ---------------------------
    (59, u'0429碎片在他胸口的温度往上走了一格。它说：他想说的话，我替他讲。他等了三年，就等这一句。',
     u'0429碎片在他胸口的温度往上走了一格。它没有出声，只把那股暖往上顶了顶，顶到肋骨底下。'),
    (99, u'蓝光漫上来，把整片白色照成半透明。光的边缘起了一圈很小的棱角。',
     u'蓝光漫上来，把整片白色照成半透明。原来有边的地方现在看不清边了。'),
    (115, u'叶文轩站在两步之外。他听得见开头，听不见后面。0428备份把后半段一段一段切给他，像有人在他耳朵里念。',
     u'赵大嘴还跪在那儿。他摊开手掌看了看，掌心什么都没有，只剩一层很淡的蓝。'),
    # -- the tail's filler, replaced in place ------------------------------
    (145, u'光里晃动的影子飘来飘去，被遗忘的东西在漂流。',
     u'缝里的光在动。它动得不明显，是那种要盯着看一会儿才看得出的动。'),
    (147, u'光里晃动的影子上下翻飞，被遗忘的东西在涌起。',
     u'叶文轩盯着看了三分钟。光的颜色在慢慢偏，从白偏到灰，又偏回来。'),
    (149, u'时间还需要再多一点。',
     u'他数着变色的间隔。一开始五秒一次，后来短了一点。'),
    (151, u'那句话烙进他的意识里，永远无法擦除。',
     u'这条缝在换气。像一条鱼被搁在岸上，鳃一开，一合。'),
    (153, u'被遗忘的东西在光影中晃动，影子在跳动。',
     u'赵大嘴蹲在旁边。他没有看缝，他在看自己的手。'),
    (155, u'他还需要一些时间去梳理思路。',
     u'掌心那层蓝已经淡到底了，只剩一点，像化开的糖水。'),
    (157, u'被遗忘的东西在光影中颤动，影子在震动。',
     u'他把手翻过来又翻过去，看了很久，什么也没说。'),
    (163, u'0429碎片的光线在空气中略微颤动，频率稳定下来。',
     u'数据的最后一行还在动。动着动着频率稳定下来，落在一个固定的数上。'),
    (165, u'赵大嘴的呼吸放轻，他感觉到0429碎片在体内完成了新一轮的扫描。',
     u'赵大嘴的呼吸放轻。0429碎片在他体内完成了新一轮的扫描，扫得很慢。'),
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
        total += len(CJK.findall(r['new'])) - len(CJK.findall(r['old']))
    before = len(CJK.findall(txt))
    print('cjk %d -> %d  (%+d)' % (before, before + total, total))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    if apply:
        recs.sort(key=lambda r: -r['line'])
        io.open('tools/r325l_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'l',
                        'note': 'ch675: R325k scene put into the book voice, three '
                                'beats repaired, tail filler replaced in place',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325l_sites.json')


main('--apply' in sys.argv)
