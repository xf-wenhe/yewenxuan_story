# -*- coding: utf-8 -*-
"""R259 — V4 被吃掉的引号（可证子集）：`f7622c68` 一轮吃了 1,802 个 `"`。

背景
    V4 的引号总数：`3bab93f8`（2026-08-17「Volume 4 complete」）**8,849** →
    `f7622c68`（2026-08-22「V4 de-AI + pad complete」）**7,047**，90 个文件少掉
    1,802 个 `"`，此后一直稳定在 6,946～6,947。可见的伤口是**段级配平被打破**：
    空行分隔的对话段里 `"` 成了奇数（全库 903 段，其中 V4 **885 段**）。

判据（只取**可证**的那一档，R254 的逐字符对位法）
    父本 `3bab93f8` 与现值按「去引号后的文本」对齐；若两行去引号后逐字相同而
    父本引号更多，则丢失位置由父本引号在去引号文本里的下标**唯一还原** ——
    PROVABLE（本轮修它）。去引号后也不同 = 该行被改写过，位置不可证 → 登记不修。

修法
    只**插入** `"`，不删不改任何字符；插完该行与父本逐字节相同（EOL 除外）。

用法
    python tools/fix_r259_lost_quotes.py --build    # 生成 tools/r259_lost_quote_sites.json
    python tools/fix_r259_lost_quotes.py            # 干跑
    python tools/fix_r259_lost_quotes.py --audit    # 只验证据链
    python tools/fix_r259_lost_quotes.py --apply    # 落盘（幂等）
    python tools/fix_r259_lost_quotes.py --verify   # 从父本 blob 重放比对
"""
import collections
import difflib
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TABLE = os.path.join(HERE, 'r259_lost_quote_sites.json')
PARENT = '3bab93f8'
VOL = 'volume-4'
DQ = '"'
CJK = re.compile(r'[一-鿿]')
BOM = b'\xef\xbb\xbf'


def rels():
    d = os.path.join(ROOT, 'chapters', VOL)
    for fn in sorted(os.listdir(d)):
        if re.match(r'chapter-\d+-polished\.md$', fn):
            yield int(re.search(r'chapter-(\d+)', fn).group(1)), 'chapters/%s/%s' % (VOL, fn)


def blob(rev, rel):
    p = subprocess.run(['git', 'cat-file', '--batch'], cwd=ROOT,
                       input=('%s:%s\n' % (rev, rel)).encode('utf-8'), capture_output=True)
    head, _, rest = p.stdout.partition(b'\n')
    parts = head.split()
    if len(parts) < 3:
        return None
    return rest[:int(parts[2])].decode('utf-8')


def strip(t):
    return t.replace(DQ, '')


def slots(line):
    """每个引号所在的「槽位」= 它前面有多少个非引号字符（去引号文本里的下标）。"""
    out, i = [], 0
    for ch in line:
        if ch == DQ:
            out.append(i)
        else:
            i += 1
    return out


def plan(parent_line, now_line):
    """父本有、现值没有的引号槽位 -> 现值插入位点（0 基，升序）。

    不能「父本有多少引号就补多少个」：现值往往还留着半对引号（如开头那个），
    盲目补会把 `"小叶…` 变成 `""小叶…`。父本与现值去引号后逐字相同，两者
    共用同一套「去引号文本下标」，于是丢失的引号 = 槽位的**多重集差**。
    """
    body, eol = split_eol(now_line)
    if strip(parent_line) != strip(body):
        raise AssertionError('去引号后不同：%r vs %r' % (parent_line[:40], body[:40]))
    pool = collections.Counter(slots(body))
    lost = []
    for s in slots(parent_line):
        if pool[s] > 0:
            pool[s] -= 1
        else:
            lost.append(s)
    idx = [j for j, ch in enumerate(body) if ch != DQ]
    return [idx[s] if s < len(idx) else len(body) + len(eol) for s in lost]


def split_eol(line):
    """行尾 CR 单独拿出来（V5 之后部分文件仍是 CRLF，别把它算进正文）。"""
    if line.endswith('\r'):
        return line[:-1], '\r'
    return line, ''


def read_lines(rel):
    """返回行体列表（去掉行尾 CR）+ 对应的行尾标记。"""
    with io.open(os.path.join(ROOT, rel), encoding='utf-8', newline='') as fh:
        raw = fh.read().split('\n')
    bodies, eols = [], []
    for ln in raw:
        b, e = split_eol(ln)
        bodies.append(b)
        eols.append(e)
    return bodies, eols


def write_lines(rel, bodies, eols):
    with io.open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as fh:
        fh.write('\n'.join(b + e for b, e in zip(bodies, eols)))


