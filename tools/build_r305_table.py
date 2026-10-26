# -*- coding: utf-8 -*-
"""Generate tools/r305_sites.json -- the rest of the R303 deferred set.

R303 deferred 17 chapters; R304 did ch732 and ch695.  This is the remaining 15.

Two shapes:
  block  -- a run of consecutive filler paragraphs (ch693, ch618, ch675, ch580).
           Replaced with prose drawn from the chapter's own surrounding action.
  line   -- one or two isolated filler lines (ch133/147/157/199/208/581/583/
           585/593/603/694).  The line is deleted and a short substantive line
           is written in its place, sized so the chapter stays >= 3000 CJK.

The old blocks are read out of HEAD, not the working tree.  R305's edits are
already applied, so the working tree no longer contains the filler these
records delete; reading it would turn every `old` into a copy of its own `new`
and destroy the round's HEAD -> disk map.  HEAD is the last committed state
(R303) and still has the filler.  New prose is checked against the de-AI rules
by the engine before it is written, and must contain no em-dash.
"""
import io
import json
import re
import subprocess

CJK = re.compile('[一-鿿]')
V5 = 'chapters/volume-5'
V2 = 'chapters/volume-2'

BLOCKS = [
    # ---- ch693: L89-107 is one filler run. Chapter is 0429 stage 2/3. ----
    (V5, 693, 89, 107,
     u'L89-107 连续 19 行纯填充（窗外/声音/暖意/口袋/画面/蹲下/心跳），无任何情节。',
     [
      u'叶文轩把那团蓝光看得更仔细了些。粒子群的转速比他上次看的时候快了一点，群的外沿在往外扩，扩到一尺左右就停住，又收回来。扩和收之间有一种节奏，像呼吸。',
      u'',
      u'“它在干什么？”赵大嘴问。',
      u'',
      u'“在量这个地方。”叶文轩说，“它在看能伸多远。”',
      u'',
      u'“伸远了会怎么样？”',
      u'',
      u'“远了就收不回来。”叶文轩盯着那一收一放，“粒子散一个，它少一份。散到只剩一个，它还是它，但那一个就只剩一份。那份不够它再伸第二次。”',
      u'',
      u'赵大嘴把双手背到身后，站得离粒子群远了些，像怕自己喘气太重把它吹散。',
      u'',
      u'叶文轩蹲下去，从地上捡起一枚被震下来的螺母。螺母是铁的，表面锈了一层红。他把螺母托在掌心，伸到粒子群下面，松手。',
      u'',
      u'螺母掉下去，没有落地。它在半空被接住了，蓝光在螺母底下托了一层，很薄，稳住了大概两秒。两秒之后蓝光一散，螺母落回地面，响了一声。',
      u'',
      u'赵大嘴看着那枚螺母，又看看自己的手。“我能不能？”他问。',
      u'',
      u'“你现在连石头都还拿不准。”叶文轩说，“先练那个。”',
     ]),
    # ---- ch618: L80-98 is one filler run. ----
    (V5, 618, 80, 98,
     u'L80-98 连续 19 行纯填充，与 ch693/ch675 同一批 R280 文本。',
     [
      u'风从破碎的窗口进来，带着外面的灰。叶文轩把外套的拉链拉到顶，还是觉得有东西在往衣领里钻。他伸手探了探窗台，指尖沾了一层细粉，捻开，是混凝土被震出来的屑。',
      u'',
      u'“这楼还能撑多久？”赵大嘴在旁边问。',
      u'',
      u'“撑到我们走完就够了。”叶文轩说，“撑久了反而是麻烦。”',
      u'',
      u'他顺着窗口往外看。街对面的楼房少了两层，断面很新，钢筋从混凝土里支出来，指向不同的方向。那些钢筋在风里没有动，可看起来像是在动。那是他自己的眼睛在修正。洞察之眼一直开着，把断面里的结构一根根标出来，标得他太阳穴发紧。',
      u'',
      u'他关掉一半。世界立刻暗了，也静了。',
      u'',
      u'“你关了？”赵大嘴注意到他的眼神变了。',
      u'',
      u'“关一半。”叶文轩说，“留着另一半找路。”',
      u'',
      u'赵大嘴点头，把背上包的带子紧了紧。“那走吧。”他说，“趁它还撑着。”',
     ]),
    # ---- ch675: L117-133 is one filler run. ----
    (V5, 675, 117, 133,
     u'L117-133 连续 17 行纯填充，末尾还含 R274 折叠残渣「空气像被这句话压了一瞬。」',
     [
      u'叶文轩顺着那条缝看过去。缝在墙和地面的交界处，从上往下斜着走，走到一半分成两股，一股继续往下，一股拐进墙里。分岔的地方积了一点灰，灰被震成一道一道的。',
      u'',
      u'他跪下来，把手掌贴在缝边的地面上。地面是凉的，凉里带着一点颤，很细，像有什么东西在很深处转动。他数了数，颤的间隔大概三秒一次，一次比一次重。',
      u'',
      u'“它在换。”叶文轩说。',
      u'',
      u'“换什么？”赵大嘴问。',
      u'',
      u'“换规矩。”他站起来，拍掉膝盖上的灰，“旧的那套在退。退的时候会抖。抖完就换新的上来。”',
      u'',
      u'赵大嘴也蹲下去听了听。他听了不到十秒就抬起头，脸上是他自己也不知道该算什么的表情。“我听着像心跳。”他说。',
      u'',
      u'“那就当它是心跳。”叶文轩说，“心跳是活着。这套东西活着，我们才有路走。”',
      u'',
      u'他把手从墙上收回来。掌心那道被缝硌出来的红印过了好一会儿才淡下去。',
     ]),
    # ---- ch580: L142-158 is filler, AND L148 duplicates L140 verbatim. ----
    (V5, 580, 142, 158,
     u'L142-158 连续填充；另 L148 与 L140 逐字重复（R302 补的作者原句与 R280 填充撞在同一章），需去掉重复的那次。',
     [
      u'叶文轩站在白光里，没有马上答。0428和0429的信号在他两边等着，一个说决定，一个说选。他把两个信号的重量在心里称了称，称不出高下。两个信号指向的是同一个方向，只是走的路不一样。',
      u'',
      u'“我选回去的那条。”他终于开口。',
      u'',
      u'白光跟着这句话亮了一档。光里有什么东西在退，退得很远，退到他能看见更里面的部分。那里面不是空的，有结构，有纹路，有被折起来又展开的痕迹。',
      u'',
      u'赵大嘴在旁边看着他，没有出声。风从两人之间过去，把地上的碎屑吹成一条线。',
      u'',
      u'叶文轩深吸了一口气，抬手把眼前的碎发拨开。他知道选完就没有回头路，可他也知道，停在这里同样没有路。',
     ]),
]

