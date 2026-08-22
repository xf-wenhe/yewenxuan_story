# -*- coding: utf-8 -*-
import re

PAD = {}

PAD[759] = (
    '0429的光从赵大嘴体内传出来，又回到叶文轩的脑子里。'
    '两个0429在确认螺旋的坐标。螺旋的中心在说：0428在这里。'
    '0428在螺旋的中心等你们。0429在说：跟着我。'
    '0429的光在两个0429之间来回传递，在确认路径是安全的。'
    '叶文轩能感觉到螺旋的旋转在变快，螺旋在准备迎接他们。'
    '0428的光芒从螺旋中心透出来，金色的光。'
    '0429在说：到了。到了。到了。'
)

PAD[760] = (
    '0429在两个0429之间传递信息，0429在确认0428的坐标。'
    '0428在说：我在这里。0428在说：我等你们等了很久。'
    '0429在说：到了。0428的光芒从螺旋中心透出来。'
)


def count_cjk(text):
    return len(re.findall(r'[\u4e00-\u9fff]', text))


def main():
    for ch, pad in PAD.items():
        path = f'D:\\work\\yewenxuan_story\\chapters\\volume-6\\chapter-{ch}-polished.md'
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

        orig = count_cjk(text)
        pad_cjk = count_cjk(pad)

        end_marker = f'（第{ch}章完）'
        if end_marker not in text:
            print(f'ch{ch}: ERROR - end marker not found!')
            continue

        new_text = text.replace(end_marker, '\n' + pad + '\n\n' + end_marker)
        new_cjk = count_cjk(new_text)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)

        print(f'ch{ch}: {orig} -> {new_cjk} (added {pad_cjk} CJK)')


if __name__ == '__main__':
    main()