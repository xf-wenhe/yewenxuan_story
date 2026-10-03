# -*- coding: utf-8 -*-
"""R279 engine: delete whole-line paragraphs that are provably machine padding.

Dataset tools/r279_sites.json (3,557 sites, built by _r279_build.py):
a record is a paragraph LINE whose every splitter segment is a family member
absent at PRE = 13db9b4c^ (a "machine member").  The line plus the following
separator (\\n\\n, else \\n) is removed; nothing else changes.

Fail-closed: the whole round is computed and validated IN MEMORY first --
every record matched by line number, exact content, machine-line property,
recorded separator and neighbouring-line context, and every file's result
checked (no triple newline, split-length drop, CJK delta, first/last line
intact).  Only when every file passes is anything written, so a guard failure
can never leave a half-written round (R268 lesson; R279's first apply attempt
aborted after the header with zero writes and this engine removes even that
window).

Rules:
  - read files as UTF-8, write back with the ORIGINAL byte form preserved
    (LF library, BOM files keep BOM); a CRLF file aborts;
  - same-file records execute in DESCENDING offset order (line deletion by
    offset cannot shift an earlier offset);
  - deleting a line plus a 2-char separator drops 2 elements from
    text.split('\\n'), a 1-char separator drops 1;
  - the chapter floor is NOT screened this round (the sub-floor list in meta
    is the R280 refill queue).

Usage:  python tools/fix_r279.py --dry-run   (default: dry run)
        python tools/fix_r279.py --apply
"""

import io
import json
import os
import re
import sys

SITES = 'tools/r279_sites.json'
CJK = re.compile('[一-鿿]')
SPLIT = re.compile('[^。！？…]*[。！？…]|[^。！？…]+')


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
    tmp = path + '.r279tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def line_offsets(text):
    offs, off = [], 0
    for line in text.split('\n'):
        if text[off:off + len(line)] != line:
            raise SystemExit('ABORT: line/offset mismatch')
        offs.append(off)
        off += len(line) + 1
    return offs


def abort(msg):
    print('ABORT: ' + msg)
    sys.exit(2)


def build():
    """Validate everything and return {path: (text_after, bom, n, delta)}."""
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs, meta = d['records'], d['meta']
    machine = set(meta['machine_members'])
    by_path = {}
    for r in recs:
        by_path.setdefault(r['path'], []).append(r)
    seps = {0: 0, 1: 0, 2: 0}
    triple_pre = []
    out = {}
    for p in sorted(by_path):
        text, bom = read_raw(p)
        n_triple = text.count('\n\n\n')
        if n_triple:
            triple_pre.append((p, n_triple))
        lines = text.split('\n')
        offs = line_offsets(text)
        seen = set()
        drop = 0
        delta = 0
        for r in by_path[p]:
            li, want = r['line_no'], r['text']
            if li in seen:
                abort('%s duplicate line_no=%d' % (p, li))
            seen.add(li)
            if li >= len(lines) or lines[li] != want:
                abort('%s L%d content mismatch: %r'
                      % (p, li, (lines[li] if li < len(lines) else None)))
            segs = [m.group(0) for m in SPLIT.finditer(want)]
            if ''.join(segs) != want or not all(
                    s.strip() in machine for s in segs):
                abort('%s L%d no longer a machine line' % (p, li))
            off, end = offs[li], offs[li] + len(want)
            tail2 = text[end:end + 2]
            sep = 2 if tail2 == '\n\n' else (1 if tail2[:1] == '\n' else 0)
            if sep != r['sep']:
                abort('%s L%d sep mismatch %d != %d' % (p, li, sep, r['sep']))
            if sep == 0:
                abort('%s L%d sep=0 (line at EOF)' % (p, li))
            seps[sep] += 1
            prev = lines[li - 1] if li > 0 else ''
            nxt = lines[li + 1] if li + 1 < len(lines) else ''
            if prev[-24:] != r['minus_ctx'] or nxt[:24] != r['plus_ctx']:
                abort('%s L%d context mismatch' % (p, li))
            drop += sep
            delta += r['cjk']
        if [r['line_no'] for r in by_path[p]] != sorted(
                r['line_no'] for r in by_path[p]):
            abort('%s records not ascending' % p)
        after = text
        for r in sorted(by_path[p], key=lambda r: -r['line_no']):
            off = offs[r['line_no']]
            end = off + len(r['text'])
            after = after[:off] + after[end + r['sep']:]
        if after.count('\n\n\n') > n_triple:
            abort('%s new triple newline after edit' % p)
        if len(lines) - len(after.split('\n')) != drop:
            abort('%s split-length drop %d != expected %d'
                  % (p, len(lines) - len(after.split('\n')), drop))
        if len(CJK.findall(text)) - len(CJK.findall(after)) != delta:
            abort('%s CJK delta != expected %d' % (p, delta))
        if after.split('\n')[0] != lines[0]:
            abort('%s first line changed' % p)
        if after.split('\n')[-1] != lines[-1]:
            abort('%s last line changed' % p)
        out[p] = (after, bom, len(by_path[p]), delta)
    print('validated: %d files, %d sites (sep 1: %d, sep 2: %d), %d CJK'
          % (len(out), sum(v[2] for v in out.values()), seps[1], seps[2],
             sum(v[3] for v in out.values())))
    print('machine members %d ; sub-floor after apply: %d chapters, deficit %d'
          % (len(machine), len(meta['subfloor']), meta['subfloor_deficit']))
    if triple_pre:
        print('pre-existing triple newlines in %d touched files: %s'
              % (len(triple_pre),
                 ', '.join('%s x%d' % (os.path.basename(p), c)
                           for p, c in triple_pre[:8])))
    return out


def main():
    apply = '--apply' in sys.argv
    print('%s: R279' % ('APPLY' if apply else 'DRY-RUN'))
    out = build()
    if not apply:
        for p in sorted(out):
            print('  %-46s -%d CJK (%d sites)' % (p, out[p][3], out[p][2]))
        print('DRY-RUN: %d files would change, %d CJK removed'
              % (len(out), sum(v[3] for v in out.values())))
        return
    total = 0
    for p in sorted(out):
        after, bom, n, delta = out[p]
        write_raw(p, after, bom)
        total += delta
    print('APPLIED: %d files changed, %d CJK removed' % (len(out), total))


if __name__ == '__main__':
    main()
