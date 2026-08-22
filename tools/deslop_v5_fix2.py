# -*- coding: utf-8 -*-
"""Post-deslop cleanup pass 2 for V5.
Fixes remaining issues after deslop.py + deslop_v5_fix.py:
1. 。X。Y where X is 1-4 chars and Y continues → ，X,，Y  (or just ，X。Y if Y ends sentence)
   Actually simpler: 。 + short segment + 。 → ， + segment
2. 。digits → digits (remove orphaned period before numbers)
3. Stray unmatched opening quotes "X → X
4. Missing 。 at end of lines
"""
import re, sys, glob


def fix_orphaned_before_short(text):
    """。 + 1-5 CJK chars + 。 → ， + chars
    e.g. '光体在。解释载体的。机制' → '光体在，解释载体的。机制'
         '我爸在。2045年。预见' → '我爸在，2045年，预见'
    """
    # 。 + 1-5 CJK + 。  →  ， + CJK
    text = re.sub(r'。([一-鿿]{1,5})。', r'，\1', text)
    # 。 + 1-5 CJK + ， → ， + CJK
    text = re.sub(r'。([一-鿿]{1,5})，', r'，\1', text)
    # 。 + 1-3 CJK at end of line → keep as is (likely real end of sentence)
    # 。 + 1-3 CJK at start of line → remove 。
    text = re.sub(r'^。([一-鿿]{1,4})', r'\1', text, flags=re.MULTILINE)
    return text


def fix_orphaned_before_digits(text):
    """。 + digits → remove 。"""
    text = re.sub(r'。(\d)', r'\1', text)
    return text


def fix_stray_quotes(text):
    """Remove unmatched opening quotes that aren't paired.
    Look for " at the start of a non-line-start position where the next few chars
    don't form a quoted pair ending before the next 。 or end of line.
    """
    # Simple approach: find " followed by short content then 。 but no closing "
    # e.g. 承载"记忆。但执行 → 承载记忆。但执行
    text = re.sub(r'"([一-鿿]{1,6})(?=[。！？，])', r'\1', text)
    # Remove trailing stray "
    text = re.sub(r'"([。！？，])', r'\1', text)
    # Remove leading stray " at start of line
    text = re.sub(r'^\s*"([一-鿿])', r'\1', text, flags=re.MULTILINE)
    return text


def add_missing_period(text):
    """Add 。 at end of lines that don't end with punctuation.
    Only for non-empty lines that aren't headers or special markers.
    """
    lines = text.split('\n')
    result = []
    for line in lines:
        stripped = line.rstrip()
        if not stripped:
            result.append(line)
            continue
        # Skip headers
        if stripped.startswith('# '):
            result.append(line)
            continue
        # Skip end markers
        if stripped.endswith('）'):
            result.append(line)
            continue
        # If line ends with a CJK char (not punctuation), add 。
        if re.search(r'[一-鿿0-9]$', stripped):
            result.append(stripped + '。')
        else:
            result.append(line)
    return '\n'.join(result)


def process(text):
    text = fix_orphaned_before_short(text)
    text = fix_orphaned_before_digits(text)
    text = fix_stray_quotes(text)
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