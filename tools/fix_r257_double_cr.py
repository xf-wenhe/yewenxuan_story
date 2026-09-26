# -*- coding: utf-8 -*-
"""R257 — V5 十章的行尾字节损坏：双回车 `\\r\\r\\n` + 孤行引号前的裸 CR

背景
    volume-5 有 10 章的 blob 里，行尾写成了 `\\r\\r\\n`（2,303 处），另有 21 处
    「`。` + 裸 CR + `"`」。git 的 safe-CRLF 规则规定：文件里含**孤立 `\\r`** 时
    判定行尾混杂，**整个文件跳过规范化** —— 所以这两类字节永久固化在仓库里，
    checkout/add 都清不掉；而任何按通用换行读法的工具都会把这些章的行号**翻倍**
    （2,303 个幻影行，历轮的锚点都得为此绕路）。

机制（同一次坏转换的产物）
    ① 换行被写成 `\\r\\r\\n`：多出来的那个 CR 会让 `split('\\n')` 多切出一行空行。
    ② 在 21 个**收尾引号**前插了一个多余 CR：`"大嘴，"叶文轩说，"你看地面上的纹路。\\r"`
       在把裸 CR 当换行的编辑器/转换器里，收尾引号被顶成**单独一行** —— 这就是账本
       记的「孤行引号族（ch552／563／617／618／679）」，与双回车族同源，故合并本轮。

判据（全库普查，零例外）
    · 含 `\\r\\r\\n` 的文件：恰好 10 个，全在 volume-5，合计 2,303 处。
    · 全库裸 CR（`\\r` 后不接 `\\n`）：恰好 21 处 / 5 文件；**CR 前一字 100% 是 `。`、
      CR 后一字 100% 是 `"`**。修法是**删掉这个 CR**（不是补 LF）：收尾引号应回到本行。

修法（两处，均为字节级、零内容改动）
    ① `\\r+\\n` -> `\\r\\n`（双回车、三连回车一律归一为一个 CRLF）
    ② `。\\r"` -> `。"`（删掉收尾引号前那个多余的 CR）

不变量（fail-closed，逐章断言；不满足即 ABORT，不写任何文件）
    · 字节数恰好减少 `crcr + lone`；除这些 CR 外逐字不动
    · 修后 `count(\\r) == count(\\r\\n)`（再无裸 CR），且再无 `\\r\\r\\n`
    · 汉字数逐章相等；逻辑行数不变
    · UTF-8 无 BOM；只接受「无裸 CR 之外全是 CRLF」的形态

工作区行尾
    仍写回 `\\r\\n`，与原工作区一致（全库工作区普遍 CRLF、blob 为 LF）。修完后文件
    不再含裸 CR，git 的 `text=auto` 恢复生效：**提交时 blob 归一为 LF**，与其余
    999 章的 blob 一致 —— 这正是 `.gitattributes`（`* text=auto eol=lf`）要求的状态。

用法
    python tools/fix_r257_double_cr.py            # 干跑
    python tools/fix_r257_double_cr.py --audit    # 只验证据链
    python tools/fix_r257_double_cr.py --apply    # 落盘（可重跑，幂等）
    python tools/fix_r257_double_cr.py --verify   # 从 HEAD 原始对象重放比对
    可选第二参数是章号/路径子串。
"""
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

BOM = b'\xef\xbb\xbf'
CJK = re.compile(r'[一-鿿]')
LONE = b'\xe3\x80\x82\x0d\x22'   # 。 CR "
KEEP = b'\xe3\x80\x82\x22'       # 。 "
CRCR = b'\r\r\n'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TABLE = os.path.join(HERE, 'r257_double_cr_sites.json')


def load():
    with io.open(TABLE, encoding='utf-8') as fh:
        return json.load(fh)


def repair(raw):
    """① 归一 CR 串 ② 删掉收尾引号前的裸 CR。"""
    return re.sub(rb'\r+\n', b'\r\n', raw).replace(LONE, KEEP)


def read_raw(rel):
    with open(os.path.join(ROOT, rel), 'rb') as fh:
        return fh.read()


def blob_raw(rev, rel):
    """原始对象字节（不经 smudge 过滤器，`git show` 会走过滤器，不能用）。"""
    p = subprocess.run(['git', 'cat-file', '--batch'], cwd=ROOT,
                       input=('%s:%s\n' % (rev, rel)).encode('utf-8'),
                       capture_output=True)
    head, _, rest = p.stdout.partition(b'\n')
    parts = head.split()
    if len(parts) < 3 or parts[1] != b'blob':
        return None
    return rest[:int(parts[2])]


