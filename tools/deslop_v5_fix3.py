# -*- coding: utf-8 -*-
"""Post-deslop cleanup pass 3 for V5.
1. Strip ALL remaining straight double quotes " (they're all orphaned emphasis marks)
2. Fix 。X。 patterns missed by pass 2 (with digits)
3. Fix 。X,。 patterns → ，X
4. Fix 缓冲区在。朵朵 → 缓冲区在，朵朵
5. Add 。 at end of lines missing it
6. Fix run-on: CJK followed immediately by lowercase or specific patterns
"""
import re, sys, glob


def strip_all_quotes(text):
    """Remove all remaining straight double quotes."""
    text = text.replace('"', '')
    return text


def fix_orphaned_period_before_cjk(text):
    """。 + 1-5 CJK chars + 。 → ， + chars
    Also handle: 。 + chars + ， → ， + chars
    And: 。 + 1-3 CJK at end of line → keep 。
    """
    # 。 + 1-5 CJK + 。 → ， + CJK
    text = re.sub(r'。([一-鿿]{1,5})。', r'，\1', text)
    # 。 + 1-5 CJK + ， → ， + CJK
    text = re.sub(r'。([一-鿿]{1,5})，', r'，\1', text)
    # 。 + digits + 。 → ， + digits
    text = re.sub(r'。(\d{1,6})。', r'，\1', text)
    # 。 + digits + ， → ， + digits
    text = re.sub(r'。(\d{1,6})，', r'，\1', text)
    return text


def fix_orphaned_period_before_digit(text):
    text = re.sub(r'。(\d)', r'\1', text)
    return text


def fix_period_before_comma_segment(text):
    """Fix patterns like '缓冲区在。朵朵的意识深处。缓冲区一个过滤网' → '缓冲区在，朵朵的意识深处，缓冲区一个过滤网'"""
    # 。 + short segment + 。 + short segment → ， + segment + ， + segment
    changed = True
    while changed:
        changed = False
        new_text = re.sub(r'。([一-鿿]{2,6})。([一-鿿]{1,6})', r'，\1。\2', text)
        if new_text != text:
            text = new_text
            changed = True
    return text


def add_missing_period(text):
    """Add 。 at end of lines that end with CJK or digit but no punctuation."""
    lines = text.split('\n')
    result = []
    for line in lines:
        stripped = line.rstrip()
        if not stripped:
            result.append(line)
            continue
        if stripped.startswith('# '):
            result.append(line)
            continue
        if stripped.endswith('）'):
            result.append(line)
            continue
        if re.search(r'[一-鿿0-9]$', stripped):
            result.append(stripped + '。')
        else:
            result.append(line)
    return '\n'.join(result)


def process(text):
    text = strip_all_quotes(text)
    text = fix_orphaned_period_before_cjk(text)
    text = fix_orphaned_period_before_digit(text)
    text = fix_period_before_comma_segment(text)
    text = add_missing_period(text)
    return text


if __name__ == '__main__':
    if len(sys.argv) > 1:
        f = sys.argv[1]
        t = open(f, encoding='utf-8').read()
        out = process(t)
        cb = len(re.findall(r'[一-鿿]', t))
        ca = len(re.findall(r'[一-鿿]', out))
        open(f, 'w', encoding='utf-8').write(out)
        print(f'{f} CJK {cb} -> {ca}')
    else:
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