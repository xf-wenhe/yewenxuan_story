# -*- coding: utf-8 -*-
"""R253 — 池 tic 焊痕：`喉…动了动|滚了滚` / `嘴角一抽…` 后面焊着的父本尾巴

背景
    R249 结清 `他清了清喉*` 一族时测出：同一焊接机制还出现在别的 tic 上。本轮把四个
    voice cleanup 轮次留下的同类焊痕一次清完（R14/R16/R17/R23），全库 37 处 / 34 章。

机制（37 组 BEFORE/AFTER 全证，逐条见 tools/r253_tic_sites.json 的 src）
    池的替换串**只盖住父句的一部分**，父句剩下的尾巴焊在后面。四轮的跨度不同：
    ① `4f350d68`（R23，`喉结上下滚`）跨度 `上下滚`/`上下`
       ch4   `小樱的喉结上下滚了一下。`  -> `小樱的喉结动了动了一下。`   焊尾 `了一下`
       ch20  `喉结上下滚了一下，`         -> `喉结滚了一下了一下，`       焊尾 `了一下`
    ② `598444cb`（Voice round 14，`喉结上下`）跨度 `喉结上下` -> `喉间|喉头动了动`
       ch12  `喉结上下滑动了一次。`       -> `喉间动了动滑动了一次。`     焊尾 `滑动了一次`
       ch566 `喉结上下滚了一下。`         -> `喉头动了动滚了一下。`       焊尾 `滚了一下`
    ③ `dee6d291`（R16，`喉咙动了`）跨度 `喉咙动` -> `喉间|喉头动了动|滚了滚`
       ch28  `叶文轩的喉咙动了一下。`     -> `叶文轩的喉间动了动一下。`   焊尾 `一下`
    ④ `6877d261`（R17，`嘴角微微/轻轻`）跨度 `嘴角微微`/`嘴角轻轻` -> 三种变体
       ch188 `嘴角轻轻动了动。`           -> `嘴角一抽动了动。`           焊尾 `动了动`
       ch640 `嘴角微微抽动，`             -> `嘴角抽动抽动，`             焊尾 `抽动`
       ch414 `嘴角微微抽动，`             -> `嘴角动了动抽动，`           焊尾 `抽动`
    —— ④ 的变体由池随机挑（同一父句 `嘴角轻轻动了动` 在 ch188/ch830 落成 `嘴角一抽动了动`、
       在 ch414 落成 `嘴角动了动动了动`），但三种都是**池写下的**。

修法
    保留池替换串写入的那个 tic，**删掉替换跨度之后父本剩下的那截**（尾巴）——与 R249 的
    22 处逐站做法一致（`他清了清喉滚动了一次` -> `他清了清喉`：池的短语留、父本的动词走）。
    只删字、不回填父句：这些轮次是有意换词的，回填等于撤销它们（R249 的边界）。
    两处例外是**池的整串替换**（`喉结上下滚了滚` -> `喉头动了动滑了滑`，ch47 L99 / ch519 L33），
    没有焊尾 —— 与 `清了清喉间` 同类，登记为池的写法，本轮不动。
    ch575 L113 / ch585 L54 另补回被吃的 `。`（`…滚了一下0429碎片` 的粘连，同 R249 的 ch577）。

与族表的一处更正
    R249 交接时在族表里写过「`滑动了一下` 属 tic 的动词，不删」——**那句是错的**。pickaxe
    证明 `滑动了一次` 是**父本**的词、池写的是 `动了动`（ch12/ch19/ch69 的 BEFORE/AFTER 在 src 里），
    故按证据走：删父本的尾巴。

用法
    python tools/fix_r253_tic_residue.py            # 干跑（列出每处删字数与逐章 CJK）
    python tools/fix_r253_tic_residue.py --audit    # 只验证据链
    python tools/fix_r253_tic_residue.py --apply    # 落盘（可重跑；3000 CJK 地板守卫）
    python tools/fix_r253_tic_residue.py --verify   # 从 git show HEAD 的字节重放比对
    可选第二参数是章号/路径子串，只看/只改匹配的章。
    一个文件的多处编辑在同一份文本上依次落下（R247 教训①），重跑时已修站点跳过。

编码
    UTF-8 无 BOM；行尾按每个文件自身的终止符切分与还原，MIXED-EOL 直接拒绝。工作区 CRLF、
    blob LF（.gitattributes `* text=auto eol=lf`）属既有状态，--verify 比行内容与结尾换行，
    不比行尾字节（R246 教训②）。
"""
import io
import json
import os
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

