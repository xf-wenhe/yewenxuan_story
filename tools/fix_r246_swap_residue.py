# -*- coding: utf-8 -*-
"""R246 — 修 R214 单字替换留下的非词（微微/淡淡 → 略/稍）。

背景
    faa1fa54「R214 de-AI batch: 307 chapters, single-word de-AI swaps
    (仿佛→似乎, 微微→略微, etc.)」把 微微/淡淡 机械换成 略/稍。绝大多数结果只是念着
    生硬（略微一抬 / 略带颤抖 / 略微抖动），那是该轮既定的简化，**本轮不动**；
    只有极少数换完根本不是词：

        平平淡淡 → 平平略     8 处   （成语只剩半截）
        微微抖动 → 稍抖动     ch171
        微微一抖 → 稍一抖     ch278
        微微颤动 → 稍颤动     ch651

修复规则
    **删掉机械替换留下的那一个字**，不添新词，也不回改成 微微/淡淡 —— 这两个词都在
    tools/polish_pipeline.py 的 L1_WORDS['action'] 里，回改会把全库 L1 命中从 0 顶上去，
    破坏历轮「检测器零回归」的不变量。删完之后站在原地的是作者自己写的字：

        平平略 → 平平      稍抖动 → 抖动      稍一抖 → 一抖      稍颤动 → 颤动

    代价是全库 CJK 净减 12 个字（每处 1 字），这是本轮的预期增量，不是损坏。

ch675 是例外
    faa1fa54 在该章末尾**整句新写**了「赵大嘴的呼吸稍放轻，他感觉到0429碎片在体内完成了
    新一轮的扫描。」（父提交里没有对应句子），顺带删掉了（第675章完）标记。句子本身留着，
    只把里面的非词「稍放轻」改成「放轻」；--audit 会断言父提交里不存在这一行。

不在本轮范围
    ch561「维护派执行者的声音稍抖动抖」—— 「抖动抖」是族 C 的叠字碎片，和 稍 残留在同一处，
    两族叠在一起，留给族 C 那一轮一次处理。

证据链（--audit 重验，对不上就拒改）
    在 faa1fa54^ 的这一章里，找「把 pre_form 换成 bad_form 之后与当前行完全相同」的行：
    必须**恰好一行**。这证明该处只是 R214 一次单字替换的结果，而不是别的轮次的改动。

用法
    python tools/fix_r246_swap_residue.py            # 干跑
    python tools/fix_r246_swap_residue.py --apply    # 落盘
    python tools/fix_r246_swap_residue.py --verify   # 把改动重放到 git show HEAD 的字节上比对
    python tools/fix_r246_swap_residue.py --audit    # 只验证据链，不写文件

    可选第二参数是章号，只看/只改那一章。

编码
    与全库一致 UTF-8 无 BOM；行尾按每个文件自己的终止符切分与还原，MIXED-EOL 直接拒绝。
"""
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

BOM = b'\xef\xbb\xbf'
R214 = 'faa1fa54'
PARENT = R214 + '^'

# (path, pre_form, bad_form, good_form)
#   pre_form=None 表示该行是 faa1fa54 整句新写的，父提交里没有。
SITES = [
    ('chapters/volume-2/chapter-181-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-2/chapter-208-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-3/chapter-284-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-3/chapter-305-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-3/chapter-319-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-3/chapter-346-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-4/chapter-517-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-5/chapter-654-polished.md', '平平淡淡', '平平略', '平平'),
    ('chapters/volume-2/chapter-171-polished.md', '微微抖动', '稍抖动', '抖动'),
    ('chapters/volume-3/chapter-278-polished.md', '微微一抖', '稍一抖', '一抖'),
    ('chapters/volume-5/chapter-651-polished.md', '微微颤动', '稍颤动', '颤动'),
    ('chapters/volume-5/chapter-675-polished.md', None, '稍放轻', '放轻'),
]


