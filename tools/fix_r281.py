# -*- coding: utf-8 -*-
"""R281 engine: restore the blank-line separator that R279's sep=2 deletions ate.

Dataset tools/r281_sites.json (19 sites, built by .claude/tmp/r281_assemble.py):
R279 removed a machine filler line plus both following newlines where the
filler sat directly under the preceding line, so text that used to read
A\\n{filler(one or more lines)}\\n\\nB now reads A\\nB -- a weld inside a
blank-line-separated chapter.  The repair inserts ONE newline between A and B
(no text backfill; pre-R279 shape is re-verified from 94806776^ per site).

Fail-closed: every record is located IN MEMORY first -- key A\\nB unique in
the live file, A\\n\\nB absent, junction gated by blank lines on both sides --
and each file's whole result is validated (old key gone, new key unique,
CJK delta 0, split-length +1 per site, triple-newline count unchanged, first
and last line intact) before anything is written, so a guard failure can
never leave a half-written round (R268 lesson).

Rules:
  - read files as UTF-8, write back with the ORIGINAL byte form preserved
    (LF library, BOM files keep BOM); a CRLF file aborts;
  - same-file records execute in DESCENDING offset order (an insertion at a
    later offset cannot shift an earlier one);
  - a record whose pre-state no longer matches the dataset aborts the round.

Usage:  python tools/fix_r281.py --dry-run   (default: dry run)
        python tools/fix_r281.py --apply
"""

import io
import json
import os
import re
import sys

SITES = 'tools/r281_sites.json'
CJK = re.compile('[一-鿿]')


def read_raw(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    text = raw.decode('utf-8')
    if '\r' in text:
        raise SystemExit('ABORT: %s has CR bytes' % path)
    return text, bom


def write_raw(path, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r281tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def abort(msg):
    print('ABORT: ' + msg)
    sys.exit(2)


def build():
    """Validate everything and return {path: (text_after, bom, n_sites)}."""
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs, meta = d['records'], d['meta']
    by_path = {}
    for r in recs:
        by_path.setdefault(r['path'], []).append(r)
    triple_pre = []
    out = {}
    for p in sorted(by_path):
        text, bom = read_raw(p)
        n_triple = text.count('\n\n\n')
        if n_triple:
            triple_pre.append((p, n_triple))
        lines = text.split('\n')
        jobs = []
        for r in by_path[p]:
            key = r['a_text'] + '\n' + r['b_text']
            new = r['a_text'] + '\n\n' + r['b_text']
            if text.count(key) != 1:
                abort('%s key count %d != 1 : %r'
                      % (p, text.count(key), key[:40]))
            if text.count(new) != 0:
                abort('%s new key already present : %r' % (p, new[:40]))
            if text.count('\n\n' + key + '\n\n') != 1:
                abort('%s junction not blank-line gated : %r' % (p, key[:40]))
            jobs.append((text.find(key), key, new))
        jobs.sort(key=lambda j: -j[0])
        for a in range(len(jobs) - 1):
            if jobs[a][0] < jobs[a + 1][0] + len(jobs[a + 1][1]):
                abort('%s overlapping records' % p)
        after = text
        for i, key, new in jobs:
            after = after[:i] + new + after[i + len(key):]
        for i, key, new in jobs:
            if after.count(key) != 0:
                abort('%s old key survives : %r' % (p, key[:40]))
            if after.count(new) != 1:
                abort('%s new key count %d != 1 : %r'
                      % (p, after.count(new), new[:40]))
        if after.count('\n\n\n') != n_triple:
            abort('%s triple-newline count changed' % p)
        if len(after.split('\n')) - len(lines) != len(jobs):
            abort('%s split-length delta %d != expected %d'
                  % (p, len(after.split('\n')) - len(lines), len(jobs)))
        if len(CJK.findall(after)) != len(CJK.findall(text)):
            abort('%s CJK changed' % p)
        if after.split('\n')[0] != lines[0]:
            abort('%s first line changed' % p)
        if after.split('\n')[-1] != lines[-1]:
            abort('%s last line changed' % p)
        out[p] = (after, bom, len(jobs))
    print('validated: %d files, %d sites (candidates %s, excluded %d)'
          % (len(out), sum(v[2] for v in out.values()),
             meta.get('candidates'), len(meta.get('excluded', []))))
    if triple_pre:
        print('pre-existing triple newlines in %d touched files: %s'
              % (len(triple_pre),
                 ', '.join('%s x%d' % (os.path.basename(p), c)
                           for p, c in triple_pre[:8])))
    return out


def main():
    apply = '--apply' in sys.argv
    print('%s: R281' % ('APPLY' if apply else 'DRY-RUN'))
    out = build()
    n_newlines = sum(v[2] for v in out.values())
    if not apply:
        for p in sorted(out):
            print('  %-46s +%d newline(s) at %d site(s)'
                  % (p, out[p][2], out[p][2]))
        print('DRY-RUN: %d files would change, %d newlines inserted'
              % (len(out), n_newlines))
        return
    for p in sorted(out):
        after, bom, n = out[p]
        write_raw(p, after, bom)
    print('APPLIED: %d files changed, %d newlines inserted'
          % (len(out), n_newlines))


if __name__ == '__main__':
    main()
