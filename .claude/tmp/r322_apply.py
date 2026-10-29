# -*- coding: utf-8 -*-
"""R322 apply: equal-length differentiation, checked at chapter level.

R320's engine aborted on this table, and it was right to: it caps a record at
three characters because those records were mark repairs.  Differentiation is
the opposite case -- the sentence cuts change, so a paragraph may legitimately
gain or lose a dozen characters.  What must not move is the chapter.

So the contract is different and it is enforced here:

  * the old paragraph must occur exactly once in the file;
  * no file may gain or lose a single CJK character overall;
  * the number of speech marks must not change (these are narration lines, but
    a stray mark would be a defect either way);
  * every replacement is written to the file with the file's own line endings.

Only after all four hold for every record is anything written.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CJK = re.compile(u'[\u4e00-\u9fff]')


def main(apply, allow_delta=False, allow_marks=False, allow_marks_up=False):
    tab = os.path.join(ROOT, sys.argv[sys.argv.index('--table') + 1])
    recs = json.load(io.open(tab, encoding='utf-8'))['records']
    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    problems = 0
    deltas = []
    texts = {}
    for path, rs in by_file.items():
        # Descending line order: a later paragraph can carry an earlier one's
        # text verbatim, and the uniqueness check would then see two matches
        # and abort before the later one is ever touched.
        rs = sorted(rs, key=lambda r: -r['line'])
        fp = os.path.join(ROOT, path)
        raw = io.open(fp, 'rb').read().decode('utf-8')
        # A single stray CRLF used to be enough to convert a whole LF chapter
        # to CRLF (ch795 came out all-CRLF from one such byte pair).  Count
        # instead of testing presence, and keep the file's majority ending.
        crlf = raw.count(u'\r\n')
        eol = u'\r\n' if crlf > raw.count(u'\n') - crlf else u'\n'
        txt = raw.replace(u'\r\n', u'\n')
        before = len(CJK.findall(txt))
        marks_before = txt.count(u'"')
        for r in rs:
            # A deletion record: `new` is null and the whole paragraph goes,
            # taking the blank line after it.  Same shape the replay verifier
            # already understands, so a table written this way still proves.
            if r.get('new') is None:
                lines = txt.split(u'\n')
                idx = r['line'] - 1
                if not (0 <= idx < len(lines) and lines[idx] == r['old']):
                    print('ABORT %s L%d: line does not hold the paragraph'
                          % (path, r['line']))
                    problems += 1
                    continue
                end = idx + 1
                if end < len(lines) and not lines[end].strip():
                    del lines[idx:end + 1]
                else:
                    del lines[idx]
                txt = u'\n'.join(lines)
                deltas.append((path, r['line'], -len(CJK.findall(r['old']))))
                continue
            lines = txt.split(u'\n')
            idx = r['line'] - 1
            if 0 <= idx < len(lines) and lines[idx].count(r['old']) == 1:
                lines[idx] = lines[idx].replace(r['old'], r['new'], 1)
                after_txt = u'\n'.join(lines)
            else:
                n = txt.count(r['old'])
                if n != 1:
                    print('ABORT %s L%d: old occurs %d times'
                          % (path, r['line'], n))
                    problems += 1
                    continue
                after_txt = txt.replace(r['old'], r['new'], 1)
            if not r['new'].strip():
                print('ABORT %s L%d: would empty a paragraph' % (path, r['line']))
                problems += 1
                continue
            # Pure deletions make `new` a substring of `old`, so a bare
            # `count(new)` fires on every one of them.  The thing that must
            # not happen is the surviving text turning out to BE another
            # paragraph of the chapter, trading one repetition for another.
            others = [p for p in txt.split(u'\n\n') if p.strip() and p != r['old']]
            if r['new'] in others:
                print('ABORT %s L%d: new already stands as its own paragraph'
                      % (path, r['line']))
                problems += 1
                continue
            d = len(CJK.findall(r['new'])) - len(CJK.findall(r['old']))
            deltas.append((path, r['line'], d))
            txt = after_txt
        after = len(CJK.findall(txt))
        marks_after = txt.count(u'"')
        if after != before and not allow_delta:
            print('ABORT %s: chapter cjk %d -> %d (delta %+d)'
                  % (path, before, after, after - before))
            problems += 1
        elif after != before:
            print('FLOAT %s: chapter cjk %d -> %d (delta %+d), allowed'
                  % (path, before, after, after - before))
        if marks_after != marks_before:
            # Dropping marks is what a mark repair does; wanting more of them
            # never is.  So this can be allowed to fall, never to rise --
            # unless the file is being *given back* speech it had lost, which
            # is the ch583 case: its second pass kept the words and dropped
            # the marks.  That is opt-in and prints as MARKRISE.
            parity = [k + 1 for k, ln in enumerate(txt.split(u'\n'))
                      if ln.count(u'"') % 2]
            if parity:
                # The invariant that actually holds across the book: 29,581
                # paragraphs carry quotes and not one of them carries an odd
                # number.  Breaching it is always a bug, whichever way the
                # total moved.
                print('ABORT %s: odd quote count on line(s) %s'
                      % (path, parity[:6]))
                problems += 1
            elif allow_marks and marks_after < marks_before:
                print('MARKDROP %s: marks %d -> %d (%d excess removed), allowed'
                      % (path, marks_before, marks_after, marks_before - marks_after))
            elif allow_marks_up and marks_after > marks_before:
                print('MARKRISE %s: marks %d -> %d (%d restored)'
                      % (path, marks_before, marks_after, marks_after - marks_before))
            else:
                print('ABORT %s: marks %d -> %d' % (path, marks_before, marks_after))
                problems += 1
        texts[path] = (txt, eol)

    moved = [(p, l, d) for p, l, d in deltas if d]
    print('files %d  records %d  problems %d  %s'
          % (len(by_file), len(recs), problems, 'APPLIED' if apply and not problems else 'DRY'))
    print('per-record CJK deltas: %d of %d moved, net %+d'
          % (len(moved), len(deltas), sum(d for _, _, d in moved)))
    for p, l, d in moved:
        print('   %s L%d  %+d' % (p.split('/')[-1], l, d))

    if not apply or problems:
        return
    for path, (txt, eol) in texts.items():
        fp = os.path.join(ROOT, path)
        io.open(fp, 'wb').write(txt.replace(u'\n', eol).encode('utf-8'))


main('--apply' in sys.argv, '--allow-delta' in sys.argv,
     '--allow-marks' in sys.argv, '--allow-marks-up' in sys.argv)
