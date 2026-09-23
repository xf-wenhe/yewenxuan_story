# -*- coding: utf-8 -*-
"""R243: repair the de-AI round's (d3f2cf96) fragment-assembly damage in ch751 and ch752.

Background
----------
Commit d3f2cf96 ("V6 de-AI blocking patterns cleared", 165 files) rewrote V6 chapters with
replacements assembled from mismatched fragments. Two of its own first chapters, 751 and 752,
took the worst of it: lip-read utterances were replaced by fragments copied out of neighbouring
lines, one line was truncated mid-sentence, a stray fragment was inserted as its own paragraph,
and the `A. 接受`-style door labels lost their ASCII space and gained a stray character in its
place.

Method
------
Each edit names a run of consecutive whole lines by its exact current text and gives the run it
should become, so edits are content-keyed: order-independent, re-runnable, and fail-closed (a
region that matches neither the old nor the new text aborts the whole run instead of editing).
Matching tolerates any mix of CRLF and LF, and the new text reuses the separators captured from
the matched region, so every other byte of every file survives untouched; the original BOM state
is restored on write. Re-running after a successful apply reports each edit as `already`.

Repairs
-------
chapter-751
  L15  `**A.门接受**` / `**B.门重构**`  ->  `**A.接受**` / `**B.重构**`
  L17  `**C.门解放**`                   ->  `**C.解放**`
  L20  truncated system broadcast         ->  tail `做出最终选择。」` restored
  L36  `一次，叶文轩画面暗了下去。`        ->  `「不要选A。」画面暗了下去。`
  L52  `一句话。叶文轩银色的门关闭了。`    ->  `「我不后悔。」银色的门关闭了。`
  L57  `叶文轩望向那人的方向。`            ->  `叶文轩看着他。`   (vague referent)
  L63  `"C.。解放"`                       ->  `C.解放`
  L101 `赵大嘴什么也没说"那我们怎么办？"`  ->  `赵大嘴沉默了一会儿"那我们怎么办？"`
chapter-752
  L41..45  `轩。` / `未来` / `画面中的未来叶文轩的眼光移去向了…`
              -> `「你来了。」` and `…的视线移向了…` (stray paragraph dropped)
  L47  `把注视定格回了控制台上`            ->  `把视线移回了控制台上。`
  L68  `的副本被`                         ->  `「选B。」`
  L87  `赵大嘴没有回应"那你选吗？"`        ->  `赵大嘴沉默了两秒"那你选吗？"`
  L95  `赵大嘴是失去了部分自我。`          ->  `赵大嘴失去了部分自我。`
  L133 `"那我们，"`                       ->  `"那我们——"`
  L156 `C.2解放`                          ->  `C.解放`
  L158 `"0解放，`                         ->  `"解放，`

Left alone on purpose
---------------------
The same round's `沉默了一下` / `沉默了两秒` -> `沉默了` simplifications, its `——` -> `，` pass, its
quote stripping and its synonym swaps (目光->视线, 愣->怔, 点头->抬了抬下巴) are grammatical and
were deliberate; they are not repaired. The em-dash pass is not a corpus rule in any case (V6
still holds 1744 `——` pairs, V5 1367, V7 4).

Detectors run (worklist for the rounds that follow)
---------------------------------------------------
All three were run corpus-wide and are too noisy to apply mechanically; where they did land, the
hits are recorded here so later rounds do not have to rediscover them.
  * mosaic / stray-line scan: legitimate adjacent-line repetition swamps the signal.
  * gutted-term hole scan: V6 13 holes in 12 files against a V1-V5 control of 23 in 750 files.
    Eight of the 13 are the deliberate `沉默了一下` -> `沉默了` simplification (grammatical, left
    as-is), two are already-correct text, and four are real, for a later round:
      chapter-772  `隐藏层的。"钥匙"。`    (add-time `隐藏层的"钥匙"，`)
      chapter-774  `备份的。"存在"。`      (add-time `备份的"存在"，`)
      chapter-775  `的备份在。`            (add-time `的备份在坐标的位置，`)
      chapter-779  `他在打破闭环的力量在`  (add-time `他用打破闭环的力量在"传递"信息`)
      chapter-775  L117 `有一个约五秒的。` (add-time `有一个约五秒的"盲区"。`)
  * speech-negation contradiction scan: 3 V6 hits, two repaired here (ch751 L101, ch752 L87),
    the third is chapter-775 L636, which belongs with the hole list above.

Usage
-----
  python tools/fix_deai_mosaic_residue.py            # dry run: print the plan
  python tools/fix_deai_mosaic_residue.py --apply    # write
"""
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import polish_pipeline as pp  # noqa: E402  (cjk_count)

