# -*- coding: utf-8 -*-
"""R309 stage-2 final replay: HEAD + every stage-2 table + the top-up.

Stage 1 rewrote whole paragraphs; stage 2 rewrites the run inside a line, and
the tables are applied one batch at a time.  A batch-local `--verify` only
proves that batch against HEAD, which stops being true as soon as a second
batch touches the same file.  This replay chains them in application order and
compares the result to disk, byte for byte, in LF space.

Batches 2a-2d are already committed, so HEAD is not the pre-stage-2 baseline.
A record whose `old` is gone and whose `new` sits on the recorded line is
therefore treated as already applied and skipped; only a record that matches
neither side is an abort.  This keeps the chain honest without needing to
rebuild the baseline from the commit before 2a.
"""
import io
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLES = ['tools/r309b_sites.json', 'tools/r309b_sites_b2.json',
          'tools/r309b_sites_b3.json', 'tools/r309b_sites_b4.json',
          'tools/r309b_sites_b5.json', 'tools/r309b_sites_b6.json',
          'tools/r309b_sites_b7.json', 'tools/r309b_sites_b8.json',
          'tools/r310_sites_ch809.json', 'tools/r310_sites_runs.json',
          'tools/r310_sites_813_814.json', 'tools/r310_sites_812a.json',
          'tools/r310_sites_812b.json', 'tools/r310_sites_812c.json', 'tools/r310_sites_818.json',
          'tools/r309b_topup.json']


def head(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace(os.sep, '/')],
                       capture_output=True, cwd=ROOT)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    return p.stdout.decode('utf-8').replace('\r\n', '\n')


def main():
    applied = []          # (path, line, old, new) in table order
    for t in TABLES:
        fp = os.path.join(ROOT, t)
        if not os.path.exists(fp):
            print('skip missing %s' % t)
            continue
        for r in json.load(io.open(fp, encoding='utf-8'))['records']:
            applied.append(r)
    print('records: %d' % len(applied))

    by_file = {}
    for r in applied:
        by_file.setdefault(r['path'], []).append(r)

    # A record can be superseded twice over: committed (so HEAD holds its `new`)
    # and then rewritten again by a later table (so HEAD holds neither side).
    # Index every `new` per line to recognise that second case.
    news = {}
    for r in applied:
        news.setdefault((r['path'], r['line']), []).append(r['new'])

    bad = 0
    skipped = 0
    for path, rs in sorted(by_file.items()):
        text = head(path)
        lines = text.split('\n')
        # later records were authored against the earlier ones, so keep table order
        for r in rs:
            i = r['line'] - 1
            n = lines[i].count(r['old'])
            # `new` is checked first on purpose: a replacement that contains the
            # original string (`醒了一部分。` -> `答得很短：醒了一部分。`) would
            # otherwise be applied a second time on replay.
            if r['new'] in lines[i]:
                skipped += 1          # already committed by an earlier batch
            elif n == 1:
                lines[i] = lines[i].replace(r['old'], r['new'], 1)
            elif any(o in lines[i] for o in news[(r['path'], r['line'])]
                     if o != r['new']):
                skipped += 1          # committed, then superseded by a later table
            else:
                raise SystemExit('ABORT: %s L%d anchor count=%d  [%s]'
                                 % (path, r['line'], n, r['old'][:30]))
        text = '\n'.join(lines)
        live = io.open(os.path.join(ROOT, path), 'rb').read().decode('utf-8')
        if text != live.replace('\r\n', '\n'):
            print('MISMATCH %s' % path)
            bad += 1
    print('already-applied records skipped: %d' % skipped)
    print('REPLAY %s: %d/%d files byte-identical'
          % ('OK' if bad == 0 else 'FAIL', len(by_file) - bad, len(by_file)))
    raise SystemExit(0 if bad == 0 else 1)


main()
