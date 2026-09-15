# -*- coding: utf-8 -*-
# R234: daughter-signal distance 120年 -> 121年 (2147-2026, core to daughter's real present)
# Byte-safe: read binary, decode utf-8, replace, encode utf-8, write binary.
# Per-edit count assertion; per-file all-or-nothing (no write unless every op checks out).
import io, sys, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
os.chdir(r'D:\work\yewenxuan_story')

A_120 = ('120年', '121年')

# (path, [(old, new, expected_count), ...]) — ops run in order within a file.
EDITS = [
 ('chapters/volume-5/chapter-710-polished.md', [A_120 + (1,)]),
 ('chapters/volume-5/chapter-717-polished.md', [A_120 + (1,)]),
 ('chapters/volume-6/chapter-799-polished.md', [A_120 + (1,)]),
 ('chapters/volume-6/chapter-803-polished.md', [A_120 + (3,)]),
 ('chapters/volume-6/chapter-804-polished.md', [A_120 + (3,)]),
 ('chapters/volume-6/chapter-806-polished.md', [A_120 + (1,)]),
 ('chapters/volume-6/chapter-807-polished.md', [A_120 + (1,)]),
 ('chapters/volume-6/chapter-810-polished.md', [A_120 + (1,)]),
 ('chapters/volume-6/chapter-817-polished.md', [A_120 + (1,)]),
]

fails = []
done = 0
for path, ops in EDITS:
    with open(path, 'rb') as f:
        txt = f.read().decode('utf-8')
    eol = '\r\n' if '\r\n' in txt else '\n'
    cur = txt
    ok = True
    for old, new, expected in ops:
        new = new.replace('{EOL}', eol)
        c = cur.count(old)
        if c == 0:
            # already applied by a previous partial run — skip
            continue
        if c != expected:
            fails.append(f'{path}: expected {expected}, found {c}: {old[:40]!r}')
            ok = False
            break
        cur = cur.replace(old, new)
    if ok:
        with open(path, 'wb') as f:
            f.write(cur.encode('utf-8'))
        done += 1
        print(f'OK {path} ({len(ops)} ops)')

print()
if fails:
    print('=== FAILURES (files with failures were NOT written) ===')
    for f in fails:
        print(f)
else:
    print('ALL FILES UPDATED CLEANLY')
print(f'files updated: {done}/{len(EDITS)}')