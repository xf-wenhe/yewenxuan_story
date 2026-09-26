# -*- coding: utf-8 -*-
"""R255 — 替换轮写坏的重复字（`了了` / `在在`）：删掉多出来的那一个

背景
    一批 voice/de-AI 替换轮的**替换串自带那个字**，而源模式没把父句原有的字包进去，
    于是写成了重复。全库 81 处 / 74 章（R133–R138、Voice round 5、round 6+7、
    de-AI round 10、R157、R171、V1 ch008–ch033 de-AI 共 7 轮）。

机制（逐站 BEFORE/AFTER 见 tools/r255_dedup_sites.json 的 src 与 win）
    ① `9cd5e651`（Voice R133–R138，35 处）：源 `钉在他身上` -> 池串 `将视线钉在`
       ch24  `赵大嘴将视线钉在他身上。`     -> `赵大嘴将视线钉在在他身上。`   多一个 `在`
       ch32  `叶文轩将目光定在他身上。`     -> `叶文轩将目光定在在他身上。`   多一个 `在`
       同类动词：钉／定／凝／粘（共 10/10/8/10 处）
    ② `78d30d02`（Voice round 5，30 处）：源 `他明白了` -> 池串 `现在他清楚`+`了`
       ch374 `现在他明白了。`              -> `现在他明白了了。`            多一个 `了`
       ch105 `他理解了。`                  -> `现在他理解了了。`            多一个 `了`
    ③ `6b1967be`（de-AI round 10，7 处）：`心脏跳得快了了`（源 `心脏跳得快了`）
    ④ `6e018370`（Voice round 6+7，6 处）：`他懂了了`（源 `他懂了`）
    ⑤ 余 3 处各来自一轮同类替换（`21ad278a` / `24773618` / `5d0ff835`）。

修法
    **删掉重复的那一个，不回填任何词** —— 与 R247（`他他`）/ R249 / R253 同属删字轮。
    两处都删得动（`了了` -> `了`、`在在` -> `在`），结果同一。

边界（判据写死，fail-closed）
    · `了了` 收全部 43 处，形全为 `快／急／懂／楚／白／解 + 了了`（`V了了`）。合法形
      `V不了了`（`走不了了`）按前字 `不` 排除 —— 全库实测 0 处。
    · `在在` **只收前字是 钉／定／凝／粘 的 38 处**。以下一律不收：
        `现在在` 104、`实实在在` 2（成语）、`存在在` 17、`也在在`/`都在在`/`还在在`/
        `直在在` 各 1 —— 这些是**合法串**：「系统的存在在变薄」是名词 `存在` + 介词 `在`，
        删一个 `在` 会把它弄坏。取不准就不动。
    · 行内 CR 的 5 行不收（未动）。
    · 整行唯一才落（`raw.count(old) == 1`），应用器按整行 old->new 替换。
    · **地板例外 2 章**：ch297 / ch374 现值恰好 3,000 CJK，删掉这 1 字即 2,999。
      与 R247 的 ch87（2,999）/ ch675（2,998）同类，记 FLOOR_EXEMPT 并入补字轮，
      不静默破线。

用法
    python tools/fix_r255_dedup_residue.py            # 干跑（列出每处删字数与逐章 CJK）
    python tools/fix_r255_dedup_residue.py --audit    # 只验证据链
    python tools/fix_r255_dedup_residue.py --apply    # 落盘（可重跑；3000 CJK 地板守卫）
    python tools/fix_r255_dedup_residue.py --verify   # 从 git show HEAD 的字节重放比对
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
TABLE = os.path.join(HERE, 'r255_dedup_sites.json')
FLOOR_EXEMPT = {
    297: '3,000 -> 2,999：删掉重复的 `在` 即破线，与 R247 的 ch87（2,999）/ ch675（2,998）'
         '同类，入补字轮',
    374: '3,000 -> 2,999：删掉重复的 `了` 即破线，同上，入补字轮',
}


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
    # 本轮修法是删字，未修状态下 new 可能是 old 的子串（count(new)>=1 恒成立），
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
    print('R255  替换轮写坏的重复字（`了了` / `在在`）：删掉多出来的那一个')
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
        print('  ch%-4d %-5s %+d字  CJK %d -> %d  %s' % (s['chapter'], eol,
                                                         -s['dropped'], b, a,
                                                         s['kind']))
        # 窗口必须从**本次编辑的位置**截（R253 用 find(frag_new) 是因为它的 frag_new 是
        # 特征串；本轮的 frag_new 只有一个 `了`/`在`，find 会飘到全章别处去）。
        # 表内每处的 old 恰含 frag_old 一次（建表时验过），故 index 即编辑点。
        k = s['old'].index(s['frag_old'])
        print('        - …%s…' % s['old'][max(0, k - 34):k + 34])
        print('        + …%s…' % s['new'][max(0, k - 34):k + 34])

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