def parse_raw(raw, allow_bom=False):
    """-> (lines, term, trail, problem)。lines 不含终止符。

    allow_bom 只给历史 blob 用：ch278/284/305/319/346 在 faa1fa54^ 那个年代还带 BOM，
    后来某一轮把 BOM 去掉了，工作区里没有。读祖先版本时要放行。
    """
    if raw.startswith(BOM):
        if not allow_bom:
            return None, None, None, 'BOM present'
        raw = raw[len(BOM):]
    try:
        body = raw.decode('utf-8')
    except UnicodeDecodeError:
        return None, None, None, 'not utf-8'
    if '\r\n' in body and body.replace('\r\n', '').count('\n'):
        return None, None, None, 'MIXED-EOL'
    term = '\r\n' if '\r\n' in body else '\n'
    text = body.replace('\r\n', '\n')
    trail = text.endswith('\n')
    lines = text.split('\n')
    if trail:
        lines = lines[:-1]
    return lines, term, trail, None


def encode(lines, term, trail):
    return (term.join(lines) + (term if trail else '')).encode('utf-8')


def read_state(path):
    with open(path, 'rb') as fh:
        raw = fh.read()
    lines, term, trail, problem = parse_raw(raw)
    return raw, lines, term, trail, problem


def blob(rev, path):
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, path)],
                       capture_output=True)
    if r.returncode:
        return None
    return r.stdout


def locate(lines, bad):
    """-> (index, problem)。要求含 bad 的行唯一，且该行里 bad 只出现一次。"""
    hits = [i for i, ln in enumerate(lines) if bad in ln]
    if not hits:
        return None, 'token absent'
    if len(hits) > 1:
        return None, 'token on %d lines' % len(hits)
    i = hits[0]
    n = lines[i].count(bad)
    if n > 1:
        return None, 'token %dx on its line' % n
    return i, None


W = 12


def audit_site(path, pre, bad, good, lines):
    """证据链：父提交里恰好一处窗口，与当前行同一位置的窗口一致。

    两种状态都算过：
      还没修 —— 窗口里是 bad，等于父提交的 pre 换成 bad
      已经修 —— 窗口里是 good，等于父提交的 pre 换成 good
    两种都不出现、或者任何一种出现不止一次，就拒。

    只比 token 前后各 W 个字，不比整行：同一行上别的字可能被后来的轮次修过
    （ch517 那行的 `。。`→`。` 就是 R216 干的），那不算证据链断。
    """
    raw = blob(PARENT, path)
    if raw is None:
        return 'parent blob missing'
    plines, _, _, problem = parse_raw(raw, allow_bom=True)
    if problem:
        return 'parent: %s' % problem
    if pre is None:
        if any(bad in ln for ln in plines):
            return 'expected an R214-authored line, but the parent has it'
        if not any(good in ln for ln in lines):
            return 'neither form present'
        return None
    hit_bad = hit_good = 0
    for ln in plines:
        k = ln.find(pre)
        while k >= 0:
            head = ln[max(0, k - W):k]
            tail = ln[k + len(pre):k + len(pre) + W]
            if any(head + bad + tail in x for x in lines):
                hit_bad += 1
            if any(head + good + tail in x for x in lines):
                hit_good += 1
            k = ln.find(pre, k + 1)
    if hit_bad == 1 and not hit_good:
        return None
    if hit_good == 1 and not hit_bad:
        return None
    return 'parent window: bad-form x%d, good-form x%d' % (hit_bad, hit_good)


