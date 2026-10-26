# -*- coding: utf-8 -*-
"""Provenance check for the R303 filler sentences.

Repetition across chapters proves a round wrote them, but not WHICH round.
Before deleting anything, walk each sentence back through history to the commit
that first introduced it.  If that commit's parent already contains the sentence
somewhere in the file, the sentence is older than we think and must not be
deleted on R280's account.

Writes .claude/tmp/r303_origin.json.
"""
import io
import json
import os
import re
import subprocess
import sys
from collections import defaultdict

BS = chr(92)
CJK = re.compile('[一-鿿]')


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


def history(path):
    p = git(['log', '--format=%H', '--', path])
    if p.returncode != 0:
        return []
    out = p.stdout.decode('utf-8', 'replace').split('\n')
    return [c for c in out if c.strip()][::-1]


def main():
    with io.open('.claude/tmp/r303_filler.json', encoding='utf-8') as fh:
        cen = json.load(fh)

    # Collect the distinct filler sentences and one representative file each.
    sent_files = {}
    for ch, hits in cen['per_chapter'].items():
        for h in hits:
            if h['text'] in cen['repeated']:
                sent_files.setdefault(h['text'], h['path'])

    cache = {}
    out = {}
    for sent, path in sent_files.items():
        posix = path.replace(BS, '/')
        if posix not in cache:
            cache[posix] = history(posix)
        hist = cache[posix]
        origin = None
        for c in hist:
            txt = show(c, posix)
            if txt is not None and sent in txt:
                origin = c
                break
        if origin is None:
            out[sent] = {'cls': 'UNKNOWN', 'path': posix}
            continue
        ptxt = show(origin + '^', posix)
        subj = git(['log', '-1', '--format=%s', origin]).stdout.decode('utf-8', 'replace').strip()
        if ptxt is not None and sent in ptxt:
            out[sent] = {'cls': 'DEEPER', 'origin': origin[:9], 'subject': subj,
                         'path': posix}
        else:
            out[sent] = {'cls': 'ORIGIN', 'origin': origin[:9], 'subject': subj,
                         'path': posix}

    with io.open('.claude/tmp/r303_origin.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(out, ensure_ascii=False, indent=1))

    tally = defaultdict(int)
    for v in out.values():
        tally[v['cls']] += 1
    print('traced %d repeated sentences: %s' % (len(out), dict(tally)))
    by_origin = defaultdict(list)
    for s, v in out.items():
        if v['cls'] == 'ORIGIN':
            by_origin[(v['origin'], v['subject'])].append(s)
    for (c, subj), ss in sorted(by_origin.items(), key=lambda kv: -len(kv[1])):
        print('  %s  %3d 句  %s' % (c, len(ss), subj[:60]))
    print()
    for s, v in out.items():
        if v['cls'] != 'ORIGIN':
            print('%s  %s  %s' % (v['cls'], v.get('origin', '?'), s[:70]))
    return 0


if __name__ == '__main__':
    sys.exit(main())
