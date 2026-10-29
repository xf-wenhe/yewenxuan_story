# -*- coding: utf-8 -*-
"""R325k, ch675: the broadcast block is the draft the last scene was written from.

The chapter is two things.  L3-L115 is 1,674 CJK of machine broadcast, one
clause per paragraph, seven facts told three to five times each:

  0429碎片在核心中会继续守护，赵大嘴        L35 L63 L73
  使命全部完成，现在自由了                  L85 L103
  我爸在 / 我以你为荣                        L25 L27 L31 L57 L83 L101
  父亲在2045年设计了0429碎片                L67 L69 L79 L99
  守护朵朵的记忆                            L65 L87 L95 L105
  眼泪在掉 + 温暖地跳动                      L29 L81 L83 L101

L117-L195 is 1,507 CJK of real scene: the crack in the wall, the street, the
notebook with 云 written in it, 四里路, 我们自己带着灯.  Somebody wrote that by
hand, and it is the good half.

The block and the tail are the same material at two stages.  The tail already
carries 0429 waking (L159), the corners of its light (L187), and the father's
line arriving secondhand (L185: 刚才0428把这句话给我看了).  The block is the
earlier draft of exactly that.

Deleting the block outright would leave 1,507 CJK, under the floor, so it is
rewritten at the block's own length as what the tail cannot cover: the farewell
inside the white space, where 赵大嘴 actually talks to his father and 0429 says
goodbye.  Beats the tail owns were left to the tail -- the corners exchange,
赵大嘴要变了 / 多快 / 快到来不及准备, and 「爸。我做到了。」 which L169 says much
better sitting on a curb.

Shape: L3 becomes the whole new scene (paragraphs separated by blank lines),
L5-L115 are deleted.  Records run in descending line order, so the deletions
happen before the insertion and no line number moves under another record.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-675-polished.md'
KEEP_LINE = 3

SCENE = u'\n\n'.join([
    u'连接建立的那一瞬间，白色空间里的回声全停了。赵大嘴听见自己的心跳，一下，又一下，撞在耳膜上。',
    u'然后有人叫他的名字。',
    u'“大嘴。”',
    u'那声音他十年没听过了。赵大嘴张了张嘴，喉咙里没有声音出来。',
    u'“是我。”那个声音说，“我一直在。0429碎片的最深层就是我。”',
    u'"爸……"',
    u'赵大嘴问：你在哪。',
    u'“在你胸口。”父亲说，“三年了。你每一次哭，我都知道。”',
    u'赵大嘴说：我没哭过几次。',
    u'“十七次。”父亲说，“第一次是你妈住院那年，最后一次是今天早上。”',
    u'赵大嘴说：你数这个干什么。',
    u'“没别的可数。”父亲说。',
    u'赵大嘴的膝盖先塌下去。他跪在白色的地面上，把脸埋进手掌，眼泪从指缝里漏出来，落在地上没有一点声响。',
    u'0429碎片在他胸口暖着。那点暖跟了他三年，他一直以为是碎片在运转。',
    u'“你做得很好。”父亲说，“你选了自己的路。你和叶文轩一起把闭环打破了。那些被抹掉的人，记忆已经回到现实。”',
    u'赵大嘴想说点什么。他试了两次，第二次只出来一声很短的抽气。',
    u'“我以你为荣。”',
    u'赵大嘴的喉咙动了一下。他说：我没想过能听见你说这句话。',
    u'“我早就想说了。”父亲说，“一直没机会。”',
    u'这五个字之后，白色空间安静了很久。赵大嘴把手从脸上拿下来，眼睛红着，人已经稳住了。他说：爸，你说话，我听着。',
    u'“我知道。”父亲说，“我一直在看。”',
    u'“你妈还好吗。”父亲问。',
    u'赵大嘴沉默了几秒。他说：她不知道。我没敢告诉她。',
    u'“先别说。”父亲说，“等这件事完了，你带她去看海。她一直想去。”',
    u'赵大嘴说：爸，我这三年一直在装。装傻，装没用，装到所有人都懒得看我一眼。',
    u'“我知道。”父亲说，“你装得很好。好到我也差点信了。”',
    u'赵大嘴说：那你为什么不早点出来。',
    u'“出不来。”父亲说，“你身上有一道锁，是系统上的。锁开的那天，我才敢说话。”',
    u'0429碎片在他胸口的温度往上走了一格。它说：他想说的话，我替他讲。他等了三年，就等这一句。',
    u'赵大嘴低头看着自己的胸口。蓝色的纹路在衣服底下转，比平时慢。',
    u'“我的事办完了。”0429碎片说，“我可以去核心，跟他在一起。”',
    u'赵大嘴把手按在胸口上，按得很用力，像要把那点光按回去。',
    u'赵大嘴问：十年以后呢。',
    u'“十年以后你自己会找到新的路。”0429碎片说，“你一直都比自己以为的能干。”',
    u'“留给你的能量在神经通路里。”0429碎片说，“够用十年。概率场以后你自己操作，不用我扶。”',
    u'白色空间里的纹路开始松。0429碎片从赵大嘴的胸口一层一层退出来，退到皮肤表面，最后只剩很薄的一层蓝。',
    u'赵大嘴的胸口变轻了。那种轻很陌生，像背了三年的东西被人接过去。',
    u'“爸在2045年就把自己嵌进来了。”赵大嘴说，声音很低，“他把意识放进碎片，放了三年。”',
    u'“第一年还能看见外面。”父亲说，“第二年只剩下你的心跳。第三年连心跳都听不清了，只知道你还在。”',
    u'赵大嘴把眼睛闭上。他说：我一直在。',
    u'“我知道。”父亲说，“所以我等到了。”',
    u'“他算准了你会走到这一步。”0429碎片说，“算准你会遇到叶文轩，算准你会跟着他走，算准你会把闭环砸开。连你先装成一个拖油瓶，他都算到了。”',
    u'赵大嘴笑了一下，笑得不太好看。“他连这个都知道。”',
    u'“他知道的比这多。”0429碎片说，“他护的是你的盲区。那些你自己看不见的地方，他一直站在前头挡着。”',
    u'白色的光往上收。0429碎片的纹路在最高处聚成一个点，停了一停，散开。',
    u'“我走了。”它说，“我随时能和你说话。我在。”',
    u'“你在外面用概率场的时候，我会知道。”0429碎片说，“用错了我也不骂你。”',
    u'赵大嘴抬起头，对着那个散开的点说：谢谢。谢谢你带我找到我爸。',
    u'蓝光漫上来，把整片白色照成半透明。光的边缘起了一圈很小的棱角。',
    u'“朵朵的记忆还在。”0428备份转过来，对叶文轩说，“沈知秋在外层守着。我们都在守着朵朵。”',
    u'赵大嘴听见这两个字，抬起头。他没见过那个孩子，但他知道那是叶文轩的女儿。',
    u'“你的女儿在等你。”0428备份说，“快了。你很快就能真正看见她。”',
    u'叶文轩问：还有多久。',
    u'“我不知道。”0428备份说，“她已经在往这边来了。”',
    u'叶文轩没有接话。他把手从手腕上收回来，指节用力用得比平时大。',
    u'“沈知秋说，她快见到小鱼了。”0428备份说，“这句话她托我带给你们。”',
    u'叶文轩站在两步之外。他听得见开头，听不见后面。0428备份把后半段一段一段切给他，像有人在他耳朵里念。',
    u'赵大嘴问：小鱼是谁。',
    u'“沈知秋的孩子。”0428备份说，“也是这三年里，被人从记忆里捞回来的一个。”',
    u'白色的空间在往下沉。像有人把一张纸慢慢合起来，边角先贴在一起，中间最后收。',
    u'“回去吧。”0428备份说，“回去以后准备仪式。沈知秋在等，赵大嘴的父亲也在等。”',
    u'赵大嘴站起来，拍了拍膝盖上的灰。他走了两步，停下，回头看了一眼那个已经散掉的地方，没有说什么。',
    u'回到现实只用了三秒。脚下是实地，风是凉的，声音一下子全涌回来。',
])


QUOTES = [121, 123, 125, 127, 129]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    if lines[KEEP_LINE - 1] != u'叶文轩感觉到0428备份在发光，赵大嘴。':
        raise SystemExit('ABORT: L%d is not the block opener' % KEEP_LINE)

    olds = [lines[k] for k in range(4, 115, 2)]      # L5, L7 ... L115
    if len(olds) != 56 or any(not x.strip() for x in olds):
        raise SystemExit('ABORT: block is not 56 paragraphs at odd lines')

    scene = SCENE.replace(u'“', u'"').replace(u'”', u'"')
    recs = [{'path': PATH, 'line': KEEP_LINE,
             'old': lines[KEEP_LINE - 1], 'new': scene}]
    for k, ln in enumerate(range(5, 116, 2)):
        recs.append({'path': PATH, 'line': ln, 'old': olds[k], 'new': None})

    for ln in QUOTES:
        old = lines[ln - 1]
        recs.append({'path': PATH, 'line': ln, 'old': old,
                     'new': old.replace(u'“', u'"').replace(u'”', u'"')})
    gone = sum(len(CJK.findall(x)) for x in olds)
    now = len(CJK.findall(scene))
    before = len(CJK.findall(txt))
    print('block %d -> %d  (%+d)' % (gone, now, now - gone))
    print('cjk %d -> %d   floor %s'
          % (before, before - gone + now,
             'ok' if before - gone + now >= 3000 else 'BROKEN'))
    print('paragraphs %d -> %d' % (len(olds), len(SCENE.split(u'\n\n'))))
    print('records %d (deletions 56)' % len(recs))
    if apply:
        io.open('tools/r325k_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'k',
                        'note': 'ch675: the broadcast block rewritten as the '
                                'farewell the tail cannot show, at equal length',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325k_sites.json')


main('--apply' in sys.argv)
