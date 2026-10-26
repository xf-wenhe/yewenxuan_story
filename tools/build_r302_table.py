# -*- coding: utf-8 -*-
"""Build the R302 repair table.

For every site, recover the sentence the author wrote before 9cd5e651
(Voice rounds R133-R138) replaced it.  That commit is the origin of every
那些那 / 那个那 damage site, and its diff shows plain prose going out and a
broken sentence coming in:

  -脑子里那个声音转了转，然后消失了。。。
  +脑子里那个那嗓音绕了几次，终于散掉。。。

Recovery rule:
  1. Take the live (damaged) line.
  2. Find it in 9cd5e651's diff as a '+' line; the adjacent '-' line is the
     author's sentence.
  3. Strip the trailing '。。' R133-R138 left behind (a separate, known defect)
     and normalise to one '。'.

Writes tools/r302_sites.json.
"""
import io
import json
import re
import subprocess
import sys

BS = chr(92)
ORIGIN = '9cd5e651'
PRE = ORIGIN + '^'


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


def diff_pairs(path):
    """{plus_line: minus_line} for hunks in ORIGIN's diff of path."""
    p = git(['show', ORIGIN, '--format=', '--', path])
    if p.returncode != 0:
        return {}
    raw = p.stdout
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
    text = raw.decode('utf-8', 'replace')
    pairs = {}
    minus = []
    for line in text.split('\n'):
        if line.startswith('---') or line.startswith('+++') or line.startswith('@@'):
            minus = []
            continue
        if line.startswith('-'):
            minus.append(line[1:])
        elif line.startswith('+'):
            plus = line[1:]
            if minus:
                pairs[plus] = minus[-1]
                minus = []
        elif line.startswith(' '):
            minus = []
    return pairs


def clean(t):
    """Normalise the double period R133-R138 welded on."""
    t = re.sub(u'。{2,}', u'。', t)
    return t


def main():
    with io.open('.claude/tmp/r302_sites_raw.json', encoding='utf-8') as fh:
        sites = json.load(fh)

    records = []
    unresolved = []
    for s in sites:
        posix = s['path'].replace(BS, '/')
        live = s['text']
        pairs = diff_pairs(posix)
        rec = {'path': posix, 'chapter': s['chapter'], 'line': s['line'],
               'pat': s['pat'], 'old': live}
        if live in pairs:
            pre = clean(pairs[live])
            if pre and pre != live:
                rec['new'] = pre
                rec['src'] = 'R133-R138 diff minus line'
                records.append(rec)
                continue
        unresolved.append(rec)

    doc = {
        'round': 'R302',
        'detector': 'manual: R280/R133-R138 filler damage patterns (那些那 / 那个那 / 他抬N / 得…来)',
        'origin': '9cd5e651 (Voice rounds R133-R138) -- verified by git show diff on every site',
        'note': (
            'Every 那些那/那个那 site traces to one commit, 9cd5e651, whose diff '
            'replaced complete author prose with a broken sentence '
            '(-脑子里那个声音转了转，然后消失了。 / +脑子里那个那嗓音绕了几次，终于散掉。). '
            'The 14 他抬 sites are the same family: R280 dropped the verb '
            '(他抬目光望向窗外). Sites whose author sentence could not be recovered '
            'from the diff are listed under "unresolved" and are not touched.'
        ),
        'records': records,
        'unresolved': unresolved,
    }
    with io.open('tools/r302_sites.json', 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(doc, ensure_ascii=False, indent=1))
    print('recovered %d / %d sites; %d unresolved' % (len(records), len(sites), len(unresolved)))
    for r in unresolved:
        print('  UNRESOLVED %s L%d %s' % (r['path'], r['line'], r['old'].strip()[:70]))
    return 0


if __name__ == '__main__':
    sys.exit(main())
