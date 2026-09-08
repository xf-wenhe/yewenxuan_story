#!/usr/bin/env python3
# tools/compare_outline_titles.py — one-off scope-verification diagnostic
import re, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

actual = {}
for n in range(619, 721):
    p = os.path.join(base, "chapters", "volume-5", f"chapter-{n}-polished.md")
    with open(p, encoding='utf-8') as f:
        first = f.readline().strip()
    m = re.search(r'：(.+)$', first)
    actual[n] = m.group(1) if m else first

outline = {}
olpath = os.path.join(base, "chapters", "volume-5", "outline-volume-5.md")
with open(olpath, encoding='utf-8') as f:
    txt = f.read()

for m in re.finditer(r'###\s*Ch\.(\d+)：(.+)', txt):
    n = int(m.group(1))
    if 619 <= n <= 720:
        outline[n] = m.group(2)

for m in re.finditer(r'###\s*Ch\.(\d+)-(\d+)：(.+)', txt):
    a, b, t = int(m.group(1)), int(m.group(2)), m.group(3)
    for n in range(a, b + 1):
        if 619 <= n <= 720:
            outline.setdefault(n, f"{t} (range {a}-{b})")

matched = 0
mismatched = []
for n in range(619, 721):
    o = outline.get(n, "(no outline entry)")
    a = actual.get(n, "(missing file)")
    if o == a:
        matched += 1
    else:
        mismatched.append((n, o, a))

print(f"Total ch619-720: {720 - 619 + 1}")
print(f"Matched: {matched}")
print(f"Mismatched: {len(mismatched)}")
print(f"\n{'Ch':>4}  {'Outline':<36} {'Actual':<36}")
print("-" * 80)
for n, o, a in mismatched:
    print(f"{n:>4}  {o:<36} {a:<36}")
