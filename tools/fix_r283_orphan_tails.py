# -*- coding: utf-8 -*-
"""R283: drop the last 11 r268 family-C orphan tails (the tail string is
"\\u7684\\u90a3\\u4e2a\\u89d2\\u843d\\u3002") that the R268 FLOOR_BLOCKED
screen held back.  Same semantics as the 78 family-C sites R268 applied:
delete the orphan tail right after its terminator; nothing is restored and
nothing else on the line changes.

Fail-closed rules:
  * read_raw aborts on "\\r" (the library is LF); UTF-8 BOM, if present, is
    preserved byte for byte.
  * Every site anchors on (line number, verbatim old line); a line already
    equal to new counts as already fixed (idempotent); anything else aborts.
  * All post-conditions are computed over the complete new text in memory and
    asserted before a single file is written; any failure exits 2 with no
    writes at all.
  * Per site: the new line equals old minus the orphan span at `at`, its CJK
    count drops by exactly the orphan's CJK count, the orphan is gone.
  * Per file: line count unchanged, CJK delta == sum of drops, first line and
    last line unchanged, "\\n\\n\\n" count unchanged, BOM status unchanged,
    and the floor holds (chapter CJK >= 3000 after the edit).

Usage:  python tools/fix_r283_orphan_tails.py [--apply]     (default: dry run)
"""
import io
import json
import os
import sys

SITES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r283_sites.json')
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
    tmp = path + '.r283tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def cjk_count(text):
    return sum(1 for ch in text if '一' <= ch <= '鿿')


def build():
    with io.open(SITES, encoding='utf-8') as fh:
        data = json.load(fh)
    by_path = {}
    for rec in data['sites']:
        by_path.setdefault(rec['path'], []).append(rec)

    files = []
    for rel in sorted(by_path):
        path = os.path.join(ROOT, rel)
        text, bom = read_raw(path)
        cjk0 = cjk_count(text)
        nl3_0 = text.count('\n\n\n')
        first0 = text.split('\n')[0]
        last0 = text.split('\n')[-1]
        lines = text.split('\n')
        seen = set()
        jobs = []
        for rec in by_path[rel]:
            ln = rec['line']
            if ln in seen:
                abort('%s: two records on line %d' % (rel, ln))
            seen.add(ln)
            if not (1 <= ln <= len(lines)):
                abort('%s: line %d out of range' % (rel, ln))
            cur = lines[ln - 1]
            if cur == rec['new']:
                continue  # idempotent
            if cur != rec['old']:
                abort('%s L%d: line neither old nor new' % (rel, ln))
            at = rec['at']
            remove = rec['remove']
            if cur[at:at + len(remove)] != remove:
                abort('%s L%d: span mismatch' % (rel, ln))
            new = cur[:at] + cur[at + len(remove):]
            if new != rec['new']:
                abort('%s L%d: derived new != recorded new' % (rel, ln))
            jobs.append((ln, cur, new, remove))
            lines[ln - 1] = new

        new_text = '\n'.join(lines)

        # post-conditions over the complete new text
        for ln, old, new, remove in jobs:
            if cjk_count(old) - cjk_count(new) != cjk_count(remove):
                abort('%s L%d: CJK delta != orphan CJK count' % (rel, ln))
            if remove in new:
                abort('%s L%d: orphan still present' % (rel, ln))
        if len(new_text.split('\n')) != len(text.split('\n')):
            abort('%s: line count changed' % rel)
        if cjk_count(new_text) != cjk0 - sum(cjk_count(j[3]) for j in jobs):
            abort('%s: chapter CJK delta != sum of drops' % rel)
        if new_text.count('\n\n\n') != nl3_0:
            abort('%s: triple-newline count changed' % rel)
        if new_text.split('\n')[0] != first0 or new_text.split('\n')[-1] != last0:
            abort('%s: first/last line changed' % rel)
        if cjk_count(new_text) < 3000:
            abort('%s: floor violated (%d)' % (rel, cjk_count(new_text)))
        files.append((path, new_text, bom, len(jobs),
                      sum(cjk_count(j[3]) for j in jobs)))
    return files


def main():
    apply = '--apply' in sys.argv
    files = build()
    total_sites = sum(f[3] for f in files)
    total_drop = sum(f[4] for f in files)
    for path, _new, _bom, n_sites, drop in files:
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        print('%-58s sites=%d -%d CJK' % (rel, n_sites, drop))
    print('files=%d sites=%d cjk=-%d' % (len(files), total_sites, total_drop))
    if apply:
        for path, new, bom, _a, _b in files:
            write_raw(path, new, bom)
        print('APPLIED')
    else:
        print('DRY RUN (use --apply)')


if __name__ == '__main__':
    main()
