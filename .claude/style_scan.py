# -*- coding: utf-8 -*-
"""Run story-deslop degeneration checker across all V1-V3 chapters, aggregate results."""
import subprocess, glob, re, json, os

results = {}
for vol in ['volume-1', 'volume-2', 'volume-3']:
    vol_res = {'files': 0, 'blocking': 0, 'advisory': 0, 'worst': []}
    for f in sorted(glob.glob(f'chapters/{vol}/chapter-*-polished.md')):
        r = subprocess.run(['node', '.claude/skills/story-deslop/scripts/check-degeneration.js', f],
                           capture_output=True, text=True, encoding='utf-8', errors='replace')
        out = (r.stdout or '') + (r.stderr or '')
        vol_res['files'] += 1
        n_block = out.count('[blocking]')
        n_adv = out.count('[advisory]')
        vol_res['blocking'] += n_block
        vol_res['advisory'] += n_adv
        if n_block > 0:
            m = re.search(r'\[blocking\][^\n]*', out)
            vol_res['worst'].append((os.path.basename(f), n_block, m.group(0) if m else ''))
    results[vol] = vol_res

with open(r'D:\work\yewenxuan_story\.claude\style-scan-result.json', 'w', encoding='utf-8') as fh:
    json.dump(results, fh, ensure_ascii=False, indent=1)
print(json.dumps(results, ensure_ascii=False, indent=1))
