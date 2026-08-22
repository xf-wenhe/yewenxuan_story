# -*- coding: utf-8 -*-
"""Post-deslop cleanup for V5:
1. Remove orphaned 。 that precede a short word and aren't end-of-sentence
   Pattern: 。X。 → ，X  (period before a short segment that continues)
2. Strip remaining quotes around short phrases that deslop.py missed
   (those with inner punctuation or >4 chars but still short)
3. Collapse double punctuation
4. Fix 。X (period followed by single short word not at line end)
"""
import re, sys, glob

# Quotes around 5-8 char phrases without inner punctuation
def strip_longer_quotes(text):
    # Chinese quotes around 2-8 char words/phrases
    text = re.sub(r'"([^"。！？…，；：、]{2,8})"', r'\1', text)
    text = re.sub(r'「([^「」。！？…，；：、]{2,8})」', r'\1', text)
    return text


def fix_orphaned_periods(text):
    """Fix 。X。 patterns where X is short and the sentence continues.
    These are from 。"X" patterns where the quote was stripped.

    Strategy: find 。 followed by a short word (< 8 chars) followed by more content
    (not end of line / not end of sentence), replace the 。 before with ，
    """
    # Pattern: 。 + short word (1-7 chars) + punctuation other than 。
    # e.g. 。存活。 → ，存活
    # e.g. 。一下。两下 → ，一下
    changed = True
    iterations = 0
    while changed and iterations < 20:
        changed = False
        iterations += 1
        # 。 + 1-7 non-punctuation chars + (，or 。at end of sentence followed by more text)
        # Fix: 。X， → ，X
        new_text = re.sub(
            r'。([一-鿿0-9]{1,7})(?=[，、；])',
            r'，\1',
            text
        )
        if new_text != text:
            text = new_text
            changed = True
        # 。X followed by more text (no punctuation) at end of line
        new_text = re.sub(
            r'。([一-鿿]{1,4})\n',
            r'\1\n',
            text
        )
        if new_text != text:
            text = new_text
            changed = True
        # 。X where X is 1-3 chars and followed by 。 (end of real sentence)
        # e.g. 。跳。 → 跳
        new_text = re.sub(
            r'。([一-鿿]{1,3})。',
            r'\1',
            text
        )
        if new_text != text:
            text = new_text
            changed = True

    return text


def fix_double_punctuation(text):
    """Collapse 。。 → 。 and 。， → 。 etc"""
    text = re.sub(r'。。+', '。', text)
    text = re.sub(r'，，+', '，', text)
    return text


def process(text):
    text = strip_longer_quotes(text)
    text = fix_orphaned_periods(text)
    text = fix_double_punctuation(text)
    return text


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Single file mode
        f = sys.argv[1]
        t = open(f, encoding='utf-8').read()
        out = process(t)
        cb = len(re.findall(r'[一-鿿]', t))
        ca = len(re.findall(r'[一-鿿]', out))
        open(f, 'w', encoding='utf-8').write(out)
        print(f'{f} CJK {cb} -> {ca}')
    else:
        # Batch mode: all V5 chapters
        files = sorted(
            glob.glob('chapters/volume-5/chapter-[567]*-polished.md'),
            key=lambda f: int(re.search(r'chapter-(\d+)', f).group(1))
        )
        print(f'Processing {len(files)} V5 chapters...')
        for f in files:
            t = open(f, encoding='utf-8').read()
            out = process(t)
            if out != t:
                cb = len(re.findall(r'[一-鿿]', t))
                ca = len(re.findall(r'[一-鿿]', out))
                open(f, 'w', encoding='utf-8').write(out)
                print(f'{f} CJK {cb} -> {ca}')
        print('Done.')