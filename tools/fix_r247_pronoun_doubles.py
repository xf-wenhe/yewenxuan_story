# -*- coding: utf-8 -*-
"""R247 — 修轮次生成句里焊进去的叠代词（他没他 / 他的他）。

背景
    2026-08-23/24/25 那几轮「替换句池」把原文的句子整句换成池子里的候选句，而候选句
    字符串本身带着一个叠代词 typo，于是换出来的句子不是话：

        他没他需要再想一想。        他需要再想一想。
        他的他清了清喉。            他清了清喉。
        那抹金色在他的他眼底映出。  那抹金色在他的眼底映出。
        他的他他喝了口水。          他喝了口水。

    来源提交（= 把 typo 句写进正文的那一轮，--audit 逐个复核）：

        793c8cb4  PAD pool cleanup: 390 慢慢停下 + 134 慢慢来 + ...      64 处
        6b1967be  V1-V7 de-AI round 10: 57 replacements                  8 处
        598444cb  Voice round 14: throat-rolling + 目光扫过 + ...          6 处
        66ece795  V1-V7 voice round 8: 115 occurrences removed            3 处
        dee6d291  R16 voice cleanup                                       1 处
        （7 个文件另有 9cd5e651 二次动过，取更早的那次为引入者）

    这些句子是**生成出来的填充句**，不是作者原句被削——父提交里对应位置是另一句
    （如 ch147 原本是 `他没有走到这一步。`），所以修法不是还原，而是**把 typo 的
    叠代词删掉**：句子其余部分读得通，不动。

修法（按形状，逐个站点的 old→new 已写死在表里）
    他没他 + 需要/还需要/得再/还要   他没他 -> 他
    他的他 + 眼底/眼瞳（所有格）      他的他 -> 他的      （删末尾那个他）
    他的他 + 动词（主语位）           他的他 -> 他        （删开头的他的）
    他的他他喝了口水                  他的他他 -> 他

    为什么不整句删掉换回父提交的旧句：旧句是那一轮**有意**清理掉的（`慢慢停下`、
    `咽了口唾沫` 之类是它要消的 padding/voice tell），回填等于把清理撤销。

证据链（--audit）
    ① 每个站点的引入提交：`git log -S<token> -- <path>` 必须含表里记的那个 commit；
    ② 站点当前状态：anchor 在文件里必须**恰好出现一次**（还没修），或者 new_anchor
       恰好出现一次（已经修过）。两种状态都认，所以 apply 前后都能跑。

用法
    python tools/fix_r247_pronoun_doubles.py            # 干跑
    python tools/fix_r247_pronoun_doubles.py --apply    # 落盘
    python tools/fix_r247_pronoun_doubles.py --verify   # 从 git show HEAD 的字节重放
    python tools/fix_r247_pronoun_doubles.py --audit    # 只验证据链
    可选第二参数是章号，只看/只改那一章。
    --apply 可重跑：站点若已修（anchor 不在、修后句在场）记为 already repaired 跳过，
    一个文件的多处编辑在同一份文本上依次落下，所以重跑不会覆盖也不会重复删。

编码
    UTF-8 无 BOM；行尾按每个文件自身的终止符切分与还原，MIXED-EOL 直接拒绝。工作区
    是 CRLF、blob 是 LF（.gitattributes `* text=auto eol=lf`）属既有状态，--verify
    比行内容不比行尾字节。
"""
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

BOM = b'\xef\xbb\xbf'