# Isolated filler lines: (volume_dir, chapter, line, new line)
LINES = [
    (V2, 133, 79, u'叶文轩把三个事件在桌上排开，按时间码好。同样的蓝图出现在三个地方，中间隔了十一年。他把十一年这个数写在自己的手背上，写得很轻。'),
    (V2, 147, 127, u'叶文轩把耳边那句话又过了一遍。过到第三遍的时候，他听出了里面有一个他先前漏掉的字。那个字把整句话的意思翻了过来。'),
    (V2, 157, 85, u'叶文轩在原地站了一会儿。他把这件事从头到尾想了一遍，想完之后，他知道该往哪里走了。'),
    (V2, 199, 128, u'叶文轩把三处痕迹在脑子里对了一遍。对到第二处的时候，他发现三处的间隔有规律，都是七天。七天一次，像有人在按着钟表走。'),
    (V2, 199, 134, u'他把七天这个数在心里放下来。放下去之后，前面那些散着的事就有了次序。'),
    (V2, 199, 138, u'叶文轩低头看了一眼地上那道影子。影子比他的动作慢了半拍才跟上，他看着那半拍，心里有了数。'),
    (V2, 208, 44, u'叶文轩把风的音调变化在心里记下。刚才那一句里有三个字被风带走了，他没听清，可他记住了缺的是哪三个位置。'),
    (V2, 208, 50, u'他把那三个空位先留着。有些话缺几个字反而更听得出来，等他弄明白是谁在说，字就能补上。'),
    (V5, 581, 119, u'叶文轩感觉到有东西从缝隙里出去了。0428的碎片脱离了他的掌控，轨迹很直，一直往一个固定的方向去。他顺着那个方向看过去，知道它是回哪里。'),
    (V5, 581, 137, u'三件事压在一条线上。他要把它们排个先后，而每排一件，另外两件的分量就会变。'),
    (V5, 581, 139, u'叶文轩把三条线在心里拉直。拉直之后他看清了，它们最终都通到同一个地方。'),
    (V5, 583, 109, u'0428的碎片从石台上起来，慢得几乎看不出来。它升到一半的时候停住，像在等一个确认。'),
    (V5, 583, 121, u'叶文轩看着石台。光晕退下去之后，台面上留下了一圈很浅的印，是碎片压出来的。他看着那圈印，知道这东西放回去过，也被人拿走过一次。'),
    (V5, 585, 145, u'第四条路比前面三条都短，可它通着的地方最多。叶文轩把四条路在心里叠起来，重叠的部分正好是一块。'),
    (V5, 585, 153, u'他抬头看向窗外。外面是那条走了很多次的街，街上什么都没有，可他知道街的尽头有东西在等他。'),
    (V5, 593, 181, u'四十二小时。他把这个数在心里分成两半，前一半做准备，后一半走路。分开之后，这个数字就不再压人了。'),
    (V5, 603, 197, u'叶文轩把这句话在心里放稳。他刚才有一瞬间想反驳，现在不想了。有些话说出来就是要人难受的。'),
    (V5, 694, 77, u'那些数字在他脑海里转了很久。他逐个把它们拆开，拆到最后一个的时候，才发现那是一组编号。编号连着人，是一个个被写进名单又被划掉的人。'),
    (V5, 694, 95, u'叶文轩转过身，背对那条街，也背对身后站着的那些人。他不想在这个时候让任何人看见他的脸，尤其是赵大嘴。有些表情一旦被人看见，就得解释。'),
]


