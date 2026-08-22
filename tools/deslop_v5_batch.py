# -*- coding: utf-8 -*-
"""Batch deslop pipeline for V5 chapters.
Steps: deslop.py (strip quotes/metaphors) → fix1 (orphaned periods) → fix2 (remaining orphans) → fix3 (final cleanup)
"""
import re, glob, subprocess, sys

def count_cjk(text):
    return len(re.findall(r'[一-鿿]', text))

files = sorted(
    glob.glob('chapters/volume-5/chapter-[567]*-polished.md'),
    key=lambda f: int(re.search(r'chapter-(\d+)', f).group(1))
)

print(f'Processing {len(files)} V5 chapters...')
results = []

for f in files:
    n = int(re.search(r'chapter-(\d+)', f).group(1))
    t = open(f, encoding='utf-8').read()
    cjk_before = count_cjk(t)

    # Step 1: deslop.py
    subprocess.run(['python', 'tools/deslop.py', f], capture_output=True)
    t = open(f, encoding='utf-8').read()

    # Step 2-4: post-fixes
    t = re.sub(r'([\""])', r'\1', t)  # keep for now, will be stripped below

    # Strip longer quotes (2-8 chars)
    t = re.sub(r'"([^"。！？…，；：、]{2,8})"', r'\1', t)
    t = re.sub(r'「([^「」。！？…，；：、]{2,8})」', r'\1', t)

    # Orphaned period fixes (pass 2)
    t = re.sub(r'。([一-鿿]{1,5})。', r'，\1', t)
    t = re.sub(r'。([一-鿿]{1,5})，', r'，\1', t)
    t = re.sub(r'。([一-鿿]{1,3})$', r'\1', t, flags=re.MULTILINE)
    t = re.sub(r'。(\d)', r'\1', t)

    # Orphaned period fixes (pass 3)
    t = re.sub(r'。([一-鿿]{1,5})。', r'，\1', t)
    t = re.sub(r'。([一-鿿]{1,5})，', r'，\1', t)
    t = re.sub(r'。(\d{1,6})。', r'，\1', t)
    t = re.sub(r'。(\d{1,6})，', r'，\1', t)
    t = re.sub(r'^。([一-鿿]{1,4})', r'\1', t, flags=re.MULTILINE)

    # Remove ALL remaining straight double quotes
    t = t.replace('"', '')

    # Fix run-on segments
    t = re.sub(r'。([一-鿿]{2,6})。', r'，\1。', t)

    # Add missing period at end of lines
    lines = t.split('\n')
    out_lines = []
    for line in lines:
        stripped = line.rstrip()
        if not stripped:
            out_lines.append(line)
        elif stripped.startswith('# '):
            out_lines.append(line)
        elif stripped.endswith('）'):
            out_lines.append(line)
        elif re.search(r'[一-鿿0-9]$', stripped):
            out_lines.append(stripped + '。')
        else:
            out_lines.append(line)
    t = '\n'.join(out_lines)

    cjk_after = count_cjk(t)
    open(f, 'w', encoding='utf-8').write(t)
    results.append((n, cjk_before, cjk_after))

print(f'\nResults:')
for n, b, a in results:
    if b != a:
        print(f'  ch{n}: CJK {b} -> {a}')

below_3000 = [(n, a) for n, b, a in results if a < 3000]
if below_3000:
    print(f'\n⚠️ Below 3000 CJK: {below_3000}')
else:
    print(f'\n✅ All chapters >= 3000 CJK')

print(f'\nDone. {len(files)} chapters processed.')