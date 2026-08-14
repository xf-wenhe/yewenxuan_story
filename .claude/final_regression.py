# -*- coding: utf-8 -*-
"""Final regression: check-degeneration.js across all V1-V3 chapters + CJK count + BOM check.

Output: .claude/final-regression.json + console summary.
Run AFTER all fix agents complete. Reports:
  - blocking/advisory counts per volume and per chapter
  - chapters with CJK < 3000
  - files with BOM or non-UTF-8 issues
"""
import subprocess, glob, re, json, sys, os

sys.stdout.reconfigure(encoding='utf-8')

ROOT = r'D:\work\yewenxuan_story'
CHECKER = os.path.join(ROOT, '.claude', 'skills', 'story-deslop', 'scripts', 'check-degeneration.js')

report = {'volumes': {}, 'short_chapters': [], 'bom_files': [], 'bad_encoding': []}
total_blocking = 0
total_files = 0

for vol in ['volume-1', 'volume-2', 'volume-3']:
    v = {'files': 0, 'blocking': 0, 'advisory': 0, 'chapters': []}
    for f in sorted(glob.glob(os.path.join(ROOT, 'chapters', vol, 'chapter-*-polished.md'))):
        total_files += 1
        v['files'] += 1
        # read + BOM / encoding check
        raw = open(f, 'rb').read()
        name = os.path.basename(f)
        if raw.startswith(b'\xef\xbb\xbf'):
            report['bom_files'].append(name)
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            report['bad_encoding'].append(name)
            continue
        cjk = len(re.findall(r'[一-鿿]', text))
        if cjk < 3000:
            report['short_chapters'].append({'file': name, 'cjk': cjk})
        # checker
        r = subprocess.run(['node', CHECKER, f], capture_output=True, text=True,
                           encoding='utf-8', errors='replace')
        out = (r.stdout or '') + (r.stderr or '')
        n_block = out.count('[blocking]')
        n_adv = out.count('[advisory]')
        v['blocking'] += n_block
        v['advisory'] += n_adv
        total_blocking += n_block
        v['chapters'].append({'file': name, 'blocking': n_block, 'advisory': n_adv, 'cjk': cjk})
    v['chapters'].sort(key=lambda x: -x['blocking'])
    report['volumes'][vol] = v

report['total_files'] = total_files
report['total_blocking'] = total_blocking

with open(os.path.join(ROOT, '.claude', 'final-regression.json'), 'w', encoding='utf-8') as fh:
    json.dump(report, fh, ensure_ascii=False, indent=1)

print('=' * 60)
for vol, v in report['volumes'].items():
    print(f"{vol}: {v['files']} files, {v['blocking']} blocking, {v['advisory']} advisory")
print(f"TOTAL: {total_files} files, {total_blocking} blocking")
print('short chapters:', report['short_chapters'])
print('BOM files:', report['bom_files'])
print('bad encoding:', report['bad_encoding'])
