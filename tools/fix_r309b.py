# -*- coding: utf-8 -*-
"""R309 stage-2 engine: rewrite machine clause runs inside a line.

Stage 1 replaced whole paragraphs.  Stage 2 replaces only the run -- the block
of three to six consecutive sentences that share one identical subject -- and
leaves the rest of the paragraph alone, because the surrounding prose is the
author's.

Anchor: a 1-based line number plus the exact run text.  The line number is
required, not optional: ch801 emits the same run four times inside one
chapter, so `text.count(old) == 1` is false there while `lines[i].count(old)`
is still 1.  Both are asserted; the engine aborts before writing anything if
either fails.

Encoding: UTF-8 without BOM, mixed-but-uniform line endings.  The engine keeps
each line's own `\\r` and rejoins, so endings and the trailing-newline state
survive untouched.

Usage:  python tools/fix_r309b.py [--sites=F]            (dry run)
        python tools/fix_r309b.py [--sites=F] --apply
        python tools/fix_r309b.py [--sites=F] --verify   (replay HEAD, compare)
"""
import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r309b_sites.json'
CJK = re.compile(u'[\u4e00-\u9fff]')
FLOOR = 3000


def sites_path():
    for a in sys.argv[1:]:
        if a.startswith('--sites='):
            return a.split('=', 1)[1]
    return SITES


def cjk(s):
    return len(CJK.findall(s))


def read_text(path):
    raw = io.open(path, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    return (raw[3:] if bom else raw).decode('utf-8'), bom, raw


def write_text(path, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r309btmp'
    io.open(tmp, 'wb').write(data)
    os.replace(tmp, path)


def head_text(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace(os.sep, '/')],
                       capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8')


def apply_sites(text, rs, label):
    lines = text.split('\n')
    for r in sorted(rs, key=lambda r: -r['line']):
        i = r['line'] - 1
        if i >= len(lines):
            raise SystemExit('ABORT(%s): %s line %s out of range'
                             % (label, r['path'], r['line']))
        n = lines[i].count(r['old'])
        # A replacement may *contain* the original string (`醒了一部分。` ->
        # `答得很短：醒了一部分。`), so `count == 1` alone would apply it twice
        # on a re-run.  `new` in place means the record is already done.
        if r['new'] in lines[i]:
            continue
        if n != 1:
            raise SystemExit('ABORT(%s): %s line %s anchor count=%d  [%s]'
                             % (label, r['path'], r['line'], n, r['old'][:30]))
        suffix = '\r' if lines[i].endswith('\r') else ''
        body = lines[i][:-1] if suffix else lines[i]
        lines[i] = body.replace(r['old'], r['new'], 1) + suffix
    return '\n'.join(lines)


def main():
    mode = ('APPLY' if '--apply' in sys.argv
            else 'VERIFY' if '--verify' in sys.argv else 'DRY-RUN')
    table = json.load(io.open(sites_path(), encoding='utf-8'))
    recs = table['records']
    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    prepared = []
    tot = 0
    for path, rs in sorted(by_file.items()):
        live, bom, raw = read_text(path)
        base = head_text(path).replace('\r\n', '\n') if mode == 'VERIFY' else live
        new = apply_sites(base, rs, mode)

        if mode == 'VERIFY':
            ok = new == live.replace('\r\n', '\n')
            if not ok:
                print('MISMATCH %s' % path)
            prepared.append((path, None, ok))
            continue

        before, after = cjk(live), cjk(new)
        dsum = sum(cjk(r['new']) - cjk(r['old']) for r in rs)
        if after - before != dsum:
            raise SystemExit('ABORT: %s CJK delta mismatch %d vs %d'
                             % (path, after - before, dsum))
        if after < FLOOR:
            raise SystemExit('ABORT: %s floor %d' % (path, after))
        if new.count('\n\n\n') != live.count('\n\n\n'):
            raise SystemExit('ABORT: %s triple-newline count changed' % path)
        if new.count('\r\n') != live.count('\r\n'):
            raise SystemExit('ABORT: %s CRLF count changed' % path)
        if new.endswith('\n') != live.endswith('\n'):
            raise SystemExit('ABORT: %s trailing newline state changed' % path)
        if new.split('\n')[0] != live.split('\n')[0]:
            raise SystemExit('ABORT: %s first line changed' % path)
        prepared.append((path, new, bom))
        tot += dsum
        print('%-42s %2d site  CJK %d -> %d (%+d)'
              % (path.split('/')[-1], len(rs), before, after, after - before))

    if mode == 'VERIFY':
        ok = sum(1 for _p, _n, good in prepared if good)
        print('VERIFY %s: %d/%d files replay byte-identical'
              % ('OK' if ok == len(prepared) else 'FAIL', ok, len(prepared)))
        raise SystemExit(0 if ok == len(prepared) else 1)

    if mode == 'APPLY':
        for path, new, bom in prepared:
            write_text(path, new, bom)
        print('APPLIED %d sites / %d files / %+d CJK'
              % (len(recs), len(prepared), tot))
    else:
        print('DRY-RUN ok: %d sites / %d files / %+d CJK -- nothing written'
              % (len(recs), len(prepared), tot))


if __name__ == '__main__':
    main()
