# -*- coding: utf-8 -*-
# R235: canon-year alignments from in-story testimonies
#  - Shen Zhiqiu (0428) death year 1985 -> 1998 (her own ch846 testimony; 28y span 1998->2026)
#  - Zhao Lei (0429, Zhao Danzui's father) sanatorium entry 1998 -> 1985 (ch884/909; 41y span 1985->2026)
#  - ch819 false-frame entry date 2026-08-11 -> 2023-08-11; PAD[451] filler text likewise
#  - ch619 + V5 outline: Zhao Danzui release destination 2026 -> 2023 (entry-year leftover)
# Byte-safe: read binary, decode utf-8, replace, encode utf-8, write binary.
# Per-edit count assertion; per-file all-or-nothing (no write unless every op checks out).
import io, sys, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
os.chdir(r'D:\work\yewenxuan_story')

# (path, [(old, new, expected_count), ...]) — ops run in order within a file.
EDITS = [
 # ch819: Ye Wenxuan's false memory frame — "yesterday" before 2023-08-11 exit attempt
 ('chapters/volume-6/chapter-819-polished.md', [
  ('2026年8月11日，傍晚六点四十三分', '2023年8月11日，傍晚六点四十三分', 1),
 ]),
 # pad filler so a re-run of pad_v4_cjk.py doesn't reinsert old canon into ch451
 ('tools/pad_v4_cjk.py', [
  ('2026年8月11日，晚上9点，那扇短信到达的时刻。', '2023年8月11日，晚上9点，那扇短信到达的时刻。', 1),
 ]),
 # ch619: release destinations — Shen Zhiqiu 2045 (ch573) and Duoduo 2022 (ch454) are correct;
 # Zhao Danzui's anchor returns to the real present 2023, not 2026
 ('chapters/volume-5/chapter-619-polished.md', [
  ('赵大嘴的锚点回到2026年', '赵大嘴的锚点回到2023年', 1),
 ]),
 ('chapters/volume-5/outline-volume-5.md', [
  ('赵大嘴的意识回到了2026年', '赵大嘴的意识回到了2023年', 2),
 ]),
 # ch832: Shen Zhiqiu died 1998, not 1985; the 41-year span belongs to 0429/father,
 # 0428/Shen Zhiqiu's wait is 28 years (1998 -> 2026)
 ('chapters/volume-6/chapter-832-polished.md', [
  ('沈知秋在1985年去世前说的最后一句话就是', '沈知秋在1998年去世前说的最后一句话就是', 1),
  ('沈知秋1985年去世后，0428碎片被闭环吸收了', '沈知秋1998年去世后，0428碎片被闭环吸收了', 1),
  ('从1985年沈知秋去世到2026年的现在，四十一年。四十一年里0428在闭环中流浪',
   '从1998年沈知秋去世到2026年的现在，二十八年。二十八年里0428在闭环中流浪', 1),
 ]),
 ('chapters/volume-6/chapter-833-polished.md', [
  ('沈知秋在1985年去世。', '沈知秋在1998年去世。', 1),
  ('这是沈知秋在1985年去世前说的最后一句话', '这是沈知秋在1998年去世前说的最后一句话', 1),
  ('那句话从1985年穿越到2026年', '那句话从1998年穿越到2026年', 1),
 ]),
 ('chapters/volume-6/chapter-834-polished.md', [
  ('早在1985年就死了', '早在1998年就死了', 1),
  ('1985年那场灾', '1998年那场灾', 1),
  ('从1985年回来的妈妈', '从1998年回来的妈妈', 1),
 ]),
 # ch883: father's entry year is 1985 (ch884: 1985 entry + 13 years = 1998 module-touch date)
 ('chapters/volume-6/chapter-883-polished.md', [
  ('你父亲在1998年进入疗养院后，意识被系统捕获了', '你父亲在1985年进入疗养院后，意识被系统捕获了', 1),
 ]),
 # V6 part2 outline: entry year + "entry day" mislabel (04-29 is the module-touch date, ch909)
 ('chapters/volume-6/outline-volume-6-part2-ch869-918.md', [
  ('赵大嘴的父亲在1998年进入疗养院后，意识被系统"捕获"了',
   '赵大嘴的父亲在1985年进入疗养院后，意识被系统"捕获"了', 1),
  ('那是赵大嘴父亲"进入"疗养院的日子', '那是赵大嘴父亲的意识"触及"筛选器时间模块的日子', 1),
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
