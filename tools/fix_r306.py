# -*- coding: utf-8 -*-
"""R306 engine: delete the 9 R274 fold-debris lines ending in a stranded 间.

Scope.  census_r303_filler.py found 184 generic sentences across 104 chapters.
trace_r303_origin.py proved all 50 of the repeated ones ORIGIN in a repair
round -- 35 of them in 9cd5e651 (Voice rounds R133-R138), the same commit that
authored R302's broken sentences.  A sentence is only eligible when it repeats
across chapters AND its introducing commit's parent lacks it; repetition is the
evidence that no author wrote it.

Deleting a whole line can leave a doubled blank line, so each delete also
collapses the blank line that followed it when the deleted line stood alone in
its own paragraph.

17 chapters would fall below the 3000 CJK floor and are deferred in the table:
they were padded to the floor with this filler, so they need real content
written in, not a delete.

Record form:
  op=del  the line at `line` equals `old` and is removed.  If the line before
          and after it are both blank, one of the two blanks goes too.

Fail-closed: every record is validated against the live file content in memory
before anything is written.  A single mismatch aborts the whole run.

Encoding: UTF-8, LF library; per-file BOM preserved; CRLF files keep CRLF.

Usage:  python tools/fix_r306.py            (default: dry run)
        python tools/fix_r306.py --apply
        python tools/fix_r306.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r306_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000


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
    tmp = path + '.r306tmp'
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


def apply_deletes(lines, rs):
    """Delete each record's line; collapse a doubled blank it leaves behind.

    Descending line order so earlier deletions never move a later record.
    """
    out = list(lines)
    for r in sorted(rs, key=lambda r: r['line'], reverse=True):
        idx = r['line'] - 1
        if idx < 0 or idx >= len(out):
            raise SystemExit('ABORT: %s line %d out of range' % (r['path'], r['line']))
        if out[idx] != r['old']:
            raise SystemExit(
                'ABORT: anchor mismatch at %s L%d\n  expected: %r\n  actual:   %r'
                % (r['path'], r['line'], r['old'], out[idx]))
        prev_blank = idx > 0 and out[idx - 1].strip() == ''
        next_blank = idx + 1 < len(out) and out[idx + 1].strip() == ''
        del out[idx]
        if prev_blank and next_blank:
            del out[idx]
    return out


def main():
    apply = '--apply' in sys.argv
    verify = '--verify' in sys.argv

    with io.open(SITES, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
    records = doc['records']

    by_path = {}
    for r in records:
        by_path.setdefault(r['path'], []).append(r)

    if verify:
        ok = True
        for path in sorted(by_path):
            rs = by_path[path]
            try:
                rebuilt = apply_deletes(head_lines(path), rs)
            except SystemExit as exc:
                print('FAIL %s: %s' % (path, exc))
                ok = False
                continue
            live, _, _ = read_lines(path)
            if rebuilt != live:
                print('FAIL %s: replay differs from live file' % path)
                ok = False
            else:
                print('PASS %s: %d delete(s), byte-identical replay' % (path, len(rs)))
        print('VERIFY %s' % ('PASS' if ok else 'FAIL'))
        sys.exit(0 if ok else 1)

    total_before = 0
    total_after = 0
    touched = []
    for path in sorted(by_path):
        rs = by_path[path]
        lines, bom, eol = read_lines(path)
        before = cjk(eol.join(lines))
        out = apply_deletes(lines, rs)
        after = cjk(eol.join(out))
        if after < FLOOR:
            raise SystemExit('ABORT: %s below the %d floor (%d)' % (path, FLOOR, after))
        # A delete must never leave a doubled blank line behind.
        for i in range(len(out) - 1):
            if out[i].strip() == '' and out[i + 1].strip() == '' and i + 2 < len(out) \
                    and out[i + 2].strip() == '':
                raise SystemExit('ABORT: %s left a triple blank near L%d' % (path, i + 1))
        total_before += before
        total_after += after
        touched.append((path, len(rs), before, after))
        if apply:
            write_lines(path, out, bom, eol)

    for path, n, before, after in touched:
        print('%s: %d delete(s), CJK %d -> %d (%+d)' % (path, n, before, after, after - before))
    print('---')
    print('%d file(s), %d delete(s), CJK %d -> %d (%+d)'
          % (len(touched), len(records), total_before, total_after,
             total_after - total_before))
    if not apply:
        print('DRY RUN -- nothing written. Re-run with --apply.')


if __name__ == '__main__':
    main()
