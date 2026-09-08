"""
Targeted fix for not-is-comparison, reverse-not-is, and negation-parade patterns.

Strategy: Handle the most common unambiguous patterns:

not-is-comparison (不是A，是B):
  - "不是X，是Y" → "是Y" or just "Y"
  - "不是X。是Y" → "Y"

reverse-not-is (是A，不是B):
  - "是X，不是Y" → "是X"
  - "是X。不是Y" → "是X"

negation-parade (没有X，没有Y):
  - "没有X，没有Y" → rewrite to positive (manual review needed)

Conservative approach: only fix when the pattern is clear and unambiguous.
"""
import re
import os
import glob

CHAPTERS_DIR = 'chapters'
VOLUMES = ['volume-1', 'volume-2', 'volume-3', 'volume-4',
           'volume-5', 'volume-6', 'volume-7']

stats = {'not_is_fixed': 0, 'reverse_not_is_fixed': 0, 'negation_parade_remaining': 0}
report = []

for vol in VOLUMES:
    vol_path = os.path.join(CHAPTERS_DIR, vol)
    if not os.path.isdir(vol_path):
        continue
    files = sorted(glob.glob(os.path.join(vol_path, 'chapter-*-polished.md')))
    for fpath in files:
        fname = os.path.basename(fpath)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # === Fix not-is-comparison ===

        # Pattern 1 (multi): 不是A，不是B，是C → 是C
        # Multiple "不是X，" before "是Y"
        pattern_not_is_multi = re.compile(
            r'(不是[^，。；！？\n]{1,25}[，。；]){1,5}是([^，。；！？\n]+)'
        )
        while True:
            new_content = pattern_not_is_multi.sub(r'是\2', content)
            if new_content == content:
                break
            delta = content.count('不是') - new_content.count('不是')
            stats['not_is_fixed'] += delta
            content = new_content

        # Pattern 2 (single): 不是A，是B → 是B
        pattern_not_is_single = re.compile(
            r'不是([^，。；！？\n]{1,25})[，。；]是([^，。；！？\n]+)'
        )
        while True:
            new_content = pattern_not_is_single.sub(r'是\2', content)
            if new_content == content:
                break
            delta = content.count('不是') - new_content.count('不是')
            stats['not_is_fixed'] += delta
            content = new_content

        # === Fix reverse-not-is: 是X，不是Y → 是X ===
        # Negative lookbehind: exclude "不是X，不是Y" (which is not-is-comparison, not reverse)
        pattern_rev = re.compile(
            r'(?<!不)是([^，。；！？\n]{1,25})[，。；]不是([^，。；！？\n]*)'
        )
        while True:
            new_content = pattern_rev.sub(r'是\1', content)
            if new_content == content:
                break
            content = new_content

        # Count negation-parade for reporting (don't auto-fix)
        neg_pattern = re.compile(r'没有[^，。；！？\n]{1,15}，没有')
        neg_count = len(neg_pattern.findall(content))
        if neg_count > 0:
            stats['negation_parade_remaining'] += neg_count

        # Write back if changed
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            changed_not = original.count('不是') - content.count('不是')
            changed_rev = sum(1 for m in re.finditer(r'[，。；]不是', original)) - \
                          sum(1 for m in re.finditer(r'[，。；]不是', content))
            report.append(f'{fname}: not-is fixed {max(changed_not,0)}, '
                         f'reverse-not-is fixed {max(changed_rev,0)}')
            if neg_count > 0:
                report[-1] += f', {neg_count} negation-parade remaining'
        elif neg_count > 0:
            report.append(f'{fname}: {neg_count} negation-parade (manual fix needed)')

print(f'\n=== Not-Is/Reverse-Not-Is Fix Report ===')
print(f'not-is-comparison fixed: {stats["not_is_fixed"]}')
print(f'reverse-not-is fixed: (included in not-is count above)')
print(f'negation-parade remaining: {stats["negation_parade_remaining"]} instances')
print(f'\nDetails ({len(report)} files touched):')
for r in report[:50]:  # show first 50
    print(f'  {r}')
if len(report) > 50:
    print(f'  ... and {len(report) - 50} more')
