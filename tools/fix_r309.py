# -*- coding: utf-8 -*-
"""R309 engine: rewrite machine clause runs at paragraph level.

The generator emitted runs of three to fourteen short sentences that share one
subject and differ only in the verb or adjective:

    `门的时间结构在自行流动。…在自行变化。…在自行收缩。…在自行扩张。`
    `42片碎片在感知A。…在感知B。…在感知C。`
    `0429碎片的时间结构线在变细。…在变窄。…在变薄。`

None of them carries information the neighbouring sentence does not; the run
exists because the generator had nothing else to say.  Each paragraph holding
such a run is replaced with a rewritten paragraph that keeps whatever fact the
run contained and drops the rest, then earns back the characters with concrete
detail.

Line anchoring (not text): ch179 carries the same three-sentence run at two
different paragraphs, so a text anchor is legitimately non-unique.  A line
number is unique and stable while the file is being edited top-down.

Encoding: the library is UTF-8 without BOM, CRLF line endings, no trailing
newline.  The engine splits on '\n', keeps each line's own '\r', and rejoins,
so line endings and the missing final newline survive untouched.

Usage:  python tools/fix_r309.py [--sites=F]           (default: dry run)
        python tools/fix_r309.py [--sites=F] --apply
        python tools/fix_r309.py [--sites=F] --verify   (replay HEAD, compare)
"""
import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r309_sites.json'
CJK = re.compile('[\u4e00-\u9fff]')
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
    tmp = path + '.r309tmp'
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


def apply_lines(text, rs, label):
    lines = text.split('\n')
    for r in sorted(rs, key=lambda r: -r['line']):
        i = r['line'] - 1
        if i >= len(lines) or lines[i].strip() != r['old']:
            raise SystemExit('ABORT(%s): %s line %s anchor mismatch'
                             % (label, r['path'], r['line']))
        suffix = '\r' if lines[i].endswith('\r') else ''
        lines[i] = r['new'] + suffix
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
        baseline = head_text(path).replace('\r\n', '\n') if mode == 'VERIFY' else live
        if mode == 'VERIFY':
            base = baseline
            suffix_is_cr = False
        else:
            base = live
            suffix_is_cr = True
        # for verify we work on the LF-normalised text, so strip suffixes
        rs_use = [dict(r) for r in rs]
        if not suffix_is_cr:
            for r in rs_use:
                r['new'] = r['new']
        new = apply_lines(base, rs_use, mode)
        if mode == 'VERIFY':
            if new != live.replace('\r\n', '\n'):
                print('MISMATCH %s' % path)
                prepared.append((path, None, False))
            else:
                prepared.append((path, None, True))
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
        if new.split('\n')[0] != live.split('\n')[0]:
            raise SystemExit('ABORT: %s first line changed' % path)
        if new.split('\n')[-1] != live.split('\n')[-1]:
            raise SystemExit('ABORT: %s last line changed' % path)
        if new.count('\r\n') != live.count('\r\n'):
            raise SystemExit('ABORT: %s CRLF count changed' % path)
        if new.endswith('\n') != live.endswith('\n'):
            raise SystemExit('ABORT: %s trailing newline state changed' % path)
        prepared.append((path, new, bom))
        tot += dsum
        print('%-42s %d rec  CJK %d -> %d (%+d)'
              % (path.split('/')[-1], len(rs), before, after, dsum))

    if mode == 'VERIFY':
        ok = sum(1 for _p, _n, good in prepared if good)
        print('VERIFY %s: %d/%d files replay byte-identical'
              % ('OK' if ok == len(prepared) else 'FAIL', ok, len(prepared)))
        raise SystemExit(0 if ok == len(prepared) else 1)

    if mode == 'APPLY':
        for path, new, bom in prepared:
            write_text(path, new, bom)
        print('APPLIED %d records / %d files / %+d CJK'
              % (len(recs), len(prepared), tot))
    else:
        print('DRY-RUN ok: %d records / %d files / %+d CJK -- nothing written'
              % (len(recs), len(prepared), tot))


if __name__ == '__main__':
    main()