BOM = b'\xef\xbb\xbf'
FLOOR = 3000
CJK = re.compile(r'[一-鿿]')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TABLE = os.path.join(HERE, 'r253_tic_sites.json')
# 3000 硬线的具名例外（与 .claude/tmp/r253_make.py 的 FLOOR_EXEMPT 同源）
FLOOR_EXEMPT = {87: '3,002 -> 2,999：焊痕 `滚了一下了一下` 删 3 字即破线，'
                   '与 R247 的 ch675（2,998）同类，入补字轮'}


def load():
    with io.open(TABLE, encoding='utf-8') as fh:
        return json.load(fh)


def parse_raw(raw, allow_bom=False):
    """-> (lines, term, trail, problem)。lines 不含终止符。"""
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
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, path)], capture_output=True,
                       cwd=ROOT)
    return None if r.returncode else r.stdout


def touchers(path, tok):
    """pickaxe：计数变过该串的提交，从新到旧。"""
    r = subprocess.run(['git', 'log', '-S', tok, '--format=%h', '--', path],
                       capture_output=True, check=True, cwd=ROOT)
    return [x for x in r.stdout.decode('utf-8').split('\n') if x.strip()]


def snippet(s, anchor):
    i = s.find(anchor)
    return s[max(0, i - 12):i + len(anchor) + 12]


