# -*- coding: utf-8 -*-
"""R262 — 「`有有` 焊字」族（R261 登记的 N1）：删掉重复的那个 `有`。

## 病灶是真凶认罪的

全库 `有有` 共 **65 处 / 49 章**，前一字分布 = 没 64 + 带 1（`带有有`）。
逐提交取证（`git log` 链上数每章 `有有` 的处数，看第一次从 0 跳起来的是哪次提交）：
**48 章全部是「0 -> N」跳变，没有一处是建章原文**。凶手三名：

    e0040d63  V2/V3/V5 periodless chain fix: 490 files modified      58 处
    99c9efa5  Batch de-AI fix: em-dash/negation/contrast cleanup      6 处
    9cd5e651  Voice rounds R133-R138 complete                          1 处（ch439 `带有有`）

那轮做「无句号链修复」时，把 `，没有A，没有B。` 形状的链**整段替换成一个 `有`**，
第一个 `没有` 的 `有` 被留下，于是焊出 `没有有`。difflib 字符级 opcode（ch68，`99c9efa5`）：

    父  …平台上什么都没有，没有脚印，没有痕迹。0428螺旋的蓝光…
    新  …平台上什么都没有有。0428螺旋的蓝光…
    （实际编辑 = `，没有脚印，没有痕迹。` -> `有。`）

所以每个 `没有有` 都是**被折叠掉的从句的墓碑**：它后面跟的往往是残句
（`没有有灰`、`没有有任`、`没有有墙没有有任`）。残句是另一族（塌缩/截断），
本轮**不碰**——`V5_引号修复计划.md` §八 明写不回填父本被删掉的词。

指纹核实：全库 `有有` 之外，行尾 `X有。`（X∉没/所）只有 9 处，全部是合法中文
（`都有。`/`也有。`/`我有。`/`占为己有。`/`0415碎片有。`）——**没有无标记的塌缩**，
即 `有有` 的处数就是这条 bug 的发射次数。`有有有` 全库仅 ch566 L45 一处
（塌缩叠加两次），删一个还剩 `有有`，形状不齐，**登记不修**，留给人工。

## 本轮只做一件事

删掉**第二个** `有`：
    `没有有` -> `没有`        `带有有` -> `带有`
只此一字，不添不减别的字符，不回填从句。修完 `没有有` 这一串在语法上不再可能
出现（现代汉语里 `没有` 后面不能直接跟动词性的 `有`）。

不变量（fail-closed）：
    ① 每一处 `有有` 的前一字必须 ∈ `没带`，否则**直接报错**（形状变了就得重新取证）；
    ② 每一章必须能证出「0 -> N」的跳变提交，证不出的**不修**、打印出来；
    ③ 含 `有有有` 的行（塌缩叠加）**不修**，只登记——删一个还剩 `有有`；
    ④ `--verify`：表 + HEAD 重放必须逐行等于工作区（同 R260/R261 的坑，
       不许从工作区重导，那样会在改完以后报「无可查」而假过）。

用法
    python tools/fix_r262_you_weld.py --scan | --build | --dry-run | --apply | --verify
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
from fix_r259_lost_quotes import blob, read_lines, write_lines      # noqa: E402

TABLE = os.path.join(ROOT, 'tools', 'r262_you_weld_sites.json')
CJK = re.compile(r'[一-鿿]')
CH = re.compile(r'chapter-(\d+)-polished\.md$')
PAIR = '有有'
WEIRD = '有有有'                     # 三连：塌缩叠加，删一个还剩 `有有`，本轮不修
BACK_OK = '没带'                     # 合法前一字：`没有有` / `带有有`


def run(args, data=None):
    return subprocess.run(args, cwd=ROOT, input=data, capture_output=True).stdout


def chapters():
    for i in range(1, 8):
        vol = 'volume-%d' % i
        d = os.path.join(ROOT, 'chapters', vol)
        for fn in sorted(os.listdir(d)):
            if CH.match(fn):
                yield int(CH.match(fn).group(1)), 'chapters/%s/%s' % (vol, fn)


def sites_in(bodies, rel='?'):
    """行体里所有 `有有`：(行号, 第一个 `有` 的列, 前一字, 行体)。前一字不在 `没带` 里就抛。"""
    out = []
    for i, ln in enumerate(bodies, start=1):
        for m in re.finditer(PAIR, ln):
            c = m.start()
            back = ln[c - 1] if c else ''
            if back not in BACK_OK:
                raise SystemExit('%s L%d 出现前一字为 %r 的 `%s`，形状变了，先重新取证：\n  %s'
                                 % (rel, i, back, PAIR, ln[max(0, c - 24):c + 24]))
            out.append((i, c, back, ln))
    return out


def sites_of(rel):
    return sites_in(read_lines(rel)[0], rel)


def blame(rel):
    """该章 `有有` 计数从 0 跳起来的提交：返回 (src, subject, before, after) 或 None。"""
    rows = [x.split('\t', 1) for x in
            run(['git', 'log', '--format=%h\t%s', '--', rel]).decode('utf-8').split('\n')
            if x.strip()]
    rv = [r[0] for r in rows]
    subj = {r[0]: (r[1] if len(r) > 1 else '') for r in rows}
    rv = list(reversed(rv)) + ['HEAD']
    p = run(['git', 'cat-file', '--batch'],
            ('\n'.join('%s:%s' % (r, rel) for r in rv) + '\n').encode('utf-8'))
    cnt, buf = [], p
    for _ in rv:
        head, _, rest = buf.partition(b'\n')
        size = int(head.split()[2])
        body, buf = rest[:size], rest[size + 1:]
        cnt.append(body.decode('utf-8').count(PAIR))
    for k in range(1, len(cnt)):
        if cnt[k] and not cnt[k - 1]:
            return rv[k], subj.get(rv[k], ''), cnt[k - 1], cnt[k]
    return None


def collect():
    """返回 (可修的行, 证不出来的章, 形状异常的处)。后两类只登记，不修。"""
    rows, unprov, odd = [], [], []
    for ch, rel in chapters():
        got = sites_of(rel)
        if not got:
            continue
        b = blame(rel)
        if not b:
            unprov.append((ch, rel, len(got)))
            continue
        for i, c, back, ln in got:
            if WEIRD in ln:                             # 删一个还剩 `有有`，形状不齐，让位人工
                odd.append((ch, rel, i, ln.strip()))
                continue
            rows.append(dict(chapter=ch, path=rel, line=i, col=c, back=back,
                             now=ln, src=b[0], subj=b[1], before=b[2], after=b[3]))
    rows.sort(key=lambda r: (r['path'], r['line'], r['col']))
    return rows, unprov, odd


def cjk_of(rel):
    bodies, _ = read_lines(rel)
    return sum(len(CJK.findall(x)) for x in bodies)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    rows, unprov, odd = collect()
    nfile = len(set(r['path'] for r in rows))
    print('全库 `%s`：%d 处 / %d 章（可修 %d，登记不修 %d）'
          % (PAIR, len(rows) + len(odd), len(set(r['path'] for r in rows)) + len(set(x[1] for x in odd)),
             len(rows), len(odd)))
    print('凶手分布：%s'
          % dict(collections.Counter(r['src'] + ' ' + r['subj'][:34] for r in rows).most_common()))
    print('前一字分布：%s' % dict(collections.Counter(r['back'] for r in rows).most_common()))
    if unprov:
        print('\n!! 证不出跳变的章（本轮不修）：%s' % unprov)
        return 1
    if odd:
        print('\n登记不修（形状异常 %d 处）：' % len(odd))
        for ch, rel, i, s in odd:
            print('   ch%-4d L%-4d %s' % (ch, i, s[-30:]))

    if mode == '--scan':
        for r in rows:
            c = r['col']
            print('\nch%-4d L%-4d src=%s  %s' % (r['chapter'], r['line'], r['src'],
                                                '删第二个「有」：`%s` -> `%s`'
                                                % (r['now'][c - 1:c + 2],
                                                   r['now'][c - 1] + r['now'][c])))
            print('   现值 …%s【%s】%s…' % (r['now'][max(0, c - 18):c], PAIR,
                                          r['now'][c + 2:c + 22]))
            print('   修后 …%s【%s】%s…' % (r['now'][max(0, c - 18):c],
                                          r['now'][c - 1] + r['now'][c],
                                          r['now'][c + 2:c + 22]))
        return 0

    if mode == '--build':
        with io.open(TABLE, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
        print('wrote %s（%d 条 / %d 章；%s；另有登记不修 %d 处）'
              % (os.path.relpath(TABLE, ROOT), len(rows), nfile,
                 dict(collections.Counter(r['src'] for r in rows)), len(odd)))
        return 0

    if mode == '--verify':
        with io.open(TABLE, encoding='utf-8') as fh:
            tbl = json.load(fh)
        want = collections.defaultdict(list)
        for r in tbl:
            want[r['path']].append(r)
        bad = 0
        # 后置条件：改完后全库还带 `有有` 的文件，只许是登记不修的那一处
        leftover = {}
        for ch, rel in chapters():
            got = sites_of(rel)
            if got:
                leftover[rel] = len(got)
        reg = collections.Counter(x[1] for x in odd)
        if leftover != dict(reg):
            bad += 1
            print('  !! 全库残余 %s，登记的是 %s' % (leftover, dict(reg)))
        else:
            print('  残余检查 OK：全库只剩登记不修的 %s' % dict(reg))
        for rel in sorted(want):
            before = (blob('HEAD', rel) or '').replace('\r\n', '\n').split('\n')
            after, _ = read_lines(rel)
            errs = []
            b = blame(rel)
            if not b or b[:2] != (want[rel][0]['src'], want[rel][0]['subj']):
                errs.append('归因不符')
            derived = sites_in(before, rel)               # 从 **HEAD** 推处数，不从工作区
            if len(derived) != len(want[rel]):
                errs.append('%s 的处数 HEAD %d != 表 %d' % (PAIR, len(derived), len(want[rel])))
            # 一行可能有多个 `有有`：按行分组，从该行原始行体上删列位，列位由高到低
            replay = list(before)
            byline = collections.defaultdict(list)
            for r in want[rel]:
                byline[r['line']].append(r)
            for li, rs in byline.items():
                ln = rs[0]['now']
                for r in sorted(rs, key=lambda r: -r['col']):
                    c = r['col']
                    if r['now'][c - 1:c + 2] != r['back'] + PAIR:
                        errs.append('L%d 列位不符' % li)
                        break
                    ln = ln[:c + 1] + ln[c + 2:]
                replay[li - 1] = ln
            if not errs and replay != after:
                d = [i + 1 for i, (x, y) in enumerate(zip(replay, after)) if x != y]
                errs.append('重放后与工作区不同（行 %s；%d vs %d）' % (d[:3], len(replay), len(after)))
            if errs:
                bad += 1
                print('  VERIFY %-42s !! %s' % (os.path.basename(rel), '; '.join(errs[:3])))
            else:
                print('  VERIFY %-42s OK  %d 处：HEAD 减第二个「有」= 工作区'
                      % (os.path.basename(rel), len(want[rel])))
        print('\nverify: %d/%d file(s) ok' % (len(want) - bad, len(want)))
        return 1 if bad else 0

    # --dry-run / --apply
    tot, thin = 0, []
    for rel in sorted(set(r['path'] for r in rows)):
        bodies, eols = read_lines(rel)
        mine = [r for r in rows if r['path'] == rel]
        was = cjk_of(rel)
        byline = collections.defaultdict(list)          # 一行可能有多个 `有有`
        for r in mine:
            byline[r['line']].append(r)
        for li, rs in byline.items():
            ln = rs[0]['now']
            if bodies[li - 1] != ln:
                raise SystemExit('%s L%d 行体与表不符，abort' % (rel, li))
            for r in sorted(rs, key=lambda r: -r['col']):
                c = r['col']
                assert ln[c - 1:c + 2] == r['back'] + PAIR, '%s L%d 列位不符' % (rel, li)
                ln = ln[:c + 1] + ln[c + 2:]
            bodies[li - 1] = ln
        now_cjk = sum(len(CJK.findall(x)) for x in bodies)
        flag = ''
        if now_cjk < 3000:
            flag = '  <<< 低于 3000'
            thin.append((os.path.basename(rel), now_cjk))
        print('  %-42s %2d 处  CJK %d -> %d%s'
              % (os.path.relpath(rel, ROOT), len(mine), was, now_cjk, flag))
        tot += len(mine)
        if mode == '--apply':
            write_lines(rel, bodies, eols)
    print()
    print('edits %d 处 in %d file(s)；CJK 合计 -%d' % (tot, nfile, tot))
    if thin:
        print('注意：以下章修后低于 3000 CJK（补字轮未跑）：%s' % thin)
    if mode == '--dry-run':
        print('dry run: nothing written')
    return 0


if __name__ == '__main__':
    sys.exit(main())
