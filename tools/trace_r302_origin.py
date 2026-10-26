# -*- coding: utf-8 -*-
"""R302 provenance adjudication -- trace each site to the commit that
introduced the damaged phrase, not merely the commit that last touched the line.

A site is REPAIRABLE only when the phrase is absent from every earlier commit
we can check AND the pre-phrase line is complete prose.  For 那些那 / 那个那 the
true origin commit was found by binary search over the chapter's history:
  2d1194e5^ : 这个念头在他脑子里转了一圈又一圈，才终于歇了。
  9cd5e651  : 脑子里那个那嗓音一圈圈荡开，终于归于寂静   <-- introduced here
So the parent-commit test must run against the INTRODUCING commit's parent,
not against R280's parent.

This script walks back from R280 through every commit that touched the file
until it finds the earliest one containing the span, then reports whether the
commit before it lacks the span.

Writes .claude/tmp/r302_origin.json.
"""
import io
import json
import subprocess
import sys

BS = chr(92)
REFILL = '7671009'

SPANS = [u'那些那', u'那个那', u'他抬', u'得再等一会儿来']


def git(args):
    return subprocess.run(['git'] + args, capture_output=True)


def show(rev, path):
    p = git(['show', '%s:%s' % (rev, path)])
    if p.returncode != 0:
        return None
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8')


def history(path):
    """Commits touching path, oldest first."""
    p = git(['log', '--format=%H', '--', path])
    if p.returncode != 0:
        return []
    out = p.stdout.decode('utf-8', 'replace').split('\n')
    return [c for c in out if c.strip()][::-1]


def main():
    with io.open('.claude/tmp/r302_sites_raw.json', encoding='utf-8') as fh:
        sites = json.load(fh)

    out = []
    for s in sites:
        posix = s['path'].replace(BS, '/')
        span = None
        for p in s['pat']:
            if p == u'那些那':
                span = u'那些那'
            elif p == u'那个那':
                span = u'那个那'
            elif p == u'他抬N':
                span = None   # too generic; handled by callers
            elif p == u'得来病句':
                span = u'得再等一会儿来'
            if span:
                break

        s['posix'] = posix
        s['span'] = span

        if span is None:
            s['cls'] = 'MANUAL'
            s['why'] = 'generic span, no automated origin trace'
            out.append(s)
            continue

        hist = history(posix)
        origin = None
        for c in hist:
            txt = show(c, posix)
            if txt is not None and span in txt:
                origin = c
                break
        if origin is None:
            s['cls'] = 'UNKNOWN'
            s['why'] = 'span never found in file history'
            out.append(s)
            continue

        parent = origin + '^'
        ptxt = show(parent, posix)
        s['origin'] = origin
        s['origin_short'] = origin[:9]
        s['origin_subject'] = git(['log', '-1', '--format=%s', origin]).stdout.decode('utf-8', 'replace').strip()
        if ptxt is not None and span in ptxt:
            s['cls'] = 'DEEPER'
            s['why'] = 'span already present in the introducing commit\'s parent'
        else:
            s['cls'] = 'ORIGIN'
            s['why'] = 'span first appears in %s (%s)' % (s['origin_short'], s['origin_subject'])
        out.append(s)

    with io.open('.claude/tmp/r302_origin.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(out, ensure_ascii=False, indent=1))

    tally = {}
    for s in out:
        tally[s['cls']] = tally.get(s['cls'], 0) + 1
    print('traced %d sites: %s' % (len(out), tally))
    origins = {}
    for s in out:
        if s.get('origin_short'):
            origins.setdefault(s['origin_short'], [0, s.get('origin_subject', '')])
            origins[s['origin_short']][0] += 1
    for c, (n, subj) in sorted(origins.items(), key=lambda kv: -kv[1][0]):
        print('  %s  %3d  %s' % (c, n, subj[:70]))
    return 0


if __name__ == '__main__':
    sys.exit(main())
