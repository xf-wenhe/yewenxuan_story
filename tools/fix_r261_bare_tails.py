# -*- coding: utf-8 -*-
"""R261 — 「裸尾」族：句末标点被吃掉的**可证子集**（20 处 / 16 章）。

R260 收口奇数引号族时，抽样里露出 `但朵朵醒着的时候不知道那些记忆是外来` 这类
**句子断在半句**的行。本轮把它量到底：全库叙述裸尾（行尾无终止标点、不在代码
围栏/引用块/标题/列表里）共 **153 处 / 84 章**。

成因（祖先可证的那一档）已确认：去 AI 轮为消灭「不是A而是B」句式，删掉
`，不是…` 从句时把**句末标点一起吃了**：

    祖先  …他没看见叶文轩为别人哭过。洞察者是为真相哭的，不是为别人哭的。
    现值  …他没看见叶文轩为别人哭过。洞察者是为真相哭的

本轮**只补句末标点**，不回填被有意删掉的从句——`V5_引号修复计划.md` §八 明写
「隐喻简化」等属既定简化，不回填父本被有意删掉的词。

取证（同 R260，全史按行建索引，要求**唯一**）：
    在某个历史修订里找**以该行开头、且更长**的行 x，要求该修订里这样的 x **唯一**；
    续文 cont = x[len(行):] 必须**以 `，` 或 `。` 起头**（＝被删的是本句/后一句的
    延续，不是无关的新段落），长度 ≤ 80 字，且 x 整行以终止标点收尾。
    kind 分类：
      A  续文以 `，不是`/`，不`/`，而` 起头 —— **对比从句被删**（15 处）
      E  续文以 `，` 起头但是同句的后续从句，如 ch799 `…运行方式是安静的`（1 处）
      F  续文以 `。` 起头 —— **后一句被删**，本句仍缺句号，如 ch804（4 处）
    补的字符一律取**祖先整行的末位字符**，且必须 ∈ `。！？…`（**不许是引号**，
    否则会给没有开引号的行补出悬挂引号，制造 R258 那类新伤）。
    长度上限 80 是防**焊接祖先**的兜底：若 x 是把两段焊在一起的长行，现值可能只是
    它的前半段，续文会是无头的新句子。实测把上限从 40 放到 200，**只多出 ch799 那
    4 处、没有任何焊接行被捞进来** —— 真正的闸门是「续文以 `，`/`。` 起头」，
    上限只是第二道保险。

排除（不是损伤，登记不修）：
    cont 以 `（第` 起头 —— 旧格式把 `（第X章完）` 焊在段尾，后来才移到独立行。

NO-EDIT 登记（证不出来的 133 处，按形状分子族，为后续轮次备料）：
    N1 `没有有…`（焊字，R255 `了了`/`在在` 的姊妹族）
    N2 `0429在说：…` 类碎片讯息行没有收尾标点
    N3 行内重复（同一段 ≥8 字的子串在一行里出现两次＝焊接/复读）
    N4 逗号插入（ch698-705 那类 `到达，前` `必须，的`）
    N5 其他

不变量（fail-closed）：全库每一处裸尾 ∈ 本表 ∪ 上述五个子族之一，一个都不许漏；
修后裸尾总数只减不增，且**减量恰等于本表行数**。

用法
    python tools/fix_r261_bare_tails.py --scan | --build | --dry-run | --apply | --verify
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
from fix_r259_lost_quotes import DQ, blob, read_lines, write_lines   # noqa: E402

TABLE = os.path.join(ROOT, 'tools', 'r261_bare_tail_sites.json')
CJK = re.compile(r'[一-鿿]')
CH = re.compile(r'chapter-(\d+)-polished\.md$')
TERM = '。！？…”"）」』）*~—…:：;；,，、'
SKIP_HEAD = ('#', '>', '-', '*', '|', '`', ' ')
STOP = '。！？…'
APPEND = '。！？…'                       # 允许补的字符：不许引号
MAX_CONT = 80                            # 续文长度上限：防**焊接祖先**（见 docstring）


def run(args, data=None):
    return subprocess.run(args, cwd=ROOT, input=data, capture_output=True).stdout


def chapters():
    for i in range(1, 8):
        vol = 'volume-%d' % i
        d = os.path.join(ROOT, 'chapters', vol)
        for fn in sorted(os.listdir(d)):
            if CH.match(fn):
                yield int(CH.match(fn).group(1)), 'chapters/%s/%s' % (vol, fn)


def bare_tails(rel):
    """叙述裸尾：(行号, 原文, 去掉行尾空白后的文本)。"""
    bodies, _ = read_lines(rel)
    out, fence = [], False
    for i, ln in enumerate(bodies, start=1):
        s = ln.rstrip()
        if s.startswith('```') or s.startswith('~~~'):
            fence = not fence
            continue
        if fence or not s or s.startswith(SKIP_HEAD):
            continue
        if s[-1] in TERM or not CJK.match(s[-1]):
            continue
        out.append((i, ln, s))
    return out


def hist_of(rel):
    rv = run(['git', 'log', '--format=%h', '--', rel]).decode().split()
    rv = list(reversed(rv)) + ['HEAD']
    p = run(['git', 'cat-file', '--batch'],
            ('\n'.join('%s:%s' % (r, rel) for r in rv) + '\n').encode('utf-8'))
    out, hist = p, []
    for _ in rv:
        head, _, rest = out.partition(b'\n')
        size = int(head.split()[2])
        body, out = rest[:size], rest[size + 1:]
        hist.append(body.decode('utf-8').replace('\r\n', '\n').split('\n'))
    return rv, hist


def prove(rel, s, hist, rv):
    """祖先取证：返回 (src, 祖先行, 续文) 或 None。要求该修订里唯一。"""
    for k in range(len(hist) - 2, -1, -1):          # 新 -> 旧（跳过 HEAD）
        cand = [x for x in hist[k] if x.startswith(s) and len(x) > len(s)]
        if len(cand) > 1:
            return None                             # 不唯一 ⇒ 证不出
        if len(cand) == 1:
            return rv[k], cand[0], cand[0][len(s):]
    return None


def kind_of(x, cont):
    """分类；不可修返回 None。"""
    if cont.startswith('（第'):
        return None                                 # 旧格式的章末标记，不是损伤
    if x[-1] not in STOP or x[-1] not in APPEND:
        return None
    if len(cont) > MAX_CONT:
        return None
    if cont.startswith('，不是') or cont.startswith('，不') or cont.startswith('，而'):
        return 'A'
    if cont[0] == '。':
        return 'F'
    if cont[0] == '，':
        return 'E'
    return None


def family(s):
    """证不出来的裸尾按形状分子族（登记用）。顺序即优先级。"""
    if '没有有' in s:
        return 'N1 没有有（焊字）'
    if re.search(r'在说[:：]', s):
        return 'N2 碎片讯息无收尾'
    grams = [s[i:i + 8] for i in range(len(s) - 7)]
    if len(grams) != len(set(grams)) or s.count('"') >= 4:
        return 'N3 行内重复/焊接'
    if s.count('，') >= 5 or re.search(r'，(的|前|到达|导出|传输|运行|意识|答案)$', s):
        return 'N4 逗号插入'
    return 'N5 其他'


def collect():
    rows, reg = [], collections.Counter()
    regs = collections.defaultdict(list)
    for ch, rel in chapters():
        tails = bare_tails(rel)
        if not tails:
            continue
        rv, hist = hist_of(rel)
        for i, raw, s in tails:
            got = prove(rel, s, hist, rv)
            k = kind_of(got[1], got[2]) if got else None
            if k:
                rows.append(dict(chapter=ch, path=rel, line=i, char=got[1][-1],
                                 kind=k, parent=got[1], now=s, src=got[0]))
                continue
            f = family(s)
            reg[f] += 1
            regs[f].append((ch, i, s))
    rows.sort(key=lambda r: (r['path'], r['line']))
    return rows, reg, regs


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    rows, reg, regs = collect()
    total = len(rows) + sum(reg.values())
    print('全库叙述裸尾 %d 处 = 本表 %d + 登记 %d' % (total, len(rows), sum(reg.values())))
    print('登记分族：')
    for k, v in reg.most_common():
        print('   %-22s %3d 处  例：ch%-4d %s' % (k, v, regs[k][0][0], regs[k][0][2][-24:]))

    if mode == '--scan':
        for f in sorted(regs):
            print('\n--- %s' % f)
            for ch, i, s in regs[f]:
                print('  ch%-4d L%-4d …%s' % (ch, i, s[-36:]))
        print('\n--- 本表（%d 处）' % len(rows))
        for r in rows:
            print('  ch%-4d L%-4d %s 补「%s」 src=%s' % (r['chapter'], r['line'], r['kind'],
                                                        r['char'], r['src']))
            print('     现值 …%s' % r['now'][-40:])
            print('     祖先 …%s' % r['parent'][-40:])
        return 0

    if mode == '--build':
        with io.open(TABLE, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(json.dumps(rows, ensure_ascii=False, indent=1) + '\n')
        print('wrote %s（%d 条 / %d 章；%s）'
              % (os.path.relpath(TABLE, ROOT), len(rows),
                 len(set(r['path'] for r in rows)),
                 dict(collections.Counter(r['kind'] for r in rows))))
        return 0

    if mode == '--verify':
        with io.open(TABLE, encoding='utf-8') as fh:
            tbl = json.load(fh)
        bad, n = 0, 0
        for rel in sorted(set(r['path'] for r in tbl)):
            n += 1
            before = (blob('HEAD', rel) or '').replace('\r\n', '\n').split('\n')
            after, _ = read_lines(rel)
            rv, hist = hist_of(rel)
            mine = collections.defaultdict(list)
            for r in tbl:
                if r['path'] == rel:
                    mine[r['line']].append(r)
            errs = []
            for li, rs in mine.items():
                s = before[li - 1].rstrip()
                got = prove(rel, s, hist, rv)
                if not got or got[1] != rs[0]['parent'] or got[0] != rs[0]['src']:
                    errs.append('L%d 祖先链重导不符' % li)
                    continue
                if kind_of(got[1], got[2]) != rs[0]['kind']:
                    errs.append('L%d 分类不符' % li)
            if not errs:                                # HEAD + 表 == 工作区
                replay = list(before)
                for li, rs in mine.items():
                    replay[li - 1] = replay[li - 1][:len(rs[0]['now'])] + rs[0]['char'] \
                        + replay[li - 1][len(rs[0]['now']):]
                if replay != after:
                    d = [i + 1 for i, (x, y) in enumerate(zip(replay, after)) if x != y]
                    errs.append('重放后与工作区不同（行 %s；行数 %d vs %d）'
                                % (d[:3], len(replay), len(after)))
            if errs:
                bad += 1
                print('  VERIFY %-40s !! %s' % (os.path.basename(rel), '; '.join(errs[:3])))
            else:
                print('  VERIFY %-40s OK  %d 行：HEAD + 表 = 工作区，祖先链重导相符'
                      % (os.path.basename(rel), len(mine)))
        print('\nverify: %d/%d file(s) ok' % (n - bad, n))
        return 1 if bad else 0

    tot = 0
    for rel in sorted(set(r['path'] for r in rows)):
        bodies, eols = read_lines(rel)
        mine = [r for r in rows if r['path'] == rel]
        before = len(bare_tails_raw(bodies))
        for r in sorted(mine, key=lambda r: -r['line']):
            ln = bodies[r['line'] - 1]
            assert ln.rstrip() == r['now'], '行 %d 与表里的现值不符' % r['line']
            bodies[r['line'] - 1] = ln.rstrip() + r['char'] + ln[len(ln.rstrip()):]
        print('  %-42s %d 处  裸尾 %d -> %d'
              % (os.path.relpath(rel, ROOT), len(mine), before, len(bare_tails_raw(bodies))))
        tot += len(mine)
        if mode == '--apply':
            write_lines(rel, bodies, eols)
    print()
    print('edits %d 处 in %d file(s)' % (tot, len(set(r['path'] for r in rows))))
    if mode == '--dry-run':
        print('dry run: nothing written')
    return 0


def bare_tails_raw(bodies):
    """只用于统计：给已改好的行体数裸尾。"""
    out, fence = [], False
    for i, ln in enumerate(bodies, start=1):
        s = ln.rstrip()
        if s.startswith('```') or s.startswith('~~~'):
            fence = not fence
            continue
        if fence or not s or s.startswith(SKIP_HEAD):
            continue
        if s[-1] in TERM or not CJK.match(s[-1]):
            continue
        out.append((i, ln, s))
    return out


if __name__ == '__main__':
    sys.exit(main())
