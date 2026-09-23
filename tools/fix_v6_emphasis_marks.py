# -*- coding: utf-8 -*-
"""R241: strip V6's single-quote emphasis marks — the same authoring-pipeline style R238 removed
for double quotes. `只看了'表面'。` -> `只看了表面。`

A `'…'` span is kept when it is nested *content* rather than emphasis:
  - sentence punctuation inside   `'我们在这里。我们没有消失。'`
  - clause punctuation inside     `'高分析力、低连接力'`
  - a reporting-verb form ends at the opening mark   `说'选C'` / `说了'我不后悔'` / `写的是'妈妈让我画的'`
  - a speech verb follows the closing mark
Spans holding ASCII letters with no CJK at all are skipped (English text, `you're`).

Scope: V6 only (62 files, 1,274 marks). V7's 5 marks sit at the V1-V5 house rate (V2 has 18
spans across 150 chapters) and each is a content quotation; V6 carried 1,336, i.e. 16-100x.

Pre-edits, each verified against the add-time text at eee81640:
  ch841 `认出'我。`  -> `认出'我'。`  the closing mark was never written; only once it is
      present do the file's marks pair up and the strip resolve the whole line.
  ch830 `。"。'我们在这里。我们没有消失。我们在闭环中活着。'"` -> `，"我们在这里。…"`
      add-time read `"它在说——"…"——'我们在这里。…'"`; a later de-AI rewrite turned the second
      `——` into `。` and left a stray `"` glued to the mark.

The file is always rebuilt from the committed HEAD bytes and the raw text is operated on, so
per-file mixed CRLF/LF and UTF-8-no-BOM are carried through byte-for-byte. `--apply` writes.
"""
import sys, re, glob, subprocess
sys.stdout.reconfigure(encoding='utf-8')
from collections import Counter

APPLY = '--apply' in sys.argv
SENT, CLAUSE = '。？！…', '，、；：'
VERB = '说问喊叫答念读道'
FORMS = ('写的是', '说的是', '标记为', '写着', '写了', '写道', '说过', '听到', '称为',
         '叫作', '显示', '标着', '印着', '说了', '说着', '问道', '喊道', '答',
         '说', '问', '喊', '叫', '念', '读', '道')
SPAN = re.compile(r"'([^'\n]{1,60})'")
ASCII = re.compile(r'[A-Za-z]')
CJK = re.compile(r'[一-鿿]')

MANUAL = [
    ('chapters/volume-6/chapter-841-polished.md', "认出'我。", "认出'我'。"),
    ('chapters/volume-6/chapter-830-polished.md',
     '。"。\'我们在这里。我们没有消失。我们在闭环中活着。\'"',
     '，"我们在这里。我们没有消失。我们在闭环中活着。"'),
]
KEEP = {'爸爸回来'}          # ch898: the drawing's subject word, quoted like V7's kept labels


def classify(text, m):
    inner = m.group(1)
    if ASCII.search(inner) and not CJK.search(inner):
        return 'skip:ascii'
    if inner in KEEP:
        return 'keep:KEEPLIST'
    if any(c in inner for c in SENT):
        return 'keep:SENT'
    if any(c in inner for c in CLAUSE):
        return 'keep:CLAUSE'
    i = m.start()
    if any(text[max(0, i - 6):i].endswith(f) for f in FORMS):
        return 'keep:REPORT'
    if text[m.end():m.end() + 1] in VERB:
        return 'keep:SPEECH-AFTER'
    return 'strip'


cls = Counter()
total_files = 0
net = 0
odd, samples, shown = [], [], 0
for p in sorted(glob.glob('chapters/volume-6/*.md')):
    p = p.replace('\\', '/')
    if '/chapter-' not in p:
        continue
    head_raw = subprocess.run(['git', 'show', 'HEAD:' + p], capture_output=True, check=True).stdout
    bom = head_raw.startswith(b'\xef\xbb\xbf')
    edited = head_raw.decode('utf-8-sig')
    for path, src, dst in MANUAL:
        if path == p and src in edited:
            edited = edited.replace(src, dst)
            net += len(dst.encode('utf-8')) - len(src.encode('utf-8'))
    if edited.count("'") % 2:
        odd.append((p, edited.count("'")))
        continue

    drop = set()
    for m in SPAN.finditer(edited):
        k = classify(edited, m)
        cls[k] += 1
        if k != 'strip':
            continue
        drop.add(m.start())
        drop.add(m.end() - 1)
        if shown < 6:
            shown += 1
            samples.append((p.split('/')[-1], edited[max(0, m.start() - 26):m.end() + 16]))
    if not drop:
        continue
    total_files += 1
    net -= len(drop)
    if APPLY:
        new = ''.join(c for k, c in enumerate(edited) if k not in drop)
        with open(p, 'wb') as fh:
            fh.write((b'\xef\xbb\xbf' if bom else b'') + new.encode('utf-8'))

print('%s  files=%d  net=%+d bytes  %s' % ('APPLIED' if APPLY else 'DRY RUN', total_files, net,
                                           '  '.join('%s=%d' % kv for kv in sorted(cls.items()))))
print('files with an odd mark count (skipped): %d' % len(odd))
for p, n in odd:
    print('   ODD %s  marks=%d' % (p.split('/')[-1], n))
for f, ctx in samples:
    print('   %-22s %s' % (f[:22], ctx.replace('\n', ' ')))
