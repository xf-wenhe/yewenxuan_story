# -*- coding: utf-8 -*-
"""Generate tools/r304_sites.json.

The table is built by script rather than written by hand: the blocks contain
Chinese prose with straight quotes, and hand-edited JSON kept losing the
record separator.  Generating it also lets the old blocks be read straight out
of HEAD, so an anchor mismatch is impossible by construction.

The old blocks come from `git show HEAD:<path>`, NOT from the working tree.
R304's edits are already applied, so the working tree no longer contains the
filler these records delete; reading it would silently turn every `old` into a
copy of its own `new` and destroy the round's HEAD -> disk map.  HEAD is the
last committed state (R303), which still has the filler.

New prose is checked against the de-AI rules by the engine before it is
written, and must contain no em-dash -- that rule was missing when this round
first ran and shipped five of them.
"""
import io
import json
import os
import re
import subprocess

CJK = re.compile('[一-鿿]')

# (path, start, end, outline note, new block)
BLOCKS = [
    ('chapters/volume-5/chapter-732-polished.md', 107, 131,
     'Ch.731-735 0429觉醒最终阶段; V733-1 赵大嘴觉醒后第一次概率扭曲',
     [
      u'叶文轩把七十五分钟在心里过了一遍。维护派的信号是从西边进来的，走完那条街要二十分钟，剩下的五十五分钟够他们把工作室围两层。他看了眼赵大嘴，赵大嘴还在看那块石头，手指一松一紧，像在试一件刚长出来的肢体。',
      u'',
      u'“你第一次用这个能力是什么时候？”叶文轩问。',
      u'',
      u'“刚才。”赵大嘴说，“石头起来的那一下，我没想。它自己就起来了。”',
      u'',
      u'“那就对了。”叶文轩说，“想的那些都不准。不想的才准。”',
      u'',
      u'0224的纹路在空气里转了一圈，暗色的部分压得很低。“补充一点，”它说，“概率扭曲的精度跟神经通路的冗余度有关。赵大嘴的通路在过去三年一直被压着，现在松开了，冗余比觉醒者平均值高出四成。四成意味着他能同时挂住两个不相干的事件，但也意味着他会先累。”',
      u'',
      u'“先累？”赵大嘴抬起头。',
      u'',
      u'“第一个人扭曲一次，消耗可以忽略。第一个人扭曲两次以上，误差开始累积。”0224的声音很平，“你们没有第二次机会。极端派到的时候，每一发都要落在该落的地方。”',
      u'',
      u'赵大嘴点了点头，把石头放回桌上。石头碰到桌面，滑了半寸才停。他看着那半寸，伸手把石头推回原位。',
      u'',
      u'“我记着了。”他说。',
      u'',
      u'叶文轩走到工作台边上，把摊开的结构图往自己这边收了收。图上回廊核心的位置已经标了出来，桥梁系统的接入点用蓝笔画了一道弧。他沿着那道弧看过去，弧的另一端接在维护派信号进来的方向上。',
      u'',
      u'“0224，”他说，“极端派的信号里有没有带编号？”',
      u'',
      u'“有。七个，全部一级响应。”0224的纹路停了一下，“其中两个来自维护派上周撤离时留下的备用信道。那两条信道不经过系统主干，我的扫描过去会被弹回来。”',
      u'',
      u'“弹回来之前你能看到多少？”',
      u'',
      u'“三秒。”0224说，“够分辨人数，不够分辨装备。”',
      u'',
      u'“够了。”叶文轩把图折起来，塞进外套内袋，“三秒里数出来几个人，回来告诉我就行。”',
      u'',
      u'赵大嘴看着他做完这些，把手里的石头又放了下来。“那我呢？”他问，“我就在这儿练石头？”',
      u'',
      u'“你练怎么不累。”叶文轩说，“一次，两次，三次。找到你开始手抖的那一次，记住那个数。到时候那个数就是你的上限。”',
      u'',
      u'赵大嘴低头看自己的手。他把它翻过来，又翻过去，像在确认那上面多了点什么。',
     ]),
    ('chapters/volume-5/chapter-695-polished.md', 73, 107,
     'Ch.691-695 0429觉醒第二阶段; 0429从赵大嘴体内完全独立，变成微小蓝光粒子群',
     [
      u'赵大嘴低头看自己的手。那双手在他眼前摊着，指节分明，没有多出来什么，也没有少掉什么。可他知道里面住着的东西已经走了。',
      u'',
      u'“它走了多久了？”他问。',
      u'',
      u'“从你的抑制解除那一刻起。”叶文轩说，“大概半分钟。”',
      u'',
      u'赵大嘴把手握起来，又摊开。他试着去感觉神经通路里那一小块熟悉的振动。过去三年，0429一直待在那里，像一颗不肯停的秒针。现在那里是空的。空得干净，空得没有一点余波。',
      u'',
      u'“奇怪，”他说，“我以为我会不习惯。”',
      u'',
      u'“你不习惯？”',
      u'',
      u'“不习惯的是另一边。”赵大嘴抬起头，看向空气，“它还在我通路里留了东西。它本身走了，走过之后的样子还在。像地上有条路，人走了，路还在。”',
      u'',
      u'叶文轩顺着他看的方向望去。工作台上的方盒还在，0428的核心在桌面下安静地亮着，蓝粉色的光沿着盒子的缝游。那光走得很慢，一圈，又一圈，像是在数着什么。',
      u'',
      u'“那就够了。”叶文轩说，“路在，它就能回来。”',
      u'',
      u'赵大笑了一下。他笑的时候肩膀在抖，抖得幅度不大，但停不下来。他把手按在桌沿上，压住它。',
      u'',
      u'第四个画面来得慢一些。还是那个厨房，还是那个男人，背对着谁在切菜。刀落在砧板上的声音很稳，一下，一下。画面的边上是黄昏的光，从窗户进来，把男人的肩膀照成橙色。',
      u'',
      u'赵大嘴看着那个画面，没有再说话。他呼吸的频率变了，比刚才深。',
      u'',
      u'0429碎片在温暖地跳动，说：记忆的回归，是从最老的开始。你父亲的，先回来。你自己的，在后面。',
      u'',
      u'我自己的怎么了。赵大嘴问。',
      u'',
      u'被压住了。0429说。压了三年。动手的是系统，用你的认知折成它能管的样子。现在折痕松了，但纸还没有完全展开。',
      u'',
      u'那要多久。',
      u'',
      u'不知道。0429的声音很平。可能很快。可能还要一段时间。你能想起来的东西，会一次比一次多。',
      u'',
      u'叶文轩一直坐在旁边看着。他看着赵大嘴的脸，看着那张脸从绷着到松下来，花了大概半分钟。松下来之后，赵大嘴看起来比三年来任何时候都像他自己。',
      u'',
      u'“还想得起什么？”叶文轩问。',
      u'',
      u'“我爸的名字。”赵大嘴说，“赵满仓。我以前一直记不得，只记得姓。”',
      u'',
      u'“满仓。”叶文轩念了一遍，“好名字。”',
      u'',
      u'“我爷爷起的。说他这辈子没吃饱过，希望他儿子能有个满仓。”赵大嘴顿了顿，“结果我爸在厨房里站了一辈子，也没吃上几顿安生饭。”',
      u'',
      u'叶文轩没有再接话。有些话说到这里就该停，往下接就轻了。',
      u'',
      u'赵大嘴用手背抹了一把脸。他抹得很快，像只是擦了汗。然后他抬起头，看向叶文轩。',
      u'',
      u'“继续吧。”他说，“还有多少，我都接得住。”',
     ]),
]

