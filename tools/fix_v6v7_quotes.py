# -*- coding: utf-8 -*-
"""R238: V6/V7 术语引号清除 + 断句修复 (dry-run by default).

修复动作（只动引号与其紧邻的错位句号，不写新句子）：
  A. 剥离术语/标记引号：`"振动"` -> `振动`（对话引号、引语、书面文本引号保留）
  B. 修补 `X。"Y"。` 断句：当被剥离的引号紧跟在 `[的了是在有和与把被对从为]。"`
     之后时，一并删掉那个错位的句号 -> `X Y。`
  C. 清理剥离后仍不配对的孤立引号（按行处理）

用法:
  python tools/fix_v6v7_quotes.py --report            # 全局统计 + 问题行转储
  python tools/fix_v6v7_quotes.py --diff FILE [FILE…] # 指定章节的前后对照
  python tools/fix_v6v7_quotes.py --apply FILE [FILE…]  # 落盘（保持原编码/换行）
"""
import re, sys, io, os, glob
from collections import Counter

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PAIR = re.compile(r'"([^"\n]{1,30})"')
TERM_PUNCT = '。？！…，、；：'
SPEECH_VERB = '说问道喊叫答'
K9_VERB = '说问喊叫答'      # 不含「道」：知道/通道/一道 会误判
FUNC_TAIL = '的了是在有和与把被对从为'
PRODUCE = ('写着', '写到', '画着', '画了', '刻着', '显示', '滚动', '标着', '印着',
           '说过', '说了', '问过', '叫作', '称为', '读着', '念', '写在')
MAX_INNER = 10          # 超过此长度的引号内文视为引语，保留
PRODUCE_WINDOW = 12     # 文本动词回看窗口


def line_start(text, i):
    ls = text.rfind('\n', 0, i) + 1
    return text[ls:i].strip() == ''


def decide(text, m, stats):
    """返回 'strip' / 'keep:<reason>'."""
    i, j = m.start(), m.end()
    inner = m.group(1)
    if line_start(text, i):
        return 'keep:K1'
    if any(c in inner for c in '。？！…'):
        return 'keep:K2'
    if any(c in inner for c in '，、；：'):
        return 'keep:K3'
    before = text[i-1] if i else ''
    after = text[j] if j < len(text) else ''
    if before == '：':
        return 'keep:K4'
    if before == '，':
        win = text[max(0, i-6):i]
        if any(v in win for v in SPEECH_VERB):
            return 'keep:K4'
    if after in SPEECH_VERB:
        return 'keep:K5'
    if before in '说问喊叫念读':
        return 'keep:K8'
    if before == '。' and i >= 2 and text[i-2] in K9_VERB:
        return 'keep:K9'          # 说。"X" —— 与其他卷同形的引语，保留引号
    if len(inner) > MAX_INNER:
        return 'keep:K6'
    win = text[max(0, i-PRODUCE_WINDOW):i]
    if any(v in win for v in PRODUCE):
        return 'keep:K7'
    return 'strip'


CASCADE_LEFT = '的了是在被过着'
ORPHAN_TAIL = ('。', '，', '、', '；', '：')

# 父版本（git add-time）核实过的定点修复：机械规则无法安全判定的残余站点
MANUAL = [
    ('chapter-760-polished.md',
     '"不知道。也许几分钟。也许几小时。0429说。"快到了"。',
     '"不知道。也许几分钟。也许几小时。"0429说，"快到了。"'),
    ('chapter-760-polished.md',
     '"它在说，"跟着0428走。0428知道路。"',
     '"它在说：跟着0428走。0428知道路。"'),
    ('chapter-766-polished.md',
     '"你说，"帮我照顾好叶子。帮我保管0429。如果我忘了，帮我记着。"',
     '"你说：帮我照顾好叶子。帮我保管0429。如果我忘了，帮我记着。"'),
    ('chapter-775-polished.md',
     '1."现在：0428借用备用功率。',
     '1.现在：0428借用备用功率。'),
    ('chapter-912-polished.md',
     '你妈妈也会有。\n\n"\n（第九百一十二章完）',
     '你妈妈也会有。"\n\n（第九百一十二章完）'),
    ('chapter-952-polished.md',
     '"她有没有听到里面的"……吧？"',
     '"她有没有听到里面的声音？"'),
    ('chapter-962-polished.md',
     '"什么"……好？"',
     '"什么声音？"'),
    # 数值被搬移/插入：按 add-time 之后的 de-AI 父版本还原（`94.7% → 94.8% → …`）
    ('chapter-802-polished.md',
     '叶文轩的"觉醒度"在"上升"。94.7%"→。94.8%\n→叶94.9%4→995.0%。',
     '叶文轩的"觉醒度"在"上升"。94.7% → 94.8% → 94.9% → 95.0%。'),
    # 英文词前的引号+错插字：add-time 为 `但 screen 上的画面…`
    ('chapter-873-polished.md',
     '但"screen像上的画面和他自己没有关系。',
     '但screen上的画面和他自己没有关系。'),
    # 强调词前的错位句号（剥离后成 `但不能。感受。`）
    ('chapter-873-polished.md',
     '他能"复述"但不能。"感受"。',
     '他能"复述"但不能"感受"。'),
]


