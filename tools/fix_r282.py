# -*- coding: utf-8 -*-
"""R282: restore the paragraph-boundary newlines that the R274 splice dropped.

For every record in tools/r282_sites.json the R274 engine (c9f07d3d) replaced a
span ending in "\\n" with a replacement not ending in "\\n" by plain string
concatenation, so the boundary newline count after the restored text came out
(pre_gap - live_gap) newlines short of the pre-collapse text (e0040d63^).
This round inserts exactly that many newlines at the junction and changes
nothing else: pure insertion, no CJK change.

Fail-closed rules:
  * read_raw aborts on "\\r" (the library is LF); UTF-8 BOM, if present, is
    preserved byte for byte.
  * Every site's key must occur exactly once in its file, and the measured
    live gap (newlines right after the key) must equal the recorded live_gap.
  * All post-conditions are computed over the complete new text in memory and
    asserted before a single file is written; any failure exits 2 with no
    writes at all.
  * Per site: inserted count == insert, the new junction is followed by a
    non-newline, the full junction-with-following-text segment occurs exactly
    once, and no "\\n\\n\\n" run is created.
  * Per file: split("\\n") length grows by exactly the sum of inserts, the CJK
    count is unchanged, first line and last line unchanged, BOM status
    unchanged.

Usage:  python tools/fix_r282.py [--apply]     (default: dry run)
"""
import io
import json
import os
import re
import sys

SITES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r282_sites.json')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def abort(msg):
    sys.stderr.write('ABORT: ' + msg + '\n')
    sys.exit(2)


def read_raw(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    body = raw[3:] if bom else raw
    if b'\r' in body:
        abort('CR byte in %s' % path)
    return body.decode('utf-8'), bom


def write_raw(path, text, bom):
    data = (b'\xef\xbb\xbf' if bom else b'') + text.encode('utf-8')
    tmp = path + '.r282tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def cjk_count(text):
    return sum(1 for ch in text if '一' <= ch <= '鿿')


def gaps(text, at, key):
    return len(re.match(r'\n*', text[at + len(key):]).group(0))


def build():
    with io.open(SITES, encoding='utf-8') as fh:
        data = json.load(fh)
    fixes = data['fixes']
    by_path = {}
    for rec in fixes:
        by_path.setdefault(rec['path'], []).append(rec)

    files = []
    for rel in sorted(by_path):
        path = os.path.join(ROOT, rel)
        text, bom = read_raw(path)
        cjk0 = cjk_count(text)
        nl3_0 = text.count('\n\n\n')
        first0 = text.split('\n')[0]
        last0 = text.split('\n')[-1]
        jobs = []
        for rec in by_path[rel]:
            key = rec['key']
            n = rec['insert']
            if text.count(key) != 1:
                abort('%s: key count != 1: %r' % (rel, key))
            i = text.find(key)
            if gaps(text, i, key) != rec['live_gap']:
                abort('%s: live gap drift at %r' % (rel, key))
            j = i + len(key) + rec['live_gap']
            if j >= len(text) or text[j] == '\n':
                abort('%s: junction tail not a line start: %r' % (rel, key))
            jobs.append((i, key, n, rec['pre_gap'], text[j:j + 16]))
        jobs.sort(key=lambda job: -job[0])
        for (i, _k, _n, _p, _t), (i2, k2, _n2, _p2, _t2) in zip(jobs, jobs[1:]):
            if i2 + len(k2) > i:
                abort('%s: overlapping sites' % rel)

        new = text
        for i, key, n, pre_gap, after16 in jobs:
            j = i + len(key)
            new = new[:j] + '\n' * n + new[j:]

        # post-conditions over the complete new text
        for i, key, n, pre_gap, after16 in jobs:
            if new.count(key) != 1:
                abort('%s: key multiplicity changed: %r' % (rel, key))
            if new.count(key + '\n' * pre_gap + after16) != 1:
                abort('%s: restored junction segment not unique: %r' % (rel, key))
            seg = key + '\n' * pre_gap
            if new.count(seg) < 1:
                abort('%s: restored boundary missing: %r' % (rel, key))
        if new.count('\n\n\n') != nl3_0:
            abort('%s: triple-newline count changed' % rel)
        if len(new.split('\n')) - len(text.split('\n')) != sum(j[2] for j in jobs):
            abort('%s: split length delta != sum of inserts' % rel)
        if cjk_count(new) != cjk0:
            abort('%s: CJK changed' % rel)
        if new.split('\n')[0] != first0 or new.split('\n')[-1] != last0:
            abort('%s: first/last line changed' % rel)
        files.append((path, new, bom, len(jobs), sum(j[2] for j in jobs)))
    return files


def main():
    apply = '--apply' in sys.argv
    files = build()
    total_sites = sum(f[3] for f in files)
    total_nl = sum(f[4] for f in files)
    for path, new, bom, n_sites, n_nl in files:
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        print('%-58s sites=%d +%d newline(s)' % (rel, n_sites, n_nl))
    print('files=%d sites=%d newlines=+%d' % (len(files), total_sites, total_nl))
    if apply:
        for path, new, bom, _a, _b in files:
            write_raw(path, new, bom)
        print('APPLIED')
    else:
        print('DRY RUN (use --apply)')


if __name__ == '__main__':
    main()
