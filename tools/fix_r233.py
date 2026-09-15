# -*- coding: utf-8 -*-
# R233: loop-span 121年 -> 124年 (2147-2023) + entry-date retcon 2026年8月11日 -> 2023年8月11日
# Byte-safe: read binary, decode utf-8, replace, encode utf-8, write binary.
# Per-edit count assertion; per-file all-or-nothing (no write unless every op checks out).
# {EOL} in a new-string is substituted with the file's own line separator.
import io, sys, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
os.chdir(r'D:\work\yewenxuan_story')

A_DATE = ('2026年8月11日', '2023年8月11日')
A_121 = ('121年', '124年')
H_121 = ('一百二十一年', '一百二十四年')

# (path, [(old, new, expected_count), ...]) — ops run in order within a file.
EDITS = [
 ('chapters/volume-1/chapter-64-polished.md', [A_121 + (1,)]),
 ('chapters/volume-4/chapter-451-polished.md', [A_DATE + (3,)]),
 ('chapters/volume-4/chapter-452-polished.md', [A_DATE + (4,)]),
 ('chapters/volume-4/chapter-502-polished.md', [A_DATE + (2,)]),
 ('chapters/volume-4/chapter-507-polished.md', [A_DATE + (1,)]),
 ('chapters/volume-4/chapter-534-polished.md', [H_121 + (1,), A_121 + (2,)]),
 ('chapters/volume-4/chapter-544-polished.md', [
    ('两个人的目光中间隔着121年的距离2026年到2147年', '两个人的目光中间隔着124年的距离2023年到2147年', 1),
    ('从2147年延伸到2026年再绕回2147年', '从2147年延伸到2023年再绕回2147年', 1),
    A_121 + (1,),
 ]),
 ('chapters/volume-4/outline-volume-4.md', [
    A_DATE + (2,),
    ('到2026年（现在）再到2147年（未来）', '到2023年（入局）再到2147年（未来）', 1),
    A_121 + (1,),
 ]),
 ('chapters/volume-5/chapter-585-polished.md', [A_DATE + (1,), A_121 + (3,)]),
 ('chapters/volume-5/chapter-587-polished.md', [
    ('2147年的终点和2026年的起点是同一个点', '2147年的终点和2023年的起点是同一个点', 1),
    ('在2026年就已经存在了', '在2023年就已经存在了', 1),
    ('直线从2026年延伸到2147年', '直线从2023年延伸到2147年', 1),
 ]),
 ('chapters/volume-5/chapter-588-polished.md', [
    ('他等了121年，从2147年到2026年。', '他等了124年，从2147年到2023年。', 1),
    ('从2147年到2026年，121年。', '从2147年到2023年，124年。', 1),
    A_121 + (6,),
 ]),
 ('chapters/volume-5/chapter-596-polished.md', [
    ('他进入无限世界的日期（2026年8月11日）的121年后', '他进入无限世界的日期（2023年8月11日）的124年后', 1),
    ('为什么是121年后？为什么不是120年或122年？', '为什么是124年后？为什么不是123年或125年？', 1),
    ('闭环中的47次循环，每次循环大约2.5年，总共约118年。加上一些时间偏移，总共约121年。',
     '闭环中的47次循环，每次循环大约2.6年，总共约122年。加上一些时间偏移，总共约124年。', 1),
    A_121 + (2,),
 ]),
 ('chapters/volume-5/chapter-597-polished.md', [A_121 + (9,)]),
 ('chapters/volume-5/chapter-598-polished.md', [A_121 + (5,)]),
 ('chapters/volume-5/chapter-599-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-600-polished.md', [A_121 + (4,)]),
 ('chapters/volume-5/chapter-601-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-602-polished.md', [A_121 + (3,)]),
 ('chapters/volume-5/chapter-603-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-609-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-619-polished.md', [H_121 + (1,)]),
 ('chapters/volume-5/chapter-620-polished.md', [H_121 + (2,)]),
 ('chapters/volume-5/chapter-622-polished.md', [
    ('从2147年发送到2026年8月11日，一百二十一年前的过去', '从2147年发送到2023年8月11日，一百二十四年前的过去', 1),
    A_DATE + (1,),
    ('把0429投射到2026年', '把0429投射到2023年', 1),
    H_121 + (2,),
 ]),
 ('chapters/volume-5/chapter-623-polished.md', [H_121 + (1,)]),
 ('chapters/volume-5/chapter-626-polished.md', [H_121 + (3,)]),
 ('chapters/volume-5/chapter-627-polished.md', [H_121 + (3,)]),
 ('chapters/volume-5/chapter-628-polished.md', [H_121 + (6,)]),
 ('chapters/volume-5/chapter-629-polished.md', [H_121 + (2,)]),
 ('chapters/volume-5/chapter-630-polished.md', [H_121 + (1,)]),
 ('chapters/volume-5/chapter-631-polished.md', [A_121 + (2,)]),
 ('chapters/volume-5/chapter-632-polished.md', [A_121 + (4,)]),
 ('chapters/volume-5/chapter-633-polished.md', [A_121 + (3,)]),
 ('chapters/volume-5/chapter-634-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-642-polished.md', [
    ('发射到了2026年', '发射到了2023年', 2),
 ]),
 ('chapters/volume-5/chapter-643-polished.md', [
    ('投射到了2026年的过去', '投射到了2023年的过去', 1),
    ('发射到了2026年的过去', '发射到了2023年的过去', 1),
    ('2026年的赵大嘴身边', '2023年的赵大嘴身边', 1),
 ]),
 ('chapters/volume-5/chapter-652-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/chapter-653-polished.md', [A_121 + (6,)]),
 ('chapters/volume-5/chapter-654-polished.md', [A_121 + (3,)]),
 ('chapters/volume-5/chapter-655-polished.md', [A_121 + (2,)]),
 ('chapters/volume-5/chapter-656-polished.md', [A_121 + (6,)]),
 ('chapters/volume-5/chapter-679-polished.md', [A_121 + (1,)]),
 ('chapters/volume-5/outline-volume-5.md', [
    ('日期（2026年8月11日）的', '日期（2023年8月11日）的', 2),
    ('他等了121年（从2147年到2026年）', '他等了124年（从2147年到2023年）', 1),
    ('会在2026年遇见叶文轩', '会在2023年遇见叶文轩', 1),
    ('PROJ_TRIO', 'PROJ_TRIO', 3),  # 投射"到了2026年 x3, quote-char variants tried in order
    A_121 + (6,),
 ]),
 ('chapters/volume-6/outline-volume-6-part1-ch751-868.md', [A_121 + (1,)]),
 ('chapters/volume-6/outline-volume-6-part2-ch869-918.md', [A_121 + (1,)]),
 ('chapters/volume-6/chapter-910-polished.md', [A_121 + (1,)]),
 ('chapters/volume-6/chapter-912-polished.md', [A_121 + (2,)]),
 ('characters/sidekick-deep-dive.md', [A_DATE + (1,)]),
 ('v4_endings.txt', [A_DATE + (1,)]),
 ('tools/audit-comprehensive.js', [
    A_121 + (2,),
    ('(?<!121)年', '(?<!124)年', 1),
 ]),
 ('worldbuilding/lore/closed-loop.md', [
    ('现在（2026年）', '现在（2023年）', 1),
    ('- **入局：** 约 2023 年 8 月（女儿叶子时年 9 岁，2014 年生）。',
     '- **入局：** 2023 年 8 月 11 日晚（女儿叶子时年 9 岁，2014 年生）。日期锚点：ch451/ch452 门面「2023年8月11日。晚上9点」。', 1),
    ('- **时间流速比：1:1，无膨胀。**',
     '- **闭环跨度：** 入局日（2023年8月11日）到闭环终点（2147年9月14日）相隔 124 年（2147-2023）。{EOL}- **时间流速比：1:1，无膨胀。**', 1),
 ]),
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
        if old == 'PROJ_TRIO':
            total = 0
            for q in ('"', '\u201c', '\u201d'):
                cand = '投射' + q + '到了2026年'
                n = cur.count(cand)
                if n:
                    cur = cur.replace(cand, '投射' + q + '到了2023年')
                    total += n
            if total != expected:
                fails.append(f'{path}: PROJ_TRIO expected {expected}, found {total}')
                ok = False
                break
            continue
        new = new.replace('{EOL}', eol)
        c = cur.count(old)
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
