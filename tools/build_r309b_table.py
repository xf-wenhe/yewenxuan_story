# -*- coding: utf-8 -*-
"""Build the R309 stage-2 site table from a hand-authored batch.

A batch record is {path, line, old, new}.  The builder re-reads every anchor
from the live file and refuses to emit a table unless the anchor sits exactly
once on the line it claims -- which is the only failure mode that matters once
line numbers are involved, because a drifted line still matches the text one
line away.

Usage: python tools/build_r309b_table.py .claude/tmp/r309b_batch1.json tools/r309b_sites.json
"""
import io
import json
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
FLOOR = 3000


def cjk(s):
    return len(CJK.findall(s))


def main():
    if len(sys.argv) < 3:
        raise SystemExit('usage: build_r309b_table.py <batch.json> <out.json>')
    src, dst = sys.argv[1], sys.argv[2]
    batch = json.load(io.open(src, encoding='utf-8'))
    recs = batch['records']

    cache = {}
    per_file = {}
    out = []
    for r in recs:
        path, line, old, new = r['path'], r['line'], r['old'], r['new']
        if path not in cache:
            cache[path] = io.open(path, encoding='utf-8').read().replace('\r\n', '\n')
        lines = cache[path].split('\n')
        if line < 1 or line > len(lines):
            raise SystemExit('ABORT: %s line %d out of range' % (path, line))
        n = lines[line - 1].count(old)
        if n != 1:
            raise SystemExit('ABORT: %s line %d anchor count=%d  [%s]'
                             % (path, line, n, old[:40]))
        if cjk(old) == 0 or cjk(new) == 0:
            raise SystemExit('ABORT: %s line %d empty side' % (path, line))
        d = per_file.setdefault(path, 0)
        per_file[path] = d + cjk(new) - cjk(old)
        out.append({'path': path, 'line': line, 'old': old, 'new': new})

    print('%-42s %3s %6s' % ('file', 'n', 'delta'))
    total = 0
    for path in sorted(per_file):
        n = sum(1 for r in out if r['path'] == path)
        txt = cache[path]
        after = cjk(txt) + per_file[path]
        flag = '' if after >= FLOOR else '  FLOOR BREACH'
        print('%-42s %3d %+6d   %d -> %d%s'
              % (path.split('/')[-1], n, per_file[path], cjk(txt), after, flag))
        total += per_file[path]
        if after < FLOOR:
            raise SystemExit('ABORT: %s would fall to %d' % (path, after))
    print('TOTAL %d sites / %d files / %+d CJK' % (len(out), len(per_file), total))

    with io.open(dst, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps({'round': 'R309b', 'source': src, 'records': out},
                            ensure_ascii=False, indent=1))
    print('wrote ' + dst)


main()
