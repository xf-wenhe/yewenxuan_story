# -*- coding: utf-8 -*-
"""R249 — 族 C 姊妹族：`他清了清喉*` 的焊痕（尾焊 + 多主语）

背景
    V1-V7 的几轮「voice cleanup / de-AI」把父句里的一截**留下来**，替换串接在它后面，
    于是正文出现 `他清了清喉滚动了一次` 这类焊接句。焊点全在 `清了清喉（咙|间）` 上：
    池的替换串吃掉的是**主语**（`喉结上下` / `喉结` / `喉咙` / `咽了口唾沫`），
    谓语尾巴和领属 `的` 都留在原地。

机制（25 组 BEFORE/AFTER 全证，逐条见 tools/r249_throat_sites.json 的 src）
    ① 尾焊（父 `[喉结/喉咙]+动词` -> 池 `他清了清喉（咙）`，父的尾巴焊在后面）
       ch40  598444cb  他顿了顿。喉结上下滚动了一次。      -> …他清了清喉滚动了一次。
       ch355 598444cb  眼眶在收紧，喉结上下滚了一下，…    -> …他清了清喉滚了一下，…
       ch253 dee6d291  他吞咽了一下。喉咙动了一下。        -> …他清了清喉间一下。
       ch884 6b1967be  赵大嘴的喉结滚动了一下。            -> 赵大嘴的他清了清喉咙了一下。
       ch963 6b1967be  赵大嘴喝了一口水，喉结滚动得很慢。  -> …他清了清喉咙得很慢。
    ② 多主语（父的领属 `的` 留在原地，池又自带 `他`）
       ch64  598444cb  赵大嘴的喉结上下动了两次，…          -> 赵大嘴的他清了清喉动了两次，…
       ch922 598444cb  叶文轩的喉结动了动。                  -> 叶文轩的他清了清喉。
    ③ 二次命中（池把**自己刚写出来的**句子又替换一次）
       ch822 dee6d291  他喝了一大口，他清了清喉咙动了两次。  -> …他清了清他清了清喉间两次。
       —— `喉咙动了` 在 `清了清喉咙动了两次` 里再次命中，插入 `他清了清喉间`，父的 `两次` 留下。
    ④ 主语位叠字（R21 的模式 `喉结滚动一下了一次` 从 `清了清喉` 的 `喉` 起命中）
       ch59  5546840b  他清了清喉结滚动一下了一次。          -> 他清了清喉结动了动。

修法边界
    只做「删掉焊在后面的尾巴 / 删掉多出来的主语字」，**不回填父句**：这些轮次是有意换词的
    （`喉结上下滚了滚` -> `清了清喉咙`），回填等于撤销它们。
    `清了清喉间` 是池替换串**自己的写法**（f89585d3 把 `咽了口唾沫` 整串换成 `他清了清喉间`；
    ch103/ch106 与 ch927 的 BEFORE/AFTER 可证），R248 也已按合法形保留（ch66）—— 故本轮
    **保留 `间`**，ch66/ch214/ch927 三处无编辑（登记为池的写法，留待文风轮）。

用法
    python tools/fix_r249_throat_residue.py            # 干跑（列出每处 -N 字与逐章 CJK）
    python tools/fix_r249_throat_residue.py --audit    # 只验证据链
    python tools/fix_r249_throat_residue.py --apply    # 落盘（可重跑；3000 CJK 地板守卫）
    python tools/fix_r249_throat_residue.py --verify   # 从 git show HEAD 的字节重放比对
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
TABLE = os.path.join(HERE, 'r249_throat_sites.json')


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
    print('R249  族 C 姊妹族：`他清了清喉*` 的焊痕')
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
        print('  ch%-4d %-5s -%-2d字  CJK %d -> %d' % (s['chapter'], eol,
                                                      s['dropped'], b, a))
        print('        - %s' % snippet(text, s['old'])[:150])
        print('        + %s' % snippet(after, s['new'])[:150])

    print()
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    below = []
    for path, lines, term, trail, edits, s in plans:
        text = '\n'.join(lines)
        for old, new in edits:
            text = text.replace(old, new, 1)
        n = len(CJK.findall(text))
        if n < FLOOR:
            below.append((s['chapter'], n))
    print('edits %d in %d file(s), %d already done; CJK %d -> %d (%+d)'
          % (sum(len(g[4]) for g in plans), len(plans), done,
             cjk_before, cjk_after, cjk_after - cjk_before))
    print('CJK floor %d: %s' % (FLOOR, 'violated %s' % below if below else 'clear'))

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
