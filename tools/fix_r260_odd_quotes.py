# -*- coding: utf-8 -*-
"""R260 — 引号配平族的收尾轮：全库最后 3 处可证修复 + 17 段登记 NO-EDIT。

R259 修完 V4 可证子集后，全库剩余奇数引号段只有非 V4 的 18 段。本轮把它们
连同 V1/V2/V3 全史的**广扫**（`.claude/tmp/r260_broad.py`，300 章全部修订逐行
按去引号文本建索引）一起收口：

    广扫结果：V1/V2/V3 全史「祖先能证明的引号丢失」只有 **6 处 / 5 章**。
    其中 3 处可取、3 处是陷阱（见 REJECTS）。

可证的 3 处（本表）：
    ch63  L45  `"精神力剩多少？"六十八。"`   -> `"精神力剩多少？""六十八。"`
    ch68  L49  `…"……不救她？"救不了。"…`     -> `…"……不救她？""救不了。"…`
    ch68  L50  `"那什么时候？"等我收集齐碎片。"…` -> `"那什么时候？""等我收集齐碎片。"…`
    判据同 R259：父本行唯一、去引号后与现值逐字相同、引号更多，丢失位置取槽位
    多重集差；`""` 相邻是本书自己的写法（ch104 L45 一处连写三段、ch113 L165/L167、
    ch114 L345，全库 9 处），不是伪影。

REJECTS（有父本、但不修，逐条留因）：
    ch148 L36  父本 `"。但出口回。"` 本身失衡且是断行残片，现值 `"…` + 下一行 `…。"`
               是跨行台词（该段引号其实是配平的）；取不准就不动。
    ch278 L417 父本末位 `"` 是**后来删行留下的悬挂引号**（父本 L419 的
               `碎片在感知那个符号。在渴望。在催促。` 现值已被删），父本自己就是奇数。
    ch288 L82  同上：父本 L84 `韩冰看着他。…` 现值已被删，末位 `"` 是删行残渣。

NO-EDIT 登记（证不出来的奇数段行，一律不动）：
    ch52 L135 / ch69 L8,9,10,13,14,15,16,19,20,28,40,41,42,43,45,49,54,55,56,74,
    79,103,107 / ch113 L32 / ch118 L85 / ch235 L87 / ch244 L40 / ch265 L27 /
    ch284 L157 / ch285 L136 / ch294 L12 / ch316 L33 / ch318 L94 / ch334 L7 /
    ch335 L78 / ch371 L21 / ch395 L75 / ch774 L66
    其中 ch235／ch335 全程引号数从未变过（原生奇数段）；其余多为 e0040d63
    （2026-08-23 V2/V3/V5 periodless chain fix，490 文件）**改链时顺手吃引号**，
    同一提交也改了同行的其他字，故无祖先可对位。V4 的 751 段经作者裁定收档。

不变量（fail-closed）：奇数段内的含引号行 = 本表位点 + REJECTS + NO-EDIT，
一个都不许漏；修后奇数段数只减不增。

用法
    python tools/fix_r260_odd_quotes.py --scan | --build | --dry-run | --apply | --verify
"""
import collections
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from fix_r259_lost_quotes import (DQ, blob, odd_blocks, plan, read_lines,  # noqa: E402
                                  strip, write_lines)

TABLE = os.path.join(ROOT, 'tools', 'r260_odd_quote_sites.json')

# 广扫点名的 5 个文件（其余 V1/V2/V3 文件全史无可证位点）
BROAD_FILES = ['chapters/volume-1/chapter-63-polished.md',
               'chapters/volume-1/chapter-68-polished.md',
               'chapters/volume-2/chapter-148-polished.md',
               'chapters/volume-3/chapter-278-polished.md',
               'chapters/volume-3/chapter-288-polished.md']

REJECTS = {
    ('chapters/volume-2/chapter-148-polished.md', 36): '父本本身失衡且是断行残片；现值是跨行台词（段内其实配平）',
    ('chapters/volume-3/chapter-278-polished.md', 417): '父本末位引号是后来删行留下的悬挂引号，父本自己就是奇数',
    ('chapters/volume-3/chapter-288-polished.md', 82): '同上：父本 L84 已被删，末位引号是删行残渣',
}

