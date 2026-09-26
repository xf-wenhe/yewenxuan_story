# -*- coding: utf-8 -*-
"""R258 — 半角撇号当引号用的「专轮」（V5_引号修复计划.md §九 line 190/214 点名待立）。

背景
    全库 ASCII 撇号 `'` 共 505 个。撇开英文缩写（`you're`）与代码文本，其余都是
    拿 `'` 当引号：241 对 + 6 个只有开头的残缺引号。这些**不是历轮破坏**——
    pickaxe 溯源 15/16 判定为 ORIG（原稿自带，见 .claude/tmp/r258_prov.json），
    所以本轮是**统一到本书自己的写法**，不是回填父本。

判据（四类，全部有库内原文先例）
    NEST_DQ  撇号对在 `"…"` 台词内部（嵌套）      -> `‘…’`
             先例：V7 原文 11 处，如 ch931 `"又把‘自己承担’说得像一句好话。…"`
    NEST_CB  撇号对在 `「…」`（系统消息/标签）内部  -> `『…』`
             先例：ch100 `「考核奖励：…『结构笔记』x1。…」`
    PRIMARY  撇号对就是台词本身（叙述里的报告语）   -> `"…"`，缺收尾的补上
             先例：计划 §九 line 190/214 的既有修法（B1b 把 ch566 三处「改回 `"` 并
             补上收尾引号」）；库内 `说："` 170 例 vs `说：'` 6 例
    CODE     代码文本（`'loop'`、`'''`、`marker = '`）与英文缩写 -> 原样不动
             先例：ch75 `「if (thought.contains('loop')) { blur(memory); }」`

用法
    python tools/fix_r258_apostrophes.py --build   # 生成 tools/r258_apostrophe_sites.json
    python tools/fix_r258_apostrophes.py           # 干跑
    python tools/fix_r258_apostrophes.py --audit   # 只验证据链
    python tools/fix_r258_apostrophes.py --apply   # 落盘（幂等）
    python tools/fix_r258_apostrophes.py --verify  # 从 HEAD 原始对象重放比对
"""
import collections
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TABLE = os.path.join(HERE, 'r258_apostrophe_sites.json')
CJK = re.compile(r'[一-鿿]')
BOM = b'\xef\xbb\xbf'
APOS = "'"
DQ, CB_O, CB_C = '"', '「', '」'
NEST_DQ = ('‘', '’')     # ‘ ’
NEST_CB = ('『', '』')     # 『 』
SPEECH = ('说：', '说，', '说', '传来：', '传来', '道：', '道')


def walk():
    base = os.path.join(ROOT, 'chapters')
    for vol in sorted(os.listdir(base)):
        d = os.path.join(base, vol)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if re.match(r'chapter-\d+-polished\.md$', fn):
                yield 'chapters/%s/%s' % (vol, fn)


def read_lines(rel):
    """按 \\n 切、保留行尾 \\r（EOL 原样）。"""
    with io.open(os.path.join(ROOT, rel), encoding='utf-8', newline='') as fh:
        return fh.read().split('\n')


def pairs(line):
    """按出现顺序切 `'…'`；返回 (pairs, singles)。"""
    pos = [m.start() for m in re.finditer(APOS, line)]
    prs, used, i = [], set(), 0
    while i + 1 < len(pos):
        a, b = pos[i], pos[i + 1]
        if APOS in line[a + 1:b]:
            i += 1
            continue
        prs.append((a, b))
        used.update((a, b))
        i += 2
    return prs, [p for p in pos if p not in used]


def is_code(line, a, b):
    """代码文本 / 英文缩写？"""
    if APOS * 3 in line:
        return True
    if re.search(r'\w\s*=\s*$', line[:a]):
        return True          # marker = '
    if a and b + 1 < len(line) and line[a - 1].isascii() and line[a - 1].isalpha() \
            and line[b + 1].isascii() and line[b + 1].isalpha():
        return True          # you're / it's
    span = enclosing(line, a, b, CB_O, CB_C)
    if span and re.search(r'[(){}=;]', span) and re.search(r'[A-Za-z]{2,}', span):
        return True          # 「…code…」
    return False


def enclosing(line, a, b, op, cl):
    """a..b 是否落在某个 op…cl 里（返回该 span 的文本）。"""
    o = line.rfind(op, 0, a + 1)
    if o < 0:
        return None
    c = line.find(cl, b)
    if c < 0:
        return None
    return line[o + 1:c]


def classify(line, a, b):
    """返回 (kind, why)。a=开撇号位置，b=收撇号位置（单撇号时 b=None）。"""
    if is_code(line, a, b if b is not None else a):
        return 'CODE', '代码文本/英文缩写'
    if line[:a].count(DQ) % 2:
        return 'NEST_DQ', '嵌套在 "…" 台词内'
    if enclosing(line, a, b if b is not None else a, CB_O, CB_C):
        return 'NEST_CB', '嵌套在 「…」 内'
    head = line[max(0, a - 8):a]          # 撇号之前，不含撇号本身
    for v in SPEECH:
        if head.endswith(v) or head.endswith(v + '：') or head.endswith(v + '，'):
            return 'PRIMARY', '报告语后的台词位点'
    if b is None:
        if not line[:a].strip():
            return 'PRIMARY', '整行即台词的孤儿开引号'
        return 'NEST_DQ', '孤儿开引号（外层引号已损）'
    return 'NEST_DQ', '台词（无引号体）内的引语'


