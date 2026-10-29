# -*- coding: utf-8 -*-
"""R325x, ch705: the front half is a machine draft, the back half is the book.

3,060 CJK.  Lines 3-50 (2,170 CJK) are machine output: every sentence carries a
comma where a pause does not belong (「他们带了八个信号，抑制器」「他们的目标，是
消灭，我们」), the same status report comes round six times, and L50 alone is a
656-character paragraph of four spliced copies of the same three facts.  Then
L52-70 is the 被遗忘的东西在光影中晃动 family of filler.  The coda, L72-120, is
720 characters of the real thing -- the fragment as a relay station, three
layers, thirty percent, the child's voice carried for three years -- and it
stays exactly as it is.

With 60 characters of headroom the front half cannot be cut, so it is rewritten
at length: the same assault, ten men, eight suppressors, six jammers, four
entrances, three of them through the door and three back out, a suppressor that
presses the field flat, a nose bleed, a commander whose signal is being squeezed,
six hours against seventy-two, and 0429 going down to the third layer to cut the
power.  What was noise becomes a scene of about the same size.

L52-70 is deleted: it says nothing the coda does not say better, and the cut is
what pays for the extra beats in the fight.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-705-polished.md'

BATTLE = u'\n\n'.join([
    u'0428备份在叶文轩的意识里亮了，报数：第二波在门口，十个人，八台信号抑制器，六台概率干扰器。指挥官在远程，自己不进车间。报得很平，像念一张货单。',
    u'这个车间是临时找的。四面墙，两台车床，一台压力机停在角落里，三年没开过。门两个，一个正门，一个侧门通后院。',
    u'0429碎片在赵大嘴胸口热了一下。它说：四个方向都有人。第一个贴到外墙了，身上一台抑制器，十米以内，设备在充能。脚步声很碎，踩在铁屑上听不出来。',
    u'0428备份说：他们带抑制器，是因为他们只知道我们有概率场。他们不知道是谁在推。',
    u'叶文轩把话转过去：让他先动手。概率扭曲，现在开始，别等人进到十米。',
    u'这是赵大嘴第一次自己推概率场。0429碎片在他体内，能给的是能量，手上的活它替不了。手一抬，神经通路里有东西往下走，像水找到了坡。',
    u'车间的空气先动。光线歪了，声音变了调，地面在震，天花板上的灰一片一片往下掉，窗户在框里响。',
    u'叶文轩看得见第一个人开始晃。设备在闪，眼睛对不上焦，脚步乱了。他退了一步，脚跟磕在一颗螺丝上，人朝后倒，设备脱手，在空中翻了一圈，落地碎了。碎的是信号抑制器，外壳弹开，里面的线圈滚到车床底下。',
    u'车间的行车在头顶晃，吊钩摆起来，撞在铁架子上响了一声。吊钩上挂着的半成品跟着转，转了两圈才停。',
    u'那个人爬起来想捡，手刚碰到线圈，扭曲又推了他一下，肩膀撞在车床腿上，人坐回地上。',
    u'0429碎片说：他倒了，扭曲起效。设备碎了，这台抑制器废了。',
    u'0428备份传回：第一个挡住。还有九个。第四个方向的人在换位置，绕开车间的正门。',
    u'0429又热起来：第二个进来了，身上一台概率干扰器，二十米，设备在充能，比你快。',
    u'那个人在门口停了停，抬手看手里的设备，像在等谁点头。没有人点头。',
    u'叶文轩数了一遍人头。四个方向，进来的一个，门外还有九个。那九个里有一个一直没动，站在一辆车的后面，手里没有设备。',
    u'叶文轩退到压力机后面，把正门的方向整个让给扭曲。他自己的位置不重要，场的位置重要。',
    u'赵大嘴把扭曲抬了一档。这一次推得比上一次稳，手上的活他自己干，0429碎片只在他神经通路里送能量，把那股劲续上。概率场的形状一次比一次宽。',
    u'车间里动得更狠。光线被掰弯，窗户在震，墙壁在摇，地面裂开一条小缝，天花板上的灯一闪一闪，灯罩里积的灰往下落。',
    u'叶文轩看得见第二个人在反应。设备在闪，眼睛对不上焦，人朝一侧歪。他抬脚想站稳，踩到一块碎片，整个滑了出去，设备脱手，翻了一圈，掉在地上碎了。',
    u'第三个人进来得很快，从侧门，没等扭曲铺到那边。他身上一台抑制器，十米，设备已经开始发射。他一边走一边说话，说的什么听不清，扭曲把声音也拉长了。',
    u'抑制器一开，概率场就被压住，往下塌了一块。塌的那一块压在赵大嘴胸口上，闷得像被人隔着被子按了一下。他没有松手，推的方向换了，从横着推改成往上顶，顶住压下来的那一层。',
    u'0428备份吐出：压住了，可你的意志在往上顶。抑制器压不满概率场，它只能压住一半。那一半，赵大嘴自己补得上。',
    u'赵大嘴的指尖开始发麻，麻到手背。他把手举得更高，像托着什么看不见的东西。',
    u'0429碎片说：我的能量往你神经里送。你的意志够，我这边就不断，概率场不会散。',
    u'赵大嘴的鼻血在这时候下来，滴在车床的导轨上。他没有抬手去擦。手一松，场就散，场一散，三个人会一起站起来。',
    u'0429说：你的手在抖。赵大嘴说：抖就抖，场别散。',
    u'第三个人开始稳不住。设备在闪，脚步乱，人朝一侧歪。他伸手想扶墙，手按空了，设备从手里滑出去，砸在地上，灯灭了。他蹲下去摸，摸到的都是碎片。',
    u'第一个人在地上喊了一句：这不正常。没有人回答他。',
    u'第四个人一直没进来。他在门外把两台设备架在一起，一台对着门，一台对着窗。叶文轩看见他按下了发射。',
    u'门外那个人对着设备说话，说了很久没人应。他把设备举高了一点，像在找一个更好的位置。',
    u'扭曲同时顶两个方向，赵大嘴的膝盖弯了一下。他扶住车床，把腰挺回去，血从下巴滴到地上。',
    u'0429碎片说：他的两台设备在互相干扰。放得太近，功率自己吃自己。',
    u'那两台设备的灯同时暗下去，第四个人低头去拍，拍了三下，拍不亮。他退到墙边，把设备抱在怀里。',
    u'0428备份传：三个人都挡住了。外面的队在乱，设备一台一台失灵。指挥官还在远程，但他的信号在变弱，每弱一分，他下达的命令就晚一分。',
    u'0429碎片说：我在压他。他的信号进不来这么远，命令传不到人手上。他们要自己拿主意，可他们不知道怎么拿。',
    u'叶文轩的洞察之眼顺着信号的尾迹往上走，找到了指挥官那一路频率的边。他把这个位置告诉0429。',
    u'0428备份说：找到了就好。这条频率他们只有一条，堵住它，十个人就是十个各自为战的人。',
    u'0429说：收到了。它把能量往那条频率上压，压得又窄又狠。',
    u'外面的队里有人喊，喊到一半断了。没有人应他。',
    u'门外的车灯亮了一下，又灭了。',
    u'0428备份开口：他们在撤。指挥官在往上报告，报告的内容是：需要更多的人，更好的设备。这两样他们都有，只是不在这儿。',
    u'叶文轩听出这句话底下还有一层：他们会回来，而且会挑一个他们量过的时刻回来。',
    u'有人在门口喊：撤。第二遍才有人动。',
    u'记忆导出在这时候开始。记忆在流，从门过去，流向朵朵。传输要七十二小时，一分钟都省不掉。',
    u'第二波的人退到车间外面。设备一台一台熄，指挥官的声音在他们耳朵里越来越轻。有人回头看了一眼车间，看了一眼就转回去，没有人再往前走。',
    u'车间里安静下来，只有压力机的壳子在响，热胀冷缩，一声一声。',
    u'叶文轩数了第二遍。进来的三个，退出去的三个，门外七个。十个人，一个没少。这一趟他们来试，不来拼命。',
    u'0428备份说：他们要知道这个场能撑多久。这一趟他们量到了。',
    u'赵大嘴还站在原地，手没有放下来。他说：他们在撤，指挥官在往上打报告。下一波会带更多的人，更好的设备。可他们要时间，我们至少有六个小时。',
    u'他说话的时候手还举着，指尖的颜色发白。',
    u'叶文轩在心里把这笔账算了一遍。六个小时够他们把导出的开头做完，不够做完全部。指挥官的信号会找到新的频率，干扰能拖一时，拖不了三天。',
    u'他问了一句：导出开始了吗。0429说：开始了，第一段已经过了门。',
    u'七十二小时，六个小时。这两个数字之间隔着一条很细的线。三天里，只要有一个绕开扭曲的人摸到门口，导出就得断。他把这句话放在心里，没有说出来。',
    u'0429碎片说：我下沉到第三层。第三层是能量层，我在那儿有权限，能远程动能量网络。他们的人靠设备，设备靠电。电一掐，抑制器和干扰器就是一堆铁。',
    u'0429又说：我这边顶不住七十二小时。能量按次算，次数有限。',
    u'赵大嘴说：那就省着用。别在他们还没进来的时候就把力气花完。',
    u'赵大嘴问：掐多久。0429说：掐到导出做完。它停了一下，又补一句：我在第三层，不回来。',
    u'赵大嘴看向叶文轩。叶文轩点了点头，什么也没说。',
])

DROP = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37,
        39, 41, 43, 44, 46, 48, 50,
        52, 54, 56, 58, 60, 62, 64, 66, 68, 70]


def main(apply):
    txt = io.open(PATH, 'rb').read().decode('utf-8').replace(u'\r\n', u'\n')
    lines = txt.split(u'\n')
    head = lines[2]
    recs = [{'path': PATH, 'line': 3, 'old': head, 'new': BATTLE}]
    bad = 0
    expected = {
        5: u'赵大嘴感觉到0429碎片在温暖地跳动，说：他们从四个，方向进入。他们的第一个人，在靠近，车间。他带了信号，抑制器。他，在十米范围，内。他的设备，在准备，发射。',
    }
    a = len(CJK.findall(head))
    b = len(CJK.findall(BATTLE))
    total = b - a
    print('L3 battle %d -> %d (%+d)' % (a, b, total))
    dropped = 0
    for ln in DROP:
        if not (0 < ln <= len(lines)):
            print('ABORT L%d out of range' % ln)
            bad += 1
            continue
        if not lines[ln - 1].strip():
            print('ABORT L%d is blank' % ln)
            bad += 1
            continue
        c = len(CJK.findall(lines[ln - 1]))
        dropped += c
        recs.append({'path': PATH, 'line': ln, 'old': lines[ln - 1], 'new': None})
    total -= dropped
    before = len(CJK.findall(txt))
    print('dropped %d paragraphs, %d CJK' % (len(DROP), dropped))
    print('cjk %d -> %d (%+d)   headroom 60 -> %d'
          % (before, before + total, total, 60 + total))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325x_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'x',
                        'note': 'ch705: machine-draft front half rewritten as the '
                                'assault it describes; filler tail deleted',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325x_sites.json')


main('--apply' in sys.argv)
