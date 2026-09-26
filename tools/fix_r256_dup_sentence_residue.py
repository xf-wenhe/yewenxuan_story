# -*- coding: utf-8 -*-
"""R256 — 轮次把**整句**写了两遍：删掉后一遍

背景
    替换/重写轮在改父本时，把同一句抄了两遍。全库只 8 处行内相邻同句，
    收表 6 处 / 6 章（另 2 处见下「不收」）。与 R247（`他他`）/ R249 / R253 /
    R255（`了了`/`在在`）同属删字轮，只是抬到整句一级。

逐站机制（父本计数逐条查过，见 tools/r256_dup_sentence_sites.json 的 src 与 old/new）
    ① ch313 / ch317  `58389e15` 名字统一轮把 `何冰`/`韩冰` 并成同一人
       父本 `何冰点了点头。韩冰点了点头。赵大嘴也点了点头。`（同一个人被写了两遍）
       现值 `韩冰点了点头。韩冰点了点头。赵大嘴也点了点头。`  -> 删后一遍
    ② ch381  `208cc5de` V3 de-AI complete 复制了尾句（父本仅 1 处）
    ③ ch429  `be4da536` V4 全面修复「补足文字」把该句写了两遍（父本 0 处）
    ④ ch622  `4dcc6338` R225「不是A而是B」清除轮重排后又抄一遍（父本 1 处）
    ⑤ ch804  复读早于 R214（`faa1fa54^` 已是两遍），**无归因**，纯文本判据

修法
    **删掉后一遍整句，不回填任何词。**

不收（留证，勿删 —— 写死在表里）
    · ch507 父本 `锁需要两把钥匙。一把是锚点A的意识签名。一把是锚点B的意识签名。`，
      那一轮把 `A`/`B` **删掉**，留下两句同文。这是**丢内容**（第二把钥匙没了），
      不是焊字；删重复句会把它整条抹掉。正解是回填 `A`/`B`，属回填，需作者拍板。
    · ch502 无父本（`3bab93f8` 新建章）且身处无标点长串，取不准就不动。

地板例外 2 章
    ch313 3,002 -> 2,996、ch317 3,003 -> 2,997，删句即破 3000。与 R247 的 ch87
    （2,999）/ ch675（2,998）、R255 的 ch297 / ch374 同类，记 FLOOR_EXEMPT 并入
    补字轮，不静默破线。

用法
    python tools/fix_r256_dup_sentence_residue.py            # 干跑
    python tools/fix_r256_dup_sentence_residue.py --audit    # 只验证据链
    python tools/fix_r256_dup_sentence_residue.py --apply    # 落盘（可重跑）
    python tools/fix_r256_dup_sentence_residue.py --verify   # 从 HEAD 字节重放比对
    可选第二参数是章号/路径子串。

编码
    UTF-8 无 BOM；行尾按每个文件自身的终止符切分与还原，MIXED-EOL 直接拒绝。
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
TABLE = os.path.join(HERE, 'r256_dup_sentence_sites.json')
FLOOR_EXEMPT = {
    313: '3,002 -> 2,996：删掉重复的 `韩冰点了点头。` 即破线，入补字轮',
    317: '3,003 -> 2,997：同上，入补字轮',
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
    r = subprocess.run(['git', 'log', '-S', tok, '--format=%h', '--', path],
                       capture_output=True, check=True, cwd=ROOT)
    return [x for x in r.stdout.decode('utf-8').split('\n') if x.strip()]


def snippet(s, k, n):
    return s[max(0, k - 40):k + n + 24]


def audit_site(site, text):
    path, src = site['path'], site['src']
    commits = touchers(path, site['sentence']) + touchers(path, site['old'])
    if not commits:
        return 'no commit ever changed this string'
    if src != '(unattributed)' and src not in commits:
        return 'recorded %s not among %s' % (src, ','.join(c[:7] for c in commits))
    # 删字轮：未修状态下 new 是 old 的真子串（count(new) 恒 >= 1），
    # 只能拿 old 的在场与否分状态（R247 教训②）；修后字节级证据交给 --verify。
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
    print('R256  轮次把整句写了两遍：删掉后一遍')
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
                    broke = 'HEAD: anchor x%d' % htext.count(s['old'])
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
            print('  %-31s !! anchor x%d' % (os.path.basename(s['path']), n))
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
        print('  ch%-4d %-5s -%d句  CJK %d -> %d  %s'
              % (s['chapter'], eol, s['dropped'], b, a, s['kind']))
        # 窗口从**本次删句的位置**截（R255 教训：锚在别处会飘到全章不相干的地方）
        k = s['old'].rindex(s['sentence'])
        print('        - …%s…' % snippet(s['old'], k, len(s['sentence'])))
        print('        + …%s…' % snippet(s['new'], k, 0))

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
