# -*- coding: utf-8 -*-
"""R309 final replay: prove that every R309-touched file on disk equals
HEAD + stage-1 records + repair records, byte for byte (in LF space).

Stage 1 is line-anchored (ch179 carries the same run twice), so it must run
first.  The repair records are text-anchored and were authored against the
stage-1 output, which is exactly the order they are applied in.
"""
import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGE1 = ['tools/r309_sites.json', 'tools/r309_sites_b2.json',
          'tools/r309_sites_b3.json', 'tools/r309_sites_b4.json']
REPAIR = 'tools/r309_repair.json'


def head(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace(os.sep, '/')],
                       capture_output=True, cwd=ROOT)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    return p.stdout.decode('utf-8').replace('\r\n', '\n')


def apply_lines(text, rs):
    lines = text.split('\n')
    for r in sorted(rs, key=lambda r: -r['line']):
        i = r['line'] - 1
        if i >= len(lines) or lines[i].strip() != r['old']:
            raise SystemExit('ABORT: %s line %s anchor mismatch'
                             % (r['path'], r['line']))
        lines[i] = r['new']
    return '\n'.join(lines)


def main():
    stage = {}
    for f in STAGE1:
        for r in json.load(io.open(os.path.join(ROOT, f), encoding='utf-8'))['records']:
            stage.setdefault(r['path'], []).append(r)
    repair = {}
    if os.path.exists(os.path.join(ROOT, REPAIR)):
        for r in json.load(io.open(os.path.join(ROOT, REPAIR), encoding='utf-8'))['records']:
            repair.setdefault(r['path'], []).append(r)

    files = sorted(set(stage) | set(repair))
    bad = 0
    for path in files:
        text = head(path)
        if path in stage:
            text = apply_lines(text, stage[path])
        for r in repair.get(path, []):
            if text.count(r['old']) != 1:
                raise SystemExit('ABORT: %s repair anchor count=%d'
                                 % (path, text.count(r['old'])))
            text = text.replace(r['old'], r['new'], 1)
        live = io.open(os.path.join(ROOT, path), 'rb').read().decode('utf-8')
        if text != live.replace('\r\n', '\n'):
            print('MISMATCH %s' % path)
            bad += 1
    print('REPLAY %s: %d/%d files byte-identical'
          % ('OK' if bad == 0 else 'FAIL', len(files) - bad, len(files)))
    raise SystemExit(0 if bad == 0 else 1)


main()
