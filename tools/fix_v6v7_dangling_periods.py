# -*- coding: utf-8 -*-
"""R240: repair R238's DANGLING-KEPT sites — the misplaced 。 that R238 left in front of a
term whose quotes it stripped (e.g. `是用。"直觉"。` -> `是用。直觉。` -> `是用直觉。`).

R238 deleted such a period whenever the character before it was a function word (UNBREAK,
1,266 sites).  Where that character was not a function word the period was left in place
and the site was only counted (DANGLING-KEPT, 574 sites) — those are this round's targets.

Every site is recognised from the pre-R238 blob with the same detector R238 used, then
located in the current file by its context string `pre。term` and the period is deleted by
position.  All matches are resolved against the original text, so nested sites (e.g.
`三处。锚点。齐备。`) cannot interfere with one another.

Sites listed in KEEP are real sentence boundaries rather than misplaced periods — there the
preceding clause is complete and the term opens (or is) the next sentence, e.g.
`不是陌生人。配套。`, `其中一张纸上有一行他写的字。买洗衣液。`, `在0428碎片中。沉睡后，`.

The file is always rebuilt from the committed HEAD bytes and the raw (unnormalised) text is
searched, so per-file mixed CRLF/LF and UTF-8-no-BOM are carried through byte-for-byte.
Run without --apply for a dry run.
"""
import sys, os, re, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
import fix_v6v7_quotes as Q
from collections import Counter

PARENT = '5ce23492^'          # the commit whose text still carried the stripped quotes
BREAK = '。！？…；：，、\n"'
APPLY = '--apply' in sys.argv

# (pre-clause, term) pairs where the period is a legitimate sentence end -> leave untouched
KEEP = {
    ('不是陌生人', '配套'), ('她在想你', '感觉到'), ('产生反应', '一切正常'),
    ('了一样', '你好'), ('的记忆', '系统外'), ('在某个地方', '身体'),
    ('封面上有螺旋纹路在流动', '书页'), ('又把小樱的消息读了一遍', '我们有家了'),
    ('路径是存档完整度达到100%时自动触发', '手动'), ('未来叶文轩吐出声音来', '我低估的是'),
    ('脑子里面的那个字的声音在消失', '桥'), ('这个字的含义在流失', '桥'),
    ('系统的核心在机房的深处', '运行'), ('然后进入对应的房间', '感受'),
    ('在0428碎片中', '沉睡'), ('召回不需要变量生产', '手动'),
    ('叶文轩没说话', '是'), ('0429只需要赵大嘴', '在'),
    ('赵大嘴的意识中有一样东西', '我愿意'), ('其中一张纸上有一行他写的字', '买洗衣液'),
    ('门口有一个白色的牌子', '核心机房·游客止步'), ('脑子里跳出来的第一个词是那段英文', '鲸鱼岩'),
    ('很冷', '刻意的冷'), ('叶文轩保持了沉默', '活的索引'), ('闭环', '害怕'),
    ('还有一个地方', '你不知道的地方'), ('我能翻译那个感觉', '选C以外的路'),
}


def sites_of(blob):
    """Yield (pre_clause, term) for every DANGLING-KEPT site, same detector as R238."""
    for m in Q.PAIR.finditer(blob):
        if Q.decide(blob, m, Counter()) != 'strip':
            continue
        i = m.start()
        if not (i >= 2 and blob[i - 1] == '。' and blob[i - 2] not in Q.FUNC_TAIL
                and re.match(r'[一-鿿0-9]', blob[i - 2])):
            continue
        s = i - 1
        while s > 0 and blob[s - 1] not in BREAK:
            s -= 1
        yield blob[s:i - 1], m.group(1)


total_del = total_files = 0
misses, mismatches, keeps, over = [], [], 0, []
for vol in ('volume-6', 'volume-7'):
    for f in sorted(os.listdir('chapters/' + vol)):
        if not f.startswith('chapter-') or not f.endswith('-polished.md'):
            continue
        p = 'chapters/%s/%s' % (vol, f)
        raw = subprocess.run(['git', 'show', '%s:%s' % (PARENT, p)],
                             capture_output=True, check=True).stdout
        blob = raw.decode('utf-8').replace('\r\n', '\n')
        # base = committed HEAD bytes (clean); the working tree may hold an earlier, EOL-normalised
        # attempt at this repair, so always rebuild from HEAD and search the RAW text, whose
        # per-line terminators (mixed CRLF/LF) are copied through untouched.
        head_raw = subprocess.run(['git', 'show', 'HEAD:' + p],
                                  capture_output=True, check=True).stdout
        bom = head_raw.startswith(b'\xef\xbb\xbf')
        cur = head_raw.decode('utf-8-sig')

        want = Counter()
        for pre, term in sites_of(blob):
            if (pre, term) in KEEP:
                keeps += 1
                continue
            want[(pre, term)] += 1

        periods = set()
        for (pre, term), n in want.items():
            needle = pre + '。' + term
            found, start = 0, 0
            while True:
                x = cur.find(needle, start)
                if x < 0:
                    break
                periods.add(x + len(pre))
                found += 1
                start = x + 1
            if found == 0:
                misses.append((p, pre, term))
            elif found != n:
                mismatches.append((p, pre, term, n, found))

        if not periods:
            continue
        total_files += 1
        total_del += len(periods)
        n_sites = sum(want.values())
        if len(periods) > n_sites:
            over.append((p, n_sites, len(periods)))
        new = ''.join(c for k, c in enumerate(cur) if k not in periods)
        if APPLY:
            with open(p, 'wb') as fh:
                fh.write((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))

print('KEEP (left alone): %d   deletions: %d   files: %d   %s'
      % (keeps, total_del, total_files, 'APPLIED' if APPLY else 'DRY RUN'))
print('misses (needle not found in current text): %d' % len(misses))
for p, pre, term in misses:
    print('   MISS %s  pre=%r term=%r' % (p.split('/')[-1], pre, term))
print('count mismatches (found != sites in blob; substring overlaps are expected): %d'
      % len(mismatches))
for p, pre, term, n, found in mismatches:
    print('   MISMATCH %s  pre=%r term=%r expect=%d found=%d'
          % (p.split('/')[-1], pre, term, n, found))
print('OVER-DELETION (deletions > blob sites): %d' % len(over))
for p, n_sites, n_del in over:
    print('   OVER %s  sites=%d deletions=%d' % (p.split('/')[-1], n_sites, n_del))
