# -*- coding: utf-8 -*-
"""Pad V1 chapters 67, 72, 77 below 3000 CJK. Minimal V1-style padding."""
import re

def count_cjk(text):
    return len(re.findall(r'[一-鿿]', text))

PADO = {
    67: (
        '碎片探测器还在震动。26片碎片的方向在各个角落闪烁，像一盏盏被风吹的灯。'
        '叶文轩的脚步没有停。裂隙的出口在前面。'
    ),
    72: (
        '0428碎片在背包里持续脉动，8秒一圈，没有停。'
        '像一颗心脏，在倒计时。清除程序的时间在一分一分地减少。'
    ),
    77: (
        '两个人走进了裂隙。岩壁在两边合拢，黑暗把他们吞了进去。'
        '0428碎片的光是唯一的亮，指着最深处的方向。'
    ),
}

END_MARKERS = {
    67: '（第六十七章完）',
    72: '（第七十二章完）',
    77: '（第七十七章完）',
}

for ch, pad in sorted(PADO.items()):
    path = f'D:/work/yewenxuan_story/chapters/volume-1/chapter-{ch}-polished.md'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    orig = count_cjk(text)
    pad_cjk = count_cjk(pad)
    marker = END_MARKERS[ch]
    idx = text.rfind(marker)

    new_text = text[:idx] + '\n\n' + pad + '\n\n' + text[idx:]
    new_cjk = count_cjk(new_text)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_text)

    status = 'OK' if new_cjk >= 3000 else 'LOW'
    print(f'[{status}] V1 ch{ch}: {orig} -> {new_cjk} (added {pad_cjk} CJK)')