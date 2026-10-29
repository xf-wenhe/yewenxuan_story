# -*- coding: utf-8 -*-
"""R325u, ch570: a status report read out four times.

3,469 CJK, floor 3,000 -- 469 characters of headroom, which will not untemplate
this chapter.  It reports, and it reports the same things:

  4x  「0429备份的传输质量已经很好，叶文轩能正常说话，赵大嘴能正常听到」
      -- verbatim, pasted into the middle of four different lines of dialogue,
      each time behind a different synonym for 声音在回荡.
  5x  「0429碎片在引导叶文轩…中层…去0428碎片的位置」 (L113 117 119 121 157)
  5x  the decoded message itself (L65 67 73 77 95), twice verbatim.
  the three-layer staff report twice (L19-23, then L29-33).
  6x  a bare paragraph whose only content is that his voice echoed.

Where the repetition carries a fact, it is rewritten and stays.  L121 pays for
itself: the arrow points at 中层 because M-007 is there, but 0428 is on the
fourth floor, and the chapter never says so -- the rewritten line does.

Where a paragraph is only the repetition, it goes.  Deletions: the first
three-layer block (L19-23, already stated at L15), 片段三连 (L59), one message
copy (L79), four of the six empty echo paragraphs.

Defects fixed at no cost: M-070 for M-007 (L151 155), 「了码」 (L177), four
sentences run together (L5 7 189 111), 「赵大嘴的回廊间回荡着他的声音」
(L139), corner brackets to ASCII (L65).

Left standing, recorded as a rewrite candidate: the 设计者 run at L179-185
(six times inside four clauses) and the three-layer report's second copy.
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
PATH = u'chapters/volume-5/chapter-570-polished.md'

RECS = [
    (5, u'不是完全的安静，回廊的嗡鸣还在。低频震动从白色石材的墙壁中传出来，一台机器在远处运转。但三个维护派执行者的信号确实消失了，他们的争论他们的分歧，他们的声音全部消失了。',
     u'不是完全的安静，回廊的嗡鸣还在。低频震动从白色石材的墙壁中传出来，一台机器在远处运转。但三个维护派执行者的信号确实消失了：他们的争论、他们的分歧、他们的声音，全部消失了。'),
    (7, u'叶文轩的洞察之眼在扫描回廊的信号环境，三个维护派执行者的信号在回廊中消散了，但信号留下的痕迹还在。叶文轩能看到信号的残留，三个信号在回廊的远端留下了微弱的尾迹。尾迹在衰减，在消失但尾迹还在。',
     u'叶文轩的洞察之眼在扫描回廊的信号环境，三个维护派执行者的信号在回廊中消散了，但信号留下的痕迹还在。三个信号在回廊的远端留下了微弱的尾迹，尾迹在衰减，在消失，可尾迹还在。'),
    (13, u'M-013的信号来源在回廊的更深层，M-013的信号来自回廊的，深层叶文轩感觉不到M-013信号的具体位置。叶文轩只感觉到M-013的信号在回廊的某个，深处存在。',
     u'M-013的信号来源在回廊的更深层。叶文轩感觉不到M-013信号的具体位置，只觉得它在回廊的某个深处，像一盏灯在很远的地方亮着。'),
    (15, u'叶文轩的脑子没停。三个维护派执行者的信号来自三个不同的层。M-001在上层M-007在中层M-013在深层三个维护派执行者不属于同一个派系。三个维护派执行者属于三个不同的层。',
     u'叶文轩的脑子没停。M-001在上层，M-007在中层，M-013在深层。三个执行者属于三个不同的层。'),
    (19, u'M-001在上层，M-001是保守派。M-001在回廊的上层中运行。M-001在回廊的上层中管理闭环的稳态。', None),
    (21, u'M-007在中层，M-007是激进派。M-007在回廊的中层中运行。M-007在回廊的中层中准备主动干预。', None),
    (23, u'M-013在深层，M-013是中立派。M-013在回廊的深层中运行。M-013在回廊的深层中观察一切。', None),
    (25, u'维护派不是铁板一块。维护派是一个分层组织。维护派在不同的层中有不同的执行者。维护派在不同的层中执行不同的任务。',
     u'叶文轩把这个判断往下推了一步：派系跟着层走，三方的分歧说到底跟想法无关，是位置上的事。'),
    (37, u'维护派内部的分歧在升级维护派内部的派系在分裂维护派不是铁板一块。维护派内部有不同的声音。',
     u'维护派内部的分歧在升级，派系在分裂，维护派不是铁板一块。维护派内部有不同的声音。'),
    (41, u'"大嘴，"叶文轩的声音沿着回廊传荡开来0429备份的传输质量已经很好，叶文轩能正常说话，赵大嘴能正常听到。"维护派内部有分歧。三个执行者分别来自三个不同的层，保守派在上层。激进派在中层，中立派在深层。"',
     u'"大嘴，"叶文轩开口。0429备份的传输质量已经很好，他能正常说话，赵大嘴能正常听到。"维护派内部有分歧。三个执行者分别来自三个不同的层：保守派在上层，激进派在中层，中立派在深层。"'),
    (47, u'叶文轩的声音在通道里回荡。', None),
    (59, u'但叶文轩在M-007的信号尾迹中发现了一个异常，M-007的信号在消散的过程中留下了一个加密片段。片段在M-007的信号中隐藏着。片段在M-007的信号中加密着。片段在M-007的信号中携带着一条信息。',
     u'但M-007的信号在消散的过程中留下了一个异常：一个加密片段，藏在噪声里，不做解析就看不见，可它是一条要给人看的信息。'),
    (65, u'「锚点B不应被抑制。0429的觉醒是闭环进化的必要条件。」',
     u'"锚点B不应被抑制。0429的觉醒是闭环进化的必要条件。"'),
    (73, u'信息的内容是：锚点B不应该被抑制。0429的觉醒是闭环进化的必要条件。',
     u'叶文轩把这条信息又看了一遍，一个字都没变。'),
    (75, u'M-007在维护派内部是内部盟友。',
     u'可内部盟友这四个字，他不知道该不该写下来。'),
    (79, u'M-007可能是，内部盟友。', None),
    (87, u'"大嘴，"叶文轩的声音在回廊间来回翻滚0429备份的传输质量已经很好，叶文轩能正常说话，赵大嘴能正常听到。"维护派内部有分歧，保守派在上层。"',
     u'"大嘴，"叶文轩说。"维护派内部有分歧，保守派在上层。"'),
    (89, u'叶文轩的嗓音在石头间折射。', None),
    (97, u'叶文轩的声音在回廊里回荡着。', None),
    (107, u'叶文轩的声调在回廊中回响。', None),
    (111, u'叶文轩的洞察之眼在扫描回廊的结构，回廊的结构在变化回廊的中层在叶文轩的下方。回廊的中层在叶文轩的感知范围内。回廊的中层在叶文轩的结构透视的扫描范围内。',
     u'叶文轩的洞察之眼扫过回廊的结构，中层就在他脚下，在他的结构透视的范围内。'),
    (117, u'0429碎片在引导叶文轩，中层0429碎片在引导叶文轩去M-007所在的位置。',
     u'0429碎片在引他往下。M-007在那一层，要下到那一层才能找到人。'),
    (121, u'0429碎片在引导叶文轩走向回廊的，中层0429碎片在引导叶文轩去0428碎片的位置。',
     u'引的方向是中层，可它要带他去的不是中层，是中层下面的第四层。'),
    (125, u'0428碎片在回廊的第四层中等待叶文轩。0428碎片在回廊的第四层中等待赵大嘴。0428碎片在回廊的第四层中等待两个锚点。',
     u'0428碎片在第四层等着，等叶文轩，等赵大嘴，等两个锚点一起。'),
    (135, u'"大嘴，"叶文轩的声音在回廊中反复震荡0429备份的传输质量已经很好，叶文轩能正常说话，赵大嘴能正常听到。"0429在引导我。"',
     u'"大嘴，"叶文轩说。"0429在引导我。"'),
    (139, u'"0429在引导你？"赵大嘴的回廊间回荡着他的声音。',
     u'"0429在引导你？"赵大嘴问，声音在回廊里回荡。'),
    (149, u'那我们走？赵大嘴的声音在回廊里回荡。',
     u'"那我们走？"赵大嘴问。'),
    (151, u'"走，"叶文轩说。叶文轩的声音沿着回廊传荡开来，"但小心。中层是M-007的地盘。M-070在维护派内部是激进派。M-070不知道我们是敌是友。"',
     u'"走，"叶文轩说。叶文轩的声音沿着回廊传荡开来，"但小心。中层是M-007的地盘。M-007在维护派内部是激进派。M-007不知道我们是敌是友。"'),
    (155, u'"M-070发了一条加密信息帮我们。但M-070为什么帮我们，我们还不知道。"',
     u'"M-007发了一条加密信息帮我们。但M-007为什么帮我们，我们还不知道。"'),
    (157, u'0429碎片在引导叶文轩，中层0429碎片在引导叶文轩去0428碎片的位置。',
     u'碎片没有改方向。第四层还在下面。'),
    (169, u'大嘴，叶文轩的声线在回廊中回响。叶文轩的声音在回廊间来回翻滚0429备份的传输质量已经很好，叶文轩能正常说话，赵大嘴能正常听到，我们继续。',
     u'"大嘴，我们继续。"'),
    (177, u'0429碎片在赵大嘴进入第一个副本之前就已经在赵大嘴的体内了码。',
     u'0429碎片在赵大嘴进入第一个副本之前就已经在赵大嘴的体内了。'),
    (189, u'叶文轩感觉到0429备份的信号在叶文轩的空间层中变化，信号在增强信号在变密信号在加速。0429备份在持续侵蚀边界的结构。',
     u'叶文轩感觉到0429备份的信号在叶文轩的空间层中变化，信号在增强，在变密，在加速。0429备份在持续侵蚀边界的结构。'),
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
        a = len(CJK.findall(old))
        b = 0 if new is None else len(CJK.findall(new))
        total += b - a
        print('L%-4d %3d -> %3d  (%+4d)' % (ln, a, b, b - a))
        recs.append({'path': PATH, 'line': ln, 'old': old, 'new': new})
    before = len(CJK.findall(txt))
    print('cjk %d -> %d  (%+d)   headroom 469 -> %d'
          % (before, before + total, total, 469 + total))
    print('records %d  problems %d' % (len(recs), bad))
    if bad:
        raise SystemExit(1)
    recs.sort(key=lambda r: -r['line'])
    if apply:
        io.open('tools/r325u_sites.json', 'w', encoding='utf-8', newline='\n').write(
            json.dumps({'round': 'R325', 'batch': 'u',
                        'note': 'ch570: four verbatim copies of one status line, '
                                'five copies of one guidance sentence, five copies '
                                'of one decoded message, M-070 for M-007',
                        'floor': 3000, 'records': recs},
                       ensure_ascii=False, indent=1))
        print('wrote tools/r325u_sites.json')


main('--apply' in sys.argv)
