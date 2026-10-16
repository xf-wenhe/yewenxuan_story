# -*- coding: utf-8 -*-
"""R294 engine: R274 non-verbatim docket -- 6 stations / 6 chapters / -15 CJK.

The docket's 21 non-verbatim R274 records were adjudicated one by one
(.claude/tmp/_r294_probe1.txt, _r294_probe2.txt).  Only class B -- records whose
`replacement` dropped punctuation that ROOT (`git show e0040d63^:`) still has --
carries real damage, plus two residual shape defects found on reconstruction
sites (ch807 L89 extra closing quote, ch802 L69 duplicated paste fragment).
The other 15 records are closed without touching the text: 3 window artefacts
(repl IS the ROOT slice; the extra chars are the span's own boundary character),
11 content reconstructions of sites where ROOT itself is damaged (already
registered as R273 (6)/(7)), and 3 (plus part of a 4th) author voice-round
rewrites attested by `git log -S`.

Record forms:
  op=sub    full-line anchor: text[line] == old, replaced by new.  Anchors are
            unique within the file (count(old) == 1) and are applied in
            descending offset order so an earlier edit never moves a later one.
  op=block  a 4-line anchor spanning lines 67-70, replaced by a 2-line block:
            the duplicated fragment and its blank separator both go, leaving a
            single blank line between the paragraphs.

Fail-closed: every record is validated against the current file content in
memory before anything is written.  A single mismatch aborts the whole run.
Encoding: UTF-8, LF library; per-file BOM preserved; CR in a source file aborts.

Usage:  python tools/fix_r294.py            (default: dry run)
        python tools/fix_r294.py --apply
        python tools/fix_r294.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r294_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000


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
    tmp = path + '.r294tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def head_bytes(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path], capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8')


def apply_records(text, rs):
    """Descending-offset application; `at` are original coordinates."""
    ops = sorted(((text.find(r['old']), r) for r in rs), key=lambda t: -t[0])
    for at, r in ops:
        if at < 0:
            raise SystemExit('ABORT: anchor not found: %r' % r['old'][:40])
        text = text[:at] + r['new'] + text[at + len(r['old']):]
    return text


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
            if r['new'] == r['old']:
                raise SystemExit('ABORT: no-op record in %s' % path)
            if src.count(r['old']) != 1:
                raise SystemExit('ABORT: %s anchor count=%d (line %s)' %
                                 (path, src.count(r['old']), r['line']))
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
        prepared.append((path, rs, text, new_text, bom, before, after))
        tot_expected += dsum
        print('%-46s lines=%-9s recs=%d  CJK %d -> %d (%+d)' %
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