def snippet(line, bad):
    j = line.find(bad)
    return '...%s[%s]%s...' % (line[max(0, j - 12):j], bad, line[j + len(bad):j + len(bad) + 12])


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    only = sys.argv[2] if len(sys.argv) > 2 else None
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2

    sites = [s for s in SITES if only is None or only in s[0]]
    print('R246  R214 %s (parent %s)' % (R214, PARENT))
    print('%d site(s) selected\n' % len(sites))

    if mode == '--verify':
        # 从 HEAD 的字节重放：在 HEAD 的 blob 里定位 bad、换成 good，结果必须与工作区
        # 字节完全一致。工作区此时已经没有 bad 了，所以走不到下面的 plans。
        bad_v = 0
        for path, _, bad, good in sites:
            raw = blob('HEAD', path)
            if raw is None:
                print('  VERIFY %-38s !! HEAD blob missing' % path.split('/')[-1])
                bad_v += 1
                continue
            hlines, hterm, htrail, problem = parse_raw(raw)
            if problem:
                print('  VERIFY %-38s !! HEAD: %s' % (path.split('/')[-1], problem))
                bad_v += 1
                continue
            j, problem = locate(hlines, bad)
            if problem:
                print('  VERIFY %-38s !! HEAD: %s' % (path.split('/')[-1], problem))
                bad_v += 1
                continue
            hlines[j] = hlines[j].replace(bad, good)
            cur = open(path, 'rb').read()
            clines, cterm, ctrail, problem = parse_raw(cur)
            if problem:
                print('  VERIFY %-38s !! worktree: %s' % (path.split('/')[-1], problem))
                bad_v += 1
                continue
            if hlines == clines and htrail == ctrail:
                # .gitattributes 是 `* text=auto eol=lf`：blob 里存 LF，工作区可能是 CRLF。
                # 行内容与结尾换行都一致就算重放成功，行尾只在真有差异时提一句。
                note = 'bytes' if hterm == cterm else 'EOL %s->%s normalized by eol=lf' % (
                    repr(hterm), repr(cterm))
                print('  VERIFY %-38s OK  (HEAD + this edit == worktree, %s)'
                      % (path.split('/')[-1], note))
            else:
                print('  VERIFY %-38s !! replay differs from the worktree' % path.split('/')[-1])
                bad_v += 1
        print('\nverify: %d/%d ok' % (len(sites) - bad_v, len(sites)))
        return 1 if bad_v else 0

    if mode == '--audit':
        bad_audit = 0
        for path, pre, bad, good in sites:
            raw, lines, term, trail, problem = read_state(path)
            if problem:
                print('  AUDIT %-38s !! %s' % (path.split('/')[-1], problem))
                bad_audit += 1
                continue
            err = audit_site(path, pre, bad, good, lines)
            print('  AUDIT %-38s %s' % (path.split('/')[-1],
                                        'OK  %s→%s' % (pre, bad) if err is None else '!! ' + err))
            if err:
                bad_audit += 1
        print('\naudit: %d/%d ok' % (len(sites) - bad_audit, len(sites)))
        return 1 if bad_audit else 0

    problems = []
    plans = []
    for path, pre, bad, good in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            problems.append((path, bad, problem))
            print('  %-44s %s  !! %s' % (path.split('/')[-1], bad, problem))
            continue
        i, problem = locate(lines, bad)
        if problem:
            problems.append((path, bad, problem))
            print('  %-44s %s  !! %s' % (path.split('/')[-1], bad, problem))
            continue
        new_line = lines[i].replace(bad, good)
        plans.append((path, lines, term, trail, i, bad, good, new_line))
        print('  %-44s L%-4d %s' % (path.split('/')[-1], i + 1, snippet(lines[i], bad)))
        print('  %-44s      -> %s' % ('', snippet(new_line, good)))

    print()

    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    if mode == '--dry-run':
        print('dry run: %d edit(s) would be written, %d file(s)'
              % (len(plans), len(set(p[0] for p in plans))))
        return 0

    # --apply
    wrote = 0
    for path, lines, term, trail, i, bad, good, new_line in plans:
        lines[i] = new_line
        with open(path, 'wb') as fh:
            fh.write(encode(lines, term, trail))
        wrote += 1
    print('applied: %d edit(s) in %d file(s)' % (wrote, len(set(p[0] for p in plans))))

    left = 0
    for path, _, bad, _ in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            print('  POST %-40s !! %s' % (path.split('/')[-1], problem))
            left += 1
            continue
        n = sum(ln.count(bad) for ln in lines)
        if n:
            print('  POST %-40s !! %s still x%d' % (path.split('/')[-1], bad, n))
            left += 1
    print('post-check: %d file(s) still carrying a token' % left)
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
