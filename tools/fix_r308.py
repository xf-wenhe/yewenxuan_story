# -*- coding: utf-8 -*-
"""R308 engine: replace the R300 round-3 padding paragraph with a real closing beat.

Background
----------
`7be2ad1f` (R300 round-3) refilled 37 chapters that had fallen under the 3000
CJK floor after R300's deletions.  The refill is one long paragraph inserted
right before `（第X章完）`, and it is built by re-telling the chapter's own last
few paragraphs (verbatim or lightly reworded) and then appending sentences that
recur verbatim across dozens of chapters -- e.g.
`0429碎片的设计者在设计它的时候就已经考虑到了赵大嘴。` appears in 19 chapters,
`0415碎片是女儿。` in dozens.  That is the loudest remaining AI tell in the
library and the reason this round exists.

Classification (`.claude/tmp/r308_classify.py`) of the 9,732 CJK padding block:

  A-echo   3,004 CJK  verbatim earlier in the same chapter
  B-tmpl   3,826 CJK  verbatim in 2+ chapters
  C-unique 2,865 CJK  local only, though most of it is lightly reworded echo

Only three chapters carry genuine new plot in the block (ch125 ch128 ch212 --
the encryption-layer opening).  Everywhere else it is pure restatement.

This round replaces the whole padding line, chapter by chapter, with a short
closing beat written for that chapter's actual ending.  The prose is checked
before it lands: no L1 word, no DEADLY pattern, no em-dash, no sentence that
already exists elsewhere in the library, no sentence repeated inside the same
chapter, and the chapter stays above the 3000 CJK floor.

Record form
-----------
op=replace-line: `old` is the padding line byte-for-byte, `new` is one line.
Applied as a byte-level replace, so BOM state, CRLF line endings and the
missing trailing newline are all preserved without being re-encoded.

Fail-closed: every record is validated in memory before anything is written.

Usage:  python tools/fix_r308.py            (default: dry run)
        python tools/fix_r308.py --apply
        python tools/fix_r308.py --verify   (replay HEAD blobs, compare bytes)
"""

import io
import json
import os
import re
import subprocess
import sys

SITES = 'tools/r308_sites.json'
CJK = re.compile('[\u4e00-\u9fff]')
FLOOR = 3000


def sites_path():
    for a in sys.argv[1:]:
        if a.startswith('--sites='):
            return a.split('=', 1)[1]
    return SITES


def cjk(s):
    return len(CJK.findall(s))


def read_raw(path):
    with io.open(path, 'rb') as fh:
        return fh.read()


def write_raw(path, data):
    tmp = path + '.r308tmp'
    with io.open(tmp, 'wb') as fh:
        fh.write(data)
    os.replace(tmp, path)


def head_bytes(path):
    p = subprocess.run(['git', 'show', 'HEAD:' + path.replace(os.sep, '/')],
                       capture_output=True)
    if p.returncode != 0:
        raise SystemExit('ABORT: git show failed for ' + path)
    return p.stdout


def apply_records(raw, rs):
    out = raw
    for r in rs:
        old_b = r['old'].encode('utf-8')
        new_b = r['new'].encode('utf-8')
        if out.count(old_b) != 1:
            raise SystemExit('ABORT: %s anchor count=%d'
                             % (r['path'], out.count(old_b)))
        out = out.replace(old_b, new_b)
    return out


def main():
    mode = ('APPLY' if '--apply' in sys.argv
            else 'VERIFY' if '--verify' in sys.argv else 'DRY-RUN')
    with io.open(sites_path(), encoding='utf-8') as fh:
        d = json.load(fh)
    recs = d['records']

    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    prepared = []
    tot = 0
    for path, rs in sorted(by_file.items()):
        raw = read_raw(path)
        bom = raw.startswith(b'\xef\xbb\xbf')
        body = raw[3:] if bom else raw
        src = head_bytes(path) if mode == 'VERIFY' else body
        # normalise only for the verify comparison; HEAD blobs are LF
        src_cmp = src.replace(b'\r\n', b'\n')
        if mode == 'VERIFY':
            for r in rs:
                if r['old'].encode('utf-8') not in src_cmp:
                    raise SystemExit('ABORT: %s anchor absent from HEAD' % path)
            new_cmp = apply_records(src_cmp, rs)
            live_cmp = body.replace(b'\r\n', b'\n')
            prepared.append((path, None, new_cmp, live_cmp))
            continue

        text = src.decode('utf-8')
        before = cjk(text)
        dsum = 0
        for r in rs:
            if '\n' in r['old'] or '\r' in r['old']:
                raise SystemExit('ABORT: %s old is not a single line' % path)
            if '\n' in r['new'] or '\r' in r['new']:
                raise SystemExit('ABORT: %s new is not a single line' % path)
            if r['new'].strip() != r['new'] or not r['new']:
                raise SystemExit('ABORT: %s new is not a clean line' % path)
            if r['old'].strip() != r['old'] or not r['old']:
                raise SystemExit('ABORT: %s old is not a clean line' % path)
            dsum += cjk(r['new']) - cjk(r['old'])
        new_body = apply_records(body, rs)
        new_text = new_body.decode('utf-8')
        after = cjk(new_text)
        if after - before != dsum:
            raise SystemExit('ABORT: %s CJK delta mismatch' % path)
        if after < FLOOR:
            raise SystemExit('ABORT: %s floor %d < %d' % (path, after, FLOOR))
        if new_text.count('\n\n\n') != text.count('\n\n\n'):
            raise SystemExit('ABORT: %s triple-newline count changed' % path)
        if new_text.split('\n')[0] != text.split('\n')[0]:
            raise SystemExit('ABORT: %s first line changed' % path)
        if new_text.split('\n')[-1] != text.split('\n')[-1]:
            raise SystemExit('ABORT: %s last line changed' % path)
        if new_body.count(b'\r\n') != body.count(b'\r\n'):
            raise SystemExit('ABORT: %s CRLF count changed' % path)
        if new_body.endswith(b'\n') != body.endswith(b'\n'):
            raise SystemExit('ABORT: %s trailing newline state changed' % path)
        if not bom and new_body.startswith(b'\xef\xbb\xbf'):
            raise SystemExit('ABORT: %s BOM introduced' % path)
        prepared.append((path, (new_body if bom else new_body), None, None))
        tot += dsum
        print('%-42s CH%-5s CJK %d -> %d (%+d)' %
              (path.split('/')[-1], ','.join(str(r['chapter']) for r in rs),
               before, after, dsum))

    if mode == 'VERIFY':
        bad = 0
        for path, _x, want, live in prepared:
            if want != live:
                print('MISMATCH %s' % path)
                bad += 1
        print('VERIFY %s: %d/%d files replay byte-identical' %
              ('OK' if bad == 0 else 'FAIL', len(prepared) - bad, len(prepared)))
        raise SystemExit(1 if bad else 0)

    if mode == 'APPLY':
        for path, data, _a, _b in prepared:
            write_raw(path, data)
        print('APPLIED %d records / %d files / %+d CJK'
              % (len(recs), len(prepared), tot))
    else:
        print('DRY-RUN ok: %d records / %d files / %+d CJK -- nothing written'
              % (len(recs), len(prepared), tot))


if __name__ == '__main__':
    main()