def apply_manual(text, path, stats):
    name = '/'.join(path.replace('\\', '/').split('/')[-1:])
    for key, src, dst in MANUAL:
        if key != name or src not in text:
            continue
        text = text.replace(src, dst)
        stats['MANUAL'] += 1
    return text


def kill_cascades(line, stats):
    """吃掉闭合引号的连锁损坏：`的"声音通过…，0428在"` 这种跨标点假配对。
    仅在该行引号数为奇数（已损坏）时启用，删除 `[的了是在被过着]"CJK` 中的引号。"""
    if line.count('"') % 2 == 0:
        return line
    out = list(line)
    for m in PAIR.finditer(line):
        inner = m.group(1)
        i = m.start()
        if not any(c in inner for c in '。，、；：'):
            continue
        if len(inner) < 10:
            continue
        if i == 0 or line[i-1] not in CASCADE_LEFT:
            continue
        out[i] = ''
        stats['CASCADE-KILL'] += 1
    return ''.join(out)


def kill_orphans(line, stats):
    """行内孤立引号（剥离术语引号之后调用）。
    只删上下文可证的孤立引号；其余留给 MANUAL / 人工，避免吃掉对话引号。"""
    if line.count('"') % 2 == 0:
        return line
    for k, ch in enumerate(line):
        if ch != '"' or k == 0:
            continue
        left = line[k-1]
        right = line[k+1] if k + 1 < len(line) else ''
        if not re.match(r'[一-鿿0-9]', right):
            # 右侧是标点/行尾：仅在非对话行、左侧是汉字时按行尾孤立处理
            if not right and re.match(r'[一-鿿]', left) \
               and left not in SPEECH_VERB and not line.startswith('"'):
                return line[:k] + line[k+1:]
            continue
        if re.match(r'[一-鿿0-9]', left):
            if line.startswith('"'):
                continue          # 对话行内的引号缺损：留人工，不删
            line = line[:k] + line[k+1:]   # 非对话行中段孤立引号：`到达"了坐标`
            stats['ORPHAN-KILL'] += 1
            return line
        if left == '，' and any(v in line[max(0, k-6):k] for v in SPEECH_VERB):
            continue                      # 说，"… 是对话
        line = line[:k] + line[k+1:]
        stats['ORPHAN-KILL'] += 1
        return line
    return line


def fix_text(text, stats=None, odd_out=None, path=None, dangling_out=None):
    stats = stats if stats is not None else Counter()
    text = text.replace('\r\n', '\n')
    if path:
        text = apply_manual(text, path, stats)

    # A. 连锁损坏：吃掉闭合引号的假配对（须在剥离前处理）
    lines = text.split('\n')
    lines = [kill_cascades(ln, stats) if ln.count('"') % 2 == 1 else ln for ln in lines]
    text = '\n'.join(lines)

    # B. 术语/标记引号剥离 + 引号前错位句号修补
    dels = set()
    for m in PAIR.finditer(text):
        d = decide(text, m, stats)
        if d == 'strip':
            stats['STRIP'] += 1
            i, j = m.start(), m.end()
            dels.add(i); dels.add(j - 1)
            if i >= 2 and text[i-1] == '。' and text[i-2] in FUNC_TAIL:
                dels.add(i - 1)
                stats['UNBREAK'] += 1
            elif i >= 2 and text[i-1] == '。' and re.match(r'[一-鿿0-9]', text[i-2]):
                # 句号前的字不在 FUNC_TAIL：可能是并列/同位（应删句号），也可能是被前次
                # 清理掏空后的残片（删句号会连成病句）。无法机械判定，登记给 R239 逐条对齐父版本。
                stats['DANGLING-KEPT'] += 1
                if dangling_out is not None:
                    dangling_out.append((text[i-2], text[max(0, i-26):i+22]))
        else:
            stats[d] += 1
    out = ''.join(ch for k, ch in enumerate(text) if k not in dels)

    # C. 剥离后仍不配对的孤立引号（此时术语对已消失，剩者为对话引号或孤立引号）
    fixed = []
    for ln in out.split('\n'):
        if ln.count('"') % 2 == 1:
            ln = kill_orphans(ln, stats)
            if ln.count('"') % 2 == 1:
                if odd_out is not None:
                    odd_out.append(ln)
                m2 = re.search(r'[。，、；：]\s*"\s*$', ln)
                if m2:
                    ln = ln[:m2.start()] + ln[m2.end():]
                    stats['ORPHAN-DROP'] += 1
        fixed.append(ln)
    return '\n'.join(fixed), stats


