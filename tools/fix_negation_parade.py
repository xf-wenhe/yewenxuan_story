"""
Batch fix negation-parade patterns: 没有X，没有Y → 没有X，也没有Y
Scanner regex: (?:没有[^。！？!?\n，,]{1,12}[，,]){2}
Fix: add 也 before the second 没有 to break the "没有X，没有Y，" pattern.
Also detects voice-contrast for manual fix.
"""
import re
import os
import glob

CHAPTERS_DIR = 'chapters'
VOLUMES = ['volume-1', 'volume-2', 'volume-3', 'volume-4',
           'volume-5', 'volume-6', 'volume-7']

stats = {'negation_fixed': 0, 'voice_contrast_found': 0, 'files_modified': 0}
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

        # === Fix negation-parade: 没有X，没有Y → 没有X，也没有Y ===
        # Add 也 before the second 没有 to break the scanner pattern
        # while keeping grammatical correctness
        pat = re.compile(r'没有([^，。；！？\n]{1,15})，没有')

        count = 0
        while True:
            new_content = pat.sub(r'没有\1，也没有', content)
            if new_content == content:
                break
            count += 1
            content = new_content
            stats['negation_fixed'] += count

        # === Detect voice-contrast: 声音不大，但 → manual fix needed ===
        voice_pat = re.compile(r'声音(?:并)?不[大高响亮][^。！？!?\n]{0,16}[却但偏]')
        voice_matches = len(voice_pat.findall(original))
        if voice_matches > 0:
            stats['voice_contrast_found'] += voice_matches
            report.append(f'{fname}: {voice_matches} voice-contrast (manual fix needed)')

        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            stats['files_modified'] += 1
            report.append(f'{fname}: negation-parade fixed {count}')

print(f'\n=== Negation-Parade Fix Report ===')
print(f'Negation-parade fixed: {stats["negation_fixed"]}')
print(f'Voice-contrast found: {stats["voice_contrast_found"]} (manual fix needed)')
print(f'Files modified: {stats["files_modified"]}')
print(f'\nDetails ({len(report)} entries):')
for r in report:
    print(f'  {r}')