def audit_site(site, text):
    path, src = site['path'], site['src']
    commits = touchers(path, site['frag_old']) + touchers(path, site['old'])
    if not commits:
        return 'no commit ever changed this string'
    if src not in commits:
        return 'recorded %s not among %s' % (src, ','.join(c[:7] for c in commits))
    # 本轮的修法含删字，未修状态下 new 可能是 old 的子串（count(new)>=1 恒成立），
    # 只能拿 old 的在场与否分状态（R247 教训②）；修后状态的字节级证据交给 --verify。
    n_old, n_new = text.count(site['old']), text.count(site['new'])
    if n_old == 1:
        return None
    if n_old == 0 and n_new:
        return None
    return 'anchor: un-repaired x%d, repaired x%d' % (n_old, n_new)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    only = sys.argv[2] if len(sys.argv) > 2 else None
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2

    all_sites = load()
    sites = [s for s in all_sites
             if only is None or only in s['path'] or only == str(s['chapter'])]
    print('R253  池 tic 焊痕：`喉…动了动|滚了滚` / `嘴角一抽…` 后面焊着的父本尾巴')
    print('%d site(s) selected of %d\n' % (len(sites), len(all_sites)))
    if not sites:
        return 2

    if mode == '--audit':
        bad = 0
        for s in sites:
            raw, lines, term, trail, problem = read_state(s['path'])
            if problem:
                print('  AUDIT %-31s !! %s' % (os.path.basename(s['path']), problem))
                bad += 1
                continue
            err = audit_site(s, '\n'.join(lines))
            print('  AUDIT %-31s %s' % (os.path.basename(s['path']),
                                        'OK  %s' % s['src'] if err is None
                                        else '!! ' + err))
            if err:
                bad += 1
        print('\naudit: %d/%d ok' % (len(sites) - bad, len(sites)))
        return 1 if bad else 0

    if mode == '--verify':
        order = []
        for s in sites:
            if s['path'] not in order:
                order.append(s['path'])
        bad = 0
        for path in order:
            mine = [s for s in sites if s['path'] == path]
            raw = blob('HEAD', path)
            if raw is None:
                print('  VERIFY %-30s !! HEAD blob missing' % os.path.basename(path))
                bad += 1
                continue
            hlines, hterm, htrail, problem = parse_raw(raw, allow_bom=True)
            if problem:
                print('  VERIFY %-30s !! HEAD: %s' % (os.path.basename(path), problem))
                bad += 1
                continue
            htext = '\n'.join(hlines)
            broke = None
            for s in mine:
                if htext.count(s['old']) != 1:
                    broke = 'HEAD: anchor x%d  %s' % (htext.count(s['old']),
                                                      snippet(htext, s['old'][:6]))
                    break
                htext = htext.replace(s['old'], s['new'], 1)
            if broke:
                print('  VERIFY %-30s !! %s' % (os.path.basename(path), broke))
                bad += 1
                continue
            hlines = htext.split('\n')
            cur = open(path, 'rb').read()
            clines, cterm, ctrail, problem = parse_raw(cur)
            if problem:
                print('  VERIFY %-30s !! worktree: %s' % (os.path.basename(path),
                                                          problem))
                bad += 1
                continue
            if hlines == clines and htrail == ctrail:
                note = 'bytes' if hterm == cterm else 'EOL %s->%s via eol=lf' % (
                    repr(hterm), repr(cterm))
                print('  VERIFY %-30s OK  x%d (%s)' % (os.path.basename(path),
                                                       len(mine), note))
            else:
                print('  VERIFY %-30s !! replay differs from the worktree'
                      % os.path.basename(path))
                bad += 1
        print('\nverify: %d/%d file(s) ok' % (len(order) - bad, len(order)))
        return 1 if bad else 0

    problems = []
    plans = []
    index = {}
    done = 0
    cjk_before = cjk_after = 0
    for s in sites:
        raw, lines, term, trail, problem = read_state(s['path'])
        if problem:
            problems.append((s['path'], s['old'], problem))
            print('  %-31s !! %s' % (os.path.basename(s['path']), problem))
            continue
        text = '\n'.join(lines)
        n = text.count(s['old'])
        if not n and text.count(s['new']):
            done += 1
            print('  ch%-4d -- already repaired' % s['chapter'])
            continue
        if n != 1:
            problems.append((s['path'], s['old'], 'anchor x%d' % n))
            print('  %-31s !! anchor x%d  %s' % (os.path.basename(s['path']), n,
                                                 snippet(text, s['old'][:6])))
            continue
        grp = index.get(s['path'])
        if grp is None:
            grp = index[s['path']] = [s['path'], lines, term, trail, [], s]
            plans.append(grp)
        grp[4].append((s['old'], s['new']))
        after = text.replace(s['old'], s['new'], 1)
        b, a = len(CJK.findall(text)), len(CJK.findall(after))
        cjk_before += b
        cjk_after += a
        eol = 'CRLF' if term == '\r\n' else 'LF'
        if '\r' in text:                       # 双 CR 行尾（parse/encode 逐字节还原）
            eol += '+CR?'
        print('  ch%-4d %-5s %+d字  CJK %d -> %d' % (s['chapter'], eol,
                                                     -s['dropped'], b, a))
        print('        - %s' % snippet(text, s['frag_old'])[:150])
        print('        + %s' % snippet(after, s['frag_new'])[:150])

    print()
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    below = []
    exempt = []
    for path, lines, term, trail, edits, s in plans:
        text = '\n'.join(lines)
        for old, new in edits:
            text = text.replace(old, new, 1)
        n = len(CJK.findall(text))
        if n < FLOOR:
            if s['chapter'] in FLOOR_EXEMPT:
                exempt.append((s['chapter'], n))
            else:
                below.append((s['chapter'], n))
    print('edits %d in %d file(s), %d already done; CJK %d -> %d (%+d)'
          % (sum(len(g[4]) for g in plans), len(plans), done,
             cjk_before, cjk_after, cjk_after - cjk_before))
    print('CJK floor %d: %s' % (FLOOR, 'violated %s' % below if below else 'clear'))
    for n, c in exempt:
        print('FLOOR EXEMPT ch%d -> %d CJK：%s' % (n, c, FLOOR_EXEMPT[n]))

    if mode == '--dry-run':
        print('dry run: nothing written')
        return 0
    if below:
        print('ABORT: a chapter would fall below the CJK floor')
        return 2

    # 一个文件的多处编辑必须在同一份文本上依次落下，否则后写的会覆盖先写的
    for path, lines, term, trail, edits, _ in plans:
        text = '\n'.join(lines)
        for old, new in edits:
            text = text.replace(old, new, 1)
        with open(path, 'wb') as fh:
            fh.write(encode(text.split('\n'), term, trail))
    print('applied: %d edit(s) in %d file(s)'
          % (sum(len(g[4]) for g in plans), len(plans)))

    left = 0
    for s in sites:
        raw, lines, term, trail, problem = read_state(s['path'])
        if problem:
            print('  POST %-32s !! %s' % (os.path.basename(s['path']), problem))
            left += 1
            continue
        t = '\n'.join(lines)
        if t.count(s['old']):
            print('  POST %-32s !! anchor still present x%d'
                  % (os.path.basename(s['path']), t.count(s['old'])))
            left += 1
    print('post-check: %d bad state(s)' % left)
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
