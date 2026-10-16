# -*- coding: utf-8 -*-
"""R296 engine: runs of >= 3 consecutive newlines in chapter prose -> exactly one blank
line.  302 stations / 9 chapters / -754 bytes / +0 CJK.

Ruling
------
Chapter prose separates paragraphs with EXACTLY ONE blank line (`\\n\\n`).  Every run of
>= 3 newlines is mechanical damage and collapses to `\\n\\n`.  Planning documents
(outline-*.md, plot-threads.md, the plan file) use `\\n\\n\\n` as a structural separator
and are ruled KEEP -- they are not in this dataset and are not touched.

Family
------
A  ch656/673/680 (296 sites): `70c3b4ff` (R223) wrote these three files with `\\r\\r\\n`
   line endings; `c63eff22` (R224) re-read them in text mode, where each `\\r\\r\\n`
   terminator expands to two `\\n`, so every line boundary doubled and a one-blank-line
   paragraph gap became three.  `8bc2b4c9` (R220, "normalize 798 files") had already
   driven the library to zero such runs, so this is a regression.  R279/R285 later
   deleted filler paragraphs, cutting the run count 99/134/134 -> 99/81/116.
B  ch585/586/662/663/733/734 (6 sites): `70c3b4ff` deleted filler and appended a
   substitute closing block; its diff inserts exactly two leading blank lines before the
   block's first paragraph, so the seam reads as three.

Record form
-----------
op=collapse, LINE-anchored: `line` is the 1-based index of the FIRST blank line of the
run, `run` is the number of consecutive newlines, and `prev` / `next` are the two prose
lines the run sits between.  The collapse deletes `run - 2` blank lines, leaving exactly
one.  Because `prev` / `next` are not unique in general, the line index is the binding
anchor (the R286 primitive) and the pair is the cross-check.

Witness ladder
--------------
T1 exact at the R224 output `c63eff22` / T2 exact at the mechanism replay (the
`70c3b4ff` blob with `\\r\\r\\n` -> `\\n\\n`) / T3 exact at R220 / T4 structural (the run
is bounded by two prose lines and collapsing it leaves the non-blank line sequence
byte-identical; the family mechanism is proved file-wide by the pickaxe table).
S1 the R223 diff inserts exactly two leading blank lines before the appended block.

Fail-closed: every record is validated against the current file in memory before anything
is written; a single mismatch aborts the whole run.  Encoding: UTF-8, LF library;
per-file BOM preserved; CR in a source file aborts.

Usage:  python tools/fix_r296.py            (default: dry run)
        python tools/fix_r296.py --apply
        python tools/fix_r296.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r296_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000
ONE_BLANK = 2          # the normalised paragraph separator: '\n\n'


def cjk(s):
    return len(CJK.findall(s))


def read_raw(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    text = raw.decode('utf-8')
    if '\r' in text:
        raise SystemExit('ABORT: %s contains CR' % path)
    return text, bom


def write_raw(path, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r296tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def head_bytes(path):
    # git wants forward slashes even on Windows; the dataset carries os.sep paths
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace(os.sep, '/')],
                       capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8')


def apply_records(text, rs):
    """Line-anchored collapse; a record names the blank run it owns."""
    lines = text.split('\n')
    removed = 0
    for r in sorted(rs, key=lambda r: -r['line']):
        i = r['line'] - 1
        n = r['run']
        if i < 1 or i + n - 1 >= len(lines):
            raise SystemExit('ABORT: line %s run %s out of range' % (r['line'], n))
        if lines[i - 1] != r['prev']:
            raise SystemExit('ABORT: line %s prev mismatch: %r' %
                             (r['line'], lines[i - 1][:40]))
        if lines[i + n - 1] != r['next']:
            raise SystemExit('ABORT: line %s next mismatch: %r' %
                             (r['line'], lines[i + n - 1][:40]))
        for k in range(i, i + n - 1):
            if lines[k] != '':
                raise SystemExit('ABORT: line %s run holds a non-blank line' % r['line'])
        # keep the first blank, drop the rest: (run - 1) blanks -> 1 blank
        del lines[i + 1:i + n - 1]
        removed += n - ONE_BLANK
    return '\n'.join(lines), removed


def runs_ge3(lines):
    out = []
    i = 0
    while i < len(lines):
        if lines[i] == '':
            j = i
            while j < len(lines) and lines[j] == '':
                j += 1
            if j - i + 1 >= 3:
                out.append((i + 1, j - i + 1))
            i = j
        else:
            i += 1
    return out


def main():
    mode = ('APPLY' if '--apply' in sys.argv
            else ('VERIFY' if '--verify' in sys.argv else 'DRY-RUN'))
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs = d['records']

    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    prepared = []
    tot_expected = 0
    for path, rs in sorted(by_file.items()):
        text, bom = read_raw(path)
        src = head_bytes(path) if mode == 'VERIFY' else text
        before = cjk(src)

        # every >= 3 run in the file must be claimed by exactly one record
        census = sorted(runs_ge3(src.split('\n')))
        claimed = sorted((r['line'], r['run']) for r in rs)
        if census != claimed:
            raise SystemExit('ABORT: %s run census != records\n  census=%s\n  recs  =%s'
                             % (path, census[:8], claimed[:8]))

        dsum = 0
        for r in rs:
            if r['op'] != 'collapse':
                raise SystemExit('ABORT: %s line %s op %r' % (path, r['line'], r['op']))
            if r['run'] < 3:
                raise SystemExit('ABORT: %s line %s run %s < 3' % (path, r['line'], r['run']))
            if not r['prev'] or not r['next']:
                raise SystemExit('ABORT: %s line %s unbounded run' % (path, r['line']))
            dsum += 0        # whitespace only

        new_text, removed = apply_records(src, rs)
        # structural invariants
        if cjk(new_text) != before:
            raise SystemExit('ABORT: %s CJK changed' % path)
        if new_text.count('\n\n\n') != 0:
            raise SystemExit('ABORT: %s still holds a >= 3 newline run' % path)
        if runs_ge3(new_text.split('\n')):
            raise SystemExit('ABORT: %s residue run remains' % path)
        if removed != sum(r['run'] - ONE_BLANK for r in rs):
            raise SystemExit('ABORT: %s removed-newline accounting' % path)
        if len(src.split('\n')) - len(new_text.split('\n')) != removed:
            raise SystemExit('ABORT: %s line-count delta != removed newlines' % path)
        # the strongest content invariant: the non-blank line sequence is untouched
        if [l for l in new_text.split('\n') if l] != [l for l in src.split('\n') if l]:
            raise SystemExit('ABORT: %s non-blank line sequence changed' % path)
        if new_text.replace('\n', '') != src.replace('\n', ''):
            raise SystemExit('ABORT: %s char stream changed' % path)
        if new_text.split('\n')[0] != src.split('\n')[0]:
            raise SystemExit('ABORT: %s first line changed' % path)
        if new_text.split('\n')[-1] != src.split('\n')[-1]:
            raise SystemExit('ABORT: %s last line changed' % path)
        if not bom and new_text.startswith('﻿'):
            raise SystemExit('ABORT: %s BOM introduced' % path)

        after = cjk(new_text)
        if after < FLOOR:
            raise SystemExit('ABORT: %s floor %d < %d' % (path, after, FLOOR))
        prepared.append((path, rs, text, new_text, bom, before, after, removed))
        tot_expected += removed
        print('%-46s sites=%-4d runs=%-28s CJK %d (%+d)  -%d nl' %
              (path.split(os.sep)[-1],
               len(rs), ','.join(str(r['run']) for r in rs[:6]) + ('...' if len(rs) > 6 else ''),
               before, dsum, removed))

    if mode == 'VERIFY':
        bad = 0
        for path, rs, _live, want, bom, _b, _a, _r in prepared:
            cur, cbom = read_raw(path)
            if cur != want or cbom != bom:
                print('MISMATCH %s' % path)
                bad += 1
        print('VERIFY %s: %d/%d files replay byte-identical' %
              ('OK' if bad == 0 else 'FAIL', len(prepared) - bad, len(prepared)))
        raise SystemExit(1 if bad else 0)

    if mode == 'APPLY':
        for path, rs, _live, want, bom, _b, _a, _r in prepared:
            write_raw(path, want, bom)
        print('APPLIED %d records / %d files / -%d bytes / %+d CJK' %
              (len(recs), len(prepared), tot_expected, 0))
    else:
        print('DRY-RUN ok: %d records / %d files / -%d bytes / %+d CJK -- nothing written' %
              (len(recs), len(prepared), tot_expected, 0))


if __name__ == '__main__':
    main()