def end_of_line(line):
    """行尾插引号的位置（跳过 EOL 的 \\r）。"""
    p = len(line)
    while p and line[p - 1] == '\r':
        p -= 1
    return p


def build():
    rows, noedit = [], []
    per = collections.Counter()
    why = collections.Counter()
    code_seen = set()

    def note_code(ch, rel, li, line, reason):
        """CODE 行按**每个撇号**登记（`'''` 记 3 个）。"""
        for m in re.finditer(APOS, line):
            key = (rel, li, m.start() + 1)
            if key in code_seen:
                continue
            code_seen.add(key)
            noedit.append(dict(chapter=ch, path=rel, line=li, col=m.start() + 1,
                               kind='CODE', why=reason, text=line[:160]))

    for rel in walk():
        ch = int(re.search(r'chapter-(\d+)', rel).group(1))
        for li, line in enumerate(read_lines(rel), 1):
            if APOS not in line:
                continue
            prs, singles = pairs(line)
            for a, b in prs:
                kind, reason = classify(line, a, b)
                if kind == 'CODE':
                    note_code(ch, rel, li, line, reason)
                    continue
                op, cl = {'NEST_DQ': NEST_DQ, 'NEST_CB': NEST_CB,
                          'PRIMARY': (DQ, DQ)}[kind]
                rows.append(dict(chapter=ch, path=rel, line=li, col=a + 1,
                                 old=APOS, new=op, kind=kind, why=reason,
                                 text=line[:200]))
                rows.append(dict(chapter=ch, path=rel, line=li, col=b + 1,
                                 old=APOS, new=cl, kind=kind, why=reason,
                                 text=line[:200]))
                per[kind] += 1
                why[reason] += 1
            for p in singles:
                kind, reason = classify(line, p, None)
                if kind == 'CODE':
                    note_code(ch, rel, li, line, reason)
                    continue
                opener = {'PRIMARY': DQ, 'NEST_DQ': NEST_DQ[0], 'NEST_CB': NEST_CB[0]}[kind]
                closer = {'PRIMARY': DQ, 'NEST_DQ': NEST_DQ[1], 'NEST_CB': NEST_CB[1]}[kind]
                if line[p + 1:].find(APOS) < 0:      # 本行之后没有收尾 -> 要补
                    ins = end_of_line(line)
                    rows.append(dict(chapter=ch, path=rel, line=li, col=ins + 1,
                                     old='', new=closer, kind=kind,
                                     why='补收尾引号（原缺）', text=line[:200]))
                    per['补引号'] += 1
                rows.append(dict(chapter=ch, path=rel, line=li, col=p + 1,
                                 old=APOS, new=opener, kind=kind, why=reason,
                                 text=line[:200]))
                per[kind] += 1
                why[reason] += 1
    rows.sort(key=lambda r: (r['path'], r['line'], r['col']))
    noedit.sort(key=lambda r: (r['path'], r['line'], r['col']))

    # fail-closed：全库每个撇号必须被「改动表」或「CODE 登记」覆盖
    edit_at = set((r['path'], r['line'], r['col']) for r in rows if r['old'])
    total, uncovered = 0, []
    for rel in walk():
        for li, line in enumerate(read_lines(rel), 1):
            for m in re.finditer(APOS, line):
                total += 1
                key = (rel, li, m.start() + 1)
                if key not in edit_at and key not in code_seen:
                    uncovered.append(key)
    if uncovered:
        print('ABORT: %d 个撇号未被覆盖，例：%s' % (len(uncovered), uncovered[:6]))
        return None, None
    print('覆盖自检：全库 %d 个撇号 = 改动 %d + CODE 登记 %d'
          % (total, len(edit_at), len(code_seen)))
    print('=' * 78)
    print('撇号引号站点：%s' % dict(per))
    print('判据分布：%s' % dict(why))
    print('原样登记（CODE）：%d 个撇号 / %d 行'
          % (len(code_seen), len(set((r['path'], r['line']) for r in noedit))))
    print('=' * 78)
    for k in ('NEST_DQ', 'NEST_CB', 'PRIMARY'):
        n = [r for r in rows if r['kind'] == k and r['old']]
        vs = collections.Counter(r['path'].split('/')[1] for r in n)
        print('%-8s %4d 处 / %3d 章  %s' % (k, len(n), len(set(r['path'] for r in n)), dict(vs)))
    print('=' * 78)
    for k in ('NEST_CB', 'PRIMARY'):
        print('--- %s ---' % k)
        for r in [x for x in rows if x['kind'] == k][:16]:
            print('  ch%-4d L%-4d c%-3d -> %r  %s' % (r['chapter'], r['line'], r['col'],
                                                      r['new'], r['text'][:110]))
    print('--- CODE 登记 ---')
    for r in noedit[:24]:
        print('  ch%-4d L%-4d c%-3d %s' % (r['chapter'], r['line'], r['col'], r['text'][:110]))
    with io.open(TABLE, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
    with io.open(os.path.join(ROOT, '.claude', 'tmp', 'r258_noedit.json'), 'w',
                 encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(noedit, ensure_ascii=False, indent=1) + '\n')
    print('wrote %s（%d 条）' % (os.path.relpath(TABLE, ROOT), len(rows)))
    return rows, noedit


def load():
    with io.open(TABLE, encoding='utf-8') as fh:
        return json.load(fh)


def apply_rows(lines, rows):
    """按行分组、列号降序落位；返回改动行数。"""
    byline = collections.defaultdict(list)
    for r in rows:
        byline[r['line']].append(r)
    n = 0
    for li, rs in byline.items():
        line = lines[li - 1]
        for r in sorted(rs, key=lambda r: -r['col']):
            c = r['col'] - 1
            if r['old']:
                if line[c:c + 1] != r['old']:
                    raise AssertionError('ch%s L%d c%d: 期望 %r 实为 %r'
                                         % (r['chapter'], li, r['col'], r['old'],
                                            line[c:c + 1]))
                line = line[:c] + r['new'] + line[c + 1:]
            else:
                line = line[:c] + r['new'] + line[c:]
        lines[li - 1] = line
        n += 1
    return n


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    if mode == '--build':
        build()
        return 0
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2
    rows = load()
    if mode == '--audit':
        bad = 0
        for r in rows:
            lines = read_lines(r['path'])
            line = lines[r['line'] - 1]
            c = r['col'] - 1
            ok = (line[c:c + 1] == r['old']) if r['old'] else True
            if not ok:
                print('  AUDIT ch%-4d L%-4d c%-3d !! 期望 %r 实为 %r'
                      % (r['chapter'], r['line'], r['col'], r['old'], line[c:c + 1]))
                bad += 1
        print('audit: %d/%d ok' % (len(rows) - bad, len(rows)))
        return 1 if bad else 0

    if mode == '--verify':
        bad = 0
        paths = sorted(set(r['path'] for r in rows))
        for rel in paths:
            head = blob_raw('HEAD', rel)
            if head is None:
                print('  VERIFY %-32s !! HEAD blob missing' % os.path.basename(rel))
                bad += 1
                continue
            hl = head.decode('utf-8').split('\n')
            my = [r for r in rows if r['path'] == rel]
            try:
                apply_rows(hl, my)
            except AssertionError as e:
                print('  VERIFY %-32s !! %s' % (os.path.basename(rel), e))
                bad += 1
                continue
            cur = read_lines(rel)
            a = '\n'.join(hl).replace('\r\n', '\n')
            b = '\n'.join(cur).replace('\r\n', '\n')
            if a == b:
                print('  VERIFY %-32s OK  重放 = 工作区（忽略 EOL：blob=LF 工作区=CRLF）%d 处'
                      % (os.path.basename(rel), len(my)))
            else:
                d = [i for i, (x, y) in enumerate(zip(a, b)) if x != y]
                print('  VERIFY %-32s !! 重放与工作区不同（首处偏移 %s，长度 %d vs %d）'
                      % (os.path.basename(rel), d[:1], len(a), len(b)))
                bad += 1
        print('\nverify: %d/%d file(s) ok' % (len(paths) - bad, len(paths)))
        return 1 if bad else 0

    paths = sorted(set(r['path'] for r in rows))
    tot = collections.Counter()
    done = 0
    for rel in paths:
        lines = read_lines(rel)
        my = [r for r in rows if r['path'] == rel]
        live = [r for r in my if r['old'] and lines[r['line'] - 1][r['col'] - 1:r['col']] == r['old']]
        if not live:
            done += 1
            continue
        before = '\n'.join(lines)
        try:
            apply_rows(lines, my)
        except AssertionError as e:
            print('  ABORT %s' % e)
            return 2
        after = '\n'.join(lines)
        if len(CJK.findall(before)) != len(CJK.findall(after)):
            print('  ABORT %s: CJK 数变了' % rel)
            return 2
        for r in my:
            tot[r['kind']] += 1
        print('  %-40s %2d 处  %+d 字符' % (os.path.relpath(rel, ROOT), len(my),
                                            len(after) - len(before)))
        if mode == '--apply':
            with io.open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as fh:
                fh.write(after)
    print()
    print('edits %d 处 in %d file(s)，%d already done；分类 %s'
          % (sum(tot.values()), len(paths) - done, done, dict(tot)))
    if mode == '--dry-run':
        print('dry run: nothing written')
    return 0


def blob_raw(rev, rel):
    """原始对象字节（`git show` 会走 smudge 过滤器，不能用）。"""
    p = subprocess.run(['git', 'cat-file', '--batch'], cwd=ROOT,
                       input=('%s:%s\n' % (rev, rel)).encode('utf-8'),
                       capture_output=True)
    head, _, rest = p.stdout.partition(b'\n')
    parts = head.split()
    if len(parts) < 3 or parts[1] != b'blob':
        return None
    return rest[:int(parts[2])]


if __name__ == '__main__':
    sys.exit(main())