CH751 = 'chapters/volume-6/chapter-751-polished.md'
CH752 = 'chapters/volume-6/chapter-752-polished.md'

# (path, lines as they read today, lines they should become)
EDITS = [
    (CH751,
     ['每扇门上方悬浮着一个选项，金色的门上方：**A.门接受**，银色的门上方：**B.门重构**'],
     ['每扇门上方悬浮着一个选项，金色的门上方：**A.接受**，银色的门上方：**B.重构**']),
    (CH751,
     ['暗色的门上方：**C.门解放**叶文轩喉头骤然发紧。他把0429碎片放回背包，拉好拉链。'],
     ['暗色的门上方：**C.解放**叶文轩喉头骤然发紧。他把0429碎片放回背包，拉好拉链。']),
    (CH751,
     ['叶文轩没有开口。他在想刚才那个系统广播：「闭环进度：100%。请'],
     ['叶文轩没有开口。他在想刚才那个系统广播：「闭环进度：100%。请做出最终选择。」']),
    (CH751,
     ['一次，叶文轩画面暗了下去。金色的门关闭。'],
     ['「不要选A。」画面暗了下去。金色的门关闭。']),
    (CH751,
     ['一句话。叶文轩银色的门关闭了。'],
     ['「我不后悔。」银色的门关闭了。']),
    (CH751,
     ['叶文轩望向那人的方向。"你说了\'我不后悔\'。"'],
     ['叶文轩看着他。"你说了\'我不后悔\'。"']),
    (CH751,
     ['门C比另外两扇门矮一些。大约两米五。黑色的表面没有任何反光，像吸收了所有光线。'
      '门上方悬浮着"C.。解放"的字样，字体的颜色在缓慢交替，从暗红到暗紫。'],
     ['门C比另外两扇门矮一些。大约两米五。黑色的表面没有任何反光，像吸收了所有光线。'
      '门上方悬浮着C.解放的字样，字体的颜色在缓慢交替，从暗红到暗紫。']),
    (CH751,
     ['赵大嘴什么也没说"那我们怎么办？"叶文轩看向三扇门"先看完。A和B已经看过了，'
      '但只看了表面。我需要深入看。"'],
     ['赵大嘴沉默了一会儿"那我们怎么办？"叶文轩看向三扇门"先看完。A和B已经看过了，'
      '但只看了表面。我需要深入看。"']),
    (CH752,
     ['轩。', '',
      '未来', '',
      '画面中的未来叶文轩的眼光移去向了控制台的左侧。他的桌面左侧有一张照片，'
      '照片上的小女孩扎着辫子，笑得露出虎牙。'],
     ['「你来了。」', '',
      '画面中的未来叶文轩的视线移向了控制台的左侧。他的桌面左侧有一张照片，'
      '照片上的小女孩扎着辫子，笑得露出虎牙。']),
    (CH752,
     ['未来叶文轩的手伸向照片，但停在了半空中。他的手指在颤抖。他看了一眼照片，'
      '然后强迫自己把注视定格回了控制台上'],
     ['未来叶文轩的手伸向照片，但停在了半空中。他的手指在颤抖。他看了一眼照片，'
      '然后强迫自己把视线移回了控制台上。']),
    (CH752, ['的副本被'], ['「选B。」']),
    (CH752,
     ['赵大嘴没有回应"那你选吗？"'],
     ['赵大嘴沉默了两秒"那你选吗？"']),
    (CH752,
     ['B结局，重构系统，创造一个更好的世界。代价是固化。某些东西被写死了，不能再改。'
      '赵大嘴的0429碎片在B结局中被永久固化。概率扭曲能力变成了主动技能，但拖油瓶的角色设定'
      '被写入了意识底层。赵大嘴是失去了部分自我。他的自由选择被系统固化成了一个角色。'],
     ['B结局，重构系统，创造一个更好的世界。代价是固化。某些东西被写死了，不能再改。'
      '赵大嘴的0429碎片在B结局中被永久固化。概率扭曲能力变成了主动技能，但拖油瓶的角色设定'
      '被写入了意识底层。赵大嘴失去了部分自我。他的自由选择被系统固化成了一个角色。']),
    (CH752, ['"那我们，"'], ['"那我们——"']),
    (CH752,
     ['赵大嘴站起来，搓了搓手。他在大厅中来回走了两圈，然后在一扇门前停下来，暗色的门C。'
      '他抬头看门上悬浮的C.2解放。'],
     ['赵大嘴站起来，搓了搓手。他在大厅中来回走了两圈，然后在一扇门前停下来，暗色的门C。'
      '他抬头看门上悬浮的C.解放。']),
    (CH752,
     ['"0解放，"赵大嘴自言自语道。他读过这个词，在某本书上，在某张报纸上，'
      '在某个不属于这个世界的地方解放。'],
     ['"解放，"赵大嘴自言自语道。他读过这个词，在某本书上，在某张报纸上，'
      '在某个不属于这个世界的地方解放。']),
]

