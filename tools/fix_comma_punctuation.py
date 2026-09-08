#!/usr/bin/env python3
# tools/fix_comma_punctuation.py
# Fix three always-defect broken-comma patterns across chapter prose:
#   1. "，。" -> "。"  (spurious comma inserted BEFORE an existing period)
#   2. "。，" -> "。"  (spurious comma inserted AFTER an existing period)
#   3. "但，" -> "但"  (spurious comma inserted after 但)
# All three are artifacts of the same bad comma-insertion pass that produced "很，".
# None is ever grammatical Chinese, so comma removal is always safe.
# Rule ordering: "，。" runs before "。，" so a (nonexistent) "，。，" triple
# would collapse to "。"; no "。，。" triples exist either (verified 0).
# Removing fullwidth commas does not affect CJK counts (U+FF0C is not CJK).
# Preserves file encoding exactly (binary read/write, BOM status kept).
import os, glob

# Order matters only for (nonexistent) triples; "，。" first is safest.
RULES = [
    ("，。", "。"),   # spurious comma before period
    ("。，", "。"),   # spurious comma after period  (1541 hits, 469 files)
    ("但，", "但"),   # spurious comma after 但
]

def process_file(path):
    with open(path, 'rb') as f:
        raw_bytes = f.read()
    has_bom = raw_bytes.startswith(b'\xef\xbb\xbf')
    text = raw_bytes.decode('utf-8-sig')
    counts = {}
    for old, new in RULES:
        c = 0
        while old in text:
            n = text.count(old)
            text = text.replace(old, new)
            c += n
        if c:
            counts[old] = c
    if counts:
        out_bytes = text.encode('utf-8')
        if has_bom:
            out_bytes = b'\xef\xbb\xbf' + out_bytes
        with open(path, 'wb') as f:
            f.write(out_bytes)
    return counts

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chapters_dir = os.path.join(base, 'chapters')
    files = glob.glob(os.path.join(chapters_dir, '**', '*-polished.md'), recursive=True)
    grand = {}
    touched = 0
    for path in sorted(files):
        counts = process_file(path)
        if counts:
            print(f'{os.path.relpath(path, base)}: {counts}')
            touched += 1
            for k, v in counts.items():
                grand[k] = grand.get(k, 0) + v
    print(f'\nFiles touched: {touched}')
    print(f'Total: {grand}')
