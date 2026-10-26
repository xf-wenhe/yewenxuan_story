# -*- coding: utf-8 -*-
"""Print pre-R280 vs live text for every AUTHOR-classified R302 site."""
import io
import json
import os
import subprocess

SEP = chr(92)  # backslash


def main():
    with io.open('.claude/tmp/r302_adjudicated.json', encoding='utf-8') as fh:
        sites = json.load(fh)
    for s in sites:
        if s['cls'] != 'AUTHOR':
            continue
        posix = s['path'].replace(SEP, '/')
        r = subprocess.run(['git', 'show', '7671009^:' + posix],
                           capture_output=True)
        raw = r.stdout
        if raw.startswith(b'\xef\xbb\xbf'):
            raw = raw[3:]
        lines = raw.decode('utf-8').split('\n')
        i = s['line'] - 1
        print('--- %s L%d ---' % (posix, s['line']))
        print('PRE : ' + (lines[i].strip()[:130] if 0 <= i < len(lines) else '<OOR>'))
        print('LIVE: ' + s['text'].strip()[:130])


if __name__ == '__main__':
    main()
