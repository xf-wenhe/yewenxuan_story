# -*- coding: utf-8 -*-
"""Census the R280 sub-floor refill filler.

R280 (7671009) wrote generic sentences into 98 chapters to hold the 3000 CJK
floor after R279 deleted whole-line machine filler.  Those sentences are the
library's most genuinely AI-sounding text: they carry no story information and
they repeat across chapters, which is the tell that no author wrote them.

A sentence counts as filler only when BOTH hold:
  1. it matches one of the generic patterns below, and
  2. the identical sentence occurs in 2 or more chapters.

Writes .claude/tmp/r303_filler.json.
"""
import io
import json
import os
import re
from collections import defaultdict

PATTERNS = [
    u'他不确定自己看到的是真的还是幻觉',
    u'胸口那股暖意又出现了',
    u'他不知道自己现在该做什么，只能等着',
    u'有些话到了嘴边，又被他咽了回去',
    u'那些数字在他脑海里不断重复，像是某种密码',
    u'他把手插进衣服口袋，试图让自己暖和一点',
    u'他转过身，背对着那些人，不想让任何人看到他的表情',
    u'空气里弥漫着一股味道，说不清楚是什么',
    u'时间在这种时候变得很慢，每一秒都像被拉长了',
    u'他抬起头看向窗外，窗外空荡荡的',
    u'他抬头看着窗外，窗外空荡荡的',
    u'记忆在重组，但重组后的画面和原来不一样',
    u'那些画面在他眼前闪烁，像是老旧电影的画面',
    u'他伸出手，想抓住什么，但指缝里什么也没有',
    u'那些消失的人，此刻就站在他的身后',
    u'他没有回头看，但感觉到后面有人在看他',
    u'那些记忆像潮水一样退去',
    u'这件事的来龙去脉',
    u'脑海中那个嗓音久久回荡',
    u'风的声音改了一番',
    u'缝隙在继续扩大',
    u'他抬起目光',
    u'他被遗忘的东西',
    u'他的思绪需要一点时间',
]
RX = [(p, re.compile(re.escape(p))) for p in PATTERNS]


def main():
    # chapter -> list of (line_no, sentence, pattern)
    per_chapter = defaultdict(list)
    for v in range(1, 8):
        d = 'chapters/volume-%d' % v
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('-polished.md'):
                continue
            p = os.path.join(d, f)
            raw = io.open(p, 'rb').read()
            if raw.startswith(b'\xef\xbb\xbf'):
                raw = raw[3:]
            txt = raw.decode('utf-8').replace('\r\n', '\n')
            ch = int(re.match(r'chapter-(\d+)', f).group(1))
            for i, line in enumerate(txt.split('\n')):
                s = line.strip()
                for pat, rx in RX:
                    if rx.search(s):
                        per_chapter[ch].append({
                            'line': i + 1, 'path': p.replace('\\', '/'),
                            'pat': pat, 'text': s,
                        })
                        break

    # sentence -> chapters that contain it
    by_sentence = defaultdict(set)
    for ch, hits in per_chapter.items():
        for h in hits:
            by_sentence[h['text']].add(ch)

    repeated = {s: sorted(cs) for s, cs in by_sentence.items() if len(cs) >= 2}
    singles = {s: sorted(cs) for s, cs in by_sentence.items() if len(cs) == 1}

    out = {
        'round': 'R303',
        'note': (
            'Filler census. A sentence is only filler when it matches a generic '
            'pattern AND appears in 2+ chapters -- repetition across chapters is '
            'the proof that no author wrote it.'
        ),
        'total_sites': sum(len(v) for v in per_chapter.values()),
        'chapters_touched': len(per_chapter),
        'repeated_sentences': len(repeated),
        'repeated_sites': sum(len(cs) for cs in repeated.values()),
        'single_use_sentences': len(singles),
        'repeated': repeated,
        'singles': singles,
        'per_chapter': {str(k): v for k, v in sorted(per_chapter.items())},
    }
    with io.open('.claude/tmp/r303_filler.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(out, ensure_ascii=False, indent=1))

    print('sites=%d chapters=%d' % (out['total_sites'], out['chapters_touched']))
    print('repeated sentences=%d (sites=%d)' % (len(repeated), out['repeated_sites']))
    print('single-use sentences=%d' % len(singles))
    print()
    print('=== 跨章重复的填充句（按出现章节数排序）===')
    for s, cs in sorted(repeated.items(), key=lambda kv: -len(kv[1])):
        print('%2d ch  %s' % (len(cs), s[:78]))


if __name__ == '__main__':
    main()
