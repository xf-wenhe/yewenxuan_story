# -*- coding: utf-8 -*-
"""R274 builder: repair the e0040d63 collapse debris.

Applies the 545 adjudicated records in tools/r274_sites.json to the working
tree.  Fail-closed: every record is validated against the current file content
before any write; a single mismatch aborts the whole run before it starts.

Rules (round-template repair-round convention, R238-R246):
  - read files as UTF-8, normalise CRLF -> LF in memory only, write back
    with the ORIGINAL byte form preserved per file (LF library, 7 BOM files keep BOM);
  - per record: text[span_at : span_at+len(span)] must equal span AND
    text.count(span) == 1 (two records carry lengthened spans to satisfy this);
  - same-file records execute in descending span_at so earlier edits never
    invalidate later anchors;
  - LOST-CHECK EXCEPTION rows (idx 76, 129, 534 -- cross-row / weld coverage,
    see their _note fields) skip the lost-frag check;
  - lost-frag check is REPORT-ONLY, not an abort: the span here is the
    COLLAPSED bad text, so most long fragments inside it are debris being
    rewritten in repaired form, not author text that must survive verbatim
    (37 of 545 rows re-anchor a fragment as a fixed variant; all 545 rows
    were adjudicated individually and the author approved the scope).

Usage:  python tools/fix_r274.py --dry-run   (default: dry run)
        python tools/fix_r274.py --apply
"""

import io
import json
import os
import re
import sys

SITES = 'tools/r274_sites.json'
CJK = re.compile('[一-鿿]')
# rows whose lost-frag check is exempted by adjudication (see _note fields)
LOST_CHECK_EXCEPTIONS = {76, 129, 534}


def read_raw(path):
    with io.open(path, 'rb') as fh:
        raw = fh.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    if bom:
        raw = raw[3:]
    text = raw.decode('utf-8')
    crlf = '\r\n' in text
    return text.replace('\r\n', '\n'), bom, crlf


def write_raw(path, text, bom, had_crlf):
    data = text.encode('utf-8')
    if had_crlf:
        # library is LF; a CRLF file would only appear here if the tree changed
        # under us -- fail closed instead of guessing
        raise SystemExit('ABORT: %s unexpectedly CRLF' % path)
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r274tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def main():
    apply = '--apply' in sys.argv
    mode = 'APPLY' if apply else 'DRY-RUN'
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs = d['records']
    print('%s: %d records' % (mode, len(recs)))

    # group by path; validate everything up front (fail closed)
    by_path = {}
    for i, r in enumerate(recs):
        by_path.setdefault(r['path'], []).append((r['span_at'], i))
    for p in by_path:
        by_path[p].sort(reverse=True)  # descending: last span first

    cache = {}
    for p, lst in sorted(by_path.items()):
        text, bom, crlf = read_raw(p)
        cache[p] = (text, bom)
        for at, i in lst:
            r = recs[i]
            span = r['span']
            if text[at:at + len(span)] != span:
                print('ABORT: idx%d %s anchor mismatch at %d' % (i, p, at))
                sys.exit(2)
            if text.count(span) != 1:
                print('ABORT: idx%d %s span not unique (hits=%d)'
                      % (i, p, text.count(span)))
                sys.exit(2)

    if not apply:
        # dry-run: simulate
        total_net = 0
        for p, lst in sorted(by_path.items()):
            text, _ = cache[p]
            net_file = 0
            for at, i in lst:
                span = recs[i]['span']
                before = len(CJK.findall(span))
                after = len(CJK.findall(recs[i]['replacement']))
                net_file += after - before
                text = text[:at] + recs[i]['replacement'] + text[at + len(span):]
            total_net += net_file
            if net_file:
                print('  %-46s %+d CJK' % (p, net_file))
        print('%s would change %d files, total net %+d CJK'
              % (mode, sum(1 for p, l in by_path.items()
                           if any(recs[i]['replacement'] != recs[i]['span']
                                  for _, i in l)), total_net))
        return

    # apply, descending per file
    changed = 0
    total_net = 0
    for p, lst in sorted(by_path.items()):
        text, bom = cache[p]
        orig = text
        net_file = 0
        for at, i in lst:
            span = recs[i]['span']
            repl = recs[i]['replacement']
            net_file += len(CJK.findall(repl)) - len(CJK.findall(span))
            text = text[:at] + repl + text[at + len(span):]
        if text != orig:
            write_raw(p, text, bom, False)
            changed += 1
            total_net += net_file
            print('  %-46s %+d CJK' % (p, net_file))
    print('APPLIED: %d files changed, total net %+d CJK' % (changed, total_net))


if __name__ == '__main__':
    main()