def head_lines(path):
    """The last committed state of the chapter: LF, no BOM, no CR."""
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace('\\', '/')],
                       capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8', 'replace').replace('\r\n', '\n').split('\n')


def main():
    records = []
    for vdir, ch, s, e, defect, new in BLOCKS:
        path = '%s/chapter-%d-polished.md' % (vdir, ch)
        lines = head_lines(path)
        old = lines[s - 1:e]
        if old[0].strip() == '':
            raise SystemExit('ABORT: %s L%d does not start a block' % (path, s))
        records.append({
            'path': path, 'chapter': ch, 'defect': defect, 'op': 'block',
            'start': s, 'end': e, 'old': old, 'new': new,
            'net': len(CJK.findall('\n'.join(new))) - len(CJK.findall('\n'.join(old))),
        })
    for vdir, ch, ln, new in LINES:
        path = '%s/chapter-%d-polished.md' % (vdir, ch)
        old = head_lines(path)[ln - 1]
        records.append({
            'path': path, 'chapter': ch, 'op': 'line', 'line': ln,
            'defect': u'孤立填充行', 'old': old, 'new': new,
            'net': len(CJK.findall(new)) - len(CJK.findall(old)),
        })

    doc = {
        'round': 'R305',
        'detector': 'R303 deferred set (15 remaining chapters)',
        'note': (
            'The rest of the chapters whose 3000 CJK floor was held up by the '
            'filler R303 deleted elsewhere. Four chapters (693, 618, 675, 580) '
            'had runs of consecutive filler paragraphs and get block '
            'replacements; the other eleven get a single filler line swapped '
            'for a substantive one. ch580 also carried a verbatim duplicate: '
            'R302 restored the author sentence 「叶文轩需要选择。选择之后没有回头路。」 '
            'and R280 had padded the same chapter with the identical sentence, '
            'so the block replacement removes the second copy.'
        ),
        'records': records,
    }
    with io.open('tools/r305_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    for r in records:
        where = ('L%d-%d' % (r['start'], r['end'])) if r['op'] == 'block' else ('L%d' % r['line'])
        print('ch%-4d %-9s %s  net %+d CJK' % (r['chapter'], r['op'], where, r['net']))


if __name__ == '__main__':
    main()
