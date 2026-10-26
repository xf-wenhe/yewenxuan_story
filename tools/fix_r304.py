# -*- coding: utf-8 -*-
"""R304 engine: replace the deferred R280 filler blocks with real content.

Scope.  R303 deleted 99 filler lines but deferred 17 chapters whose 3000 CJK
floor was held up by that filler.  This round handles the two worst of them,
ch732 and ch695, whose filler blocks were not a line here and there but 12 and
35 consecutive paragraphs of generic prose with no story content -- including
one block that cycles the same sentence through six noun swaps.

Unlike R302/R303, this round does WRITE new prose, so the added text is drawn
from the volume outline (Ch.731-735 for ch732, Ch.691-695 for ch695) so it
carries information the chapter needs: ch732 gets the 0224 warning about
probability-distortion error accumulation ahead of the 75-minute deadline
already stated at L105; ch695 gets 赵大嘴 registering that 0429 has left his
body but left its path behind, which is the outline's beat for this chapter.

Style constraints honoured: no banned words, no deadly patterns, no em-dash,
dialogue in straight quotes, varied sentence length, no triple parallelism,
no 不是A是B.

Record form:
  op=block  lines[start-1 .. end-1] must equal `old` exactly.  The block is
            replaced by `new`.  Whole-block anchoring (not a fragment) means a
            mismatch aborts rather than silently editing the wrong span.

Fail-closed: every record is validated against the live file in memory before
anything is written.  A single mismatch aborts the whole run.

Encoding: UTF-8, LF library; per-file BOM preserved; CRLF files keep CRLF.

Usage:  python tools/fix_r304.py            (default: dry run)
        python tools/fix_r304.py --apply
        python tools/fix_r304.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r304_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000

# The de-AI rules from CLAUDE.md / polish_pipeline.py, checked on new prose.
BANNED = [u'仿佛', u'犹如', u'宛若', u'如同', u'深吸一口气', u'缓缓', u'不禁',
          u'微微', u'轻轻', u'淡淡', u'眼中闪过', u'嘴角勾起', u'眉头微皱',
          u'心中暗道', u'不容置疑', u'显而易见', u'毫无疑问', u'坚定', u'深邃',
          u'凛冽', u'冰冷', u'不由自主', u'情不自禁']
DEADLY = [
    (u'不是A，是B', re.compile(u'不是[^。，]{1,20}[，,]?\s*是')),
    (u'是A，不是B', re.compile(u'是[^。，]{1,20}[，,]?\s*不是')),
    (u'没有X没有Y', re.compile(u'没有[^。，]{1,15}[，,]\s*没有')),
    (u'眼中闪过一丝', re.compile(u'眼中闪过一丝')),
    (u'心中涌起一股', re.compile(u'心中涌起一股')),
    (u'脑中闪过', re.compile(u'脑中闪过')),
]
# The em-dash is not in polish_pipeline.py's L1_WORDS, so the banned list above
# let it through and R304/R305 shipped five of them.  check-ai-patterns.js
# counts it as a blocking pattern, so the gate has to see it too.
PUNCT_BANNED = [u'——', u'——']


def cjk(s):
    return len(CJK.findall(s))


def read_lines(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    if b'\r' in raw.replace(b'\r\n', b''):
        raise SystemExit('ABORT: %s has bare CR' % path)
    crlf = b'\r\n' in raw
    text = raw.decode('utf-8')
    lines = text.split('\r\n') if crlf else text.split('\n')
    return lines, bom, ('\r\n' if crlf else '\n')


def write_lines(path, lines, bom, eol):
    data = eol.join(lines).encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r304tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def head_lines(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path], capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8', 'replace').split('\n')


def check_new_prose(rec):
    """The new prose must obey the project's de-AI rules."""
    problems = []
    for para in rec['new']:
        for w in BANNED:
            if w in para:
                problems.append('banned word %r' % w)
        for name, rx in DEADLY:
            if rx.search(para):
                problems.append('deadly pattern %s' % name)
        for w in PUNCT_BANNED:
            if w in para:
                problems.append('banned punctuation %r' % w)
    if problems:
        raise SystemExit('ABORT: %s new prose violates de-AI rules: %s'
                         % (rec['path'], sorted(set(problems))))


def apply_blocks(lines, rs):
    """Replace each record's block. Descending order so earlier edits are safe."""
    out = list(lines)
    for r in sorted(rs, key=lambda r: r['start'], reverse=True):
        s, e = r['start'], r['end']
        if s < 1 or e > len(out) or s > e:
            raise SystemExit('ABORT: %s block %d-%d out of range' % (r['path'], s, e))
        actual = out[s - 1:e]
        if actual != r['old']:
            for i, (a, b) in enumerate(zip(actual, r['old'])):
                if a != b:
                    raise SystemExit(
                        'ABORT: anchor mismatch at %s L%d\n  expected: %r\n  actual:   %r'
                        % (r['path'], s + i, b, a))
            raise SystemExit('ABORT: anchor length mismatch at %s L%d-%d (%d vs %d)'
                             % (r['path'], s, e, len(actual), len(r['old'])))
        check_new_prose(r)
        out[s - 1:e] = r['new']
    return out


def main():
    apply = '--apply' in sys.argv
    verify = '--verify' in sys.argv

    with io.open(SITES, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
    records = doc['records']

    if verify:
        ok = True
        for r in records:
            try:
                rebuilt = apply_blocks(head_lines(r['path']), [r])
            except SystemExit as exc:
                print('FAIL %s: %s' % (r['path'], exc))
                ok = False
                continue
            live, _, _ = read_lines(r['path'])
            if rebuilt != live:
                print('FAIL %s: replay differs from live file' % r['path'])
                ok = False
            else:
                print('PASS %s: block %d-%d, byte-identical replay'
                      % (r['path'], r['start'], r['end']))
        print('VERIFY %s' % ('PASS' if ok else 'FAIL'))
        sys.exit(0 if ok else 1)

    touched = []
    for r in records:
        lines, bom, eol = read_lines(r['path'])
        before = cjk(eol.join(lines))
        out = apply_blocks(lines, [r])
        after = cjk(eol.join(out))
        if after < FLOOR:
            raise SystemExit('ABORT: %s below the %d floor (%d)' % (r['path'], FLOOR, after))
        touched.append((r['path'], before, after, r['start'], r['end']))
        if apply:
            write_lines(r['path'], out, bom, eol)

    for path, before, after, s, e in touched:
        print('%s: block L%d-%d, CJK %d -> %d (%+d)' % (path, s, e, before, after, after - before))
    print('---')
    print('%d file(s) rewritten' % len(touched))
    if not apply:
        print('DRY RUN -- nothing written. Re-run with --apply.')


if __name__ == '__main__':
    main()