def read_raw(path):
    with open(path, 'rb') as f:
        return f.read()


def decode(raw):
    return raw.decode('utf-8')


def main():
    args = sys.argv[1:]
    mode = 'report'
    files = []
    for a in args:
        if a in ('--report', '--diff', '--apply'):
            mode = a.strip('-')
        else:
            files.append(a)

    if mode == 'report':
        vols = files or ['volume-6', 'volume-7']
        for vol in vols:
            paths = [p.replace('\\', '/') for p in sorted(glob.glob(f'chapters/{vol}/*.md'))]
            paths = [p for p in paths if '/chapter-' in p]
            stats = Counter(); odd_all = []; worst = []; dangling_all = []
            for p in paths:
                raw = read_raw(p)
                text = decode(raw)
                odd = []
                _, stats = fix_text(text, stats, odd, p, dangling_all)
                odd_all += [(p, ln) for ln in odd]
                n = Counter(); fix_text(text, n, None, p)
                worst.append((n['STRIP'], p, n['UNBREAK']))
            print(f'=== {vol}: {len(paths)} files ===')
            for k, v in stats.most_common():
                print(f'  {k:16s} {v:7d}')
            print('  worst chapters:')
            for n, p, u in sorted(worst, reverse=True)[:8]:
                print(f'    strip={n:5d} unbreak={u:4d}  {p}')
            print(f'  --- lines still unbalanced after fix: {len(odd_all)} ---')
            for p, ln in odd_all[:40]:
                print(f'    {p.split("/")[-1]:26s} | {ln[:110]}')
            print(f'  --- 断句待定（DANGLING-KEPT, 交 R239）: {len(dangling_all)} ---')
            dc = Counter(c for c, _ in dangling_all)
            print('    by prev char: ' + ' '.join(f'{c}={n}' for c, n in dc.most_common(18)))
            for c, s in dangling_all[:12]:
                print(f'    [{c}] …{s}')
            print()
        return

    # diff / apply on explicit files
    for p in files:
        p = p.replace('\\', '/')
        raw = read_raw(p)
        text = decode(raw).replace('\r\n', '\n')
        new, stats = fix_text(decode(raw), path=p)
        if mode == 'diff':
            print(f'######## {p}  strip={stats["STRIP"]} unbreak={stats["UNBREAK"]} '
                  f'orphan={stats["ORPHAN-KILL"] + stats["ORPHAN-DROP"]} '
                  f'cascade={stats["CASCADE-KILL"]} manual={stats["MANUAL"]}')
            old_l = text.split('\n'); new_l = new.split('\n')
            for a, b in zip(old_l, new_l):
                if a != b:
                    print(f'  - {a[:150]}')
                    print(f'  + {b[:150]}')
            print()
        elif mode == 'apply':
            if new == text:
                print(f'  unchanged: {p}')
                continue
            nl = '\r\n' if b'\r\n' in raw else '\n'
            data = new.replace('\r\n', '\n').replace('\n', nl).encode('utf-8')
            with open(p, 'wb') as f:
                f.write(data)
            print(f'  applied: {p}  strip={stats["STRIP"]} unbreak={stats["UNBREAK"]} '
                  f'orphan={stats["ORPHAN-KILL"] + stats["ORPHAN-DROP"]} '
                  f'manual={stats["MANUAL"]} eol={"CRLF" if nl == chr(13)+chr(10) else "LF"}')


if __name__ == '__main__':
    main()
