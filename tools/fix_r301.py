# -*- coding: utf-8 -*-
"""R301 engine: R274/R276 fold-stub residue -- 2 stations / 2 chapters / +3 CJK.

Scope. 486 blocking sites from check-ai-patterns.js were adjudicated one by one
against git blame (.claude/tmp/r301_adjudicated.json).  473 are the author's own
prose or normal-round output and are left untouched -- most notably the 340
not-is-comparison sites, which are the author's V2/V3 voice (V2 107 / V3 171 /
V5 52 against V1 1 / V4 1 / V6 8 / V7 0), not an AI template.  13 trace to
R274/R276 fold and stub records; 11 of those are grammatically complete and are
closed without touching the text.  ch331 L130 was drafted and then dropped: the
first pass at it only added more negation runs.

The 2 records below are the ones with real damage -- a fold/stub replacement
welded its own sentence onto the tail of the preceding clause, or swallowed a
transition sentence that the root commit still has.

Record form:
  op=sub  full-line anchor: text[line] == old, replaced by new.  The anchor is
          unique within the file (count(old) == 1).  Applied in descending
          offset order so an earlier edit never moves a later one.

Fail-closed: every record is validated against the live file content in memory
before anything is written.  A single mismatch aborts the whole run and no file
is touched.

Encoding: UTF-8, LF library; per-file BOM preserved; CR in a source file aborts.

Usage:  python tools/fix_r301.py            (default: dry run)
        python tools/fix_r301.py --apply
        python tools/fix_r301.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r301_sites.json'
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
    tmp = path + '.r301tmp'
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
    """Apply sub records in descending offset order. Returns (text, n_applied)."""
    lines = text.split('\n')
    # build (offset, record) for every record, then sort descending
    positioned = []
    cursor = 0
    line_starts = []
    for ln in lines:
        line_starts.append(cursor)
        cursor += len(ln) + 1
    for r in rs:
        idx = r['line'] - 1
        if idx < 0 or idx >= len(lines):
            raise SystemExit('ABORT: %s line %d out of range' % (r['path'], r['line']))
        if lines[idx] != r['old']:
            raise SystemExit(
                'ABORT: anchor mismatch at %s L%d\n  expected: %r\n  actual:   %r'
                % (r['path'], r['line'], r['old'], lines[idx]))
        if text.count(r['old']) != 1:
            raise SystemExit('ABORT: anchor not unique in %s: %r' % (r['path'], r['old']))
        positioned.append((line_starts[idx], r))
    positioned.sort(key=lambda t: t[0], reverse=True)
    for _, r in positioned:
        lines[r['line'] - 1] = r['new']
    return '\n'.join(lines), len(positioned)


def main():
    apply = '--apply' in sys.argv
    verify = '--verify' in sys.argv

    with io.open(SITES, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
    records = doc['records']

    by_path = {}
    for r in records:
        by_path.setdefault(r['path'], []).append(r)

    total_cjk_before = 0
    total_cjk_after = 0
    touched = []

    if verify:
        # Replay every touched file from its HEAD blob and compare bytes.
        ok = True
        for path in sorted(by_path):
            rs = by_path[path]
            head = head_bytes(path)
            try:
                rebuilt, n = apply_records(head, rs)
            except SystemExit as exc:
                print('FAIL %s: %s' % (path, exc))
                ok = False
                continue
            live_text, _ = read_raw(path)
            if rebuilt != live_text:
                print('FAIL %s: replay differs from live file' % path)
                ok = False
            else:
                print('PASS %s: %d record(s), byte-identical replay' % (path, n))
        print('VERIFY %s' % ('PASS' if ok else 'FAIL'))
        sys.exit(0 if ok else 1)

    for path in sorted(by_path):
        rs = by_path[path]
        text, bom = read_raw(path)
        before = cjk(text)
        new_text, n = apply_records(text, rs)
        after = cjk(new_text)
        if after < FLOOR:
            raise SystemExit('ABORT: %s below the %d floor (%d)' % (path, FLOOR, after))
        total_cjk_before += before
        total_cjk_after += after
        touched.append((path, n, before, after))
        if apply:
            write_raw(path, new_text, bom)

    for path, n, before, after in touched:
        print('%s L%s: %d record(s), CJK %d -> %d (%+d)'
              % (path, by_path[path][0]['line'], n, before, after, after - before))
    print('---')
    print('%d file(s), %d record(s), CJK %d -> %d (%+d)'
          % (len(touched), len(records), total_cjk_before, total_cjk_after,
             total_cjk_after - total_cjk_before))
    if not apply:
        print('DRY RUN -- nothing written. Re-run with --apply.')


if __name__ == '__main__':
    main()
