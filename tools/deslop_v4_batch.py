# -*- coding: utf-8 -*-
"""Batch deslop pipeline for V4 chapters.
V4 profile: mostly legitimate dialogue quotes (~4400 total, ~3564 real, ~836 AI-emphasis),
metaphor markers (像是 1068, 好像 22), parallelism (68), 似的/般地 (5).
Steps: deslop.py → post-fixes (orphaned periods, stray quotes, missing periods)
"""
import re, glob, subprocess, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(BASE, '..'))
os.chdir(ROOT)

def count_cjk(text):
    return len(re.findall(r'[一-鿿]', text))

files = sorted(
    glob.glob('chapters/volume-4/chapter-[45][0-9]*-polished.md'),
    key=lambda f: int(re.search(r'chapter-(\d+)', f).group(1))
)

print(f'Processing {len(files)} V4 chapters...')
results = []
errors = []

for f in files:
    n = int(re.search(r'chapter-(\d+)', f).group(1))
    t = open(f, encoding='utf-8').read()
    cjk_before = count_cjk(t)

    # Step 1: deslop.py
    try:
        subprocess.run(['python', 'tools/deslop.py', f], capture_output=True, timeout=30)
    except Exception as e:
        errors.append((n, str(e)))
    t = open(f, encoding='utf-8').read()

    # Step 2: Strip longer quotes (2-6 chars, no inner punctuation) that survived deslop
    t = re.sub(r'"([^"。！？…，；：、]{2,6})"', r'\1', t)

    # Orphaned period fixes
    t = re.sub(r'。([一-鿿]{1,5})。', r'，\1', t)
    t = re.sub(r'。([一-鿿]{1,5})，', r'，\1', t)
    t = re.sub(r'。(\d{1,6})。', r'，\1', t)
    t = re.sub(r'。(\d{1,6})，', r'，\1', t)
    t = re.sub(r'^。([一-鿿]{1,4})', r'\1', t, flags=re.MULTILINE)

    # Orphaned period before digit
    t = re.sub(r'。(\d)', r'\1', t)

    # Second pass for remaining orphaned periods
    t = re.sub(r'。([一-鿿]{1,5})。', r'，\1', t)
    t = re.sub(r'。([一-鿿]{1,5})，', r'，\1', t)

    # Fix run-on segments: 。CJK。 → ，CJK。
    t = re.sub(r'。([一-鿿]{2,6})。', r'，\1。', t)

    # Fix stray quotes (opening quote before punctuation)
    t = re.sub(r'"([。！？，])', r'\1', t)

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

# Report
changes = [(n, b, a) for n, b, a in results if b != a]
print(f'\nChapters with CJK changes: {len(changes)}')
for n, b, a in changes[:30]:
    print(f'  ch{n}: {b} -> {a} ({b-a:+d})')
if len(changes) > 30:
    print(f'  ... and {len(changes)-30} more')

below_3000 = [(n, a) for n, b, a in results if a < 3000]
if below_3000:
    print(f'\n⚠️ Below 3000 CJK ({len(below_3000)}):')
    for n, a in below_3000:
        print(f'  ch{n}: {a} CJK')
else:
    print(f'\n✅ All chapters >= 3000 CJK')

if errors:
    print(f'\n❌ Errors: {errors}')

print(f'\nDone. {len(files)} chapters processed.')