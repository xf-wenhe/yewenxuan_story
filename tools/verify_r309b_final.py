# -*- coding: utf-8 -*-
"""R309 stage-2 / R310 final replay: HEAD + every table, in application order.

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
          'tools/r310_sites_812b.json', 'tools/r310_sites_812c.json',
          'tools/r310_sites_818.json', 'tools/r310_sites_816.json',
          'tools/r310_sites_810.json', 'tools/r310_sites_817.json',
          'tools/r311_sites_810.json', 'tools/r311_sites_817.json',
          'tools/r311b_sites_810.json', 'tools/r311b_sites_817.json',
          'tools/r311c_sites_810.json', 'tools/r311_sites_812.json',
          'tools/r312_sites.json',
          'tools/r312b_sites.json', 'tools/r312c_sites.json',
          'tools/r312d_sites.json',
          'tools/r313_sites.json', 'tools/r313b_sites.json', 'tools/r313c_sites.json',
          'tools/r314_sites.json', 'tools/r314f_sites.json',
          'tools/r315_sites.json']


def head_many(paths):
    """Read every HEAD blob in one `git cat-file --batch` process.

    The earlier version ran `git show` once per file.  Eighty-five process
    spawns on this machine kept getting killed mid-replay by the sandbox
    watchdog (SIGTERM, exit 1, no stdout), which looks exactly like a broken
    replay but is not one.  One batch process is faster and stable.
    """
    req = ''.join('HEAD:%s\n' % p.replace(os.sep, '/') for p in paths)
    p = subprocess.run(['git', 'cat-file', '--batch'], input=req.encode('utf-8'),
                       capture_output=True, cwd=ROOT)
    if p.returncode != 0:
        raise SystemExit('ABORT: git cat-file failed: '
                         + p.stderr.decode('utf-8', 'replace')[:200])
    out = p.stdout
    res = {}
    pos = 0
    for path in paths:
        nl = out.index(b'\n', pos)
        hdr = out[pos:nl].decode('utf-8').split(' ')
        if len(hdr) != 3 or hdr[1] == 'missing':
            raise SystemExit('ABORT: git cat-file missing for ' + path)
        size = int(hdr[2])
        body = out[nl + 1:nl + 1 + size]
        pos = nl + 1 + size + 1        # blob is followed by one newline
        res[path] = body.decode('utf-8').replace('\r\n', '\n')
    return res


def main():
    applied = []          # (path, line, old, new) in table order
    for t in TABLES:
        fp = os.path.join(ROOT, t)
        # A silently skipped table would silently weaken the proof: the replay
        # would still say OK while comparing against fewer edits than the round
        # actually made.  Missing is an abort, never a skip.
        if not os.path.exists(fp):
            raise SystemExit('ABORT: missing table ' + t)
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
    order = sorted(by_file.items())
    heads = head_many([p for p, _ in order])
    for path, rs in order:
        text = heads[path]
        lines = text.split('\n')
        # later records were authored against the earlier ones, so keep table order
        for r in rs:
            i = r['line'] - 1
            n = lines[i].count(r['old']) if 0 <= i < len(lines) else 0
            # `new` being present is not proof: see fix_r309b.already_applied.
            # When `old` sits inside `new` (containment) presence of `new` is the
            # proof; otherwise the record is done only when its anchor is gone.
            done = False
            if 0 <= i < len(lines) and r['new'] in lines[i]:
                done = (r['old'] in r['new']) or (r['old'] not in lines[i])
            if done:
                skipped += 1          # already committed by an earlier batch
            elif n == 1:
                lines[i] = lines[i].replace(r['old'], r['new'], 1)
            elif any(o in lines[i] for o in news[(r['path'], r['line'])]
                     if o != r['new']):
                skipped += 1          # committed, then superseded by a later table
            elif '\n'.join(lines).count(r['new']) == 1:
                # Committed, but the line number no longer points at it: a table
                # that splits a paragraph inserts a line, and every record after
                # it shifts.  The text is the truth, the line number is the
                # authoring aid.
                skipped += 1
            else:
                raise SystemExit('ABORT: %s L%d anchor count=%d  [%s]'
                                 % (path, r['line'], n, r['old'][:30]))
        text = '\n'.join(lines)
        raw = io.open(os.path.join(ROOT, path), 'rb').read()
        live = raw.decode('utf-8')
        # Compare in LF space on both sides.  A record whose `new` inserts a
        # paragraph break carries a bare `\n`, while the file it lands in keeps
        # CRLF; normalising only one side calls that a mismatch.
        if text.replace('\r\n', '\n') != live.replace('\r\n', '\n'):
            print('MISMATCH %s' % path)
            bad += 1
        # The invariant is not "must be CRLF" but "must not end up a mix": a
        # table that inserts `\n\n` into a CRLF file is exactly how that happens.
        crlf, lf = raw.count(b'\r\n'), raw.count(b'\n')
        if crlf not in (0, lf):
            print('MIXED-ENDING %s  crlf=%d lf=%d' % (path, crlf, lf))
            bad += 1
    print('already-applied records skipped: %d' % skipped)
    print('REPLAY %s: %d/%d files byte-identical'
          % ('OK' if bad == 0 else 'FAIL', len(by_file) - bad, len(by_file)))
    raise SystemExit(0 if bad == 0 else 1)


main()
