# -*- coding: utf-8 -*-
"""R254 表构建 v2：碎片编号前被剥离轮吃掉的句读（父本 `9252b142^` 权威 + 引入者 diff 逐字符对位）。

v1 的病灶（全量已回退）
    v1 的判据是「父本整章里 `左+标点+右` 唯一命中」。三处会翻车：
      · 父本自己复读同一句（ch614 L147/L165 等）时，`。` 命中两次 -> 唯一性把它否掉，
        转而采用**另一行**的 `，` 当证人 -> 插错标点（15 处）；
      · 接缝其实是「引号被吃」而不是「标点被吃」时，证人从别处借来 -> 多插（34 处）；
      · 右窗 j=3 只截到三位数字，`042|8…` 与 `042|9…` 分不开 -> 对错位（ch646 L79）。
v2 把「哪一处、该是什么标点」交给**引入者自己的 diff**：

    git diff -U0 9252b142^ HEAD -- chapters/volume-5/
    A 侧（+）就是 HEAD 的文本，所以「HEAD 行 -> 父本祖先」逐行对得上；
    把同一 hunk 的 A 侧与 R 侧各自去引号后拼接、逐字符对齐（difflib opcodes），
    再把接缝在 A 侧的位置经这层对位映射回 R 侧，读那里的标点：
      · 读到 `。`/`，` -> 就是被吃掉的标点（在 HEAD 行同一接缝处插回）；
      · 读到别的字符 -> 本来就粘连（引号族 / 别族），**不动**；
      · 读到别的标点 -> 别族，**不动**；
      · 对位不上（该行父本至今未变、或局部验不回）-> **不动**（fail-closed）。
    局部必须验回：映射处 R 侧同样要出现「左窗（≤4 汉字）+ 四位码」，否则判 unmapped。

伪句号判据（v2 第二版加的，本次核对的新发现）
    父本本身是**上一轮「机械加引号」的产物**：V5 父本有 185,665 个引号（现值 9,701），
    >500 个的章有 118 个。那一轮的规则是「把 2–4 字块裹上引号，并在**开引号前**补一个 `。`」：
        作者  `维护派在说谎。`        ->  父本  `维护派在。"说谎"。`
        作者  `0428碎片会被系统重置。` ->  父本  `0428碎片会被系统。"重置"。`
    （`echo` 式核对：ch560 L83 父本整行 `维护派在。"说谎"。0428碎片不会被。"重新分配"。…`）
    所以父本里紧挨着**开引号**的那个 `。` 是轮次补的，读它当证据 = 把伪句号插回去。
    判据（读到的标点在看门狗窗口里的原文邻居）：
      · 后面紧跟引号 -> quote-artifact，弃（如 `觉醒中的。｜0429｜。`）；
      · 前面是 `，、；：` -> punct-clash，弃（不可能序列）；
      · 前面是闭引号（`"共振"。0429`）或普通汉字 -> 作者原文，留。

为什么行仍然要整行唯一
    应用期引擎按 `before -> after` 整行替换，行若不唯一就定不住是哪一处（v1 同款护板）。

用法
    python .claude/tmp/r254_make2.py --dry       # 只算不写，打印分布与抽样
    python .claude/tmp/r254_make2.py             # 写 tools/r254_period_sites.json
    python .claude/tmp/r254_make2.py --check     # 重算并核对既有表

编码
    UTF-8 无 BOM；行尾逐字节取自盘（本卷混有 CRLF / 纯 LF / 行内 CR，禁止统一）。
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
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tools', 'r254_period_sites.json')
PARENT = '9252b142^'
LO, HI = 551, 750
JOINT = re.compile(r'([一-鿿])([0-9]{4})')
PUNCS = ('。', '，')
OTHER_PUNC = '：；！？、,.!?;'
QUOTES = '"\'“”‘’「」『』'
BAD = ('。。', '，，', '。，', '，。', '。、', '，、')
LEFTW = 4


def rel(n):
    return 'chapters/volume-5/chapter-%03d-polished.md' % n


def nq_map(s):
    """去引号、去 CR -> (nq 文本, nq 下标 -> 原串下标)。对位一律在 nq 空间做。

    CR 必须一起抹掉：`git diff` 的 A 行自带 CRLF 的 `\\r`（blob 行尾），
    而盘上行的 `\\r` 已归入终止符被 rstrip 掉 —— 不去掉就整行对不上（全判 no-hunk）。
    """
    out = []
    pos = []
    for i, ch in enumerate(s):
        if ch not in QUOTES and ch != '\r':
            out.append(ch)
            pos.append(i)
    return ''.join(out), pos


def nq(s):
    return nq_map(s)[0]


def parse_raw(raw):
    """-> (lines, problem)。lines 保留每行自己的行尾终止符（末行可以没有）。"""
    if raw.startswith('﻿'):
        return None, 'BOM present'
    if '\r\n' in raw and raw.replace('\r\n', '').count('\n'):
        return None, 'MIXED-EOL'
    lines = raw.split('\n')
    if lines and lines[-1] == '':
        lines = [l + '\n' for l in lines[:-1]]
    else:
        lines = [l + '\n' for l in lines[:-1]] + [lines[-1]] if lines else []
    return lines, None


def load_hunks():
    """一次 git diff 拉全卷，按文件切 -> {relpath: [(R_lines, A_lines), ...]}"""
    r = subprocess.run(['git', 'diff', '-U0', '--no-color', PARENT, 'HEAD',
                        '--', 'chapters/volume-5/'], capture_output=True, cwd=ROOT)
    text = r.stdout.decode('utf-8', 'replace')
    per = collections.defaultdict(list)
    cur = None
    for line in text.split('\n'):
        if line.startswith('diff --git '):
            cur = None
            path = line.split(' b/', 1)[-1]
            cur_path = path
        elif line.startswith('@@'):
            cur = ([], [])
            per[cur_path].append(cur)
        elif cur is None:
            continue
        elif line.startswith('+'):
            cur[1].append(line[1:])
        elif line.startswith('-'):
            cur[0].append(line[1:])
    return per


def a2r_map(Rcat, Acat):
    """A 侧下标 -> R 侧下标（difflib opcodes；replace 段按比例，insert 段指向 i2）。"""
    sm = difflib.SequenceMatcher(None, Rcat, Acat, autojunk=False)
    a2r = [0] * (len(Acat) + 1)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for d in range(j2 - j1):
                a2r[j1 + d] = i1 + d
        elif tag == 'replace':
            span_r, span_a = i2 - i1, j2 - j1
            for d in range(span_a):
                a2r[j1 + d] = i1 + min(int(d * span_r / span_a), span_r - 1)
        elif tag == 'insert':
            for d in range(j2 - j1):
                a2r[j1 + d] = i2
    a2r[len(Acat)] = len(Rcat)
    return a2r


def prep_hunks(hunks):
    """把 hunk 的 R/A 两侧各自去引号去 CR 后拼接，并预计算 A->R 的下标映射。

    另外留两样东西给「伪句号」判据用：
      Rraw —— R 侧原文（**保留引号**）；
      ridx —— Rcat 下标 -> Rraw 下标（按行累加，不能用行内下标）。
    """
    out = []
    for R_lines, A_lines in hunks:
        Rraw = ''.join(R_lines)
        cats = []
        ridx = []
        base = 0
        for x in R_lines:
            s, pos = nq_map(x)
            cats.append(s)
            ridx.extend(base + p for p in pos)
            base += len(x)
        Rcat = ''.join(cats)
        Acat = ''.join(nq(x) for x in A_lines)
        out.append((Rcat, Acat, a2r_map(Rcat, Acat), Rraw, ridx))
    return out


def local_verdict(Rcat, q, code, H, seam):
    """在 Rcat 的下标 q 处，父本是否给出了本接缝的形状？-> (score, verdict) 或 None。

    分数 = 左窗长度 + 4（右窗逐字相符时）—— 左窗越长证据越强，右窗只加分不否决：
    剥离轮常常把接缝**右侧**的词句一起改写（`引导。0429在说` -> `引导0429的信号传来`），
    右侧一变就否决，会把真还原成批漏掉。左窗那一侧才是标点的依据。
    门槛 >= 4：8/6/5/4 字左窗可直接成立，2 字左窗必须右窗相符。
    """
    if Rcat[q:q + 4] != code:
        return None
    score_r = 0
    for rk in (4, 2):
        right = H[seam + 5:seam + 5 + rk]
        if len(right) == rk and Rcat[q + 4:q + 4 + rk] == right:
            score_r = 4
            break
    best = None
    for k in (8, 6, 5, 4, 3, 2):
        if k > seam + 1 or q < k:
            continue
        left = H[seam + 1 - k:seam + 1]
        got = []
        if Rcat[q - k:q] == left:
            got.append('∅')
        if q - 1 - k >= 0 and Rcat[q - 1 - k:q - 1] == left:
            ch = Rcat[q - 1]
            if ch in PUNCS:
                got.append(ch)
            elif ch in OTHER_PUNC:
                got.append('other:' + ch)
        if not got:
            continue
        sc = k + score_r
        if best is None or sc > best[0]:
            best = (sc, got[0] if len(got) == 1 else 'conflict')
        elif sc == best[0] and set(got) != {best[1]}:
            best = (sc, 'conflict')
    return best


def gate(prep, H, seam, code):
    """prep: prep_hunks 的结果。seam: 接缝汉字在 H 的下标（插入点 = seam+1）。

    verdict ∈ {'。','，','∅','other:X','quote-artifact','punct-clash',
               'unmapped','no-hunk','conflict'}
    ev: 命中的 hunk 里父本侧的邻域片段（供人读）。
    """
    votes = collections.Counter()
    evs = {}
    for Rcat, Acat, a2r, Rraw, ridx in prep:
        hit = None
        # 接缝邻域先从宽的找：越宽越不容易撞重，但要整段在 A 侧唯一出现才算定住位置。
        for CTX in (32, 24, 16, 12):
            lo = max(0, seam + 1 - CTX)
            hi = min(len(H), seam + 1 + CTX)
            ctx = H[lo:hi]
            if len(ctx) < 8:
                break
            if Acat.count(ctx) != 1:
                continue
            pa = Acat.index(ctx) + (seam + 1 - lo)
            if pa > len(Acat):
                continue
            pr = a2r[pa]
            # 贴回：邻域内找本接缝的父本落点（对位允许小幅漂移），取证据最强的一个
            cands = []
            for q in range(max(0, pr - 24), min(len(Rcat), pr + 24) + 1):
                lv = local_verdict(Rcat, q, code, H, seam)
                if lv and lv[0] >= 4:
                    cands.append((lv[0], -abs(q - pr), q, lv[1]))
            if not cands:
                continue
            cands.sort(reverse=True)
            top = set(c[3] for c in cands
                      if c[0] == cands[0][0] and c[1] == cands[0][1])
            v = cands[0][3] if len(top) == 1 else 'conflict'
            q = cands[0][2]
            ev = Rcat[max(0, q - 12):q + 10]
            # 伪句号判据：父本这一带的标点紧挨着引号时，它可能是上一轮「机械加引号」
            # 补的块终止符，不是作者原文 —— 证据就不成立（详见文件头）。
            if v in PUNCS and q - 1 < len(ridx):
                ri = ridx[q - 1]
                if ri + 1 < len(Rraw) and Rraw[ri + 1] in QUOTES:
                    v = 'quote-artifact'
                    ev = Rraw[max(0, ri - 14):ri + 12]
                elif ri > 0 and Rraw[ri - 1] in '，、；：,;':
                    v = 'punct-clash'
                    ev = Rraw[max(0, ri - 14):ri + 12]
            hit = (v, ev)
            break
        if hit is None:
            votes['unmapped'] += 1
            continue
        votes[hit[0]] += 1
        evs.setdefault(hit[0], hit[1])
    mapped = {v: c for v, c in votes.items() if v != 'unmapped'}
    if not mapped:
        return ('unmapped' if votes else 'no-hunk'), ''
    if len(mapped) > 1:
        return 'conflict', ' | '.join('%s x%d' % kv for kv in votes.most_common())
    v = next(iter(mapped))
    return v, evs.get(v, '')


def build_chapter(n, prep, verbose=False):
    path = rel(n)
    raw = io.open(os.path.join(ROOT, path), encoding='utf-8', newline='').read()
    lines, problem = parse_raw(raw)
    if problem:
        return None, problem, None
    counts = collections.Counter()
    sites = []
    for li, line in enumerate(lines):
        content = line.rstrip('\r\n').rstrip('\r')
        term = line[len(content):]
        if not term:
            counts['no-term'] += 1
            continue
        H, hpos = nq_map(content)
        ins = []
        for m in JOINT.finditer(H):
            seam = m.start()
            code = m.group(2)
            v, ev = gate(prep, H, seam, code)
            if v in PUNCS:
                ins.append((seam + 1, v, code, ev))
            else:
                counts['drop:' + v] += 1
        if not ins:
            continue
        new = content
        for hpos_i, punc, *_ in sorted(ins, key=lambda x: -x[0]):
            new = new[:hpos[hpos_i]] + punc + new[hpos[hpos_i]:]
        if any(b in new for b in BAD):
            counts['drop:bad-bigram'] += 1
            continue
        before = content + term
        after = new + term
        if raw.count(before) != 1:
            counts['drop:dup-line'] += 1
            continue
        counts['sites'] += len(ins)
        kinds = set(p for _, p, _, _ in ins)
        for _, p, _, _ in ins:
            counts['punc_' + p] += 1
        sites.append(dict(
            chapter=n, line=li + 1,
            kind='戊1' if kinds == set('。') else
                 ('戊2' if kinds == set('，') else '戊3'),
            before=before, after=after,
            parent=' ｜ '.join(ev for _, _, _, ev in ins),
            code=','.join(c for _, _, c, _ in ins),
            core_before=content, core_after=new,
            note='；'.join('引入者 diff 对位：父本 `%s`' % ev for _, _, _, ev in ins),
            ctx=0, sites=len(ins)))
    return sites, None, counts


def main():
    prep = {k: prep_hunks(v) for k, v in load_hunks().items()}
    total = []
    problems = []
    tally = collections.Counter()
    per = collections.Counter()
    codes = collections.Counter()
    samples = []
    print('R254 表构建 v2：碎片编号前被吃的句读（父本 %s + 引入者 diff 对位）' % PARENT)
    for n in range(LO, HI + 1):
        sites, problem, counts = build_chapter(n, prep.get(rel(n), []))
        if problem:
            problems.append('ch%d: %s' % (n, problem))
            print('  ch%-4d !! %s' % (n, problem))
            continue
        tally.update(counts)
        if sites:
            per[n] = sum(s['sites'] for s in sites)
            for s in sites:
                for c in s['code'].split(','):
                    codes[c] += 1
                if len(samples) < 12:
                    samples.append(s)
            total.extend(sites)
    print()
    print('可证位点 %d / %d 行 / %d 章'
          % (tally['sites'], len(total), len(per)))
    print('插入标点：句号 %d / 逗号 %d' % (tally['punc_。'], tally['punc_，']))
    drops = {k: v for k, v in sorted(tally.items())
             if k not in ('sites', 'punc_。', 'punc_，')}
    print('弃 %d：%s' % (sum(drops.values()), drops))
    print('碎片编号分布 top8: %s' % codes.most_common(8))
    print('章间分布 top8: %s' % per.most_common(8))
    print()
    print('抽样（前 12 行）：')
    for s in samples:
        print('  ch%-4d L%-4d %s %s' % (s['chapter'], s['line'], s['kind'], s['parent'][:96]))
        print('        before: %s' % s['core_before'][:96])
        print('        after : %s' % s['core_after'][:96])
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        for p in problems:
            print('   ' + p)
        return 2
    if '--check' in sys.argv:
        have = json.load(io.open(OUT, encoding='utf-8'))
        print('--check: existing table %s'
              % ('matches' if have == total else 'DIFFERS'))
        return 0 if have == total else 1
    if '--dry' in sys.argv:
        print('dry: nothing written')
        return 0
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(total, ensure_ascii=False, indent=1) + '\n')
    print('wrote %s' % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