NOEDIT = """chapters/volume-1/chapter-52-polished.md:135
chapters/volume-1/chapter-69-polished.md:8,9,10,13,14,15,16,19,20,28,40,41,42,43,45,49,54,55,56,74,79,103,107
chapters/volume-2/chapter-113-polished.md:32
chapters/volume-2/chapter-118-polished.md:85
chapters/volume-2/chapter-235-polished.md:87
chapters/volume-2/chapter-244-polished.md:40
chapters/volume-3/chapter-265-polished.md:27
chapters/volume-3/chapter-284-polished.md:157
chapters/volume-3/chapter-285-polished.md:136
chapters/volume-3/chapter-294-polished.md:12
chapters/volume-3/chapter-316-polished.md:33
chapters/volume-3/chapter-318-polished.md:94
chapters/volume-3/chapter-334-polished.md:7
chapters/volume-3/chapter-335-polished.md:78
chapters/volume-3/chapter-371-polished.md:21
chapters/volume-3/chapter-395-polished.md:75
chapters/volume-6/chapter-774-polished.md:66"""


def noedit_set():
    out = set()
    for ln in NOEDIT.strip().split('\n'):
        p, ls = ln.rsplit(':', 1)
        for x in ls.split(','):
            out.add((p, int(x)))
    return out


def run(args, data=None):
    return subprocess.run(args, cwd=ROOT, input=data, capture_output=True).stdout


def revs_of(rel):
    return list(reversed(run(['git', 'log', '--format=%h', '--', rel]).decode().split())) + ['HEAD']


def ancestors(rel):
    """该文件全部修订的行内容（旧 -> 新，末项是 HEAD）。"""
    rv = revs_of(rel)
    out = run(['git', 'cat-file', '--batch'],
              ('\n'.join('%s:%s' % (r, rel) for r in rv) + '\n').encode('utf-8'))
    hist = []
    for r in rv:
        head, _, rest = out.partition(b'\n')
        size = int(head.split()[2])
        body, out = rest[:size], rest[size + 1:]
        hist.append((r, body.decode('utf-8').replace('\r\n', '\n').split('\n')))
    return hist


def prove(rel, bodies=None):
    """全行祖先取证：{line: (rev, parent_line, ins)}。

    bodies 给定时以它为「现值」（`--verify` 用 HEAD 的行做基线，因为落盘后
    工作区里已经没有位点了，从工作区重导只会得到空表）。
    """
    hist = ancestors(rel)
    idx = [collections.defaultdict(list) for _ in hist]
    for k, (rev, lines) in enumerate(hist):
        for ln in lines:
            if DQ in ln:
                idx[k][strip(ln)].append(ln)
    if bodies is None:
        bodies, _ = read_lines(rel)
    res = {}
    for li, now in enumerate(bodies, start=1):
        if DQ not in now:
            continue
        for k in range(len(hist) - 2, -1, -1):        # 新 -> 旧（跳过 HEAD）
            cand = [x for x in idx[k].get(strip(now), []) if x.count(DQ) > now.count(DQ)]
            if len(cand) != 1:                         # 唯一性：0 或不唯一都跳过
                continue
            res[li] = (hist[k][0], cand[0], plan(cand[0], now))
            break
    return res


def odd_lines(rel):
    """奇数段内的含引号行号。"""
    bodies, _ = read_lines(rel)
    out, start, blk = [], 1, []
    for i, ln in enumerate(bodies + [''], start=1):
        if ln.strip() == '':
            if blk and sum(x.count(DQ) for x in blk) % 2:
                out.extend(start + k for k, b in enumerate(blk) if DQ in b)
            start, blk = i + 1, []
        else:
            blk.append(ln)
    return out


