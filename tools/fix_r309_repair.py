# -*- coding: utf-8 -*-
"""R309 repair: remove the templates my own rewrites introduced.

Two kinds of damage, both from re-using a stock phrasing instead of writing
this chapter's own sentence:

  1. `不是A，是B` negative setup that only delays the positive fact the
     sentence already states -- flagged blocking by check-ai-patterns.
  2. a sentence I emitted verbatim in two different chapters -- flagged as a
     cross-chapter echo, which is the signature of a generator, not a writer.

The repair table is the single source of truth: tools/r309_repair.json.
Applied after stage 1, text-anchored, idempotent (a record already applied is
skipped), fail-closed on every gate.
"""
import io
import json
import os
import re
import sys

CJK = re.compile(u'[\u4e00-\u9fff]')
TABLE = 'tools/r309_repair.json'

BANNED = [u'仿佛', u'犹如', u'宛若', u'如同', u'缓缓', u'不禁', u'微微', u'轻轻',
          u'淡淡', u'一丝', u'一股', u'一抹', u'一缕']
DEADLY = [
    re.compile(u'不是[^，。！？]{1,10}而是[^，。！？]{1,10}'),
    re.compile(u'不是[^，。！？]{1,10}，是[^，。！？]{1,10}'),
    re.compile(u'没有[^，。！？]{1,10}，没有[^，。！？]{1,10}'),
    re.compile(u'他知道[^\\n]{1,50}'),
    re.compile(u'眼中闪过'), re.compile(u'心中涌起'), re.compile(u'脑中闪过'),
]


def main():
    apply = '--apply' in sys.argv
    recs = json.load(io.open(TABLE, encoding='utf-8'))['records']
    by_file = {}
    for r in recs:
        by_file.setdefault(r['path'], []).append(r)

    ok = True
    tot = 0
    done = 0
    for path, rs in sorted(by_file.items()):
        raw = io.open(path, 'rb').read()
        bom = raw.startswith(b'\xef\xbb\xbf')
        text = raw[3:].decode('utf-8') if bom else raw.decode('utf-8')
        before = len(CJK.findall(text))
        out = text
        pending = []
        for r in rs:
            have_old = out.count(r['old'])
            if have_old == 0 and r['new'] in out:
                continue                      # already applied
            if have_old != 1:
                raise SystemExit('ABORT: %s anchor count=%d  [%s]'
                                 % (path, have_old, r['old'][:24]))
            out = out.replace(r['old'], r['new'], 1)
            pending.append(r)
        if not pending:
            print('%-42s already applied' % path.split('/')[-1])
            continue

        after = len(CJK.findall(out))
        dsum = sum(len(CJK.findall(r['new'])) - len(CJK.findall(r['old']))
                   for r in pending)
        if after - before != dsum:
            raise SystemExit('ABORT: %s CJK delta %d vs %d' % (path, after - before, dsum))
        if after < 3000:
            raise SystemExit('ABORT: %s floor %d' % (path, after))
        if out.count('\r\n') != text.count('\r\n'):
            raise SystemExit('ABORT: %s CRLF changed' % path)
        if out.endswith('\n') != text.endswith('\n'):
            raise SystemExit('ABORT: %s trailing newline changed' % path)
        if out.count('\n\n\n') != text.count('\n\n\n'):
            raise SystemExit('ABORT: %s triple-newline changed' % path)
        for w in BANNED:
            if w in out and w not in text:
                print('  FAIL banned word introduced: %s in %s' % (w, path))
                ok = False
        for rx in DEADLY:
            for m in rx.finditer(out):
                if m.group(0) not in text:
                    print('  FAIL deadly introduced: %s in %s -- %s'
                          % (rx.pattern[:18], path, m.group(0)))
                    ok = False

        print('%-42s %d rec  CJK %d -> %d (%+d)'
              % (path.split('/')[-1], len(pending), before, after, after - before))
        tot += after - before
        if apply:
            data = out.encode('utf-8')
            if bom:
                data = b'\xef\xbb\xbf' + data
            tmp = path + '.r309fix'
            io.open(tmp, 'wb').write(data)
            os.replace(tmp, path)
            done += 1

    if not ok:
        raise SystemExit('GATE FAILED -- nothing written')
    print('%s: %d files / %+d CJK'
          % ('APPLIED' if apply else 'DRY-RUN ok', done if apply else len(by_file), tot))


main()