def odd_blocks(lines):
    """段（空行分隔）里 `"` 为奇数的段数。"""
    n, block = 0, []
    for ln in lines + ['']:
        if ln.strip() == '':
            if block and sum(x.count(DQ) for x in block) % 2:
                n += 1
            block = []
        else:
            block.append(ln)
    return n


def build():
    rows, rewritten, bad = [], 0, 0
    for ch, rel in rels():
        old = (blob(PARENT, rel) or '').replace('\r\n', '\n').split('\n')
        new, _ = read_lines(rel)
        sm = difflib.SequenceMatcher(None, [strip(x) for x in old],
                                     [strip(x) for x in new], autojunk=False)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == 'equal':
                for k in range(i2 - i1):
                    a, b = old[i1 + k], new[j1 + k]
                    if a.count(DQ) <= b.count(DQ):
                        continue
                    try:
                        ins = plan(a, b)
                    except AssertionError as e:
                        print('  !! ch%d L%d %s' % (ch, j1 + k + 1, e))
                        bad += 1
                        continue
                    for pos in ins:
                        rows.append(dict(chapter=ch, path=rel, line=j1 + k + 1,
                                         col=pos + 1, char=DQ, parent=a, now=b))
            elif tag == 'replace':
                for k in range(i1, i2):
                    if old[k].count(DQ):
                        rewritten += 1
    rows.sort(key=lambda r: (r['path'], r['line'], r['col']))

    # 干跑：逐文件把 row 插进去，量段级配平的变化（父本值一并量，作baseline）
    parent_odd = before = after = 0
    bypath = collections.defaultdict(list)
    for r in rows:
        bypath[r['path']].append(r)
    for ch, rel in rels():
        parent_odd += odd_blocks((blob(PARENT, rel) or '').replace('\r\n', '\n').split('\n'))
        bodies, _ = read_lines(rel)
        before += odd_blocks(bodies)
        for r in sorted(bypath.get(rel, []), key=lambda r: (r['line'], -r['col'])):
            ln = bodies[r['line'] - 1]
            bodies[r['line'] - 1] = ln[:r['col'] - 1] + r['char'] + ln[r['col'] - 1:]
        after += odd_blocks(bodies)
    print('=' * 78)
    print('可证位点：%d 处 / %d 章（另有被改写过的含引号行 %d 行，位置不可证，不修）'
          % (len(rows), len(set(r['path'] for r in rows)), rewritten))
    if bad:
        print('!! 对位失败 %d 处' % bad)
    print('V4 段级配平：父本 %d 段 -> 现值 %d 段 -> 插入后 %d 段（奇数引号段）'
          % (parent_odd, before, after))
    print('每个位点插入的引号数分布：%s'
          % dict(collections.Counter(
              len([x for x in rows if x['path'] == p and x['line'] == l])
              for p, l in set((r['path'], r['line']) for r in rows))))
    print('密章 top10：%s' % collections.Counter(r['chapter'] for r in rows).most_common(10))
    print('=' * 78)
    for r in rows[:8]:
        print('ch%-4d L%-4d c%-3d' % (r['chapter'], r['line'], r['col']))
        print('   父本 %s' % r['parent'][:140])
        print('   现值 %s' % r['now'][:140])
    with io.open(TABLE, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
    print('wrote %s（%d 条）' % (os.path.relpath(TABLE, ROOT), len(rows)))
    return rows


def load():
    with io.open(TABLE, encoding='utf-8') as fh:
        return json.load(fh)


def apply_rows(lines, rows):
    byline = collections.defaultdict(list)
    for r in rows:
        byline[r['line']].append(r)
    for li, rs in byline.items():
        line = lines[li - 1]
        for r in sorted(rs, key=lambda r: -r['col']):
            c = r['col'] - 1
            line = line[:c] + r['char'] + line[c:]
        lines[li - 1] = line
    return len(byline)


def residual():
    """本轮修不到的奇数段长什么样（只读统计，给下一带定形）。"""
    rows = load()
    fixed = set((r['path'], r['line']) for r in rows)
    shapes = collections.Counter()
    shown, blocks = 0, 0
    for ch, rel in rels():
        bodies, _ = read_lines(rel)
        start, block = 1, []
        for i, ln in enumerate(bodies + [''], start=1):
            if ln.strip() == '':
                if block and sum(x.count(DQ) for x in block) % 2:
                    blocks += 1
                    for off, bl in enumerate(block):
                        if DQ not in bl:
                            continue
                        li = start + off
                        if (rel, li) in fixed:
                            continue
                        lead, tail = bl.startswith(DQ), bl.endswith(DQ)
                        shapes['%s头 %s尾' % ('有' if lead else '无', '有' if tail else '无')] += 1
                        if shown < 14:
                            shown += 1
                            print('  ch%-4d L%-4d %s' % (ch, li, bl[:96]))
                start, block = i + 1, []
            else:
                block.append(ln)
    print()
    print('仍为奇数引号段的段数：%d；其中未被本轮覆盖的含引号行按首尾引号分类：' % blocks)
    for k, v in shapes.most_common():
        print('   %-14s %d 行' % (k, v))


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    if mode == '--build':
        build()
        return 0
    if mode == '--residual':
        residual()
        return 0
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2
    rows = load()
    if mode == '--audit':
        bad = 0
        for r in rows:
            lines, _ = read_lines(r['path'])
            ln = lines[r['line'] - 1]
            try:
                ins = plan(r['parent'], ln)
            except AssertionError as e:
                print('  AUDIT ch%-4d L%-4d !! %s' % (r['chapter'], r['line'], e))
                bad += 1
                continue
            if r['col'] - 1 not in ins:
                print('  AUDIT ch%-4d L%-4d c%-3d !! 该列不是父本的引号位'
                      % (r['chapter'], r['line'], r['col']))
                bad += 1
        print('audit: %d/%d ok' % (len(rows) - bad, len(rows)))
        return 1 if bad else 0

    if mode == '--verify':
        """落盘后从两个独立来源复核：父本（重导证据链）与 HEAD（重放改动）。"""
        bad = 0
        for ch, rel in rels():
            old = (blob(PARENT, rel) or '').replace('\r\n', '\n').split('\n')
            before = (blob('HEAD', rel) or '').replace('\r\n', '\n').split('\n')
            after, _ = read_lines(rel)
            want = {}
            sm = difflib.SequenceMatcher(None, [strip(x) for x in old],
                                         [strip(x) for x in before], autojunk=False)
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                if tag != 'equal':
                    continue
                for k in range(i2 - i1):
                    a, b = old[i1 + k], before[j1 + k]
                    if a.count(DQ) > b.count(DQ):
                        want[j1 + k + 1] = (a, plan(a, b))
            mine = collections.defaultdict(list)
            for r in rows:
                if r['path'] == rel:
                    mine[r['line']].append(r['col'] - 1)
            errs = []
            if set(want) != set(mine):
                errs.append('重导位点不符：父本×HEAD 得 %d 行 vs 表 %d 行（差 %s）'
                            % (len(want), len(mine), sorted(set(want) ^ set(mine))[:5]))
            else:
                for li, (a, ins) in want.items():
                    if sorted(ins) != sorted(mine[li]):
                        errs.append('L%d 槽位不符 %s vs %s' % (li, ins, mine[li]))
                        continue
                    b = before[li - 1]
                    for c in sorted(ins, reverse=True):
                        b = b[:c] + DQ + b[c:]
                    if b != a:
                        errs.append('L%d 还原后 != 父本行' % li)
            # 重放：HEAD 行 + 表里的插入 == 工作区（未列出的行必须原样）
            if not errs:
                replay = list(before)
                apply_rows(replay, [r for r in rows if r['path'] == rel])
                if replay != after:
                    d = [i + 1 for i, (x, y) in enumerate(zip(replay, after)) if x != y]
                    errs.append('重放后与工作区不同（行 %s；行数 %d vs %d）'
                                % (d[:3], len(replay), len(after)))
            if errs:
                bad += 1
                print('  VERIFY %-32s !! %s' % (os.path.basename(rel), '; '.join(errs[:3])))
            elif mine:
                print('  VERIFY %-32s OK  %d 行 %d 处：HEAD + 表 = 工作区，还原 = 父本行'
                      % (os.path.basename(rel), len(mine),
                         sum(len(v) for v in mine.values())))
        print('\nverify: %d/%d file(s) ok' % (len(list(rels())) - bad, len(list(rels()))))
        return 1 if bad else 0

    paths = sorted(set(r['path'] for r in rows))
    done, tot = 0, 0
    for rel in paths:
        bodies, eols = read_lines(rel)
        my = [r for r in rows if r['path'] == rel]
        before_odd = odd_blocks(bodies)
        if not my:
            continue
        try:
            apply_rows(bodies, my)
        except AssertionError as e:
            print('  ABORT %s' % e)
            return 2
        after_odd = odd_blocks(bodies)
        print('  %-42s %2d 处  奇数段 %d -> %d' % (os.path.relpath(rel, ROOT), len(my),
                                                   before_odd, after_odd))
        tot += len(my)
        if after_odd > 0:
            done += 1
        if mode == '--apply':
            write_lines(rel, bodies, eols)
    print()
    print('edits %d 处 in %d file(s)；仍有奇数段的文件 %d 个' % (tot, len(paths), done))
    if mode == '--dry-run':
        print('dry run: nothing written')
    return 0


if __name__ == '__main__':
    sys.exit(main())
