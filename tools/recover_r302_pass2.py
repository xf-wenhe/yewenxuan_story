# -*- coding: utf-8 -*-
"""Second-pass recovery for the 37 sites R302 could not match by diff.

These lines were rewritten again after 9cd5e651, so the diff has no matching
'+' line.  But the pre-9cd5e651 blob still holds the author's sentence; only
the line number moved.  Recover it by searching the parent blob for the
damaged sentence's neighbourhood instead of by line number.

Strategy: take a distinctive fragment of the damaged sentence, find it in the
parent blob, and read the whole parent line.  If the parent line is complete
prose (no 那些那/那个那), it is the recovery source.

Writes .claude/tmp/r302_pass2.json and merges into tools/r302_sites.json.
"""
import io
import json
import re
import subprocess
import sys

BS = chr(92)
ORIGIN = '9cd5e651'
PRE = ORIGIN + '^'
BROKEN = re.compile(u'那些那|那个那')


def git(args):
    return subprocess.run(['git'] + args, capture_output=True)


def show(rev, path):
    p = git(['show', '%s:%s' % (rev, path)])
    if p.returncode != 0:
        return None
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    return raw.decode('utf-8', 'replace')


def clean(t):
    return re.sub(u'。{2,}', u'。', t.strip())


def main():
    with io.open('tools/r302_sites.json', encoding='utf-8') as fh:
        doc = json.load(fh)

    # Distinctive fragments, longest-first, that survive into the parent.
    FRAGS = [
        u'脑子里那个', u'脑海中那个', u'那个', u'他抬', u'他得再等一会儿',
        u'0428碎片让回声能理解', u'叶文轩的后背在发麻',
    ]

    pass2 = []
    still = []
    for rec in doc['unresolved']:
        posix = rec['path'].replace(BS, '/')
        pre = show(PRE, posix)
        if pre is None:
            still.append(rec)
            continue
        pre_lines = pre.split('\n')
        live = rec['old'].strip()

        # Try each fragment; take the first that lands on a clean parent line.
        hit = None
        for frag in FRAGS:
            if frag not in live:
                continue
            for i, pl in enumerate(pre_lines):
                if frag in pl and not BROKEN.search(pl):
                    # require the parent line to be a plausible replacement:
                    # non-trivial and not the same damaged text
                    if len(pl.strip()) >= 8 and pl.strip() != live:
                        hit = (i + 1, clean(pl))
                        break
            if hit:
                break
        if hit:
            rec['new'] = hit[1]
            rec['pre_line'] = hit[0]
            rec['src'] = 'parent-blob search (fragment %r)' % frag
            pass2.append(rec)
        else:
            still.append(rec)

    doc['records'].extend(pass2)
    doc['unresolved'] = still
    doc['note'] += (
        ' Pass 2 recovered %d more by fragment search in %s; %d remain unresolved.'
        % (len(pass2), PRE, len(still))
    )
    with io.open('tools/r302_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))

    print('pass2 recovered %d; total records %d; still unresolved %d'
          % (len(pass2), len(doc['records']), len(still)))
    for r in still:
        print('  STILL %s L%d %s' % (r['path'], r['line'], r['old'].strip()[:70]))
    return 0


if __name__ == '__main__':
    sys.exit(main())