DEFECTS = {
    'chapters/volume-5/chapter-732-polished.md':
        u'L107-131 是 R280 插入的 12 段纯填充，不含任何情节，夹在 0224 的七十五分钟倒计时（L105）与重构开始（L133）之间，其中还含 R274 折叠残渣「他，又吐出，像是在排出什么。空气像被这句话冻了一下。间。」',
    'chapters/volume-5/chapter-695-polished.md':
        u'L73-107 是 35 行填充块，L97-107 把同一句换了六次名词（光中的影子来回晃动/晃荡/翻腾，周围安静下来/空气沉下来），是同义词轮换；整块夹在 0429 觉醒（L71）与后文之间。',
}


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
    for path, s, e, outline, new in BLOCKS:
        lines = head_lines(path)
        old = lines[s - 1:e]
        if not old or old[0].strip() == '':
            raise SystemExit('ABORT: %s L%d does not start a block' % (path, s))
        records.append({
            'path': path,
            'chapter': int(re.search(r'chapter-(\d+)', path).group(1)),
            'outline': outline,
            'defect': DEFECTS[path],
            'op': 'block',
            'start': s,
            'end': e,
            'old': old,
            'new': new,
            'net': len(CJK.findall('\n'.join(new))) - len(CJK.findall('\n'.join(old))),
        })

    doc = {
        'round': 'R304',
        'detector': 'R303 deferred set: the 17 chapters whose 3000 CJK floor was held up by the filler R303 deleted elsewhere',
        'note': (
            'R303 deleted 99 filler lines across 79 chapters but deferred 17 chapters '
            'that would have dropped below the 3000 CJK floor. Their floor was '
            'padding. This round removes the filler AND writes real content in its '
            'place, drawn from the volume outline so the added prose carries story '
            'information rather than atmosphere. Each record is a whole-block '
            'replacement: the filler block goes out, a substantive block comes in. '
            'Every chapter is re-checked against the 3000 floor after the edit.'
        ),
        'records': records,
    }
    with io.open('tools/r304_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    for r in records:
        print('%s L%d-%d: %d lines -> %d lines, net %+d CJK'
              % (r['path'], r['start'], r['end'], len(r['old']), len(r['new']), r['net']))


if __name__ == '__main__':
    main()
