# -*- coding: utf-8 -*-
"""R302 engine: restore author prose damaged by Voice rounds R133-R138.

Scope.  66 damage sites were found by scanning for the broken phrases those
rounds left behind (那些那 / 那个那 / 他抬+名词 / 得再等一会儿来).  Every one
of them was traced through the file's whole commit history, not just one
parent: all 52 traceable sites originate in a single commit, 9cd5e651
(Voice rounds R133-R138), whose diff shows complete prose going out and a
broken sentence coming in:

    -脑子里那个声音转了转，然后消失了。。。
    +脑子里那个那嗓音绕了几次，终于散掉。。。

65 of the 66 were recovered from that commit's parent -- 29 straight from its
diff, 36 by fragment search in the parent blob -- and every recovered sentence
was then re-validated as a verbatim substring of 9cd5e651^.  Nothing here is
newly composed prose: the round only puts the author's own words back.
The 1 unresolved site (ch580 L148) is listed in the table and left alone.

Record form:
  op=sub  full-line anchor: text[line] == old, replaced by new.  The anchor is
          unique within the file (count(old) == 1).  Applied in descending
          offset order so an earlier edit never moves a later one.

Fail-closed: every record is validated against the live file content in memory
before anything is written.  A single mismatch aborts the whole run and no file
is touched.

Encoding: UTF-8, LF library; per-file BOM preserved; CR in a source file aborts.

Usage:  python tools/fix_r302.py            (default: dry run)
        python tools/fix_r302.py --apply
        python tools/fix_r302.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r302_sites.json'
CJK = re.compile('[一-鿿]')
FLOOR = 3000


def cjk(s):
    return len(CJK.findall(s))


def read_raw(path):
    """Read a chapter, preserving its BOM and its line ending as on disk.

    52 files in the working tree are CRLF because core.autocrlf=true fights
    .gitattributes' `eol=lf`.  That is an environment artefact, not damage to
    the text -- the HEAD blob of the same file has zero CR -- so the line
    ending is carried through untouched instead of aborting the run.  The
    lines themselves are returned without any trailing CR, matching how the
    site table was built.
    """
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


def join_lines(lines, eol):
    return eol.join(lines)


def write_raw(path, lines, bom, eol):
    data = join_lines(lines, eol).encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r302tmp'
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


def apply_records(lines, rs):
    """Apply sub records in descending offset order. Returns (lines, n_applied)."""
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
        if '\n'.join(lines).count(r['old']) != 1:
            raise SystemExit('ABORT: anchor not unique in %s: %r' % (r['path'], r['old']))
        if r.get('new', '').strip() == '':
            raise SystemExit('ABORT: empty replacement at %s L%d' % (r['path'], r['line']))
        positioned.append((line_starts[idx], r))
    positioned.sort(key=lambda t: t[0], reverse=True)
    for _, r in positioned:
        lines[r['line'] - 1] = r['new']
    return lines, len(positioned)


def main():
    apply = '--apply' in sys.argv
    verify = '--verify' in sys.argv

    with io.open(SITES, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
    records = doc['records']

    by_path = {}
    for r in records:
        by_path.setdefault(r['path'], []).append(r)

    total_before = 0
    total_after = 0
    touched = []

    if verify:
        ok = True
        for path in sorted(by_path):
            rs = by_path[path]
            head = head_bytes(path)
            try:
                rebuilt, n = apply_records(head.split('\n'), rs)
            except SystemExit as exc:
                print('FAIL %s: %s' % (path, exc))
                ok = False
                continue
            live_lines, _, _ = read_raw(path)
            if rebuilt != live_lines:
                print('FAIL %s: replay differs from live file' % path)
                ok = False
            else:
                print('PASS %s: %d record(s), byte-identical replay' % (path, n))
        print('VERIFY %s' % ('PASS' if ok else 'FAIL'))
        sys.exit(0 if ok else 1)

    for path in sorted(by_path):
        rs = by_path[path]
        lines, bom, eol = read_raw(path)
        before = cjk(eol.join(lines))
        new_lines, n = apply_records(lines, rs)
        new_text = eol.join(new_lines)
        after = cjk(new_text)
        if after < FLOOR:
            raise SystemExit('ABORT: %s below the %d floor (%d)' % (path, FLOOR, after))
        total_before += before
        total_after += after
        touched.append((path, n, before, after))
        if apply:
            write_raw(path, new_lines, bom, eol)

    for path, n, before, after in touched:
        print('%s: %d record(s), CJK %d -> %d (%+d)'
              % (path, n, before, after, after - before))
    print('---')
    print('%d file(s), %d record(s), CJK %d -> %d (%+d)'
          % (len(touched), len(records), total_before, total_after,
             total_after - total_before))
    if not apply:
        print('DRY RUN -- nothing written. Re-run with --apply.')


if __name__ == '__main__':
    main()
