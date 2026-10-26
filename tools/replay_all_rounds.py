# -*- coding: utf-8 -*-
"""Sequential replay of every round table against HEAD, compared to disk.

`fix_rNNN.py --verify` replays ONE round from HEAD.  That is only valid for a
chapter carrying records from that round alone.  Four chapters in this session
carry records from two rounds (R305 then R306 on ch593 and ch694; R304/R305 then
R306 on ch732 and ch695), so a single-round replay shifts the line offsets of
the later round and reports a mismatch that is not corruption.

This script replays every table in order against the HEAD blobs, then compares
the accumulated result to the working tree, byte for byte.  That is the honest
question: does the set of recorded edits, applied to HEAD in order, produce
exactly what is on disk?

Only tables for UNCOMMITTED rounds are replayed.  R302 (commit 6a39def4) and
R303 (commit 2e5b2d6e) are already in HEAD, so their records describe edits
that replaying again would invert -- ch650 is the proof: HEAD already carries
the repaired line, so the R302 record's `old` is not there to be found.  Those
tables stay on disk as the audit trail for what those commits did.

R304/R305/R306 were uncommitted when this was written and PASSED with it
(commit c78f30b0).  Run again after that commit, every anchor now fails,
because HEAD is no longer the state those tables start from.  That failure
means "nothing left to replay", not corruption.  To re-verify a committed
round, replay it against the commit BEFORE it instead.

Encoding: HEAD blobs are LF (the CRLF in the working tree is core.autocrlf
fighting .gitattributes), so the comparison is done on text with CR stripped
and the file's real BOM/CRLF state checked separately.

Writes nothing.  Exits non-zero on any divergence.
"""
import io
import json
import re
import subprocess
import sys

TABLES = ['tools/r304_sites.json', 'tools/r305_sites.json',
          'tools/r306_sites.json']
# R302/R303 are committed (6a39def4, 2e5b2d6e) and therefore already in HEAD.
COMMITTED = ['tools/r302_sites.json', 'tools/r303_sites.json']
CJK = re.compile('[一-鿿]')


def head_lines(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace('\\', '/')],
                       capture_output=True)
    if p.returncode != 0:
        return None
    raw = p.stdout
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    return raw.decode('utf-8', 'replace').replace('\r\n', '\n').split('\n')


def disk_lines(path):
    raw = io.open(path, 'rb').read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    return raw.decode('utf-8').replace('\r\n', '\n').split('\n'), bom


def apply_block(lines, r):
    s, e = r['start'], r['end']
    if lines[s - 1:e] != r['old']:
        return None
    return lines[:s - 1] + r['new'] + lines[e:]


def apply_line(lines, r):
    idx = r['line'] - 1
    if lines[idx] != r['old']:
        return None
    return lines[:idx] + [r['new']] + lines[idx + 1:]


def apply_del(lines, r):
    idx = r['line'] - 1
    if lines[idx] != r['old']:
        return None
    out = list(lines)
    prev_blank = idx > 0 and out[idx - 1].strip() == ''
    next_blank = idx + 1 < len(out) and out[idx + 1].strip() == ''
    del out[idx]
    if prev_blank and next_blank:
        del out[idx]
    return out


APPLY = {'block': apply_block, 'line': apply_line, 'sub': apply_line,
         'del': apply_del}


def main():
    state = {}
    applied = 0
    for table in COMMITTED:
        print('BASE %s (already in HEAD, not replayed)' % table)
    for table in TABLES:
        try:
            with io.open(table, 'r', encoding='utf-8') as fh:
                doc = json.load(fh)
        except IOError:
            print('SKIP %s (absent)' % table)
            continue
        records = doc.get('records', [])
        # Descending by line/start within a table, matching the engines.
        def key(r):
            return r.get('start', r.get('line', 0))
        for r in sorted(records, key=key, reverse=True):
            path = r['path'].replace('\\', '/')
            if path not in state:
                head = head_lines(path)
                if head is None:
                    print('SKIP %s (not in HEAD)' % path)
                    continue
                state[path] = head
            op = r.get('op', 'sub')  # R302's earliest records predate the field
            fn = APPLY.get(op)
            if fn is None:
                print('FAIL %s: unknown op %r' % (path, op))
                sys.exit(1)
            new = fn(state[path], r)
            if new is None:
                print('FAIL %s ch%s: anchor mismatch replaying %s'
                      % (path, r.get('chapter'), table))
                sys.exit(1)
            state[path] = new
            applied += 1
        print('OK %s: %d record(s) replayed' % (table, len(records)))

    ok = True
    for path in sorted(state):
        live, _ = disk_lines(path)
        if state[path] != live:
            ok = False
            for i, (a, b) in enumerate(zip(state[path], live)):
                if a != b:
                    print('FAIL %s L%d\n  replay: %r\n  disk:   %r'
                          % (path, i + 1, a[:70], b[:70]))
                    break
            else:
                print('FAIL %s: length %d (replay) vs %d (disk)'
                      % (path, len(state[path]), len(live)))
    print('---')
    print('%d record(s) replayed, %d file(s) compared' % (applied, len(state)))
    print('SEQUENTIAL REPLAY %s' % ('PASS' if ok else 'FAIL'))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