SPLIT = re.compile(r'(\r?\n)')


def decode(raw):
    bom = raw.startswith(b'\xef\xbb\xbf')
    return raw[3:].decode('utf-8') if bom else raw.decode('utf-8'), bom


def split_keep(text):
    """Split into [content, eol, content, eol, ..., trailing content]."""
    return SPLIT.split(text)


def find_regions(parts, lines):
    """0-based start indices where `lines` occurs as consecutive whole lines."""
    n = len(lines)
    total = len(parts) // 2 + 1
    hits = []
    for k in range(0, total - n + 1):
        if all(parts[2 * (k + i)] == lines[i] for i in range(n)):
            hits.append(k)
    return hits


def stats(text):
    lines = SPLIT.split(text)[0::2]
    return (pp.cjk_count(text), len(lines), text.count('"'),
            text.count('「'), text.count('」'))


def apply_region(parts, k, old_n, new_lines):
    """Replace whole lines k..k+old_n-1 with new_lines, reusing the region's separators."""
    seps = [parts[2 * (k + i) + 1] for i in range(old_n)]
    if new_lines:
        sep = seps[0] if seps else '\n'
        rebuilt = []
        for i, ln in enumerate(new_lines):
            rebuilt.append(ln)
            if i < len(new_lines) - 1:
                rebuilt.append(seps[i] if i < len(seps) else sep)
        # keep the separator that followed the region
        rebuilt.append(seps[-1] if seps else '')
        return parts[:2 * k] + rebuilt + parts[2 * (k + old_n):]
    return parts[:2 * k] + parts[2 * (k + old_n):]


def run(apply=False):
    by_file = {}
    for path, old_lines, new_lines in EDITS:
        by_file.setdefault(path, []).append((old_lines, new_lines))

    n_edit = n_done = 0
    for path in sorted(by_file):
        full = os.path.join(ROOT, path)
        raw = open(full, 'rb').read()
        text, bom = decode(raw)
        before = stats(text)
        parts = split_keep(text)
        print('== %s  (%s)' % (path, 'BOM' if bom else 'no BOM'))
        todo = []
        for old_lines, new_lines in by_file[path]:
            hits_old = find_regions(parts, old_lines)
            hits_new = find_regions(parts, new_lines)
            if len(hits_old) == 1:
                todo.append((hits_old[0], old_lines, new_lines, 'edit'))
            elif not hits_old and len(hits_new) == 1:
                todo.append((hits_new[0], old_lines, new_lines, 'already'))
            else:
                raise SystemExit('ABORT %s: %r -> old hits=%d new hits=%d'
                                 % (path, old_lines[0][:40], len(hits_old), len(hits_new)))
        for k, old_lines, new_lines, state in todo:
            n_edit += state == 'edit'
            n_done += state == 'already'
            print('   [%s] line %d' % (state, k + 1))
            for ln in old_lines:
                if ln:
                    print('      - %s' % ln[:96])
            for ln in new_lines:
                if ln or not old_lines:
                    print('      + %s' % ln[:96])
        for k, old_lines, new_lines, state in sorted(todo, key=lambda t: -t[0]):
            if state != 'edit':
                continue
            parts = apply_region(parts, k, len(old_lines), new_lines)
        if not any(state == 'edit' for _, _, _, state in todo):
            print('   (nothing to write)')
            continue
        out = ''.join(parts)
        after = stats(out)
        print('   cjk %d -> %d   lines %d -> %d   quotes %d->%d  「%d->%d」%d->%d'
              % (before[0], after[0], before[1], after[1],
                 before[2], after[2], before[3], after[3], before[4], after[4]))
        if apply:
            data = (b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8')
            with open(full, 'wb') as f:
                f.write(data)
            print('   wrote %d bytes (%d before)' % (len(data), len(raw)))
        else:
            print('   (dry run)')
    print('total: edits=%d already=%d  mode=%s'
          % (n_edit, n_done, 'APPLY' if apply else 'dry-run'))


if __name__ == '__main__':
    run(apply='--apply' in sys.argv)