def collect():
    rows, covered = [], set()
    for rel in BROAD_FILES:
        ch = int(re.search(r'chapter-(\d+)', rel).group(1))
        bodies, _ = read_lines(rel)
        for li, (rev, par, ins) in sorted(prove(rel).items()):
            covered.add((rel, li))
            if (rel, li) in REJECTS:
                continue
            for pos in ins:
                rows.append(dict(chapter=ch, path=rel, line=li, col=pos + 1, char=DQ,
                                 parent=par, now=bodies[li - 1], src=rev))
    rows.sort(key=lambda r: (r['path'], r['line'], r['col']))

    # fail-closed：每个奇数段行必须落在 表 / REJECTS / NO-EDIT 之一
    ne = noedit_set()
    miss, n_odd, n_hit = [], 0, 0
    for vol in ('volume-1', 'volume-2', 'volume-3', 'volume-6'):
        d = os.path.join(ROOT, 'chapters', vol)
        for fn in sorted(os.listdir(d)):
            if not re.match(r'chapter-\d+-polished\.md$', fn):
                continue
            rel = 'chapters/%s/%s' % (vol, fn)
            tbl = set(r['line'] for r in rows if r['path'] == rel)
            for li in odd_lines(rel):
                n_odd += 1
                if li in tbl:
                    n_hit += 1
                    continue
                if (rel, li) not in REJECTS and (rel, li) not in ne:
                    miss.append('%s:%d' % (rel, li))
    return rows, miss, n_odd, n_hit


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    rows, miss, n_odd, n_hit = collect()
    if miss:
        print('!! 覆盖自检失败：奇数段里有 %d 行既没修也没登记：%s' % (len(miss), miss[:8]))
        return 2
    print('覆盖自检：奇数段内共 %d 行 = 本表 %d + NO-EDIT %d，无遗漏；'
          '另有 %d 处（不在奇数段内、祖先可证但判定为陷阱）登记 REJECTS'
          % (n_odd, n_hit, n_odd - n_hit, len(REJECTS)))
    if mode == '--scan':
        for r in rows:
            print('ch%-4d L%-4d c%-3d src=%s' % (r['chapter'], r['line'], r['col'], r['src']))
            print('   父本 %s' % r['parent'][:150])
            print('   现值 %s' % r['now'][:150])
        return 0
    if mode == '--build':
        with io.open(TABLE, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
        print('wrote %s（%d 条 / %d 章）'
              % (os.path.relpath(TABLE, ROOT), len(rows), len(set(r['path'] for r in rows))))
        return 0
    if mode == '--verify':
        """落盘后从两个独立来源复核：祖先链（重导证据）与 HEAD（重放改动）。

        位点从**表**里读，不从工作区重导 —— 修完以后工作区已无位点，
        从工作区重导会得到空表并「全过」，那是空转。
        """
        with io.open(TABLE, encoding='utf-8') as fh:
            tbl = json.load(fh)
        bad, n = 0, 0
        for rel in sorted(set(r['path'] for r in tbl)):
            n += 1
            before = (blob('HEAD', rel) or '').replace('\r\n', '\n').split('\n')
            after, _ = read_lines(rel)
            got = prove(rel, before)                      # 祖先链 × HEAD 基线重导
            mine = collections.defaultdict(list)
            for r in tbl:
                if r['path'] == rel:
                    mine[r['line']].append(r['col'] - 1)
            errs = []
            if set(got) != set(mine):
                errs.append('重导位点不符：祖先链×HEAD 得 %d 行 vs 表 %d 行（差 %s）'
                            % (len(got), len(mine), sorted(set(got) ^ set(mine))[:5]))
            else:
                for li, cols in mine.items():
                    if sorted(got[li][2]) != sorted(cols):
                        errs.append('L%d 槽位不符 %s vs %s' % (li, got[li][2], cols))
                        continue
                    b = before[li - 1]
                    for c in sorted(cols, reverse=True):
                        b = b[:c] + DQ + b[c:]
                    if b != got[li][1]:
                        errs.append('L%d 还原后 != 父本行' % li)
            if not errs:                                  # HEAD + 表 == 工作区
                replay = list(before)
                for li, cols in mine.items():
                    ln = replay[li - 1]
                    for c in sorted(cols, reverse=True):
                        ln = ln[:c] + DQ + ln[c:]
                    replay[li - 1] = ln
                if replay != after:
                    d = [i + 1 for i, (x, y) in enumerate(zip(replay, after)) if x != y]
                    errs.append('重放后与工作区不同（行 %s；行数 %d vs %d）'
                                % (d[:3], len(replay), len(after)))
            if errs:
                bad += 1
                print('  VERIFY %-40s !! %s' % (os.path.basename(rel), '; '.join(errs[:3])))
            else:
                print('  VERIFY %-40s OK  %d 行 %d 处：HEAD + 表 = 工作区，还原 = 父本行'
                      % (os.path.basename(rel), len(mine), sum(len(v) for v in mine.values())))
        print('\nverify: %d/%d file(s) ok' % (n - bad, n))
        return 1 if bad else 0

    tot, before_all, after_all = 0, 0, 0
    for rel in sorted(set(r['path'] for r in rows)):
        bodies, eols = read_lines(rel)
        mine = collections.defaultdict(list)
        for r in rows:
            if r['path'] == rel:
                mine[r['line']].append(r['col'] - 1)
        before_all += odd_blocks(bodies)
        before = odd_blocks(bodies)
        for li, cols in mine.items():
            ln = bodies[li - 1]
            for c in sorted(cols, reverse=True):
                ln = ln[:c] + DQ + ln[c:]
            bodies[li - 1] = ln
        after_all += odd_blocks(bodies)
        print('  %-42s %d 处  奇数段 %d -> %d'
              % (os.path.relpath(rel, ROOT), sum(len(v) for v in mine.values()),
                 before, odd_blocks(bodies)))
        tot += sum(len(v) for v in mine.values())
        if mode == '--apply':
            write_lines(rel, bodies, eols)
    print()
    print('edits %d 处 in %d file(s)；这些文件奇数段合计 %d -> %d'
          % (tot, len(set(r['path'] for r in rows)), before_all, after_all))
    if mode == '--dry-run':
        print('dry run: nothing written')
    return 0


if __name__ == '__main__':
    sys.exit(main())