def invariants(ch, raw, fixed):
    """返回问题列表；空表示全部通过。"""
    bad = []
    crcr, lone = raw.count(CRCR), raw.count(LONE)
    if raw.startswith(BOM):
        bad.append('BOM present')
    try:
        raw.decode('utf-8')
    except UnicodeDecodeError:
        bad.append('not utf-8')
    if len(raw) - len(fixed) != crcr + lone:
        bad.append('byte delta %d != %d' % (len(raw) - len(fixed), crcr + lone))
    if fixed.count(b'\r') != fixed.count(b'\r\n'):
        bad.append('lone CR left: %d' % (fixed.count(b'\r') - fixed.count(b'\r\n')))
    if CRCR in fixed:
        bad.append('double CR left: %d' % fixed.count(CRCR))
    if len(CJK.findall(raw.decode('utf-8', 'replace'))) != \
       len(CJK.findall(fixed.decode('utf-8', 'replace'))):
        bad.append('CJK count changed')
    if len(raw.replace(CRCR, b'\r\n')) - len(fixed) != lone:
        bad.append('non-CRCR changes besides lone CRs')
    return bad


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    only = sys.argv[2] if len(sys.argv) > 2 else None
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2

    all_sites = load()
    sites = [s for s in all_sites
             if only is None or only in s['path'] or only == str(s['chapter'])]
    print('R257  V5 十章行尾：双回车 + 孤行引号前的裸 CR')
    print('%d file(s) selected of %d\n' % (len(sites), len(all_sites)))
    if not sites:
        return 2

    if mode == '--audit':
        bad = 0
        for s in sites:
            raw = read_raw(s['path'])
            crcr, lone = raw.count(CRCR), raw.count(LONE)
            fixed = repair(raw)
            if crcr == 0 and lone == 0:
                print('  AUDIT %-31s -- already repaired' % os.path.basename(s['path']))
                continue
            if crcr != s['crcr'] or lone != s['lone']:
                print('  AUDIT %-31s !! table says %d/%d, file has %d/%d'
                      % (os.path.basename(s['path']), s['crcr'], s['lone'], crcr, lone))
                bad += 1
                continue
            if len(raw) != s['bytes_before']:
                print('  AUDIT %-31s !! bytes %d != %d'
                      % (os.path.basename(s['path']), len(raw), s['bytes_before']))
                bad += 1
                continue
            if s['path'].split('/')[1] != 'volume-5':
                print('  AUDIT %-31s !! not volume-5' % os.path.basename(s['path']))
                bad += 1
                continue
            errs = invariants(s['chapter'], raw, fixed)
            print('  AUDIT %-31s %s' % (os.path.basename(s['path']),
                                        'OK  %d+%d' % (crcr, lone) if not errs
                                        else '!! ' + '; '.join(errs)))
            if errs:
                bad += 1
        print('\naudit: %d/%d ok' % (len(sites) - bad, len(sites)))
        return 1 if bad else 0

    if mode == '--verify':
        bad = 0
        for s in sites:
            rel = s['path']
            head = blob_raw('HEAD', rel)
            if head is None:
                print('  VERIFY %-30s !! HEAD blob missing' % os.path.basename(rel))
                bad += 1
                continue
            cur = read_raw(rel)
            errs = invariants(s['chapter'], head, repair(head))
            if errs:
                print('  VERIFY %-30s !! HEAD side: %s'
                      % (os.path.basename(rel), '; '.join(errs)))
                bad += 1
                continue
            if repair(head) == cur:
                print('  VERIFY %-30s OK  重放 = 工作区（逐字节）%d+%d'
                      % (os.path.basename(rel), head.count(CRCR), head.count(LONE)))
            else:
                d = [i for i, (a, b) in enumerate(zip(repair(head), cur)) if a != b]
                print('  VERIFY %-30s !! 重放与工作区不同（首处偏移 %s，长度 %d vs %d）'
                      % (os.path.basename(rel), d[:1], len(repair(head)), len(cur)))
                bad += 1
        print('\nverify: %d/%d file(s) ok' % (len(sites) - bad, len(sites)))
        return 1 if bad else 0

    problems = []
    tot_c = tot_l = 0
    tot_before = tot_after = 0
    done = 0
    for s in sites:
        raw = read_raw(s['path'])
        crcr, lone = raw.count(CRCR), raw.count(LONE)
        fixed = repair(raw)
        if crcr == 0 and lone == 0:
            done += 1
            print('  ch%-4d -- already repaired' % s['chapter'])
            continue
        errs = invariants(s['chapter'], raw, fixed)
        if errs:
            problems.append((s['path'], '; '.join(errs)))
            print('  %-31s !! %s' % (os.path.basename(s['path']), '; '.join(errs)))
            continue
        tot_c += crcr
        tot_l += lone
        tot_before += len(raw)
        tot_after += len(fixed)
        print('  ch%-4d 双回车 %-4d 孤行 %-3d  字节 %d -> %d  逻辑行 %d（原读法多切 %d 个幻影行）'
              % (s['chapter'], crcr, lone, len(raw), len(fixed),
                 fixed.count(b'\r\n'), crcr - lone * 0))

    print()
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    print('edits %d 处 in %d file(s), %d already done; 字节 %d -> %d (%+d)'
          % (tot_c + tot_l, len(sites) - done, done,
             tot_before, tot_after, tot_after - tot_before))

    if mode == '--dry-run':
        print('dry run: nothing written')
        return 0

    for s in sites:
        raw = read_raw(s['path'])
        fixed = repair(raw)
        if fixed == raw:
            continue
        with open(os.path.join(ROOT, s['path']), 'wb') as fh:
            fh.write(fixed)
    print('applied: %d file(s)' % (len(sites) - done))

    left = 0
    for s in sites:
        raw = read_raw(s['path'])
        if raw.count(CRCR) or raw.count(LONE):
            print('  POST %-32s !! 仍有 双回车 %d / 裸 CR %d'
                  % (os.path.basename(s['path']), raw.count(CRCR), raw.count(LONE)))
            left += 1
    print('post-check: %d bad state(s)' % left)
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