# (path, 引入提交, anchor, 修完的 anchor)
SITES = [
    ('chapters/volume-1/chapter-55-polished.md', '66ece795',
     '他的他他喝了口水。',
     '他喝了口水。'),
    ('chapters/volume-1/chapter-59-polished.md', '6b1967be',
     '他的他眼底映出一小块光斑，像黑暗中最后一点不灭的余烬。',
     '他的眼底映出一小块光斑，像黑暗中最后一点不灭的余烬。'),
    ('chapters/volume-1/chapter-60-polished.md', '598444cb',
     '他的他清了清喉，"正百分之五百六十七。',
     '他清了清喉，"正百分之五百六十七。'),
    ('chapters/volume-2/chapter-103-polished.md', '598444cb',
     '他的他看了看房间的每一个角落。',
     '他看了看房间的每一个角落。'),
    ('chapters/volume-2/chapter-112-polished.md', '6b1967be',
     '他的他眼底闪了一下。',
     '他的眼底闪了一下。'),
    ('chapters/volume-2/chapter-142-polished.md', '793c8cb4',
     '他没他还需要时间确定方向。',
     '他还需要时间确定方向。'),
    ('chapters/volume-2/chapter-147-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-150-polished.md', '6b1967be',
     '他的他眼瞳里涌出来。',
     '他的眼瞳里涌出来。'),
    ('chapters/volume-2/chapter-151-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-175-polished.md', '793c8cb4',
     '他没他得再缓一缓才来得及。',
     '他得再缓一缓才来得及。'),
    ('chapters/volume-2/chapter-177-polished.md', '793c8cb4',
     '他没他还需要时间做决定。',
     '他还需要时间做决定。'),
    ('chapters/volume-2/chapter-177-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-182-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-192-polished.md', '793c8cb4',
     '他没他得再等一会儿才能把话讲完。',
     '他得再等一会儿才能把话讲完。'),
    ('chapters/volume-2/chapter-193-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-193-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-194-polished.md', '793c8cb4',
     '他没他得再缓一缓。',
     '他得再缓一缓。'),
    ('chapters/volume-2/chapter-194-polished.md', '793c8cb4',
     '他没他还需要一些时间去思考。',
     '他还需要一些时间去思考。'),
    ('chapters/volume-2/chapter-197-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-198-polished.md', '793c8cb4',
     '他没他得再缓片刻。',
     '他得再缓片刻。'),
    ('chapters/volume-2/chapter-199-polished.md', '793c8cb4',
     '他没他还需要时间定下来。',
     '他还需要时间定下来。'),
    ('chapters/volume-2/chapter-199-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-204-polished.md', '793c8cb4',
     '他没他需要再多一会儿才能把话说全。',
     '他需要再多一会儿才能把话说全。'),
    ('chapters/volume-2/chapter-204-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-206-polished.md', '793c8cb4',
     '他没他还需要时间理清。',
     '他还需要时间理清。'),
    ('chapters/volume-2/chapter-207-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-207-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-208-polished.md', '793c8cb4',
     '他没他还需要时间理顺思路。',
     '他还需要时间理顺思路。'),
    ('chapters/volume-2/chapter-208-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-209-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-2/chapter-209-polished.md', '793c8cb4',
     '他没他还需要时间形成判断。',
     '他还需要时间形成判断。'),
    ('chapters/volume-2/chapter-210-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-2/chapter-213-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-3/chapter-251-polished.md', 'dee6d291',
     '他的他清了清喉咙一下，想说什么，最后没有开口。',
     '他清了清喉咙一下，想说什么，最后没有开口。'),
    ('chapters/volume-3/chapter-341-polished.md', '793c8cb4',
     '他没他得再缓片刻才能说完。',
     '他得再缓片刻才能说完。'),
    ('chapters/volume-3/chapter-342-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-3/chapter-373-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-3/chapter-386-polished.md', '793c8cb4',
     '他没他还要再等一等。',
     '他还要再等一等。'),
    ('chapters/volume-3/chapter-388-polished.md', '793c8cb4',
     '他没他还需要片刻才能想通。',
     '他还需要片刻才能想通。'),
    ('chapters/volume-4/chapter-489-polished.md', '66ece795',
     '他的他吞咽了一下。',
     '他吞咽了一下。'),
    ('chapters/volume-4/chapter-495-polished.md', '6b1967be',
     '他的他眼底面映出一层暖色。',
     '他的眼底面映出一层暖色。'),
    ('chapters/volume-4/chapter-496-polished.md', '6b1967be',
     '他的他眼瞳里面映出一层暖色，他的表情和刚才没什么变化',
     '他的眼瞳里面映出一层暖色，他的表情和刚才没什么变化'),
    ('chapters/volume-4/chapter-516-polished.md', '598444cb',
     '他的他清了清喉，有什么东西卡在了喉咙里面。',
     '他清了清喉，有什么东西卡在了喉咙里面。'),
    ('chapters/volume-4/chapter-534-polished.md', '598444cb',
     '他的他看了看门板，门上没有锁，不需要钥匙。',
     '他看了看门板，门上没有锁，不需要钥匙。'),
    ('chapters/volume-4/chapter-539-polished.md', '6b1967be',
     '他的他眼底，两个光点，一个在掌心，一个在眼里，他沉默',
     '他的眼底，两个光点，一个在掌心，一个在眼里，他沉默'),
    ('chapters/volume-4/chapter-539-polished.md', '6b1967be',
     '他的他眼底，把所有的杂质都照没了。',
     '他的眼底，把所有的杂质都照没了。'),
    ('chapters/volume-4/chapter-546-polished.md', '6b1967be',
     '他的他眼瞳里投下一层薄薄的阴影。',
     '他的眼瞳里投下一层薄薄的阴影。'),
    ('chapters/volume-5/chapter-563-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-573-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-573-polished.md', '66ece795',
     '他的他他喝了口水，手指握紧了。',
     '他喝了口水，手指握紧了。'),
    ('chapters/volume-5/chapter-575-polished.md', '793c8cb4',
     '他没他还需要时间梳理清楚。',
     '他还需要时间梳理清楚。'),
    ('chapters/volume-5/chapter-577-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-577-polished.md', '598444cb',
     '他的他清了清喉滚了一下0429碎片在他的体内发热。',
     '他清了清喉滚了一下0429碎片在他的体内发热。'),
    ('chapters/volume-5/chapter-578-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-580-polished.md', '793c8cb4',
     '他没他得再等一会儿来理清思绪。',
     '他得再等一会儿来理清思绪。'),
    ('chapters/volume-5/chapter-585-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-586-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-590-polished.md', '793c8cb4',
     '他没他还需要再缓一缓。',
     '他还需要再缓一缓。'),
    ('chapters/volume-5/chapter-598-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-600-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-610-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-612-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-618-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-644-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-645-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-650-polished.md', '793c8cb4',
     '他没他还需要短暂的时间才能做出判断。',
     '他还需要短暂的时间才能做出判断。'),
    ('chapters/volume-5/chapter-651-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-652-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-661-polished.md', '793c8cb4',
     '他没他需要再多给点时间。',
     '他需要再多给点时间。'),
    ('chapters/volume-5/chapter-662-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-663-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-667-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-671-polished.md', '793c8cb4',
     '他没他还需要更多余地。',
     '他还需要更多余地。'),
    ('chapters/volume-5/chapter-674-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-675-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-676-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-677-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-683-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-686-polished.md', '793c8cb4',
     '他没他还需要再缓一缓。',
     '他还需要再缓一缓。'),
    ('chapters/volume-5/chapter-688-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-694-polished.md', '793c8cb4',
     '他没他还要再缓一缓才能把话说完整。',
     '他还要再缓一缓才能把话说完整。'),
    ('chapters/volume-5/chapter-696-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-697-polished.md', '793c8cb4',
     '他没他还要花一点时间。',
     '他还要花一点时间。'),
    ('chapters/volume-5/chapter-698-polished.md', '793c8cb4',
     '他没他还要再等片刻才能讲完。',
     '他还要再等片刻才能讲完。'),
    ('chapters/volume-5/chapter-699-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-700-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-702-polished.md', '793c8cb4',
     '他没他还需要时间理清思路。',
     '他还需要时间理清思路。'),
    ('chapters/volume-5/chapter-703-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-704-polished.md', '793c8cb4',
     '他没他得再等一会儿才能把话讲完。',
     '他得再等一会儿才能把话讲完。'),
    ('chapters/volume-5/chapter-705-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-706-polished.md', '793c8cb4',
     '他没他得再缓片刻。',
     '他得再缓片刻。'),
    ('chapters/volume-5/chapter-724-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-5/chapter-732-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-5/chapter-734-polished.md', '793c8cb4',
     '他没他还要再等一等。',
     '他还要再等一等。'),
    ('chapters/volume-6/chapter-904-polished.md', '6b1967be',
     '他的他眼底，一明一暗。',
     '他的眼底，一明一暗。'),
    ('chapters/volume-6/chapter-906-polished.md', '793c8cb4',
     '他没他还需要时间梳理清楚。',
     '他还需要时间梳理清楚。'),
    ('chapters/volume-6/chapter-906-polished.md', '793c8cb4',
     '他没他需要再想一想。',
     '他需要再想一想。'),
    ('chapters/volume-6/chapter-907-polished.md', '793c8cb4',
     '他没他需要喘一口气。',
     '他需要喘一口气。'),
    ('chapters/volume-6/chapter-907-polished.md', '793c8cb4',
     '他没他还要再等一会儿。',
     '他还要再等一会儿。'),
    ('chapters/volume-7/chapter-971-polished.md', '598444cb',
     '他的他清了清喉，转身打开调料柜，找了半天，只找到一小',
     '他清了清喉，转身打开调料柜，找了半天，只找到一小'),
]


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
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, path)], capture_output=True)
    return None if r.returncode else r.stdout


