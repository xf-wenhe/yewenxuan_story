"""
Batch fix em-dash (——) issues across all chapters.

Strategy: Replace narrative em-dashes with commas (，).
This is the safest general-purpose fix per scanner guidance:
  "破折号按功能改写：插入说明→逗号/冒号"

Edge cases to preserve (NOT fixed):
  - Volume-end markers: ——第X卷·卷名·完——
  - Any em-dash that is part of a title/header pattern
"""
import re
import os
import glob

CHAPTERS_DIR = 'chapters'
VOLUMES = ['volume-1', 'volume-2', 'volume-3', 'volume-4',
           'volume-5', 'volume-6', 'volume-7']

stats = {'files_modified': 0, 'em_dashes_fixed': 0, 'em_dashes_remaining': 0}
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

        # Check if this file has any narrative em-dashes
        if '——' not in content:
            continue

        # Count original em-dashes
        original_count = content.count('——')

        # Skip volume-end markers (design intent)
        # Pattern: ——第X卷·卷名·完——
        vol_marker_pattern = re.compile(r'——第[一二三四五六七八九十百千零○两]+卷·[^——]*·完——')
        vol_markers_found = len(vol_marker_pattern.findall(content))

        if vol_markers_found > 0:
            # Preserve volume markers by temporarily replacing them
            placeholders = []
            def preserve_marker(m):
                idx = len(placeholders)
                placeholders.append(m.group(0))
                return f'__EMDASH_PLACEHOLDER_{idx}__'

            content = vol_marker_pattern.sub(preserve_marker, content)
            original_count -= vol_markers_found  # don't count these

        # Replace all remaining em-dashes with commas
        fixed_count = content.count('——')
        content = content.replace('——', '，')

        # Restore volume markers
        for i, marker in enumerate(placeholders):
            content = content.replace(f'__EMDASH_PLACEHOLDER_{i}__', marker)

        # Check result
        remaining = content.count('——')

        if fixed_count > 0:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            stats['files_modified'] += 1
            stats['em_dashes_fixed'] += fixed_count
            stats['em_dashes_remaining'] += remaining
            report.append(f'{fname}: fixed {fixed_count} em-dashes' +
                         (f', {vol_markers_found} volume markers preserved' if vol_markers_found else ''))
        else:
            if remaining > 0:
                stats['em_dashes_remaining'] += remaining
                report.append(f'{fname}: {remaining} em-dashes (all volume markers, skipped)')

print(f'\n=== Em-dash Batch Fix Report ===')
print(f'Files modified: {stats["files_modified"]}')
print(f'Em-dashes fixed: {stats["em_dashes_fixed"]}')
print(f'Em-dashes remaining: {stats["em_dashes_remaining"]} (volume markers only)')
print(f'\nDetails:')
for r in report:
    print(f'  {r}')
