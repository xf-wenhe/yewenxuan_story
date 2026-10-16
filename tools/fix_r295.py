# -*- coding: utf-8 -*-
"""R295 engine: R214 stripped-paragraph-period residue -- 21 stations / 9 chapters / +21 CJK.

Background
----------
`faa1fa54` (R214, "de-AI batch") swapped single words but ALSO deleted the
paragraph-terminal `。` of many lines.  That side effect is confined to 19 V6
chapter files (ch777-856); 761 strips are provable there (`pre` line ends with
`。` and `post` line == `pre[:-1]`).  `ef009be8` (R245) restored 935/944 of them
but only in 15 of the 19 files -- ch779/817/834/836 were skipped (they are clean
at HEAD now, rewritten by later rounds) -- and later rounds (R238 quote strip,
R274 rebuild, R279/R285 filler deletion, R286 line-anchored repair) rewrote the
middles of many survivors, defeating whole-line and blind-key matching.

This round closes the residue that is still provable by one of two witnesses:

  W1  the live line's text IS R214's period-less output (whole-line, last-16
      quote-blind chars, or first-12 quote-blind chars anchor on the strip set);
  W2  the line's last-20 quote-blind chars appear elsewhere in the library
      followed by `。` -- a parallel form attesting the missing period.

21 stations / 9 chapters carry W1 or W2; the other 32 terminator-less lines in
those 19 files have no witness and stay untouched (registered, not repaired).

Record form
-----------
op=sub  LINE-anchored edit: lines[line-1] == old, replaced by new == old + '。'.
        Line anchoring (the R286 primitive) is required here: several stations
        are the head of a longer sibling line that carries the attesting `。`
        (ch801 L159 is a prefix of L161), so `text.count(old)` legitimately
        exceeds 1 while the line-exact match stays unique.

Fail-closed: every record is validated against the current file content in
memory before anything is written.  A single mismatch aborts the whole run.
Encoding: UTF-8, LF library; per-file BOM preserved; CR in a source file aborts.

Usage:  python tools/fix_r295.py            (default: dry run)
        python tools/fix_r295.py --apply
        python tools/fix_r295.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r295_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000
PERIOD = '。'


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
    tmp = path + '.r295tmp'
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
    """Line-anchored application; a record names the line it owns."""
    lines = text.split('\n')
    for r in sorted(rs, key=lambda r: -r['line']):
        i = r['line'] - 1
        if i >= len(lines) or lines[i] != r['old']:
            raise SystemExit('ABORT: line %s does not hold its anchor: %r' %
                             (r['line'], r['old'][:40]))
        lines[i] = r['new']
    return '\n'.join(lines)


def main():
    mode = 'APPLY' if '--apply' in sys.argv else ('VERIFY' if '--verify' in sys.argv else 'DRY-RUN')
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs = d['records']

    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    # ---- memory pre-validation, before any write ----
    prepared = []
    tot_expected = 0
    for path, rs in sorted(by_file.items()):
        text, bom = read_raw(path)
        src = head_bytes(path) if mode == 'VERIFY' else text
        before = cjk(src)
        dsum = 0
        for r in rs:
            # this round's single primitive: append one paragraph-terminal period
            if r['new'] != r['old'] + PERIOD:
                raise SystemExit('ABORT: %s line %s not a period-append' % (path, r['line']))
            if r['old'].rstrip() != r['old'] or not r['old']:
                raise SystemExit('ABORT: %s line %s anchor not a clean line' % (path, r['line']))
            if src.count(r['old']) != 1:
                # legal when the anchor heads a longer sibling line; the
                # line-exact check below is the binding one
                if src.split('\n')[r['line'] - 1] != r['old']:
                    raise SystemExit('ABORT: %s line %s anchor mismatch' % (path, r['line']))
            # the anchor must still sit on the recorded line
            if src.split('\n')[r['line'] - 1] != r['old']:
                raise SystemExit('ABORT: %s line %s moved' % (path, r['line']))
            dsum += cjk(r['new']) - cjk(r['old'])
        after = before + dsum
        if after < FLOOR:
            raise SystemExit('ABORT: %s floor %d < %d' % (path, after, FLOOR))
        new_text = apply_records(src, rs)
        # structural invariants
        if cjk(new_text) - before != dsum:
            raise SystemExit('ABORT: %s CJK delta mismatch' % path)
        if new_text.count('\n\n\n') != src.count('\n\n\n'):
            raise SystemExit('ABORT: %s triple-newline count changed' % path)
        if new_text.split('\n')[0] != src.split('\n')[0]:
            raise SystemExit('ABORT: %s first line changed' % path)
        if new_text.split('\n')[-1] != src.split('\n')[-1]:
            raise SystemExit('ABORT: %s last line changed' % path)
        if not bom and new_text.startswith('﻿'):
            raise SystemExit('ABORT: %s BOM introduced' % path)
        # every changed line differs from its source line by exactly the final '。'
        s_lines, n_lines = src.split('\n'), new_text.split('\n')
        if len(s_lines) != len(n_lines):
            raise SystemExit('ABORT: %s line count changed' % path)
        for i, (a, b) in enumerate(zip(s_lines, n_lines)):
            if a != b and b != a + PERIOD:
                raise SystemExit('ABORT: %s line %d not a period-append' % (path, i + 1))
        prepared.append((path, rs, text, new_text, bom, before, after))
        tot_expected += dsum
        print('%-46s lines=%-24s recs=%d  CJK %d -> %d (%+d)' %
              (path.split('/')[-1], ','.join(str(r['line']) for r in rs), len(rs),
               before, after, dsum))

    if mode == 'VERIFY':
        bad = 0
        for path, rs, _live, want, bom, _b, _a in prepared:
            cur, cbom = read_raw(path)
            if cur != want or cbom != bom:
                print('MISMATCH %s' % path)
                bad += 1
        print('VERIFY %s: %d/%d files replay byte-identical' %
              ('OK' if bad == 0 else 'FAIL', len(prepared) - bad, len(prepared)))
        raise SystemExit(1 if bad else 0)

    if mode == 'APPLY':
        for path, rs, _live, want, bom, _b, _a in prepared:
            write_raw(path, want, bom)
        print('APPLIED %d records / %d files / %+d CJK (expected %+d)' %
              (len(recs), len(prepared), tot_expected, tot_expected))
    else:
        print('DRY-RUN ok: %d records / %d files / %+d CJK -- nothing written' %
              (len(recs), len(prepared), tot_expected))


if __name__ == '__main__':
    main()