def token_of(old):
    return '他没他' if '他没他' in old else '他的他'


def introducer(path, tok):
    r = subprocess.run(['git', 'log', '-S', tok, '--format=%h', '--', path],
                       capture_output=True, check=True)
    return [x for x in r.stdout.decode('utf-8').split('\n') if x.strip()]


def snippet(s, anchor):
    i = s.find(anchor)
    return s[max(0, i - 10):i + len(anchor) + 10]


def audit_site(path, src, old, new, lines):
    text = '\n'.join(lines)
    tok = token_of(old)
    commits = introducer(path, tok)
    if not commits:
        return '%s present in the worktree but no commit changed it' % tok
    if src not in commits:
        return 'introducer %s not among %s' % (src, ','.join(c[:7] for c in commits))
    # 本轮的修法是「删字」，new 是 old 的子串，所以在未修状态下 count(new) 必然 >=1
    # （由 old 自身贡献）。只能拿 old 的在场与否分状态；修后状态的字节级证据由
    # --verify 从 HEAD 重放给出，这里只做粗验。
    n_old, n_new = text.count(old), text.count(new)
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

    sites = [s for s in SITES if only is None or only in s[0]]
    print('R247  他没他 / 他的他 叠代词')
    print('%d site(s) selected\n' % len(sites))

    if mode == '--audit':
        bad = 0
        for path, src, old, new in sites:
            raw, lines, term, trail, problem = read_state(path)
            if problem:
                print('  AUDIT %-30s !! %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            err = audit_site(path, src, old, new, lines)
            print('  AUDIT %-30s %s' % (path.split('/')[-1],
                                        'OK  %s(%s)' % (src, token_of(old)) if err is None
                                        else '!! ' + err))
            if err:
                bad += 1
        print('\naudit: %d/%d ok' % (len(sites) - bad, len(sites)))
        return 1 if bad else 0

    if mode == '--verify':
        # 一个文件可能有多处，必须把该文件的全部编辑按表里的顺序重放一遍再比
        order = []
        for path, src, old, new in sites:
            if path not in order:
                order.append(path)
        bad = 0
        for path in order:
            mine = [s for s in sites if s[0] == path]
            raw = blob('HEAD', path)
            if raw is None:
                print('  VERIFY %-30s !! HEAD blob missing' % path.split('/')[-1])
                bad += 1
                continue
            hlines, hterm, htrail, problem = parse_raw(raw)
            if problem:
                print('  VERIFY %-30s !! HEAD: %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            htext = '\n'.join(hlines)
            broke = None
            for _, _, old, new in mine:
                if htext.count(old) != 1:
                    broke = 'HEAD: anchor x%d  %s' % (htext.count(old), snippet(htext, old[:6]))
                    break
                htext = htext.replace(old, new, 1)
            if broke:
                print('  VERIFY %-30s !! %s' % (path.split('/')[-1], broke))
                bad += 1
                continue
            hlines = htext.split('\n')
            cur = open(path, 'rb').read()
            clines, cterm, ctrail, problem = parse_raw(cur)
            if problem:
                print('  VERIFY %-30s !! worktree: %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            if hlines == clines and htrail == ctrail:
                note = 'bytes' if hterm == cterm else 'EOL %s->%s via eol=lf' % (
                    repr(hterm), repr(cterm))
                print('  VERIFY %-30s OK  x%d (%s)' % (path.split('/')[-1], len(mine), note))
            else:
                print('  VERIFY %-30s !! replay differs from the worktree' % path.split('/')[-1])
                bad += 1
        print('\nverify: %d/%d file(s) ok' % (len(order) - bad, len(order)))
        return 1 if bad else 0

    problems = []
    plans = []          # [path, lines, term, trail, [(old, new), ...]]，一个文件一条
    index = {}
    done = 0
    for path, src, old, new in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            problems.append((path, old, problem))
            print('  %-30s !! %s' % (path.split('/')[-1], problem))
            continue
        text = '\n'.join(lines)
        n = text.count(old)
        if not n and text.count(new):
            done += 1       # 上一趟已修过（重跑时容忍），不重复写
            print('  %-30s -- already repaired' % path.split('/')[-1])
            continue
        if n != 1:
            problems.append((path, old, 'anchor x%d' % n))
            print('  %-30s !! anchor x%d  %s' % (path.split('/')[-1], n, snippet(text, old[:6])))
            continue
        grp = index.get(path)
        if grp is None:
            grp = index[path] = [path, lines, term, trail, []]
            plans.append(grp)
        grp[4].append((old, new))
        print('  %-30s %s' % (path.split('/')[-1], snippet(text, old)))
        print('  %-30s -> %s' % ('', snippet(text, old).replace(old, new)))

    print()
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    if mode == '--dry-run':
        print('dry run: %d edit(s) in %d file(s), %d already done'
              % (sum(len(g[4]) for g in plans), len(plans), done))
        return 0

    # 一个文件的多处编辑必须在同一份文本上依次落下，否则后写的会覆盖先写的
    for path, lines, term, trail, edits in plans:
        text = '\n'.join(lines)
        for old, new in edits:
            text = text.replace(old, new, 1)
        with open(path, 'wb') as fh:
            fh.write(encode(text.split('\n'), term, trail))
    print('applied: %d edit(s) in %d file(s)'
          % (sum(len(g[4]) for g in plans), len(plans)))

    left = 0
    for path, _, old, new in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            print('  POST %-32s !! %s' % (path.split('/')[-1], problem))
            left += 1
            continue
        t = '\n'.join(lines)
        if t.count(old):
            print('  POST %-32s !! anchor still present x%d' % (path.split('/')[-1],
                                                                t.count(old)))
            left += 1
    print('post-check: %d bad state(s)' % left)
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
