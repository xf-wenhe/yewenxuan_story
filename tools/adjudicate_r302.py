# -*- coding: utf-8 -*-
"""R302 provenance adjudication, whole-file test.

A site is AUTHOR prose only when the damaged phrase already occurs somewhere
in the pre-R280 (7671009^) version of the file.  Line-number matching is not
enough: R280 replaced whole lines, so a hit on the same line number proves
nothing.

Writes .claude/tmp/r302_adjudicated.json.
"""
import io
import json
import subprocess
import sys

REFILL = '7671009'
PRE = REFILL + '^'
BS = chr(92)

# The exact damaged span, used for the whole-file containment test.
SPAN = {
    u'那些那': u'那些那',
    u'那个那': u'那个那',
    u'他抬N': None,      # phrase too generic; judged by line diff below
    u'得来病句': u'得再等一会儿来',
}


def show(rev, path):
    posix = path.replace(BS, '/')
    p = subprocess.run(['git', 'show', '%s:%s' % (rev, posix)],
                       capture_output=True)
    if p.returncode != 0:
        return None
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8')


def main():
    with io.open('.claude/tmp/r302_sites_raw.json', encoding='utf-8') as fh:
        sites = json.load(fh)

    cache = {}
    for s in sites:
        path = s['path']
        if path not in cache:
            cache[path] = show(PRE, path)
        pre = cache[path]
        if pre is None:
            s['cls'] = 'UNKNOWN'
            s['why'] = 'file absent in ' + PRE
            continue

        pre_lines = pre.split('\n')
        idx = s['line'] - 1
        pre_line = pre_lines[idx] if 0 <= idx < len(pre_lines) else None
        s['pre_line'] = pre_line
        s['line_changed'] = (pre_line != s['text'])

        # Whole-file containment: does the damaged span exist anywhere pre-R280?
        span = None
        for p in s['pat']:
            if SPAN.get(p):
                span = SPAN[p]
                break
        s['span'] = span
        if span is not None:
            s['span_in_pre'] = span in pre
        else:
            s['span_in_pre'] = None

        if s['span_in_pre']:
            s['cls'] = 'AUTHOR'
            s['why'] = 'span %r present in %s version of the file' % (span, PRE)
        elif span is not None:
            s['cls'] = 'REFILL'
            s['why'] = 'span %r absent from %s version of the file' % (span, PRE)
        else:
            # 他抬N: fall back to a line diff, since the span is generic.
            s['cls'] = 'AUTHOR' if not s['line_changed'] else 'REFILL'
            s['why'] = 'generic span; judged by line diff (changed=%s)' % s['line_changed']

    with io.open('.claude/tmp/r302_adjudicated.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(sites, ensure_ascii=False, indent=1))

    tally = {}
    for s in sites:
        tally[s['cls']] = tally.get(s['cls'], 0) + 1
    print('adjudicated %d sites: %s' % (len(sites), tally))
    return 0


if __name__ == '__main__':
    sys.exit(main())
