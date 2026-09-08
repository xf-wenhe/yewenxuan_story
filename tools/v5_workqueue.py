#!/usr/bin/env python3
# tools/v5_workqueue.py — list title-matched degenerate chapters, sorted by severity
import re, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V5 = os.path.join(base, "chapters", "volume-5")

# actual titles
actual = {}
for n in range(619, 721):
    p = os.path.join(V5, f"chapter-{n}-polished.md")
    with open(p, encoding='utf-8') as f:
        first = f.readline().strip()
    m = re.search(r'：(.+)$', first)
    actual[n] = m.group(1) if m else first

# outline titles (single + range)
outline = {}
olpath = os.path.join(V5, "outline-volume-5.md")
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
            outline.setdefault(n, t)

# degeneration count per chapter
pat = re.compile(r'(?:桥梁在说|在说|在感知|在跳动|在发光)：')
degen = {}
for n in range(619, 721):
    p = os.path.join(V5, f"chapter-{n}-polished.md")
    with open(p, encoding='utf-8') as f:
        t = f.read()
    degen[n] = len(pat.findall(t))

# Matched = exact title match (single outline entries only, not ranges)
matched_singles = []
for n in range(619, 721):
    o = outline.get(n, "")
    a = actual.get(n, "")
    # range entries have the same title for multiple chapters; treat as not-exact-match
    is_range = bool(re.search(r'range|\(range', o)) or o == ""
    if not is_range and o == a and degen[n] > 0:
        matched_singles.append(n)

matched_singles.sort(key=lambda n: -degen[n])
print("TITLE-MATCHED chapters WITH degeneration (work queue, worst first):")
print(f"{'Ch':>4}  {'Degen':>5}  Title")
print("-" * 60)
total_inst = 0
for n in matched_singles:
    print(f"{n:>4}  {degen[n]:>5}  {actual[n]}")
    total_inst += degen[n]
print(f"\nChapters to clean: {len(matched_singles)}")
print(f"Total degeneration instances: {total_inst}")

# also show matched-but-clean (degen==0) for completeness
clean = [n for n in range(619,721) if outline.get(n,"")==actual.get(n,"") and not re.search(r'range',outline.get(n,"")) and degen[n]==0]
print(f"\nMatched + clean (no work needed): {len(clean)} chapters")
