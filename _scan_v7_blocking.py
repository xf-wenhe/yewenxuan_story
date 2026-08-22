import subprocess, os, glob, re, json

files = sorted(glob.glob('D:/work/yewenxuan_story/chapters/volume-7/*-polished.md'))
print(f"V7 files to scan: {len(files)}")

cmd = ['node', 'D:/work/yewenxuan_story/.claude/skills/story-deslop/scripts/check-ai-patterns.js'] + files
result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

lines = result.stdout.split('\n') if result.stdout else []
blocking_lines = [l for l in lines if '[blocking]' in l]
print(f"Total blocking findings: {len(blocking_lines)}")

# Use line-split approach: find last 3 colon-separated segments at the end
by_file = {}
for l in blocking_lines:
    # Normalize path separators
    l = l.replace('\\', '/')
    # Split on colons — the last 3 should be :line:col: [blocking]...
    parts = l.split(':')
    # Find [blocking] position
    idx = -1
    for i, p in enumerate(parts):
        if '[blocking]' in p:
            idx = i
            break
    if idx < 0:
        print(f"  NO_BLOCKING: {l[:120]}")
        continue
    # line = parts[idx-2], col = parts[idx-1], detail = rest
    try:
        line_num = int(parts[idx-2].strip())
        col_num = int(parts[idx-1].strip())
    except:
        print(f"  BAD_NUMS: {l[:120]}")
        continue
    # Reconstruct file path (everything before the line number colons)
    filepath = ':'.join(parts[:idx-2])
    filename = os.path.basename(filepath)
    detail = ':'.join(parts[idx:])

    if filename not in by_file:
        by_file[filename] = {'path': filepath, 'findings': []}
    by_file[filename]['findings'].append({
        'line': line_num,
        'col': col_num,
        'detail': detail[:150]
    })

file_list = []
for fn in sorted(by_file.keys()):
    entry = by_file[fn]
    print(f"\n{fn} ({len(entry['findings'])} findings):")
    for f in entry['findings']:
        print(f"  L{f['line']}: {f['detail'][:100]}")
    file_list.append({
        'file': entry['path'],
        'findings_count': len(entry['findings']),
        'findings': entry['findings']
    })

with open('D:/work/yewenxuan_story/_v7_blocking_files.json', 'w', encoding='utf-8') as f:
    json.dump(file_list, f, ensure_ascii=False, indent=2)
print(f"\nSaved {len(file_list)} files to _v7_blocking_files.json")