# -*- coding: utf-8 -*-
"""Generate tools/r306_sites.json -- the 9 `。间。` fold-debris lines.

R274's periodless-chain collapse welded a sentence onto its neighbour and left
a single stranded 间 behind, producing 「空气像被这句话冻了一下。间。」 in nine
chapters. The sentence itself is a recycled filler template (空气像被这句话X)
and every one of the nine sits between two paragraphs of real content, so the
line is deleted outright rather than repaired.

Writes tools/r306_sites.json.
"""
import io
import json
import re

CJK = re.compile('[一-鿿]')
FLOOR = 3000


def read_lines(path):
    raw = io.open(path, 'rb').read()
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8').replace('\r\n', '\n').split('\n')


def main():
    targets = []
    for v in range(1, 8):
        d = 'chapters/volume-%d' % v
        import os
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('-polished.md'):
                continue
            p = os.path.join(d, f)
            for i, l in enumerate(read_lines(p)):
                if re.search(u'。间。\s*$', l):
                    targets.append((p.replace('\\', '/'), i + 1, l))

    records = []
    for path, ln, old in targets:
        lines = read_lines(path)
        cur = len(CJK.findall('\n'.join(lines)))
        if cur - len(CJK.findall(old)) < FLOOR:
            raise SystemExit('ABORT: %s would drop below floor deleting L%d' % (path, ln))
        records.append({
            'path': path,
            'chapter': int(re.search(r'chapter-(\d+)', path).group(1)),
            'line': ln, 'op': 'del', 'old': old,
            'defect': u'R274 折叠残渣：「空气像被这句话X。间。」——「间」字是被压塌的词根，句子本身也是跨章重复的填充模板。',
        })

    doc = {
        'round': 'R306',
        'detector': 'regex: 。间。 at end of line',
        'note': (
            'R274 collapsed a periodless chain and stranded a single 间 after '
            'its sentence, in nine chapters. The host sentence is the recycled '
            '「空气像被这句话X」 filler, and in every case the paragraphs on '
            'both sides carry real content, so the whole line is deleted. Each '
            'chapter is re-checked against the 3000 floor.'
        ),
        'records': records,
    }
    with io.open('tools/r306_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    for r in records:
        print('%s L%d: %s' % (r['path'], r['line'], r['old'][:50]))


if __name__ == '__main__':
    main()
