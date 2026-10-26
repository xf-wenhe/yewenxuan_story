# -*- coding: utf-8 -*-
"""Validate every R302 recovery against the pre-R133-R138 blob.

A recovery is only accepted when its NEW text occurs VERBATIM in 9cd5e651^.
Anything that does not is dropped from the table -- we restore author prose,
we do not compose it.

Writes tools/r302_sites.json (validated records only).
"""
import io
import json
import subprocess
import sys

BS = chr(92)
PRE = '9cd5e651^'


def show(rev, path):
    p = subprocess.run(['git', 'show', '%s:%s' % (rev, path)], capture_output=True)
    if p.returncode != 0:
        return None
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8', 'replace')


def main():
    with io.open('tools/r302_sites.json', encoding='utf-8') as fh:
        doc = json.load(fh)

    cache = {}
    keep = []
    drop = []
    for r in doc['records']:
        posix = r['path'].replace(BS, '/')
        if posix not in cache:
            cache[posix] = show(PRE, posix)
        pre = cache[posix]
        if pre is None:
            r['why_dropped'] = 'no parent blob'
            drop.append(r)
            continue
        new = r['new'].strip()
        if new in pre:
            r['verbatim_in_parent'] = True
            keep.append(r)
        else:
            r['why_dropped'] = 'NEW not verbatim in ' + PRE
            r['dropped_new'] = r['new']
            drop.append(r)

    doc['records'] = keep
    doc['dropped'] = drop
    with io.open('tools/r302_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))

    print('validated %d verbatim; dropped %d' % (len(keep), len(drop)))
    for r in drop:
        print('  DROP %s L%d -- %s' % (r['path'], r['line'], r['why_dropped']))
        print('       %s' % r.get('dropped_new', '')[:110])
    return 0


if __name__ == '__main__':
    sys.exit(main())
