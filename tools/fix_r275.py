# -*- coding: utf-8 -*-
"""R275 builder: repair the V2 pure-deletion gap left by the e0040d63 collapse.

Restores the text that e0040d63 deleted in V2 chapters 103-250 by re-inserting
the gone sentences at their original seams.  The execution dataset is
tools/r275_sites.json (757 records from _r275_plans_v7.json plus the probe114
revisions: idx745 period-at-head, idx604 re-anchor, idx727 residue note).

Fail-closed: every record is validated against the current file content before
any write; a single mismatch aborts the whole run before it starts.

Rules:
  - read files as UTF-8, normalise CRLF -> LF in memory only, write back with
    the ORIGINAL byte form preserved per file (LF library, BOM files keep BOM);
    a CRLF file aborts (library was normalised to LF in R271);
  - three kinds of action:
      insert_after:  text must contain anchor exactly once; insert insert_raw
                     immediately after the anchor;
      insert_before: text must contain anchor exactly once; insert insert_raw
                     immediately before the anchor;
      replace:       text must contain span exactly once; replace the span with
                     insert_raw;
      merged_into:   skip at execution (covered by another record);
  - same-file records execute in DESCENDING find position (latest seam first)
    so earlier edits never invalidate later anchors, EXCEPT for pairs listed
    in meta.order_overrides, which are forced into ASCENDING order (the lo
    site first); the loop re-finds each anchor on the current text
    (leftmost match) after every prior edit;
  - net CJK accounting uses the actual inserted text, not the docket cjk.

Usage:  python tools/fix_r275.py --dry-run   (default: dry run)
        python tools/fix_r275.py --apply
"""

import io
import json
import os
import re
import sys

SITES = 'tools/r275_sites.json'
CJK = re.compile('[一-鿿]')


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
        raise SystemExit('ABORT: %s unexpectedly CRLF' % path)
    if bom:
        data = b'\xef\xbb\xbf' + data
    tmp = path + '.r275tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def key_of(r):
    return r['anchor'] if str(r['kind']).startswith('insert') else r['span']


def act(text, r, at):
    k = key_of(r)
    ins = r.get('insert_raw') or ''
    if r['kind'] == 'insert_after':
        p = at + len(k)
        return text[:p] + ins + text[p:]
    if r['kind'] == 'insert_before':
        return text[:at] + ins + text[at:]
    return text[:at] + ins + text[at + len(k):]


def main():
    apply = '--apply' in sys.argv
    mode = 'APPLY' if apply else 'DRY-RUN'
    with io.open(SITES, encoding='utf-8', newline='') as fh:
        d = json.load(fh)
    recs = d['sites']
    overrides = {k: [tuple(pair) for pair in v]
                 for k, v in d.get('meta', {}).get('order_overrides', {}).items()}
    exec_recs = [r for r in recs if r['kind'] != 'merged_into']
    print('%s: %d records (%d execute, %d merged_into)'
          % (mode, len(recs), len(exec_recs), len(recs) - len(exec_recs)))

    # ---- full pre-validation (fail closed, before any write) ----
    by_path = {}
    for r in exec_recs:
        by_path.setdefault(r['rel'], []).append(r)
    cache = {}
    for p in sorted(by_path):
        text, bom, crlf = read_raw(p)
        if crlf:
            print('ABORT: %s is CRLF' % p)
            sys.exit(2)
        cache[p] = (text, bom)
        for r in by_path[p]:
            k = key_of(r)
            n = text.count(k)
            if n != 1:
                print('ABORT: site_idx=%s %s key not unique (hits=%d) %r'
                      % (r['site_idx'], p, n, k[:60]))
                sys.exit(2)
            if r['kind'] == 'replace' and not r.get('insert_raw'):
                print('ABORT: site_idx=%s replace missing insert_raw' % r['site_idx'])
                sys.exit(2)

    # ---- ordering: descending find position, order_overrides force ascending ----
    def ordered(rel, rs, text):
        locate = lambda r: text.find(key_of(r))
        order = sorted(rs, key=locate, reverse=True)
        for lo, hi in overrides.get(rel, []):
            lo_r = next(r for r in order if int(r['site_idx']) == lo)
            hi_r = next(r for r in order if int(r['site_idx']) == hi)
            if order.index(lo_r) > order.index(hi_r):
                order.remove(lo_r)
                order.insert(order.index(hi_r), lo_r)
        return order

    if not apply:
        # dry-run: simulate and account by actual inserted text
        total_net = 0
        for p in sorted(by_path):
            text, _ = cache[p]
            net_file = 0
            for r in ordered(p, by_path[p], text):
                k = key_of(r)
                at = text.find(k)
                assert at >= 0
                ins = r.get('insert_raw') or ''
                text = act(text, r, at)
                net_file += len(CJK.findall(ins))
                if r['kind'] == 'replace':
                    net_file -= len(CJK.findall(k))
            total_net += net_file
            if net_file:
                print('  %-46s %+d CJK (%d sites)'
                      % (p, net_file, len(by_path[p])))
        n_files = sum(1 for p in by_path)
        print('%s would change %d files, total net %+d CJK' % (mode, n_files, total_net))
        return

    # ---- apply ----
    changed = 0
    total_net = 0
    for p in sorted(by_path):
        text, bom = cache[p]
        orig = text
        net_file = 0
        for r in ordered(p, by_path[p], text):
            k = key_of(r)
            at = text.find(k)
            assert at >= 0
            ins = r.get('insert_raw') or ''
            text = act(text, r, at)
            net_file += len(CJK.findall(ins))
            if r['kind'] == 'replace':
                net_file -= len(CJK.findall(k))
        if text != orig:
            write_raw(p, text, bom, False)
            changed += 1
            total_net += net_file
            print('  %-46s %+d CJK (%d sites)' % (p, net_file, len(by_path[p])))
    print('APPLIED: %d files changed, total net %+d CJK' % (changed, total_net))


if __name__ == '__main__':
    main()